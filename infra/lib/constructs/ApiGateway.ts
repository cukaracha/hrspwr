import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { CognitoAuthorizer } from './CognitoAuthorizer';

export interface ApiGatewayProps {
  cognitoAuthorizer: CognitoAuthorizer;
  vinLookupLambda: lambda.Function;
  photoAnalyzerLambda: lambda.Function;
  partsCategoriesLambda: lambda.Function;
  partsSearchLambda: lambda.Function;
}

export class ApiGateway extends Construct {
  public readonly apiEndpoint: string;
  public readonly apiId: string;
  public readonly stageName: string;
  private readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'Hp-Api',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
      deployOptions: {
        stageName: 'dev',
        tracingEnabled: true,
      },
    });

    const defaultMethodOptions: apigateway.MethodOptions = {
      authorizer: props.cognitoAuthorizer.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    this.createAgentsEndpoints(defaultMethodOptions, props);

    this.apiId = this.api.restApiId.toString();
    this.stageName = this.api.deploymentStage.stageName.toString();
    this.apiEndpoint = `https://${this.api.restApiId}.execute-api.${
      cdk.Stack.of(this).region
    }.${cdk.Stack.of(this).urlSuffix}/${this.api.deploymentStage.stageName}/`;

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.apiEndpoint,
      description: 'API Gateway endpoint URL',
    });
  }

  private createAgentsEndpoints(
    defaultMethodOptions: apigateway.MethodOptions,
    props: ApiGatewayProps
  ) {
    // Create /agents resource
    const agents = this.api.root.addResource('agents');

    // POST /agents/vin-lookup
    const vinLookup = agents.addResource('vin-lookup');
    vinLookup.addMethod(
      'POST',
      new apigateway.LambdaIntegration(props.vinLookupLambda),
      defaultMethodOptions
    );

    // POST /agents/photo-analyzer
    const photoAnalyzer = agents.addResource('photo-analyzer');
    photoAnalyzer.addMethod(
      'POST',
      new apigateway.LambdaIntegration(props.photoAnalyzerLambda),
      defaultMethodOptions
    );

    // POST /agents/parts-categories
    const partsCategories = agents.addResource('parts-categories');
    partsCategories.addMethod(
      'POST',
      new apigateway.LambdaIntegration(props.partsCategoriesLambda),
      defaultMethodOptions
    );

    // POST /agents/parts-search
    const partsSearch = agents.addResource('parts-search');
    partsSearch.addMethod(
      'POST',
      new apigateway.LambdaIntegration(props.partsSearchLambda),
      defaultMethodOptions
    );
  }
}
