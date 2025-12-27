#!/bin/bash

# Setup script for Withings Sync Raycast Extension
# This organizes all files into the correct directory structure

echo "🚀 Setting up Withings Sync Raycast Extension..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📁 Current directory: $SCRIPT_DIR"

# Create the necessary directories
echo "📂 Creating directory structure..."
mkdir -p "$SCRIPT_DIR/src"
mkdir -p "$SCRIPT_DIR/assets"

# Move TypeScript/React files to src/
echo "📦 Moving source files to src/..."
[ -f "$SCRIPT_DIR/configure.tsx" ] && mv "$SCRIPT_DIR/configure.tsx" "$SCRIPT_DIR/src/"
[ -f "$SCRIPT_DIR/sync-to-garmin.tsx" ] && mv "$SCRIPT_DIR/sync-to-garmin.tsx" "$SCRIPT_DIR/src/"
[ -f "$SCRIPT_DIR/view-measurements.tsx" ] && mv "$SCRIPT_DIR/view-measurements.tsx" "$SCRIPT_DIR/src/"
[ -f "$SCRIPT_DIR/withings-api.ts" ] && mv "$SCRIPT_DIR/withings-api.ts" "$SCRIPT_DIR/src/"
[ -f "$SCRIPT_DIR/garmin-api.ts" ] && mv "$SCRIPT_DIR/garmin-api.ts" "$SCRIPT_DIR/src/"

# Move and rename the icon
echo "🎨 Moving icon to assets/..."
if [ -f "$SCRIPT_DIR/extension_icon.png" ]; then
    mv "$SCRIPT_DIR/extension_icon.png" "$SCRIPT_DIR/assets/command-icon.png"
    echo "✅ Icon renamed to command-icon.png"
else
    echo "⚠️  Warning: extension_icon.png not found. You'll need to add assets/command-icon.png manually"
fi

# Keep these files in root
echo "📄 Root files are already in place:"
echo "   - package.json"
echo "   - README.md"
echo "   - SETUP.md"
echo "   - QUICKSTART.md"
echo "   - PROJECT_SUMMARY.md"
echo "   - FIT_IMPLEMENTATION.md"

# Create tsconfig.json if it doesn't exist
if [ ! -f "$SCRIPT_DIR/tsconfig.json" ]; then
    echo "⚙️  Creating tsconfig.json..."
    cat > "$SCRIPT_DIR/tsconfig.json" << 'EOF'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF
fi

# Create .gitignore if it doesn't exist
if [ ! -f "$SCRIPT_DIR/.gitignore" ]; then
    echo "📝 Creating .gitignore..."
    cat > "$SCRIPT_DIR/.gitignore" << 'EOF'
# Node
node_modules
dist
.DS_Store

# Raycast
.raycast

# Logs
*.log
npm-debug.log*

# Environment
.env
.env.local
EOF
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Directory structure:"
tree -L 2 "$SCRIPT_DIR" 2>/dev/null || find "$SCRIPT_DIR" -maxdepth 2 -not -path '*/node_modules/*' | head -20

echo ""
echo "🎯 Next steps:"
echo "   1. cd $(basename "$SCRIPT_DIR")"
echo "   2. npm install"
echo "   3. npm run dev"
echo ""
echo "📖 Read QUICKSTART.md for detailed instructions"
echo ""
