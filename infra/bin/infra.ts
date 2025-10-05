#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfraStack } from '../lib/infra-stack';
import { UiStack } from '../lib/ui-stack';

const app = new cdk.App();

// Get stack prefix from environment variable for multi-environment deployments
const stackPrefix = process.env.STACK_PREFIX || '';
const infraStackName = `${stackPrefix}InfraStack`;
const uiStackName = `${stackPrefix}UiStack`;

// Deploy infrastructure first
const infraStack = new InfraStack(app, infraStackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  // Add your custom domain here (optional)
  // IMPORTANT: See DEPLOYMENT.md for DNS setup instructions when using custom domains
  domainName: 'sample.justifiai.com',
});
console.log(infraStack.userPoolId);
console.log(infraStack.userPoolClientId);
console.log(infraStack.apiEndpoint);
console.log(infraStack.domainName);

// Deploy UI after infrastructure is ready
const uiStack = new UiStack(app, uiStackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  userPoolId: infraStack.userPoolId,
  userPoolClientId: infraStack.userPoolClientId,
  apiEndpoint: infraStack.apiEndpoint,
  domainName: infraStack.domainName,
});

// Add dependency between stacks
uiStack.addDependency(infraStack);
