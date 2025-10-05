import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { Construct } from 'constructs';
import { CognitoAuthorizer } from './CognitoAuthorizer';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface ApiGatewayProps {
  cognitoAuthorizer: CognitoAuthorizer;
  apiKeysSecret: secretsmanager.Secret;
  dataBucket: s3.IBucket;
}

export class ApiGateway extends Construct {
  public readonly apiEndpoint: string;
  public readonly apiId: string;
  public readonly stageName: string;
  private readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    this.api = new apigateway.RestApi(this, 'Api', {
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
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    };

    this.createAssignmentsEndpoints(defaultMethodOptions, props);

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

  private createAssignmentsEndpoints(
    defaultMethodOptions: apigateway.MethodOptions,
    props: ApiGatewayProps
  ) {
    // GET /assignments
    const assignments = this.api.root.addResource('assignments');
    const listAssignmentsLambda = new NodejsFunction(this, 'ListAssignmentsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(
        __dirname,
        '../../../apps/apis/sample-todo-api/assignments/read/list-assignments.ts'
      ),
      handler: 'handler',
      environment: {
        NODE_ENV: 'production',
        ASSIGNMENTS_TABLE: 'AssignmentsAccess',
      },
    });

    // Grant DynamoDB permissions to the Lambda
    listAssignmentsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query', 'dynamodb:GetItem'],
        resources: [
          `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${
            cdk.Stack.of(this).account
          }:table/AssignmentsAccess`,
        ],
      })
    );

    assignments.addMethod(
      'GET',
      new apigateway.LambdaIntegration(listAssignmentsLambda),
      defaultMethodOptions
    );

    // POST /assignments
    const createAssignmentLambda = new NodejsFunction(this, 'CreateAssignmentFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(
        __dirname,
        '../../../apps/apis/sample-todo-api/assignments/create/create-assignment.ts'
      ),
      handler: 'handler',
      environment: {
        NODE_ENV: 'production',
        ASSIGNMENTS_TABLE: 'AssignmentsAccess',
        ASSIGNMENTS_BUCKET: props.dataBucket.bucketName,
      },
    });

    // Grant DynamoDB permissions to the Lambda
    createAssignmentLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        resources: [
          `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${
            cdk.Stack.of(this).account
          }:table/AssignmentsAccess`,
        ],
      })
    );

    assignments.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createAssignmentLambda),
      defaultMethodOptions
    );

    // POST /assignments/presigned-url
    const presignedUrlLambda = new NodejsFunction(this, 'PresignedUrlFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(
        __dirname,
        '../../../apps/apis/sample-todo-api/assignments/create/generate-presigned-url.ts'
      ),
      handler: 'handler',
      environment: {
        NODE_ENV: 'production',
        ASSIGNMENTS_BUCKET: props.dataBucket.bucketName,
      },
    });

    // Grant S3 permissions to the Lambda
    props.dataBucket.grantReadWrite(presignedUrlLambda);

    const presignedUrl = assignments.addResource('presigned-url');
    presignedUrl.addMethod(
      'POST',
      new apigateway.LambdaIntegration(presignedUrlLambda),
      defaultMethodOptions
    );

    // GET /assignments/{id}
    const getAssignmentByIdLambda = new NodejsFunction(this, 'GetAssignmentByIdFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(
        __dirname,
        '../../../apps/apis/sample-todo-api/assignments/read/read-assignment.ts'
      ),
      handler: 'handler',
      environment: {
        NODE_ENV: 'production',
        ASSIGNMENTS_TABLE: 'AssignmentsAccess',
      },
    });
    getAssignmentByIdLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:GetItem', 'dynamodb:Scan'],
        resources: [
          `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${
            cdk.Stack.of(this).account
          }:table/AssignmentsAccess`,
        ],
      })
    );
    const assignmentById = assignments.addResource('{id}');
    assignmentById.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getAssignmentByIdLambda),
      defaultMethodOptions
    );

    // DELETE /assignments/{id}
    const deleteAssignmentLambda = new NodejsFunction(this, 'DeleteAssignmentFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(
        __dirname,
        '../../../apps/apis/sample-todo-api/assignments/delete/delete-assignment.ts'
      ),
      handler: 'handler',
      environment: {
        NODE_ENV: 'production',
        ASSIGNMENTS_TABLE: 'AssignmentsAccess',
        ASSIGNMENTS_BUCKET: props.dataBucket.bucketName,
      },
    });

    // Grant DynamoDB permissions to the delete Lambda
    deleteAssignmentLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:DeleteItem', 'dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan'],
        resources: [
          `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${
            cdk.Stack.of(this).account
          }:table/AssignmentsAccess`,
        ],
      })
    );

    // Grant S3 permissions to the delete Lambda
    props.dataBucket.grantDelete(deleteAssignmentLambda);
    props.dataBucket.grantRead(deleteAssignmentLambda);

    assignmentById.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(deleteAssignmentLambda),
      defaultMethodOptions
    );

    // POST /assignments/analyze
    const analyzeAssignmentLayer = new lambda.LayerVersion(this, 'AnalyzeAssignmentLayer', {
      code: lambda.Code.fromAsset(
        path.join(
          __dirname,
          '../../../apps/apis/sample-todo-api/assignments/create/analyze-assignment/lambda_layer.zip'
        )
      ),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_11],
      description: 'Python dependencies for analyze-assignment Lambda',
    });

    const analyzeAssignmentLambda = new lambda.Function(this, 'AnalyzeAssignmentFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      code: lambda.Code.fromAsset(
        path.join(
          __dirname,
          '../../../apps/apis/sample-todo-api/assignments/create/analyze-assignment'
        )
      ),
      handler: 'analyze-assignment.lambda_handler',
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      environment: {
        NODE_ENV: 'production',
        SECRET_ARN: props.apiKeysSecret.secretArn,
      },
      layers: [analyzeAssignmentLayer],
    });

    // Grant permissions to read from the secret
    props.apiKeysSecret.grantRead(analyzeAssignmentLambda);

    const analyzeAssignment = assignments.addResource('analyze');
    analyzeAssignment.addMethod(
      'POST',
      new apigateway.LambdaIntegration(analyzeAssignmentLambda),
      defaultMethodOptions
    );
  }
}
