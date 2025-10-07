#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfraStack } from '../lib/infra-stack';
import { AgentsStack } from '../lib/agents-stack';
import { UiStack } from '../lib/ui-stack';

const app = new cdk.App();

// Get stack prefix from environment variable for multi-environment deployments
const stackPrefix = process.env.STACK_PREFIX || 'Hp';
const infraStackName = `${stackPrefix}InfraStack`;
const agentsStackName = `${stackPrefix}AgentsStack`;
const uiStackName = `${stackPrefix}UiStack`;

// Deploy Agents stack first (creates API keys secret, Lambda functions, DynamoDB cache)
const agentsStack = new AgentsStack(app, agentsStackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Deploy infrastructure stack (creates Cognito, API Gateway with all endpoints, Assignments DB)
const infraStack = new InfraStack(app, infraStackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  vinLookupLambda: agentsStack.vinLookupLambda,
  photoAnalyzerLambda: agentsStack.photoAnalyzerLambda,
  partsCategoriesLambda: agentsStack.partsCategoriesLambda,
  partsSearchLambda: agentsStack.partsSearchLambda,
  apiKeysSecret: agentsStack.apiKeysSecret,
  // Using CloudFront default domain for now
  // To add custom domain in the future:
  // 1. Uncomment the line below and set your domain
  // 2. Add certificateArn to UiStack props (certificate must be in us-east-1)
  // domainName: 'your-domain.com',
});
infraStack.addDependency(agentsStack);

console.log(infraStack.userPoolId);
console.log(infraStack.userPoolClientId);
console.log(infraStack.apiEndpoint);
console.log(infraStack.domainName);

// Deploy UI after infrastructure and agents are ready
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
uiStack.addDependency(agentsStack);
