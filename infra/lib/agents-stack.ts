import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PartsAgent } from './constructs/PartsAgent';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface AgentsStackProps extends cdk.StackProps {}

export class AgentsStack extends cdk.Stack {
  public readonly vinLookupLambda: lambda.Function;
  public readonly photoAnalyzerLambda: lambda.Function;
  public readonly partsCategoriesLambda: lambda.Function;
  public readonly partsSearchLambda: lambda.Function;
  public readonly apiKeysSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: AgentsStackProps) {
    super(scope, id, props);

    // Create AWS Secret for API keys (used by agent Lambdas)
    this.apiKeysSecret = new secretsmanager.Secret(this, 'ApiKeysSecret', {
      secretName: 'Hp-ApiKeys-Secret',
      description: 'API Keys for RapidAPI and OpenAI',
      secretStringValue: cdk.SecretValue.unsafePlainText(
        JSON.stringify({
          RAPIDAPI_KEY: '',
          OPENAI_API_KEY: '',
        })
      ),
    });

    // Create Parts Agent construct with DynamoDB table and Lambda functions
    const partsAgent = new PartsAgent(this, 'PartsAgent', {
      apiKeysSecret: this.apiKeysSecret,
    });

    // Export Lambda functions for use in InfraStack API Gateway
    this.vinLookupLambda = partsAgent.vinLookupLambda;
    this.photoAnalyzerLambda = partsAgent.photoAnalyzerLambda;
    this.partsCategoriesLambda = partsAgent.partsCategoriesLambda;
    this.partsSearchLambda = partsAgent.partsSearchLambda;
  }
}
