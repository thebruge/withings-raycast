# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Raycast extension that syncs Withings health data (weight, blood pressure, body composition) to Garmin Connect. Built with TypeScript and React, using the Raycast API for UI and OAuth authentication.

## Setup Requirements

### Withings OAuth App Registration

**REQUIRED**: You must register your own Withings OAuth application:

1. Go to https://developer.withings.com/ and create an account
2. Create a new OAuth 2.0 application
3. Set the **Redirect URI** to: `https://raycast.com/redirect?packageName=Extension`
4. Copy your Client ID and Client Secret
5. Update `WITHINGS_CLIENT_ID` and `WITHINGS_CLIENT_SECRET` in [src/withings-api.ts](src/withings-api.ts:8-9)

The redirect URI **must** match exactly what Raycast expects, or OAuth will fail with "redirect_uri_mismatch" error.

## Development Commands

### Build and Development
```bash
# Development mode with hot reload
npm run dev

# Build for distribution
npm run build

# Linting
npm run lint

# Auto-fix linting issues
npm run fix-lint

# Publish to Raycast Store
npm run publish
```

### Testing in Raycast
- Use `npm run dev` to run in development mode
- The extension will appear in Raycast immediately
- Changes auto-reload during development
- Use the Raycast developer console (⌘ + ⇧ + D in dev mode) for debugging

## Architecture

### High-Level Data Flow

1. **OAuth Authentication**: Withings uses OAuth 2.0 PKCE flow via `@raycast/api` OAuth client
2. **Token Management**: Access tokens stored in LocalStorage, auto-refreshed 5 minutes before expiry
3. **Data Fetching**: Measurements fetched from Withings API, grouped by date
4. **FIT File Generation**: Health data converted to Garmin's FIT format
5. **Garmin Upload**: Session-based authentication with cookie management, FIT files uploaded via HTTP

### Module Structure

**[src/withings-api.ts](src/withings-api.ts)**: Withings OAuth and data fetching
- `withingsOAuthClient`: Shared OAuth client instance
- `authorize()`: Initiates OAuth flow, stores tokens
- `getValidTokens()`: Returns valid tokens, auto-refreshes if needed
- `getMeasurements()`: Fetches measurements, groups by date, sorts descending
- Token storage key: `withings_tokens` in LocalStorage

**[src/garmin-api.ts](src/garmin-api.ts)**: Garmin authentication and upload
- `GarminAPI` class manages session state
- `authenticate()`: Loads cached session or performs login
- `validateSession()`: Checks if existing session is valid
- `uploadFitFile()`: Uploads FIT file to Garmin Connect
- `createFitFile()`: **Currently simplified** - needs proper FIT encoding (see FIT_IMPLEMENTATION.md)
- Session storage key: `garmin_session` in LocalStorage

**[src/configure.tsx](src/configure.tsx)**: Configuration UI
- Shows connection status for both Withings and Garmin
- Handles OAuth authorization flow
- Manages logout/disconnect

**[src/view-measurements.tsx](src/view-measurements.tsx)**: Read-only measurement viewer
- Displays last 7 days of measurements by default
- Shows weight, blood pressure, heart rate, body fat
- Grouped by measurement date

**[src/sync-to-garmin.tsx](src/sync-to-garmin.tsx)**: Sync interface
- Individual and batch sync (last 7 measurements)
- Shows sync status per measurement
- Respects `includeBloodPressure` preference

### API Integration Details

**Withings API**:
- Endpoint: `https://wbsapi.withings.net`
- OAuth flow requires your own registered OAuth app credentials
- Redirect URI must be: `https://raycast.com/redirect?packageName=Extension`
- Measurement types map to numeric codes (1=weight, 9=diastolic BP, 10=systolic BP, etc.)
- Values include scaling factor (unit field): `actualValue = value * 10^unit`

**Garmin Connect**:
- SSO endpoint: `https://sso.garmin.com/sso`
- Upload endpoint: `https://connect.garmin.com/modern/proxy/upload-service/upload/.fit`
- Uses form-based authentication (username/password from preferences)
- Session managed via cookies
- Credentials stored in Raycast preferences, session in LocalStorage

### State Management

- No global state management library used
- Each command is independent with local React state
- LocalStorage used for:
  - Withings OAuth tokens (with expiry)
  - Garmin session cookies
- Preferences managed by Raycast API

### Critical Implementation Notes

**FIT File Generation**: The current implementation in `createFitFile()` only creates a minimal header and does NOT properly encode measurement data. This is a known limitation documented in FIT_IMPLEMENTATION.md. For production use, you need to either:
1. Use a FIT library like `easy-fit` or `@garmin/fitsdk`
2. Port the FIT encoding logic from the Python withings-sync project
3. Implement manual FIT encoding following Garmin's FIT SDK documentation

**Token Refresh**: Tokens are refreshed 5 minutes before expiry (300000ms buffer). This happens transparently in `getValidTokens()` - callers don't need to handle refresh logic.

**Error Handling**: All API calls should handle errors and show toast notifications. Network errors, auth failures, and API errors all surface as user-visible toasts.

## Extension Metadata

- Commands defined in [package.json](package.json:13-34)
- Preferences defined in [package.json](package.json:36-61)
- Three commands: `view-measurements`, `sync-to-garmin`, `configure`
- Schema: https://www.raycast.com/schemas/extension.json

## Dependencies

Key dependencies:
- `@raycast/api`: Core Raycast functionality, OAuth, UI components
- `@raycast/utils`: Helper utilities for common patterns
- `node-fetch`: HTTP requests (v2 for CommonJS compatibility)
- TypeScript 5.4.5 with strict mode enabled

## Common Development Patterns

**API Error Handling**:
```typescript
try {
  await showToast({ style: Toast.Style.Animated, title: "Loading..." });
  // API call
  await showToast({ style: Toast.Style.Success, title: "Success!" });
} catch (error) {
  showToast({
    style: Toast.Style.Failure,
    title: "Error",
    message: error instanceof Error ? error.message : "Unknown error",
  });
}
```

**Authentication Check Pattern**:
```typescript
const isAuth = await isAuthenticated();
if (!isAuth) {
  // Show empty view with authorize action
  return;
}
// Proceed with authenticated flow
```

**Measurement Data Access**:
All measurements are optional fields on `WithingsMeasurement`. Always check for undefined before using:
```typescript
if (measurement.weight) {
  // Use measurement.weight
}
```