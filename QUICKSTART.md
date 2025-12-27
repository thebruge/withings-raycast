# Quick Start Guide

## Get Running in 5 Minutes

### Step 1: Add Icon (Required)
```bash
# Navigate to the extension folder
cd withings-raycast

# Create a simple icon or download one
# Save as: assets/command-icon.png (512x512 PNG)
```

💡 **Quick icon creation**: Visit https://ray.so/icon and create one

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run in Development Mode
```bash
npm run dev
```

Raycast will open with your extension loaded!

### Step 4: Test Withings Connection
1. In Raycast, type: `Configure Withings`
2. Click "Authorize Withings"
3. Log in to Withings in the browser
4. Return to Raycast

### Step 5: View Your Data
1. In Raycast, type: `View Withings Measurements`
2. See your recent measurements!

### Step 6 (Optional): Configure Garmin
1. In any command, press `⌘ + ,`
2. Enter Garmin username and password
3. Toggle blood pressure if desired

### Step 7 (Optional): Sync to Garmin
1. Type: `Sync to Garmin`
2. Select a measurement or sync all

⚠️ **Note**: Garmin sync requires proper FIT file implementation (see FIT_IMPLEMENTATION.md)

## Troubleshooting

**"Can't find icon"**
- Make sure `assets/command-icon.png` exists
- Must be 512x512 PNG

**"Module not found"**
- Run `npm install`
- Check that you're in the right directory

**"Withings authorization fails"**
- Check your internet connection
- Try again (browser might have blocked popup)

**"No measurements showing"**
- Ensure you have measurements in last 7 days
- Check Withings app to verify data exists

## Next Steps

1. ✅ Get basic viewing working (above)
2. 🔨 Implement FIT file generation (see FIT_IMPLEMENTATION.md)
3. ✅ Test Garmin sync
4. 🚀 Publish to Raycast Store (optional)

## Need Help?

- Read SETUP.md for detailed instructions
- Check PROJECT_SUMMARY.md for technical overview
- See FIT_IMPLEMENTATION.md for Garmin sync details

Happy syncing! 🏃‍♂️
