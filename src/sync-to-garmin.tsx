import {
  List,
  ActionPanel,
  Action,
  Icon,
  showToast,
  Toast,
  Color,
  getPreferenceValues,
  Detail,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { getMeasurements, isAuthenticated, authorize, WithingsMeasurement } from "./withings-api";
import { GarminAPI, createFitFile, FitFileData } from "./garmin-api";

interface Preferences {
  garminUsername: string;
  garminPassword: string;
  includeBloodPressure: boolean;
}

interface SyncResult {
  success: boolean;
  message: string;
  measurementDate?: Date;
}

export default function SyncToGarmin() {
  const [measurements, setMeasurements] = useState<WithingsMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const prefs = getPreferenceValues<Preferences>();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  async function checkAuthAndLoadData() {
    try {
      const isAuth = await isAuthenticated();
      setAuthenticated(isAuth);

      if (!isAuth) {
        setIsLoading(false);
        return;
      }

      await loadMeasurements();
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error loading measurements",
        message: error instanceof Error ? error.message : "Unknown error",
      });
      setIsLoading(false);
    }
  }

  async function loadMeasurements() {
    try {
      setIsLoading(true);
      const data = await getMeasurements();
      setMeasurements(data);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error loading measurements",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAuthorize() {
    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Authorizing with Withings...",
      });

      await authorize();

      await showToast({
        style: Toast.Style.Success,
        title: "Successfully authorized!",
      });

      setAuthenticated(true);
      await loadMeasurements();
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Authorization failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async function syncMeasurement(measurement: WithingsMeasurement) {
    if (!prefs.garminUsername || !prefs.garminPassword) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Garmin credentials missing",
        message: "Please configure your Garmin username and password in preferences",
      });
      return;
    }

    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Syncing to Garmin...",
      });

      const garmin = new GarminAPI();

      // Build FIT file data
      const fitData: FitFileData = {
        timestamp: measurement.date,
        weight: measurement.weight,
        bodyFat: measurement.fatRatio,
        boneMass: measurement.boneMass,
        muscleMass: measurement.muscleMass,
      };

      if (prefs.includeBloodPressure && measurement.systolicBloodPressure && measurement.diastolicBloodPressure) {
        fitData.systolicBP = measurement.systolicBloodPressure;
        fitData.diastolicBP = measurement.diastolicBloodPressure;
        fitData.heartRate = measurement.heartPulse;
      }

      const fitFile = createFitFile(fitData);
      const success = await garmin.uploadFitFile(fitFile);

      if (success) {
        await showToast({
          style: Toast.Style.Success,
          title: "Successfully synced to Garmin!",
        });

        setSyncResults((prev) => [
          ...prev,
          {
            success: true,
            message: "Synced successfully",
            measurementDate: measurement.date,
          },
        ]);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Sync failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });

      setSyncResults((prev) => [
        ...prev,
        {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
          measurementDate: measurement.date,
        },
      ]);
    }
  }

  async function syncAllRecent() {
    if (!prefs.garminUsername || !prefs.garminPassword) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Garmin credentials missing",
        message: "Please configure your Garmin username and password in preferences",
      });
      return;
    }

    const recentMeasurements = measurements.slice(0, 7); // Last 7 measurements

    for (const measurement of recentMeasurements) {
      await syncMeasurement(measurement);
      // Add small delay between syncs
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await showToast({
      style: Toast.Style.Success,
      title: "Batch sync complete!",
      message: `Synced ${recentMeasurements.length} measurements`,
    });
  }

  async function syncToday() {
    if (!prefs.garminUsername || !prefs.garminPassword) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Garmin credentials missing",
        message: "Please configure your Garmin username and password in preferences",
      });
      return;
    }

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter measurements from today
    const todaysMeasurements = measurements.filter((m) => {
      const measurementDate = new Date(m.date);
      measurementDate.setHours(0, 0, 0, 0);
      return measurementDate.getTime() === today.getTime();
    });

    if (todaysMeasurements.length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No measurements found",
        message: "No measurements from today to sync",
      });
      return;
    }

    await showToast({
      style: Toast.Style.Animated,
      title: "Syncing today's data...",
      message: `${todaysMeasurements.length} measurement(s)`,
    });

    for (const measurement of todaysMeasurements) {
      await syncMeasurement(measurement);
      // Add small delay between syncs
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await showToast({
      style: Toast.Style.Success,
      title: "Today's data synced!",
      message: `Synced ${todaysMeasurements.length} measurement(s)`,
    });
  }

  if (!authenticated) {
    return (
      <List isLoading={isLoading}>
        <List.EmptyView
          icon={Icon.Lock}
          title="Withings Not Connected"
          description="You need to authorize Raycast to access your Withings data"
          actions={
            <ActionPanel>
              <Action title="Authorize Withings" onAction={handleAuthorize} icon={Icon.Key} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  if (!prefs.garminUsername || !prefs.garminPassword) {
    return (
      <Detail
        markdown="# Garmin Credentials Required\n\nPlease configure your Garmin username and password in the extension preferences.\n\n1. Press `⌘ + ,` to open preferences\n2. Enter your Garmin Connect credentials\n3. Enable/disable blood pressure sync"
        actions={
          <ActionPanel>
            <Action.OpenInBrowser
              title="Open Garmin Connect"
              url="https://connect.garmin.com"
            />
          </ActionPanel>
        }
      />
    );
  }

  // Count today's measurements
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysMeasurements = measurements.filter((m) => {
    const measurementDate = new Date(m.date);
    measurementDate.setHours(0, 0, 0, 0);
    return measurementDate.getTime() === today.getTime();
  });

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Select measurement to sync...">
      <List.Section title="Actions">
        <List.Item
          title="Sync Today's Data"
          subtitle="Sync all measurements from today (weight + blood pressure)"
          icon={Icon.Calendar}
          accessories={[{ tag: { value: `${todaysMeasurements.length} item${todaysMeasurements.length !== 1 ? 's' : ''}` } }]}
          actions={
            <ActionPanel>
              <Action
                title="Sync Today"
                onAction={syncToday}
                icon={Icon.Calendar}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Sync All Recent Measurements"
          subtitle="Sync the last 7 measurements to Garmin"
          icon={Icon.Upload}
          accessories={[{ tag: { value: `${Math.min(measurements.length, 7)} items` } }]}
          actions={
            <ActionPanel>
              <Action
                title="Sync All"
                onAction={syncAllRecent}
                icon={Icon.Upload}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="Recent Measurements">
        {measurements.map((measurement, index) => (
          <MeasurementItem
            key={index}
            measurement={measurement}
            onSync={() => syncMeasurement(measurement)}
            syncResult={syncResults.find((r) => r.measurementDate === measurement.date)}
          />
        ))}
      </List.Section>
    </List>
  );
}

interface MeasurementItemProps {
  measurement: WithingsMeasurement;
  onSync: () => void;
  syncResult?: SyncResult;
}

function MeasurementItem({ measurement, onSync, syncResult }: MeasurementItemProps) {
  const formattedDate = measurement.date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const accessories: List.Item.Accessory[] = [];

  if (measurement.weight) {
    accessories.push({
      tag: {
        value: `${measurement.weight.toFixed(1)} kg`,
        color: Color.Blue,
      },
    });
  }

  if (measurement.systolicBloodPressure && measurement.diastolicBloodPressure) {
    accessories.push({
      tag: {
        value: `${measurement.systolicBloodPressure.toFixed(0)}/${measurement.diastolicBloodPressure.toFixed(0)}`,
        color: Color.Red,
      },
    });
  }

  if (syncResult) {
    accessories.push({
      icon: syncResult.success ? Icon.CheckCircle : Icon.XMarkCircle,
      tooltip: syncResult.message,
    });
  }

  return (
    <List.Item
      title={formattedDate}
      accessories={accessories}
      actions={
        <ActionPanel>
          <Action title="Sync to Garmin" onAction={onSync} icon={Icon.Upload} />
        </ActionPanel>
      }
    />
  );
}
