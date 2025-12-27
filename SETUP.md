# Withings Sync - Setup Guide

This guide will walk you through setting up the Withings Sync extension for Raycast.

## Prerequisites

- macOS with Raycast installed
- Node.js 18+ and npm
- A Withings account with measurement data
- (Optional) A Garmin Connect account for syncing

## Installation

### Option 1: Install from Raycast Store (When Published)

1. Open Raycast
2. Search for "Withings Sync"
3. Click Install
4. Follow the setup wizard

### Option 2: Build from Source

1. **Clone or download this repository**

```bash
cd ~/Documents  # or wherever you keep your projects
git clone <repository-url>
cd withings-raycast
```

2. **Install dependencies**

```bash
npm install
```

3. **Add an icon** (required)

You need to add a `command-icon.png` file to the `assets/` folder. This should be a 512x512 PNG image.

Quick option: Create one at https://ray.so/icon

Or use any 512x512 PNG image and save it as:
```
assets/command-icon.png
```

4. **Import into Raycast**

```bash
npm run dev
```

This will open Raycast in development mode with your extension loaded.

Alternatively:
- Open Raycast
- Type "Import Extension"
- Select the folder containing this extension

## Initial Configuration

### Step 1: Authorize Withings

1. Open Raycast and type: `Configure Withings & Garmin`
2. Press Enter to run the command
3. Click "Authorize Withings"
4. A browser window will open
5. Log in to your Withings account
6. Grant permissions to Raycast
7. You'll be redirected back to Raycast

The authorization will be saved and tokens will refresh automatically.

### Step 2: Configure Garmin (Optional)

If you want to sync to Garmin Connect:

1. Press `⌘ + ,` (Command + Comma) while in any Withings Sync command
2. This opens the extension preferences
3. Enter your Garmin Connect credentials:
   - **Garmin Username**: Your email address used for Garmin Connect
   - **Garmin Password**: Your Garmin Connect password
4. Toggle "Include Blood Pressure" if desired
5. Close preferences

**Note**: Your Garmin credentials are stored securely in Raycast's encrypted storage and are only used to authenticate with Garmin's servers.

## Using the Extension

### View Measurements

1. Open Raycast
2. Type: `View Withings Measurements`
3. Press Enter
4. You'll see your recent measurements with:
   - Date and time
   - Weight (if available)
   - Blood pressure (if available)
   - Heart rate (if available)
   - Body fat percentage (if available)

### Sync to Garmin

1. Open Raycast
2. Type: `Sync to Garmin`
3. Press Enter
4. Options:
   - **Sync All Recent**: Syncs the last 7 measurements
   - Select individual measurement and press Enter to sync just that one

## Troubleshooting

### "Withings Not Connected"

**Solution**: Run the "Configure Withings & Garmin" command and click "Authorize Withings"

### "Garmin credentials missing"

**Solution**: 
1. Press `⌘ + ,` in any Withings Sync command
2. Enter your Garmin username and password
3. Close preferences and try again

### No measurements showing up

**Possible causes**:
- You haven't taken any measurements in the last 7 days
- Authorization failed or expired

**Solutions**:
1. Check that you have measurements in the Withings app
2. Try disconnecting and reconnecting Withings in the Configure command
3. Check that measurements are recent (last 7 days)

### Garmin sync fails

**Possible causes**:
- Incorrect Garmin credentials
- Garmin account requires 2FA (not yet supported)
- Network issues

**Solutions**:
1. Verify you can log in to connect.garmin.com with your credentials
2. Check your internet connection
3. Try again in a few minutes (Garmin may be rate-limiting)

### Extension won't install in Raycast

**Solution**:
1. Make sure you have the icon file: `assets/command-icon.png`
2. Run `npm install` to ensure all dependencies are installed
3. Try running `npm run build` to check for TypeScript errors

## Privacy & Security

### What data is stored?

- **Withings OAuth tokens**: Stored locally in Raycast's encrypted storage
- **Garmin credentials**: Stored locally in Raycast's preferences (encrypted)
- **No measurement data**: Health data is fetched on-demand, not stored

### Where is data sent?

- **Withings API**: To fetch your measurements
- **Garmin API**: Only if you choose to sync (and only to upload FIT files)
- **No third parties**: Your data never leaves your device except to Withings/Garmin

### Can I remove my data?

Yes:
1. Run "Configure Withings & Garmin"
2. Click "Disconnect Withings"
3. Delete Garmin credentials from preferences (⌘ + ,)
4. Optionally uninstall the extension

## Development

### Project Structure

```
withings-raycast/
├── src/
│   ├── view-measurements.tsx    # View command
│   ├── sync-to-garmin.tsx       # Sync command
│   ├── configure.tsx            # Configuration command
│   ├── withings-api.ts          # Withings API client
│   └── garmin-api.ts            # Garmin API client
├── assets/
│   └── command-icon.png         # Extension icon
├── package.json                 # Extension manifest
└── README.md                    # Documentation
```

### Running in Development Mode

```bash
npm run dev
```

This enables:
- Hot reloading
- Console logging visible in terminal
- Faster iteration

### Building for Production

```bash
npm run build
```

### Publishing to Raycast Store

```bash
npm run publish
```

## Advanced Configuration

### Customizing Date Range

Currently, the extension fetches the last 7 days of measurements. To change this, modify the `getMeasurements()` call in the source files.

### Adding More Measurement Types

Withings supports many measurement types. To add more:

1. Edit `src/withings-api.ts`
2. Add new measurement type constants
3. Update the parsing logic in `getMeasurements()`
4. Update the UI components to display new types

## Support

For issues or questions:
1. Check this SETUP.md file
2. Review the main README.md
3. Check the original withings-sync project: https://github.com/jaroslawhartman/withings-sync

## Next Steps

After setup:
1. ✅ Verify measurements appear in "View Withings Measurements"
2. ✅ Test syncing to Garmin (if configured)
3. ✅ Set up keyboard shortcuts in Raycast for quick access
4. ✅ Enjoy seamless health data syncing!
