import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface ReactWebAppProps {
  userPoolId: string;
  userPoolClientId: string;
  apiEndpoint: string;
  domainName?: string;
  certificateArn?: string;
  config?: { [key: string]: string };
}

export default class ReactWebApp extends Construct {
  public readonly distribution: cloudfront.CfnDistribution;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: ReactWebAppProps) {
    super(scope, id);

    // Create certificate only if domain name is provided
    let certificate: acm.ICertificate | undefined;
    if (props.domainName && !props.domainName.includes('cloudfront.net')) {
      certificate = new acm.Certificate(this, 'Certificate', {
        domainName: props.domainName,
        validation: acm.CertificateValidation.fromDns(),
      });
    } else if (props.certificateArn) {
      certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', props.certificateArn);
    }

    this.bucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `autograderai-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create OAC (Origin Access Control)
    const oac = new cloudfront.CfnOriginAccessControl(this, 'OAC', {
      originAccessControlConfig: {
        name: 'AutograderOAC',
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
        description: 'OAC for Autograder S3 bucket',
      },
    });

    // Build distribution config
    const distributionConfig: any = {
      enabled: true,
      defaultRootObject: 'index.html',
      origins: [
        {
          domainName: this.bucket.bucketRegionalDomainName,
          id: 'S3Origin',
          originAccessControlId: oac.attrId,
          s3OriginConfig: {
            originAccessIdentity: '',
          },
        },
      ],
      defaultCacheBehavior: {
        targetOriginId: 'S3Origin',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
        compress: true,
        forwardedValues: {
          queryString: false,
          cookies: { forward: 'none' },
        },
      },
      customErrorResponses: [
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html',
        },
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: '/index.html',
        },
      ],
    };

    // Add domain and certificate configuration only if we have a custom domain
    if (props.domainName && !props.domainName.includes('cloudfront.net') && certificate) {
      distributionConfig.aliases = [props.domainName];
      distributionConfig.viewerCertificate = {
        acmCertificateArn: certificate.certificateArn,
        sslSupportMethod: 'sni-only',
        minimumProtocolVersion: 'TLSv1.2_2021',
      };
    } else {
      // Use CloudFront default certificate for default domain
      distributionConfig.viewerCertificate = {
        cloudFrontDefaultCertificate: true,
      };
    }

    // Create CloudFront distribution
    this.distribution = new cloudfront.CfnDistribution(this, 'Distribution', {
      distributionConfig,
    });

    // Grant OAC read access to the bucket
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [this.bucket.arnForObjects('*')],
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${
              cdk.Stack.of(this).account
            }:distribution/${this.distribution.ref}`,
          },
        },
      })
    );

    const buildCommand = [
      'cd /asset-input',
      'npm install',
      'npm run build',
      'cp -r dist/* /asset-output/',
    ].join(' && ');

    new s3deploy.BucketDeployment(this, 'web-deployment', {
      sources: [
        s3deploy.Source.asset('../apps/ui/web', {
          assetHashType: cdk.AssetHashType.CUSTOM,
          assetHash: Date.now().toString(), // Forces a new asset hash on each deploy
          bundling: {
            image: cdk.DockerImage.fromRegistry('node:18'),
            command: ['bash', '-c', buildCommand],
            user: 'root',
            // No environment variables needed - deploy.sh script handles .env file updates
          },
        }),
      ],
      destinationBucket: this.bucket,
      distribution: cloudfront.Distribution.fromDistributionAttributes(this, 'DistributionRef', {
        distributionId: this.distribution.ref,
        domainName: this.distribution.attrDomainName,
      }),
      distributionPaths: ['/*'],
    });
  }
}
