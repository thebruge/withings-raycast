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

## Publishing to Raycast Store

**CRITICAL: Check for open PRs before making changes to the raycast-extensions fork**

The extension is published via PRs to `raycast/extensions`. The user's fork is `thebruge/raycast-extensions` with branch `ext/withings-sync`.

### Validating Before Push

**IMPORTANT**: Always validate code meets Raycast requirements before pushing:

```bash
# Validate all Raycast requirements (package.json, icons, metadata, ESLint, Prettier)
npx ray lint

# Auto-fix formatting issues
npx ray lint --fix

# Also run build to catch TypeScript errors
npm run build
```

The `npx ray lint` command runs the same validations as `npm run publish` without creating a PR. Always run this before committing.

### Before updating the PR branch:

1. **Validate locally first:**
   ```bash
   npx ray lint --fix
   npm run build
   ```

2. **Check for open PRs:**
   ```bash
   gh pr list --repo raycast/extensions --author thebruge --state open
   ```

3. **If a PR exists**, update it by pushing normally (not force push) to the existing branch:
   ```bash
   cd /Users/rgallagher/Documents/GitHub/raycast-extensions
   git checkout ext/withings-sync
   git pull origin ext/withings-sync
   # Copy updated files from withings-raycast
   cp /Users/rgallagher/Documents/GitHub/withings-raycast/package.json extensions/withings-sync/
   cp /Users/rgallagher/Documents/GitHub/withings-raycast/src/*.ts extensions/withings-sync/src/
   cp /Users/rgallagher/Documents/GitHub/withings-raycast/src/*.tsx extensions/withings-sync/src/
   cp /Users/rgallagher/Documents/GitHub/withings-raycast/README.md extensions/withings-sync/
   git add extensions/withings-sync/
   git commit -m "Description of changes"
   GIT_LFS_SKIP_PUSH=1 git push origin ext/withings-sync
   ```

4. **NEVER force push** to a branch with an open PR - this will close the PR.

5. **NEVER disable git hooks** (`git config core.hooksPath /dev/null`) when pushing to PR branches.

6. **If using `npm run publish`**: Only use this when there is NO open PR. The Raycast CLI manages its own PR lifecycle and will create a new PR, potentially conflicting with existing ones.

### Related repositories:
- **Development repo**: `/Users/rgallagher/Documents/GitHub/withings-raycast` (this repo)
- **Fork for PRs**: `/Users/rgallagher/Documents/GitHub/raycast-extensions`
- **Upstream**: `raycast/extensions`

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
- `GarminAPI` class manages session state using garmin-connect library
- `authenticate()`: Loads cached OAuth tokens or performs login
- Uses `GarminConnect` client (Node.js equivalent of Python garth library)
- `uploadFitFile()`: Writes FIT buffer to temp file and uploads to Garmin Connect
- `createFitFile()`: Generates proper FIT files using @markw65/fit-file-writer
- Session storage key: `garmin_session` in LocalStorage (stores OAuth1/OAuth2 tokens)

**[src/configure.tsx](src/configure.tsx)**: Configuration UI
- Shows connection status for both Withings and Garmin
- Handles OAuth authorization flow
- Manages logout/disconnect

**[src/view-measurements.tsx](src/view-measurements.tsx)**: Read-only measurement viewer
- Displays last 7 days of measurements by default
- Shows weight (in lbs), blood pressure, heart rate, body fat
- Grouped by measurement date
- Weight conversion: kg to lbs (× 2.20462)

**[src/sync-to-garmin.tsx](src/sync-to-garmin.tsx)**: Sync interface
- **Sync Today's Data**: Syncs all measurements from current day
- **Sync All Recent**: Batch sync last 7 measurements
- Individual measurement sync
- Shows sync status per measurement
- Respects `includeBloodPressure` preference
- Syncs complete body composition: weight, body fat, bone mass, muscle mass

### API Integration Details

**Withings API**:
- Endpoint: `https://wbsapi.withings.net`
- OAuth flow requires your own registered OAuth app credentials
- Redirect URI must be: `https://raycast.com/redirect?packageName=Extension`
- Measurement types map to numeric codes:
  - 1=weight, 5=fat-free mass, 6=fat ratio, 8=fat mass weight
  - 9=diastolic BP, 10=systolic BP, 11=heart pulse
  - 76=muscle mass, 88=bone mass
- Values include scaling factor (unit field): `actualValue = value * 10^unit`

**Garmin Connect**:
- Uses `garmin-connect` npm library (Node.js equivalent of Python garth)
- OAuth1 and OAuth2 token-based authentication
- Automatic session management and token refresh
- Upload endpoint accessed via library's `uploadActivity()` method
- Credentials stored in Raycast preferences, OAuth tokens in LocalStorage

### State Management

- No global state management library used
- Each command is independent with local React state
- LocalStorage used for:
  - Withings OAuth tokens (with expiry)
  - Garmin OAuth1/OAuth2 tokens
- Preferences managed by Raycast API

### Critical Implementation Notes

**FIT File Generation**: Uses `@markw65/fit-file-writer` library for proper FIT encoding:
- Generates file_id, weight_scale, and blood_pressure messages
- Supports weight, body fat, bone mass, muscle mass, blood pressure, and heart rate
- Timestamps in FIT format (seconds since UTC 00:00 Dec 31 1989)
- Returns Buffer that's written to temp file for upload

**Garmin Authentication**: Uses `garmin-connect` library (inspired by Python garth):
- `loadToken()` and `exportToken()` for session persistence
- `getUserSettings()` to validate session before use
- Automatic login if session expired or invalid
- OAuth tokens stored as JSON in LocalStorage

**Token Refresh**:
- Withings: Tokens refreshed 5 minutes before expiry (300000ms buffer) in `getValidTokens()`
- Garmin: Handled automatically by garmin-connect library

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
- `garmin-connect`: Garmin Connect authentication and upload (Node.js garth equivalent)
- `@markw65/fit-file-writer`: FIT file generation for Garmin
- TypeScript 5.4.5 with strict mode enabled

Dev dependencies:
- `@types/react@19.0.10`: React 19 types (required by Raycast)
- `@types/node@22.13.10`: Node.js types (required by Raycast)

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

## Raycast Store PR Requirements

When submitting PRs to the Raycast extensions store:

### PR Description Template
PRs need a full description with these sections:
- **Description**: What the extension does, how it works, user features
- **Screencast**: Video/screenshots (speeds up review)
- **Checklist**: Confirming guidelines were followed

Use `gh pr edit <number> --repo raycast/extensions --body "..."` to update PR descriptions.

### PR State
- PRs must NOT be in draft state to be reviewed
- Check PR state: `gh pr view <number> --repo raycast/extensions --json isDraft,state`

### Common Review Feedback
Issues that reviewers commonly flag:

1. **Unnecessary dependencies**: Don't include `node-fetch` - Node 21+ has built-in fetch
2. **Manual type definitions**: Don't define `interface Preferences {}` manually - Raycast auto-generates this from package.json preferences
3. **Future-dated changelog**: Dates in CHANGELOG.md should not be in the future

## LaunchAgent Configuration

The extension runs in dev mode via a LaunchAgent for persistent availability.

**Plist location**: `/Users/rgallagher/Library/LaunchAgents/com.user.withings-raycast-dev.plist`

**Key settings**:
- Working directory: `/Users/rgallagher/Documents/GitHub/withings-raycast`
- npm path: `/opt/homebrew/bin/npm` (Homebrew on Apple Silicon)
- PATH must include `/opt/homebrew/bin` for Homebrew tools

**Managing the service**:
```bash
# Check status
launchctl list | grep withings

# View logs
cat /tmp/withings-raycast-dev.log
cat /tmp/withings-raycast-dev-error.log

# Reload after changes
launchctl unload ~/Library/LaunchAgents/com.user.withings-raycast-dev.plist
launchctl load ~/Library/LaunchAgents/com.user.withings-raycast-dev.plist
```

**If the extension stops working after moving the repo**, update the WorkingDirectory in the plist file.

## Git LFS Issues

The `raycast-extensions` repo uses Git LFS. If you see LFS errors when pushing:

1. **DO NOT** disable hooks with `git config core.hooksPath /dev/null` - this can cause force pushes that close PRs
2. Instead, install git-lfs: `brew install git-lfs`
3. Or use `GIT_LFS_SKIP_PUSH=1` environment variable (safer)

## Troubleshooting

### Extension not appearing in Raycast
1. Run `npm run dev` from the extension directory
2. Check that the LaunchAgent is running: `launchctl list | grep withings`
3. Check logs: `cat /tmp/withings-raycast-dev.log`

### npm path issues in LaunchAgent
On Apple Silicon Macs, npm is at `/opt/homebrew/bin/npm`, not `/usr/local/bin/npm`. Update the plist if needed.

### PR accidentally closed
If a PR gets closed due to force push or branch issues:
1. The code is still in the branch - create a new PR from the same branch
2. Copy the description from the old PR
3. Update PR description with `gh pr edit`