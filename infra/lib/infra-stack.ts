import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CognitoAuthorizer } from './constructs/CognitoAuthorizer';
import { ApiGateway } from './constructs/ApiGateway';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface InfraStackProps extends cdk.StackProps {
  domainName?: string;
  createCertificate?: boolean;
  vinLookupLambda: lambda.Function;
  photoAnalyzerLambda: lambda.Function;
  partsCategoriesLambda: lambda.Function;
  partsSearchLambda: lambda.Function;
  apiKeysSecret: secretsmanager.Secret;
}

export class InfraStack extends cdk.Stack {
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;
  public readonly apiEndpoint: string;
  public readonly domainName: string;
  public readonly cognitoAuthorizer: CognitoAuthorizer;

  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    // Create the Cognito authorizer
    this.cognitoAuthorizer = new CognitoAuthorizer(this, 'Cognito', {});

    // Create the API Gateway with agents endpoints
    const api = new ApiGateway(this, 'Api', {
      cognitoAuthorizer: this.cognitoAuthorizer,
      vinLookupLambda: props.vinLookupLambda,
      photoAnalyzerLambda: props.photoAnalyzerLambda,
      partsCategoriesLambda: props.partsCategoriesLambda,
      partsSearchLambda: props.partsSearchLambda,
    });

    // Store only the string values
    this.userPoolId = this.cognitoAuthorizer.userPoolId.toString();
    this.userPoolClientId = this.cognitoAuthorizer.userPoolClientId.toString();
    this.apiEndpoint = api.apiEndpoint.toString();

    // Use provided domain name or default for local development
    this.domainName =
      props?.domainName || `sample-web-${cdk.Stack.of(this).account}.cloudfront.net`;

    // Export values for UI stack
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.cognitoAuthorizer.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'UserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.cognitoAuthorizer.userPoolClientId,
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

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'InfraQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
