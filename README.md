# Withings Sync for Raycast

Sync your Withings health data (weight, blood pressure, body composition) to Garmin Connect directly from Raycast.

## Features

- 📊 **View Measurements**: View your recent Withings measurements including weight, body fat, and blood pressure
- ⬆️ **Sync to Garmin**: Upload your Withings data to Garmin Connect with one click
- 🔐 **Secure Authentication**: OAuth-based authentication with automatic token refresh
- 🩺 **Blood Pressure Support**: Optionally include blood pressure readings in your sync
- ⚡ **Fast & Lightweight**: Built with TypeScript and React for optimal performance

## Setup

### 1. Install the Extension

Install the extension from the Raycast Store or build it locally.

### 2. Configure Withings

1. Run the "Configure Withings & Garmin" command
2. Click "Authorize Withings"
3. Sign in to your Withings account in the browser
4. Grant permissions to Raycast

### 3. Configure Garmin (Optional)

1. Press `⌘ + ,` to open extension preferences
2. Enter your Garmin Connect username (email)
3. Enter your Garmin Connect password
4. Enable/disable blood pressure sync

## Commands

### View Withings Measurements

Browse your recent health measurements from Withings including:
- Weight
- Body fat percentage
- Blood pressure (systolic/diastolic)
- Heart rate

### Sync to Garmin

Upload your Withings measurements to Garmin Connect:
- Sync individual measurements
- Batch sync recent measurements
- Includes weight and optionally blood pressure

### Configure Withings & Garmin

Manage your account connections and view configuration status.

## Preferences

- **Garmin Username**: Your Garmin Connect email address
- **Garmin Password**: Your Garmin Connect password
- **Include Blood Pressure**: Whether to sync blood pressure measurements

## Privacy & Security

- All credentials are stored securely in Raycast's encrypted storage
- OAuth tokens are automatically refreshed
- No data is sent to third parties
- Garmin password is stored locally and never transmitted except to Garmin

## Troubleshooting

### "Not authenticated" error

Run the "Configure Withings & Garmin" command and click "Authorize Withings"

### Garmin sync fails

1. Verify your Garmin credentials in preferences
2. Check that you can log in to connect.garmin.com
3. Try disconnecting and reconnecting in the configure command

### No measurements showing

- Ensure you have recent measurements in your Withings account
- The extension shows measurements from the last 7 days by default

## Credits

Based on [withings-sync](https://github.com/jaroslawhartman/withings-sync) by Jaroslaw Hartman.

## License

MIT License
