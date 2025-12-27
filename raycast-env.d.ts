/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Withings Client ID - Your Withings OAuth Client ID from https://developer.withings.com/ */
  "withingsClientId": string,
  /** Withings Client Secret - Your Withings OAuth Client Secret */
  "withingsClientSecret": string,
  /** Garmin Username - Your Garmin Connect username/email */
  "garminUsername"?: string,
  /** Garmin Password - Your Garmin Connect password */
  "garminPassword"?: string,
  /** Weight Unit - Display weight in pounds or kilograms */
  "weightUnit": "lbs" | "kg",
  /** Include Blood Pressure - Sync blood pressure measurements to Garmin */
  "includeBloodPressure": boolean
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `view-measurements` command */
  export type ViewMeasurements = ExtensionPreferences & {}
  /** Preferences accessible in the `sync-to-garmin` command */
  export type SyncToGarmin = ExtensionPreferences & {}
  /** Preferences accessible in the `configure` command */
  export type Configure = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `view-measurements` command */
  export type ViewMeasurements = {}
  /** Arguments passed to the `sync-to-garmin` command */
  export type SyncToGarmin = {}
  /** Arguments passed to the `configure` command */
  export type Configure = {}
}

