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
  Form,
} from "@raycast/api";
import { useEffect, useState } from "react";
import {
  getMeasurements,
  isAuthenticated,
  authorize,
  WithingsMeasurement,
} from "./withings-api";
import {
  GarminAPI,
  createFitFile,
  FitFileData,
  DateWeightMap,
} from "./garmin-api";

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
  const [showDateRangeForm, setShowDateRangeForm] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [garminWeightData, setGarminWeightData] =
    useState<DateWeightMap | null>(null);
  const [isCheckingGarmin, setIsCheckingGarmin] = useState(false);
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
        message:
          "Please configure your Garmin username and password in preferences",
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

      if (
        prefs.includeBloodPressure &&
        measurement.systolicBloodPressure &&
        measurement.diastolicBloodPressure
      ) {
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
        message:
          "Please configure your Garmin username and password in preferences",
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
        message:
          "Please configure your Garmin username and password in preferences",
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

  async function checkGarminData() {
    if (!prefs.garminUsername || !prefs.garminPassword) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Garmin credentials missing",
        message: "Please configure Garmin credentials first",
      });
      return;
    }

    try {
      setIsCheckingGarmin(true);
      await showToast({
        style: Toast.Style.Animated,
        title: "Checking Garmin Connect...",
        message: "Fetching existing weight data",
      });

      const garmin = new GarminAPI();

      if (measurements.length === 0) {
        await showToast({
          style: Toast.Style.Failure,
          title: "No measurements",
          message: "Load Withings measurements first",
        });
        return;
      }

      const oldestMeasurement = measurements[measurements.length - 1];
      const newestMeasurement = measurements[0];

      const weightData = await garmin.getWeightDataForDateRange(
        oldestMeasurement.date,
        newestMeasurement.date,
      );

      setGarminWeightData(weightData);

      await showToast({
        style: Toast.Style.Success,
        title: "Garmin data loaded",
        message: `Found ${Object.keys(weightData).length} measurements`,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to check Garmin",
        message: error instanceof Error ? error.message : "Unknown error",
      });
      setGarminWeightData(null);
    } finally {
      setIsCheckingGarmin(false);
    }
  }

  async function syncOnlyNew() {
    if (!garminWeightData) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Check Garmin first",
        message: "Use 'Check Garmin for Existing Data' action first",
      });
      return;
    }

    const newMeasurements = measurements.filter((measurement) => {
      const dateKey = measurement.date.toISOString().split("T")[0];
      const existsInGarmin = garminWeightData[dateKey];

      if (!existsInGarmin) {
        return true;
      }

      if (measurement.weight) {
        const weightDiff = Math.abs(measurement.weight - existsInGarmin.weight);
        return weightDiff >= 0.1;
      }

      return false;
    });

    if (newMeasurements.length === 0) {
      await showToast({
        style: Toast.Style.Success,
        title: "Already synced",
        message: "All measurements already exist in Garmin",
      });
      return;
    }

    await showToast({
      style: Toast.Style.Animated,
      title: "Syncing new measurements",
      message: `${newMeasurements.length} to sync`,
    });

    for (const measurement of newMeasurements) {
      await syncMeasurement(measurement);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await showToast({
      style: Toast.Style.Success,
      title: "Sync complete",
      message: `Synced ${newMeasurements.length} new measurements`,
    });
  }

  async function syncFromSelected(selectedMeasurement: WithingsMeasurement) {
    const selectedIndex = measurements.findIndex(
      (m) => m.date.getTime() === selectedMeasurement.date.getTime(),
    );

    if (selectedIndex === -1) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Selected measurement not found",
      });
      return;
    }

    const measurementsToSync = measurements.slice(0, selectedIndex + 1);

    await showToast({
      style: Toast.Style.Animated,
      title: "Syncing forward",
      message: `${measurementsToSync.length} measurements`,
    });

    for (const measurement of measurementsToSync.reverse()) {
      await syncMeasurement(measurement);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await showToast({
      style: Toast.Style.Success,
      title: "Sync complete",
      message: `Synced ${measurementsToSync.length} measurements`,
    });
  }

  async function handleCustomDateRangeSync() {
    if (!customStartDate || !customEndDate) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Validation Error",
        message: "Both start and end dates are required",
      });
      return;
    }

    if (customStartDate > customEndDate) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Validation Error",
        message: "Start date must be before end date",
      });
      return;
    }

    const daysDiff = Math.ceil(
      (customEndDate.getTime() - customStartDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysDiff > 90) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Date Range Too Large",
        message: "Please select a range of 90 days or less",
      });
      return;
    }

    try {
      setIsLoading(true);
      await showToast({
        style: Toast.Style.Animated,
        title: "Fetching measurements",
        message: `${daysDiff} days`,
      });

      const customMeasurements = await getMeasurements(
        customStartDate,
        customEndDate,
      );

      if (customMeasurements.length === 0) {
        await showToast({
          style: Toast.Style.Failure,
          title: "No measurements found",
          message: "No data in selected date range",
        });
        setIsLoading(false);
        return;
      }

      await showToast({
        style: Toast.Style.Animated,
        title: "Syncing measurements",
        message: `${customMeasurements.length} to sync`,
      });

      for (const measurement of customMeasurements) {
        await syncMeasurement(measurement);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      await showToast({
        style: Toast.Style.Success,
        title: "Custom sync complete",
        message: `Synced ${customMeasurements.length} measurements`,
      });

      setShowDateRangeForm(false);
      setCustomStartDate(null);
      setCustomEndDate(null);
      await loadMeasurements();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Sync failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function CustomDateRangeForm() {
    return (
      <Form
        actions={
          <ActionPanel>
            <Action.SubmitForm
              title="Sync Date Range"
              onSubmit={handleCustomDateRangeSync}
              icon={Icon.Upload}
            />
            <Action
              title="Cancel"
              onAction={() => setShowDateRangeForm(false)}
              icon={Icon.XMarkCircle}
              shortcut={{ modifiers: ["cmd"], key: "escape" }}
            />
          </ActionPanel>
        }
      >
        <Form.DatePicker
          id="startDate"
          title="Start Date"
          value={customStartDate}
          onChange={setCustomStartDate}
          max={new Date()}
        />
        <Form.DatePicker
          id="endDate"
          title="End Date"
          value={customEndDate}
          onChange={setCustomEndDate}
          max={new Date()}
          min={customStartDate || undefined}
        />
        <Form.Description
          title="Info"
          text="Select a date range to sync (max 90 days). All measurements in this range will be synced to Garmin."
        />
      </Form>
    );
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
              <Action
                title="Authorize Withings"
                onAction={handleAuthorize}
                icon={Icon.Key}
              />
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

  // Show custom date range form if requested
  if (showDateRangeForm) {
    return <CustomDateRangeForm />;
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
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Select measurement to sync..."
    >
      <List.Section title="Actions">
        <List.Item
          title="Sync Today's Data"
          subtitle="Sync all measurements from today"
          icon={Icon.Calendar}
          accessories={[
            {
              tag: {
                value: `${todaysMeasurements.length} item${todaysMeasurements.length !== 1 ? "s" : ""}`,
              },
            },
          ]}
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
          subtitle="Sync the last 7 measurements"
          icon={Icon.Upload}
          accessories={[
            { tag: { value: `${Math.min(measurements.length, 7)} items` } },
          ]}
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
        <List.Item
          title="Sync Custom Date Range"
          subtitle="Choose specific dates to sync"
          icon={Icon.Calendar}
          actions={
            <ActionPanel>
              <Action
                title="Choose Date Range"
                onAction={() => setShowDateRangeForm(true)}
                icon={Icon.Calendar}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Check Garmin for Existing Data"
          subtitle="Fetch existing weight data from Garmin"
          icon={Icon.Download}
          accessories={
            garminWeightData
              ? [
                  {
                    tag: {
                      value: `${Object.keys(garminWeightData).length} found`,
                      color: Color.Green,
                    },
                  },
                ]
              : isCheckingGarmin
                ? [{ tag: { value: "Checking...", color: Color.Blue } }]
                : []
          }
          actions={
            <ActionPanel>
              <Action
                title="Check Garmin"
                onAction={checkGarminData}
                icon={Icon.Download}
              />
              {garminWeightData && (
                <Action
                  title="Sync Only New"
                  onAction={syncOnlyNew}
                  icon={Icon.Stars}
                  shortcut={{ modifiers: ["cmd"], key: "n" }}
                />
              )}
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
            onSyncFromSelected={() => syncFromSelected(measurement)}
            garminWeightData={garminWeightData}
            syncResult={syncResults.find(
              (r) => r.measurementDate === measurement.date,
            )}
          />
        ))}
      </List.Section>
    </List>
  );
}

interface MeasurementItemProps {
  measurement: WithingsMeasurement;
  onSync: () => void;
  onSyncFromSelected: () => void;
  garminWeightData: DateWeightMap | null;
  syncResult?: SyncResult;
}

function MeasurementItem({
  measurement,
  onSync,
  onSyncFromSelected,
  garminWeightData,
  syncResult,
}: MeasurementItemProps) {
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
          <Action
            title="Sync This + All Newer"
            onAction={onSyncFromSelected}
            icon={Icon.ArrowUp}
            shortcut={{ modifiers: ["opt"], key: "enter" }}
          />
          {garminWeightData && (
            <Action
              title="Check If in Garmin"
              onAction={async () => {
                const dateKey = measurement.date.toISOString().split("T")[0];
                const exists = garminWeightData[dateKey];
                await showToast({
                  style: exists ? Toast.Style.Success : Toast.Style.Failure,
                  title: exists ? "Found in Garmin" : "Not in Garmin",
                  message: exists
                    ? `Weight: ${exists.weight.toFixed(1)} kg`
                    : "Not synced",
                });
              }}
              icon={Icon.MagnifyingGlass}
              shortcut={{ modifiers: ["cmd"], key: "g" }}
            />
          )}
        </ActionPanel>
      }
    />
  );
}
