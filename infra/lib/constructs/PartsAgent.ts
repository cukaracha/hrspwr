import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Construct } from 'constructs';

export interface PartsAgentProps {
  apiKeysSecret: secretsmanager.Secret;
}

export class PartsAgent extends Construct {
  public readonly vinLookupLambda: lambda.Function;
  public readonly photoAnalyzerLambda: lambda.Function;
  public readonly partsCategoriesLambda: lambda.Function;
  public readonly apiCacheTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: PartsAgentProps) {
    super(scope, id);

    // Create Lambda Layer for Python utilities
    const lambdaUtilsLayer = new lambda.LayerVersion(this, 'LambdaUtilsLayer', {
      layerVersionName: 'Hp-LambdaUtils-Layer',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../../apps/agents/lambda_layers/lambda_utils/lambda_layer.zip')
      ),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
      description: 'Lambda utilities layer for agent functions',
    });

    // Create DynamoDB table for API response caching
    this.apiCacheTable = new dynamodb.Table(this, 'ApiCacheTable', {
      tableName: 'Hp-ApiCache-Table',
      partitionKey: { name: 'cacheKey', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'ttl',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - change to RETAIN for production
    });

    // Common Lambda configuration
    const commonLambdaProps = {
      runtime: lambda.Runtime.PYTHON_3_12,
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      layers: [lambdaUtilsLayer],
      environment: {
        SECRET_ARN: props.apiKeysSecret.secretArn,
        API_CACHE_TABLE: this.apiCacheTable.tableName,
      },
    };

    // Create VIN Lookup Lambda
    this.vinLookupLambda = new lambda.Function(this, 'VinLookupLambda', {
      functionName: 'Hp-VinLookupAgent-Lambda',
      ...commonLambdaProps,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../apps/agents/vin')),
      handler: 'lookup_vin.lambda_handler',
    });

    // Grant Textract permissions to VIN Lookup Lambda
    this.vinLookupLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['textract:DetectDocumentText'],
        resources: ['*'],
      })
    );

    // Create Photo Analyzer Lambda
    this.photoAnalyzerLambda = new lambda.Function(this, 'PhotoAnalyzerLambda', {
      functionName: 'Hp-PhotoAnalyzerAgent-Lambda',
      ...commonLambdaProps,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../apps/agents/photo_analyzer')),
      handler: 'analyze_object.lambda_handler',
    });

    // Create Parts Categories Lambda
    this.partsCategoriesLambda = new lambda.Function(this, 'PartsCategoriesLambda', {
      functionName: 'Hp-PartsCategoriesAgent-Lambda',
      ...commonLambdaProps,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../apps/agents/parts_categories')),
      handler: 'lookup_categories.lambda_handler',
    });

    // Grant all Lambdas access to:
    // 1. DynamoDB table (read/write)
    this.apiCacheTable.grantReadWriteData(this.vinLookupLambda);
    this.apiCacheTable.grantReadWriteData(this.photoAnalyzerLambda);
    this.apiCacheTable.grantReadWriteData(this.partsCategoriesLambda);

    // 2. Secrets Manager (read)
    props.apiKeysSecret.grantRead(this.vinLookupLambda);
    props.apiKeysSecret.grantRead(this.photoAnalyzerLambda);
    props.apiKeysSecret.grantRead(this.partsCategoriesLambda);

    // 3. Bedrock model invocation
    const bedrockPolicy = new iam.PolicyStatement({
      actions: ['bedrock:*'],
      resources: ['*'],
    });

    this.vinLookupLambda.addToRolePolicy(bedrockPolicy);
    this.photoAnalyzerLambda.addToRolePolicy(bedrockPolicy);
    this.partsCategoriesLambda.addToRolePolicy(bedrockPolicy);
  }
}
