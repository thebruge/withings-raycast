import { LocalStorage, getPreferenceValues } from "@raycast/api";
import fetch from "node-fetch";

interface Preferences {
  garminUsername: string;
  garminPassword: string;
  includeBloodPressure: boolean;
}

interface GarminSession {
  oauth1Token?: string;
  oauth2Token?: string;
  cookies?: string[];
}

const GARMIN_SSO_URL = "https://sso.garmin.com/sso";
const GARMIN_CONNECT_URL = "https://connect.garmin.com";

export class GarminAPI {
  private session: GarminSession | null = null;

  async authenticate(): Promise<void> {
    const prefs = getPreferenceValues<Preferences>();

    if (!prefs.garminUsername || !prefs.garminPassword) {
      throw new Error("Garmin username and password are required. Please configure them in preferences.");
    }

    // Try to load existing session
    const sessionString = await LocalStorage.getItem<string>("garmin_session");
    if (sessionString) {
      this.session = JSON.parse(sessionString);
      // Try to validate session
      if (await this.validateSession()) {
        return;
      }
    }

    // Need to authenticate
    await this.performLogin(prefs.garminUsername, prefs.garminPassword);
  }

  private async validateSession(): Promise<boolean> {
    try {
      const response = await fetch(`${GARMIN_CONNECT_URL}/modern/`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  private async performLogin(username: string, password: string): Promise<void> {
    // This is a simplified version - actual Garmin SSO is more complex
    // In production, you'd need to handle the full OAuth flow
    const loginData = new URLSearchParams({
      username,
      password,
      embed: "false",
    });

    const response = await fetch(`${GARMIN_SSO_URL}/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: loginData.toString(),
    });

    if (!response.ok) {
      throw new Error("Failed to authenticate with Garmin. Please check your credentials.");
    }

    // Extract session cookies
    const cookies = response.headers.raw()["set-cookie"];
    this.session = { cookies };

    await LocalStorage.setItem("garmin_session", JSON.stringify(this.session));
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    };

    if (this.session?.cookies) {
      headers["Cookie"] = this.session.cookies.join("; ");
    }

    return headers;
  }

  async uploadFitFile(fitData: Buffer): Promise<boolean> {
    await this.authenticate();

    const formData = new URLSearchParams();
    formData.append("file", fitData.toString("base64"));

    const response = await fetch(`${GARMIN_CONNECT_URL}/modern/proxy/upload-service/upload/.fit`, {
      method: "POST",
      headers: {
        ...this.getHeaders(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to upload to Garmin: ${response.statusText}`);
    }

    const result = (await response.json()) as { detailedImportResult: { successes: unknown[] } };
    return result.detailedImportResult.successes.length > 0;
  }
}

// FIT file creation utilities
export interface FitFileData {
  timestamp: Date;
  weight?: number;
  bodyFat?: number;
  bodyWater?: number;
  boneMass?: number;
  muscleMass?: number;
  systolicBP?: number;
  diastolicBP?: number;
  heartRate?: number;
}

export function createFitFile(data: FitFileData): Buffer {
  // This is a simplified FIT file generator
  // In production, you'd want to use a proper FIT SDK like 'fit-file-writer'
  
  const fitHeader = Buffer.alloc(14);
  fitHeader.writeUInt8(14, 0); // Header size
  fitHeader.writeUInt8(0x10, 1); // Protocol version
  fitHeader.writeUInt16LE(2105, 2); // Profile version
  
  // For now, return a minimal FIT file structure
  // You would need to implement full FIT encoding here
  return fitHeader;
}

export async function clearGarminSession(): Promise<void> {
  await LocalStorage.removeItem("garmin_session");
}
