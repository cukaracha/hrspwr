import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface CognitoAuthorizerProps {
  userPoolId?: string;
  userPoolClientId?: string;
}

export class CognitoAuthorizer extends Construct {
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;
  private readonly userPool: cognito.IUserPool;
  public readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string, props?: CognitoAuthorizerProps) {
    super(scope, id);

    if (props?.userPoolId) {
      this.userPoolId = props.userPoolId.toString();
      this.userPool = cognito.UserPool.fromUserPoolId(this, 'UserPool', props.userPoolId);
    } else {
      // Create a Cognito user pool
      this.userPool = new cognito.UserPool(this, 'UserPool', {
        userPoolName: 'Hp-UserPool',
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
      groupName: 'admin',
      description: 'Administrator group with full system access',
    });

    new cognito.CfnUserPoolGroup(this, 'WorkshopGroup', {
      userPoolId: this.userPoolId,
      groupName: 'workshop',
      description: 'Workshop/garage access',
    });

    new cognito.CfnUserPoolGroup(this, 'SupplierGroup', {
      userPoolId: this.userPoolId,
      groupName: 'supplier',
      description: 'Parts supplier access',
    });

    new cognito.CfnUserPoolGroup(this, 'CustomerGroup', {
      userPoolId: this.userPoolId,
      groupName: 'customer',
      description: 'Customer access',
    });

    if (props?.userPoolClientId) {
      this.userPoolClientId = props.userPoolClientId;
    } else {
      // Create a Cognito user pool client
      const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
        userPoolClientName: 'Hp-UserPoolClient',
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

    // Create native Cognito authorizer
    this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [this.userPool],
      authorizerName: 'Hp-Cognito-Authorizer',
    });
  }
}
