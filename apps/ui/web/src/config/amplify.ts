import { Amplify } from 'aws-amplify';

// Configure Amplify with environment variables
export const configureAmplify = () => {
  const userPoolId = import.meta.env.VITE_USER_POOL_ID;
  const userPoolClientId = import.meta.env.VITE_USER_POOL_CLIENT_ID;

  if (!userPoolId || !userPoolClientId) {
    console.error('Missing required environment variables:', {
      userPoolId: !!userPoolId,
      userPoolClientId: !!userPoolClientId,
    });
    throw new Error(
      'AWS Cognito configuration is missing. Please check your environment variables.'
    );
  }

  console.log('Configuring Amplify with:', {
    userPoolId,
    userPoolClientId,
    region: userPoolId.split('_')[0], // Extract region from user pool ID
  });

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: {
          email: true,
        },
      },
    },
  });
};
