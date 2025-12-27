# Withings Sync Changelog

## [2.0.0] - 2025-12-27

Major feature update with enhanced sync capabilities.

### New Features

1. **Configurable Lookback Days**: Set default number of days to fetch measurements in preferences (default: 7)
2. **Custom Date Range Sync**: Sync specific date ranges up to 90 days with validation
3. **Garmin Duplicate Detection**: Check existing Garmin data and sync only new measurements
4. **Bulk Forward Sync**: Select a measurement and sync it plus all newer measurements (Alt+Enter)

### Keyboard Shortcuts

- `⌘N` - Sync only new measurements (after checking Garmin)
- `⌥Enter` - Sync selected measurement + all newer
- `⌘G` - Check if measurement exists in Garmin
- `⌘Escape` - Cancel date range form

### UI Improvements

- Added "Sync Custom Date Range" action with date picker form
- Added "Check Garmin for Existing Data" action with visual feedback
- Enhanced measurement actions with forward sync and duplicate checking
- Dynamic empty view message based on configured lookback days

### Breaking Changes

None - fully backward compatible

---

## [Initial Version] - 2025-12-27

Initial release of Withings Sync extension.

### Features

- View Withings measurements (weight, blood pressure, heart rate, body composition)
- Sync measurements to Garmin Connect
- Quick "Sync Today's Data" action to upload all measurements from today
- Support for complete body composition data (weight, body fat, bone mass, muscle mass)
- Optional blood pressure sync
- Secure OAuth authentication for Withings
- Session-based authentication for Garmin Connect
- Weight displayed in pounds (lbs)
