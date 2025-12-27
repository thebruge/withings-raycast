# FIT File Generation - Implementation Notes

## Current Status

The current `garmin-api.ts` contains a **simplified** FIT file generator. For production use, you'll want to improve this.

## Why FIT Files?

FIT (Flexible and Interoperable Data Transfer) is Garmin's proprietary format for fitness data. To upload weight and blood pressure to Garmin Connect, we need to create valid FIT files.

## Current Implementation Issues

The current `createFitFile()` function in `garmin-api.ts` only creates a minimal header. It doesn't actually encode the measurement data properly.

## Recommended Improvements

### Option 1: Use a FIT Library (Recommended)

Install a proper FIT library:

```bash
npm install easy-fit
```

Then update `garmin-api.ts`:

```typescript
import EasyFit from 'easy-fit';

export function createFitFile(data: FitFileData): Buffer {
  const easyFit = new EasyFit({
    force: true,
    speedUnit: 'km/h',
    lengthUnit: 'km',
    temperatureUnit: 'celsius',
    elapsedRecordField: true,
    mode: 'cascade',
  });

  // Create FIT file structure
  const fitData = {
    file_id: {
      type: 'weight',
      manufacturer: 'withings',
      time_created: data.timestamp,
    },
    weight_scale: [{
      timestamp: data.timestamp,
      weight: data.weight,
      percent_fat: data.bodyFat,
      // ... other fields
    }],
  };

  if (data.systolicBP && data.diastolicBP) {
    fitData.blood_pressure = [{
      timestamp: data.timestamp,
      systolic_pressure: data.systolicBP,
      diastolic_pressure: data.diastolicBP,
      heart_rate: data.heartRate,
    }];
  }

  // This is pseudo-code - you'll need to check the library's actual API
  return easyFit.encode(fitData);
}
```

### Option 2: Port from withings-sync

The original withings-sync Python code uses the `garth` library. You could:

1. Study the Python implementation
2. Port the FIT file generation logic to TypeScript
3. Use the same field mappings and structure

Key Python code to reference:
- Look at how withings-sync creates FIT files for weight
- Look at how it handles blood pressure
- Check the field mappings

### Option 3: Call Python Script

A quick workaround (not ideal):

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function createFitFile(data: FitFileData): Promise<Buffer> {
  // Write data to temp JSON file
  const tempFile = `/tmp/withings-data-${Date.now()}.json`;
  await fs.writeFile(tempFile, JSON.stringify(data));
  
  // Call Python script to generate FIT
  const { stdout } = await execAsync(
    `python3 generate_fit.py ${tempFile}`
  );
  
  // Read generated FIT file
  return await fs.readFile(stdout.trim());
}
```

## FIT File Structure for Withings Data

A proper FIT file for weight data should include:

### File ID Message
- Type: weight (4)
- Manufacturer: withings
- Time created: measurement timestamp

### Weight Scale Message
- Timestamp
- Weight (in kg, scaled by 100)
- Body fat percentage (optional)
- Body water percentage (optional)
- Bone mass (optional)
- Muscle mass (optional)

### Blood Pressure Message (if enabled)
- Timestamp
- Systolic pressure (mmHg)
- Diastolic pressure (mmHg)
- Heart rate (bpm, optional)

## Field Scaling

FIT files use integer values with scaling:

- Weight: kg * 100 (0.01 kg resolution)
- Body fat: % * 10 (0.1% resolution)
- Blood pressure: mmHg (no scaling needed)
- Heart rate: bpm (no scaling needed)

## Testing Your FIT Files

To verify FIT files are valid:

1. **Use FIT SDK**: Download Garmin's FIT SDK
2. **Use FitFileViewer**: https://www.fitfileviewer.com/
3. **Try uploading**: Upload to Garmin Connect and check if it accepts

## Priority Tasks

1. ✅ Get basic authentication working
2. ✅ Fetch Withings measurements
3. ✅ **Implement proper FIT file generation**
4. ✅ Implement Garmin authentication using garmin-connect library
5. 🔲 Test Garmin upload ← You are here
6. 🔲 Add error handling
7. 🔲 Polish UI

## Resources

- Garmin FIT SDK: https://developer.garmin.com/fit/overview/
- FIT Protocol: https://developer.garmin.com/fit/protocol/
- withings-sync source: https://github.com/jaroslawhartman/withings-sync
- garth library: https://github.com/matin/garth (Python, shows Garmin auth)

## Quick Start for FIT Implementation

The fastest path to working FIT files:

```bash
# Install a FIT library
npm install @garmin/fitsdk

# Or if that doesn't work:
npm install fit-file-writer
```

Then study the library's examples and implement proper encoding in `garmin-api.ts`.
