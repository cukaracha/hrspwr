#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Print commands and their arguments as they are executed (for debugging)
set -x

# Function to show stack trace on error
show_error() {
    echo "Error occurred in deployment script!"
    echo "Stack trace:"
    local frame=0
    while caller $frame; do
        ((frame++))
    done
    echo "Deployment failed at line $1"
    exit 1
}

# Trap errors and show stack trace
trap 'show_error $LINENO' ERR

# Set stack names - use STACK_PREFIX for multi-environment deployments
STACK_PREFIX=${STACK_PREFIX:-""}
INFRA_STACK="${STACK_PREFIX}InfraStack"
UI_STACK="${STACK_PREFIX}UiStack"

echo "Starting deployment process..."

# Deploy infrastructure stack first
echo "Deploying infrastructure stack..."
cd infra
STACK_PREFIX=$STACK_PREFIX cdk deploy $INFRA_STACK --require-approval never
cd ..

# Extract CloudFormation outputs and update .env file
echo "Updating .env file with infrastructure outputs..."

# Set region - use CDK_DEFAULT_REGION if set, otherwise use us-east-1 as default
REGION=${CDK_DEFAULT_REGION:-us-east-1}



echo "Using region: $REGION"
echo "Infrastructure stack: $INFRA_STACK"
echo "UI stack: $UI_STACK"

USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name $INFRA_STACK --region $REGION --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $INFRA_STACK --region $REGION --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)
API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name $INFRA_STACK --region $REGION --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text)

# Create or update the .env file
cat > apps/ui/web/.env << EOF
VITE_USER_POOL_ID=$USER_POOL_ID
VITE_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
VITE_API_URL=$API_ENDPOINT
EOF

echo "Updated apps/ui/web/.env file with:"
echo "VITE_USER_POOL_ID=$USER_POOL_ID"
echo "VITE_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID"
echo "VITE_API_URL=$API_ENDPOINT"

# Build the UI
echo "Building UI..."
cd apps/ui/web
npm run build
cd ../../..

# Deploy UI stack
echo "Deploying UI stack..."
cd infra
STACK_PREFIX=$STACK_PREFIX cdk deploy $UI_STACK --require-approval never
cd ..

echo "Deployment completed successfully!"