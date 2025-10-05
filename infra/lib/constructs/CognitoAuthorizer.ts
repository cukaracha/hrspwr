import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Construct } from 'constructs';

export interface CognitoAuthorizerProps {
  userPoolId?: string;
  userPoolClientId?: string;
}

export class CognitoAuthorizer extends Construct {
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;
  public readonly authorizerId: string;
  private readonly userPool: cognito.IUserPool;
  private readonly _authorizer: apigateway.TokenAuthorizer;

  constructor(scope: Construct, id: string, props?: CognitoAuthorizerProps) {
    super(scope, id);

    if (props?.userPoolId) {
      this.userPoolId = props.userPoolId.toString();
      this.userPool = cognito.UserPool.fromUserPoolId(this, 'UserPool', props.userPoolId);
    } else {
      // Create a Cognito user pool
      this.userPool = new cognito.UserPool(this, 'UserPool', {
        selfSignUpEnabled: true,
        signInAliases: { email: true },
        standardAttributes: {
          email: { required: true, mutable: true },
          givenName: { required: true, mutable: true },
          familyName: { required: true, mutable: true },
          phoneNumber: { required: false, mutable: true },
          birthdate: { required: false, mutable: true },
          gender: { required: false, mutable: true },
          address: { required: false, mutable: true },
        },
        customAttributes: {
          studentID: new cognito.StringAttribute({ mutable: true }),
          accountStatus: new cognito.StringAttribute({ mutable: true }),
          enrollmentStatus: new cognito.StringAttribute({ mutable: true }),
          emergencyContact: new cognito.StringAttribute({ mutable: true }),
        },
        passwordPolicy: {
          minLength: 8,
          requireDigits: true,
          requireLowercase: true,
          requireSymbols: false,
          requireUppercase: true,
        },
        accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      // Output the user pool ID
      new cdk.CfnOutput(this, 'UserPoolId', {
        value: this.userPool.userPoolId,
        description: 'The ID of the Cognito User Pool',
      });

      this.userPoolId = this.userPool.userPoolId.toString();
    }

    // Create user groups
    new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: this.userPoolId,
      groupName: 'Admin',
      description: 'Administrator group with full access',
    });

    new cognito.CfnUserPoolGroup(this, 'TeacherGroup', {
      userPoolId: this.userPoolId,
      groupName: 'Teacher',
      description: 'Teacher group with course management access',
    });

    new cognito.CfnUserPoolGroup(this, 'StudentGroup', {
      userPoolId: this.userPoolId,
      groupName: 'Student',
      description: 'Student group with limited access',
    });

    if (props?.userPoolClientId) {
      this.userPoolClientId = props.userPoolClientId;
    } else {
      // Create a Cognito user pool client
      const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
        userPool: this.userPool,
        generateSecret: false,
        authFlows: {
          userPassword: true,
          userSrp: true,
        },
        oAuth: {
          flows: {
            implicitCodeGrant: true,
          },
          callbackUrls: [
            'http://localhost:3000',
            'https://your-domain.com', // Update this with your domain
          ],
        },
      });

      // Output the client ID
      new cdk.CfnOutput(this, 'UserPoolClientId', {
        value: userPoolClient.userPoolClientId,
        description: 'The ID of the Cognito User Pool Client',
      });

      this.userPoolClientId = userPoolClient.userPoolClientId;
    }

    // Create the custom Lambda authorizer function
    const authorizerFunction = new NodejsFunction(this, 'CustomAuthorizerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../lambda/utils/authorize/custom-authorizer.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_ENV: 'production',
        USER_POOL_ID: this.userPoolId,
      },
      bundling: {
        externalModules: ['aws-sdk'],
        nodeModules: ['jsonwebtoken', 'jwks-rsa'],
        minify: true,
        sourceMap: false,
      },
    });

    // Grant the authorizer function permission to invoke itself
    authorizerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: ['*'],
      })
    );

    // Create the custom Lambda authorizer
    this._authorizer = new apigateway.TokenAuthorizer(this, 'CustomAuthorizer', {
      handler: authorizerFunction,
      identitySource: 'method.request.header.Authorization',
      authorizerName: 'CustomCognitoAuthorizer',
      resultsCacheTtl: cdk.Duration.minutes(5),
    });

    this.authorizerId = this._authorizer.authorizerId;

    // Output the authorizer details
    new cdk.CfnOutput(this, 'CustomAuthorizerId', {
      value: this.authorizerId,
      description: 'The ID of the Custom Lambda Authorizer',
    });
  }

  public get authorizer(): apigateway.TokenAuthorizer {
    return this._authorizer;
  }
}
