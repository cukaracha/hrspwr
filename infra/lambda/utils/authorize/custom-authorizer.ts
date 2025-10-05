import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
  PolicyDocument,
  Statement,
  Context,
} from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
interface CognitoTokenPayload {
  sub: string;
  'cognito:groups'?: string[];
  email?: string;
  'cognito:username'?: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

// Simple RBAC check - only admin group allowed for now
function checkAccess(groups: string[] = []): boolean {
  // TODO: Implement full RBAC logic based on access-control.json
  // For now, simple logic: only admin group is allowed
  return groups.includes('Admin');
}

function generatePolicy(
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string,
  context?: any
): APIGatewayAuthorizerResult {
  // Generate a wildcard resource ARN to allow/deny access to all endpoints in the API
  // Convert: arn:aws:execute-api:region:account:api-id/stage/method/resource-path
  // To:      arn:aws:execute-api:region:account:api-id/stage/*/*
  const resourceParts = resource.split('/');
  const wildcardResource = `${resourceParts.slice(0, 2).join('/')}/*/*`;

  const policyDocument: PolicyDocument = {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: wildcardResource,
      } as Statement,
    ],
  };

  return {
    principalId,
    policyDocument,
    context,
  };
}

async function verifyToken(token: string): Promise<CognitoTokenPayload> {
  const userPoolId = process.env.USER_POOL_ID;
  const region = process.env.AWS_REGION;

  if (!userPoolId) {
    throw new Error('USER_POOL_ID environment variable not set');
  }

  if (!region) {
    throw new Error('AWS_REGION environment variable not set');
  }

  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

  // Create JWKS client
  const client = jwksClient({
    jwksUri: `${issuer}/.well-known/jwks.json`,
    cache: true,
    cacheMaxAge: 600000, // 10 minutes
  });

  return new Promise((resolve, reject) => {
    // Decode the token header to get the key ID
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
      reject(new Error('Invalid token format'));
      return;
    }

    // Get the signing key
    client.getSigningKey(decoded.header.kid, (err: any, key: any) => {
      if (err) {
        reject(new Error(`Failed to get signing key: ${err.message}`));
        return;
      }

      const signingKey = key?.getPublicKey();
      if (!signingKey) {
        reject(new Error('No signing key found'));
        return;
      }

      // Verify the token
      jwt.verify(
        token,
        signingKey,
        {
          issuer,
          algorithms: ['RS256'],
        },
        (verifyErr, payload) => {
          if (verifyErr) {
            reject(new Error(`Token verification failed: ${verifyErr.message}`));
            return;
          }

          resolve(payload as CognitoTokenPayload);
        }
      );
    });
  });
}

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
  _context: Context
): Promise<APIGatewayAuthorizerResult> => {
  console.log('Custom authorizer invoked', JSON.stringify(event, null, 2));

  try {
    // Extract token from the authorization header
    const token = event.authorizationToken?.replace('Bearer ', '');

    if (!token) {
      console.log('No token provided');
      throw new Error('Unauthorized');
    }

    // Verify the Cognito token
    const payload = await verifyToken(token);
    console.log('Token verified successfully', {
      sub: payload.sub,
      groups: payload['cognito:groups'],
      username: payload['cognito:username'],
    });

    // Extract user groups from token claims
    const userGroups = payload['cognito:groups'] || [];

    // Check access based on RBAC (simple for now)
    const hasAccess = checkAccess(userGroups);

    if (!hasAccess) {
      console.log('Access denied for user groups:', userGroups);
      return generatePolicy(payload.sub, 'Deny', event.methodArn);
    }

    console.log('Access granted for user groups:', userGroups);

    // Return allow policy with user context
    return generatePolicy(payload.sub, 'Allow', event.methodArn, {
      userId: payload.sub,
      email: payload.email,
      username: payload['cognito:username'],
      groups: JSON.stringify(userGroups),
    });
  } catch (error) {
    console.error('Authorization failed:', error);

    // Return deny policy for any errors
    return generatePolicy('user', 'Deny', event.methodArn);
  }
};
