import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CognitoAuthorizer } from './constructs/CognitoAuthorizer';
import { ApiGateway } from './constructs/ApiGateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as s3 from 'aws-cdk-lib/aws-s3';

interface InfraStackProps extends cdk.StackProps {
  domainName?: string;
  createCertificate?: boolean;
}

export class InfraStack extends cdk.Stack {
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;
  public readonly apiEndpoint: string;
  public readonly domainName: string;
  public readonly assignmentsTable: dynamodb.Table;
  public readonly apiKeysSecret: secretsmanager.Secret;
  public readonly dataBucket: s3.IBucket;

  constructor(scope: Construct, id: string, props?: InfraStackProps) {
    super(scope, id, props);

    // Create the Cognito authorizer
    const cognitoAuthorizer = new CognitoAuthorizer(this, 'Cognito', {});

    // Create AWS Secret for API keys
    this.apiKeysSecret = new secretsmanager.Secret(this, 'ApiKeysSecret', {
      description: 'API Keys for Mistral and OpenAI',
      secretStringValue: cdk.SecretValue.unsafePlainText(
        JSON.stringify({
          MISTRAL_API_KEY: '',
          OPENAI_API_KEY: '',
        })
      ),
    });

    // Create S3 bucket object for existing submissions bucket
    this.dataBucket = s3.Bucket.fromBucketName(
      this,
      'DataBucket',
      'acugrade-backend-submissions-685445159226'
    );

    // Create DynamoDB table for assignments access first
    this.assignmentsTable = new dynamodb.Table(this, 'AssignmentsAccess', {
      tableName: 'AssignmentsAccess',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - change to RETAIN for production
    });

    // Create the API Gateway
    const api = new ApiGateway(this, 'Api', {
      cognitoAuthorizer,
      apiKeysSecret: this.apiKeysSecret,
      dataBucket: this.dataBucket,
    });

    // Store only the string values
    this.userPoolId = cognitoAuthorizer.userPoolId.toString();
    this.userPoolClientId = cognitoAuthorizer.userPoolClientId.toString();
    this.apiEndpoint = api.apiEndpoint.toString();

    // Use provided domain name or default for local development
    this.domainName =
      props?.domainName || `sample-web-${cdk.Stack.of(this).account}.cloudfront.net`;

    // Export values for UI stack
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: cognitoAuthorizer.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'UserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: cognitoAuthorizer.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'UserPoolClientId',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.apiEndpoint,
      description: 'API Gateway Endpoint',
      exportName: 'ApiEndpoint',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: cdk.Stack.of(this).region,
      description: 'AWS Region',
      exportName: 'Region',
    });

    new cdk.CfnOutput(this, 'DomainName', {
      value: this.domainName,
      description: 'Domain Name',
      exportName: 'DomainName',
    });

    // Export the table name
    new cdk.CfnOutput(this, 'AssignmentsTableName', {
      value: this.assignmentsTable.tableName,
      description: 'DynamoDB Table Name for Assignments Access',
      exportName: 'AssignmentsTableName',
    });

    // Export the S3 bucket name
    new cdk.CfnOutput(this, 'DataBucketName', {
      value: this.dataBucket.bucketName,
      description: 'S3 Bucket Name for Data Storage',
      exportName: 'DataBucketName',
    });

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'InfraQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
