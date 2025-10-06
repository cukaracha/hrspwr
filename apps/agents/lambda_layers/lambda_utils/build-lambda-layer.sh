#!/bin/bash

# Script to build Lambda Layer for analyze-assignment function
# This script uses Docker to build dependencies on Amazon Linux for Lambda compatibility

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Use current directory for layer building
LAYER_DIR="$(pwd)"

echo -e "${YELLOW}Building Lambda Layer...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if requirements.txt exists
if [[ ! -f "$LAYER_DIR/requirements.txt" ]]; then
    echo -e "${RED}Error: requirements.txt not found at $LAYER_DIR/requirements.txt${NC}"
    exit 1
fi

echo -e "${YELLOW}Found requirements.txt with dependencies:${NC}"
cat "$LAYER_DIR/requirements.txt"
echo ""

# Create temporary build directory
BUILD_DIR="$LAYER_DIR/build"
echo -e "${YELLOW}Creating build directory: $BUILD_DIR${NC}"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy requirements.txt to build directory
cp "$LAYER_DIR/requirements.txt" "$BUILD_DIR/"

# Check if lib directory exists and copy it
if [[ -d "$LAYER_DIR/lib" ]]; then
    echo -e "${YELLOW}Found lib directory, will include in layer...${NC}"
    mkdir -p "$BUILD_DIR/python"
    cp -r "$LAYER_DIR/lib" "$BUILD_DIR/python/"
fi

echo -e "${YELLOW}Installing dependencies using Amazon Linux Docker container...${NC}"

# Use Docker to install dependencies on Amazon Linux
# This ensures compatibility with Lambda runtime (x86_64 architecture)
docker run --rm \
    --platform=linux/amd64 \
    --entrypoint="" \
    -v "$BUILD_DIR":/var/task \
    -w /var/task \
    public.ecr.aws/lambda/python:3.12 \
    bash -c "
        echo 'Installing Python dependencies...'
        pip install --upgrade pip
        pip install -r requirements.txt -t python/
        echo 'Dependencies installed successfully'
        ls -la python/
    "

# Check if installation was successful
if [[ ! -d "$BUILD_DIR/python" ]]; then
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${YELLOW}Creating layer zip file...${NC}"

# Create the zip file
cd "$BUILD_DIR"
zip -r lambda_layer.zip python/ -q

# Check if zip was created successfully
if [[ ! -f "$BUILD_DIR/lambda_layer.zip" ]]; then
    echo -e "${RED}Error: Failed to create zip file${NC}"
    exit 1
fi

# Copy the zip file to the lambda_layer directory (overwriting existing one)
echo -e "${YELLOW}Copying layer zip to deployment directory...${NC}"
cp "$BUILD_DIR/lambda_layer.zip" "$LAYER_DIR/"

# Get zip file size for confirmation
ZIP_SIZE=$(du -h "$LAYER_DIR/lambda_layer.zip" | cut -f1)

echo -e "${GREEN}✓ Lambda layer built successfully!${NC}"
echo -e "${GREEN}✓ Layer zip file: $LAYER_DIR/lambda_layer.zip (${ZIP_SIZE})${NC}"

# Clean up build directory
echo -e "${YELLOW}Cleaning up build directory...${NC}"
rm -rf "$BUILD_DIR"

echo -e "${GREEN}✓ Build complete! The layer is ready for CDK deployment.${NC}"

# Show contents of the layer for verification
echo -e "${YELLOW}Layer contents:${NC}"
unzip -l "$LAYER_DIR/lambda_layer.zip" | head -20

echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Deploy your CDK stack to update the Lambda function with the new layer"
echo "2. Test your Lambda function to ensure the import errors are resolved"