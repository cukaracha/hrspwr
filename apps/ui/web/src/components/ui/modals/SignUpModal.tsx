import * as React from 'react';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import { Mail, Lock, User } from 'lucide-react';
import { GlassButton } from '../buttons/glassbutton/GlassButton';
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
} from '../cards/glasscard/GlassCard';
import { ModalBackdrop } from './ModalBackdrop';
import { CloseButton } from '../buttons/closebutton/CloseButton';
import { Alert } from '../alerts/Alert';
import { GlassInput } from '../inputs/glassinput/GlassInput';

export interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUpSuccess?: () => void;
}

export const SignUpModal: React.FC<SignUpModalProps> = ({ isOpen, onClose, onSignUpSuccess }) => {
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [confirmationCode, setConfirmationCode] = React.useState('');
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: lastName,
          },
        },
      });
      setIsConfirming(true);
      setSuccess('Account created! Please check your email for the confirmation code.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await confirmSignUp({
        username: email,
        confirmationCode,
      });
      setSuccess('Account confirmed successfully! You can now log in.');
      // Clear form and close modal after a short delay
      setTimeout(() => {
        handleClose();
        onSignUpSuccess?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirmation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset all state
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setConfirmationCode('');
    setIsConfirming(false);
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={handleClose} maxWidth='max-w-lg'>
      <GlassCard
        variant='default'
        className='cursor-default hover:bg-white/10 hover:shadow-2xl active:scale-100 max-h-[90vh] overflow-y-auto'
      >
        {/* Header */}
        <GlassCardHeader className='relative'>
          <GlassCardTitle className='text-3xl'>
            {isConfirming ? 'Confirm your account' : 'Create an account'}
          </GlassCardTitle>
          <GlassCardDescription>
            {isConfirming
              ? 'Enter the confirmation code sent to your email'
              : 'Enter your details to get started'}
          </GlassCardDescription>
          <CloseButton onClick={handleClose} />
        </GlassCardHeader>

        {/* Content */}
        <GlassCardContent className='space-y-6'>
          {!isConfirming ? (
            <form onSubmit={handleSignUp} className='space-y-4'>
              {/* Name Fields */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <label htmlFor='firstName' className='text-sm font-medium text-glass-text'>
                    First Name
                  </label>
                  <div className='relative'>
                    <User className='absolute left-3 top-1/2 transform -translate-y-1/2 text-glass-text/40 h-4 w-4 z-10' />
                    <GlassInput
                      id='firstName'
                      type='text'
                      placeholder='First name'
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className='pl-10'
                      required
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <label htmlFor='lastName' className='text-sm font-medium text-glass-text'>
                    Last Name
                  </label>
                  <div className='relative'>
                    <User className='absolute left-3 top-1/2 transform -translate-y-1/2 text-glass-text/40 h-4 w-4 z-10' />
                    <GlassInput
                      id='lastName'
                      type='text'
                      placeholder='Last name'
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className='pl-10'
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className='space-y-2'>
                <label htmlFor='email' className='text-sm font-medium text-glass-text'>
                  Email
                </label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-glass-text/40 h-4 w-4 z-10' />
                  <GlassInput
                    id='email'
                    type='email'
                    placeholder='Enter your email'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className='pl-10'
                    required
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className='space-y-2'>
                <label htmlFor='password' className='text-sm font-medium text-glass-text'>
                  Password
                </label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-glass-text/40 h-4 w-4 z-10' />
                  <GlassInput
                    id='password'
                    type='password'
                    placeholder='Enter your password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className='pl-10'
                    required
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <label htmlFor='confirmPassword' className='text-sm font-medium text-glass-text'>
                  Confirm Password
                </label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-glass-text/40 h-4 w-4 z-10' />
                  <GlassInput
                    id='confirmPassword'
                    type='password'
                    placeholder='Confirm your password'
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className='pl-10'
                    required
                  />
                </div>
              </div>

              {/* Error/Success Display */}
              {error && <Alert variant='error' message={error} />}
              {success && <Alert variant='success' message={success} />}

              {/* Submit Button */}
              <GlassButton
                type='submit'
                disabled={isLoading}
                loading={isLoading}
                variant='default'
                size='lg'
                className='w-full h-12'
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </GlassButton>
            </form>
          ) : (
            <form onSubmit={handleConfirmSignUp} className='space-y-4'>
              <div className='space-y-2'>
                <label htmlFor='confirmationCode' className='text-sm font-medium text-glass-text'>
                  Confirmation Code
                </label>
                <GlassInput
                  id='confirmationCode'
                  type='text'
                  placeholder='Enter confirmation code'
                  value={confirmationCode}
                  onChange={e => setConfirmationCode(e.target.value)}
                  required
                />
              </div>

              {/* Error/Success Display */}
              {error && <Alert variant='error' message={error} />}
              {success && <Alert variant='success' message={success} />}

              {/* Submit Button */}
              <GlassButton
                type='submit'
                disabled={isLoading}
                loading={isLoading}
                variant='default'
                size='lg'
                className='w-full h-12'
              >
                {isLoading ? 'Confirming...' : 'Confirm account'}
              </GlassButton>
            </form>
          )}
        </GlassCardContent>
      </GlassCard>
    </ModalBackdrop>
  );
};
