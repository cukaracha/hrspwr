import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  getCurrentUser,
  resetPassword,
  confirmResetPassword,
  updatePassword,
  fetchUserAttributes,
  updateUserAttributes,
  fetchAuthSession,
} from '@aws-amplify/auth';
import { configureAmplify } from '../config/amplify';
import { UserAttributes, UserProfile, UserAttributeUtils } from '../types/userAttributes';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  userAttributes: any | null;
  userProfile: UserProfile | null;
  userGroups: string[];
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    additionalAttributes?: Record<string, string>
  ) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateUserProfile: (profileUpdates: Partial<UserProfile>) => Promise<void>;
  refreshUserAttributes: () => Promise<void>;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<any>;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
  isStudent: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [userAttributes, setUserAttributes] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to extract groups from ID token
  const getUserGroups = async (): Promise<string[]> => {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;

      if (idToken) {
        // Decode the JWT token to get the groups
        const payload = JSON.parse(atob(idToken.toString().split('.')[1]));
        return payload['cognito:groups'] || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }
  };

  // Helper functions to check user roles
  const isAdmin = (): boolean => userGroups.includes('Admin');
  const isTeacher = (): boolean => userGroups.includes('Teacher');
  const isStudent = (): boolean => userGroups.includes('Student');

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        configureAmplify(); // Call synchronously
        await checkAuth();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      // Fetch user attributes
      const attributes = await fetchUserAttributes();
      setUserAttributes(attributes);

      // Convert attributes to user profile format
      const profile = UserAttributeUtils.cognitoToProfile(attributes as UserAttributes);
      setUserProfile(profile);

      // Fetch user groups
      const groups = await getUserGroups();
      setUserGroups(groups);

      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setUserAttributes(null);
      setUserProfile(null);
      setUserGroups([]);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signIn({ username: email, password });
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      // Fetch user attributes
      const attributes = await fetchUserAttributes();
      setUserAttributes(attributes);

      // Convert attributes to user profile format
      const profile = UserAttributeUtils.cognitoToProfile(attributes as UserAttributes);
      setUserProfile(profile);

      // Fetch user groups
      const groups = await getUserGroups();
      setUserGroups(groups);

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const handleSignUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    additionalAttributes?: Record<string, string>
  ) => {
    try {
      // Prepare user attributes in Cognito format
      const userAttributes: Record<string, string> = {
        email,
        given_name: firstName,
        family_name: lastName,
      };

      // Add optional phone number if provided
      if (additionalAttributes?.phoneNumber) {
        userAttributes.phone_number = additionalAttributes.phoneNumber;
      }

      // Add other custom attributes with proper prefix
      Object.entries(additionalAttributes || {}).forEach(([key, value]) => {
        if (key !== 'phoneNumber' && value) {
          // Handle custom attributes with prefix
          if (
            ['studentID', 'accountStatus', 'enrollmentStatus', 'emergencyContact'].includes(key)
          ) {
            userAttributes[`custom:${key}`] = value;
          } else if (!userAttributes[key]) {
            // Add other standard attributes if not already set
            userAttributes[key] = value;
          }
        }
      });

      await signUp({
        username: email,
        password,
        options: {
          userAttributes,
        },
      });
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const handleConfirmSignUp = async (email: string, code: string) => {
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
    } catch (error) {
      console.error('Error confirming sign up:', error);
      throw error;
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await resetPassword({ username: email });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  };

  const handleConfirmForgotPassword = async (email: string, code: string, newPassword: string) => {
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
    } catch (error) {
      console.error('Error confirming password reset:', error);
      throw error;
    }
  };

  const handleChangePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await updatePassword({
        oldPassword,
        newPassword,
      });
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  };

  const handleUpdateUserProfile = async (profileUpdates: Partial<UserProfile>) => {
    try {
      // Convert profile updates to Cognito format
      const cognitoUpdates = UserAttributeUtils.profileToCognito(profileUpdates);

      // Update attributes in Cognito
      await updateUserAttributes({
        userAttributes: cognitoUpdates,
      });

      // Refresh local state
      await handleRefreshUserAttributes();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const handleRefreshUserAttributes = async () => {
    try {
      if (!user) return;

      // Fetch fresh attributes
      const attributes = await fetchUserAttributes();
      setUserAttributes(attributes);

      // Convert to profile format
      const profile = UserAttributeUtils.cognitoToProfile(attributes as UserAttributes);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error refreshing user attributes:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setUserAttributes(null);
      setUserProfile(null);
      setUserGroups([]);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        userAttributes,
        userProfile,
        userGroups,
        signIn: handleSignIn,
        signUp: handleSignUp,
        confirmSignUp: handleConfirmSignUp,
        forgotPassword: handleForgotPassword,
        confirmForgotPassword: handleConfirmForgotPassword,
        changePassword: handleChangePassword,
        updateUserProfile: handleUpdateUserProfile,
        refreshUserAttributes: handleRefreshUserAttributes,
        signOut: handleSignOut,
        getCurrentUser,
        isAdmin,
        isTeacher,
        isStudent,
      }}
    >
      {isLoading ? (
        <div className='flex justify-center items-center min-h-screen'>
          <div className='text-lg text-gray-600'>Loading...</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
