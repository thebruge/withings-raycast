# Withings Sync for Raycast

Sync your Withings health data (weight, blood pressure, body composition) to Garmin Connect directly from Raycast.

## Features

- 📊 **View Measurements**: View your recent Withings measurements including weight (in lbs), body fat, blood pressure, and heart rate
- ⬆️ **Sync to Garmin**: Upload your Withings data to Garmin Connect with one click
- 📅 **Sync Today's Data**: Quick action to sync all measurements from today
- 🏋️ **Complete Body Composition**: Syncs weight, body fat, bone mass, and skeletal muscle mass
- 🔐 **Secure Authentication**: OAuth-based authentication with automatic token refresh for Withings, session-based auth for Garmin
- 🩺 **Blood Pressure Support**: Optionally include blood pressure readings in your sync
- ⚡ **Fast & Lightweight**: Built with TypeScript and React for optimal performance

## Setup

### 1. Register Withings OAuth App

**REQUIRED**: You must register your own Withings OAuth application:

1. Go to https://developer.withings.com/ and create an account
2. Create a new OAuth 2.0 application
3. Set the **Redirect URI** to: `https://raycast.com/redirect?packageName=Extension`
4. Copy your Client ID and Client Secret

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and add your Withings credentials:
   ```
   WITHINGS_CLIENT_ID=your_client_id_here
   WITHINGS_CLIENT_SECRET=your_client_secret_here
   ```

### 3. Install Dependencies and Build

```bash
npm install
npm run build
```

### 4. Configure Withings in Raycast

1. Open Raycast and search for "Configure Withings & Garmin"
2. Click "Authorize Withings"
3. Sign in to your Withings account in the browser
4. Grant permissions to Raycast

### 5. Configure Garmin

1. Press `⌘ + ,` to open extension preferences
2. Enter your Garmin Connect username (email)
3. Enter your Garmin Connect password
4. Enable/disable blood pressure sync

## Commands

### View Withings Measurements

Browse your recent health measurements from Withings including:
- Weight (displayed in lbs)
- Body fat percentage
- Blood pressure (systolic/diastolic)
- Heart rate
- Bone mass
- Skeletal muscle mass

### Sync to Garmin

Upload your Withings measurements to Garmin Connect:
- **Sync Today's Data**: Upload all measurements from today in one action
- **Sync All Recent**: Batch sync the last 7 measurements
- **Individual Sync**: Sync specific measurements one at a time
- Includes weight, body fat, bone mass, muscle mass, and optionally blood pressure

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
