#!/bin/bash

# Simple wrapper script to build Lambda Layer
# This can be run from the project root directory

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Building Lambda Layer for analyze-assignment..."
echo "Project root: $SCRIPT_DIR"

# Run the main build script
bash "$SCRIPT_DIR/infra/scripts/build-lambda-layer.sh"