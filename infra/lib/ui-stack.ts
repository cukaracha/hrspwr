import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import ReactWebApp from './constructs/ReactWebApp';

interface UiStackProps extends cdk.StackProps {
  userPoolId: string;
  userPoolClientId: string;
  apiEndpoint: string;
  domainName: string;
}

export class UiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: UiStackProps) {
    super(scope, id, props);

    // Create React web app with environment variables from InfraStack
    new ReactWebApp(this, 'AutograderWebApp', {
      userPoolId: props.userPoolId,
      userPoolClientId: props.userPoolClientId,
      apiEndpoint: props.apiEndpoint,
      domainName: props.domainName,
    });
  }
}
