import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function SignUp() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await confirmSignUp({
        username: email,
        confirmationCode,
      });
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl text-center'>
            {isConfirming ? 'Confirm your account' : 'Create an account'}
          </CardTitle>
          <CardDescription className='text-center'>
            {isConfirming
              ? 'Enter the confirmation code sent to your email'
              : 'Enter your details to create your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConfirming ? (
            <form onSubmit={handleSignUp} className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <label htmlFor='firstName' className='text-sm font-medium'>
                    First Name
                  </label>
                  <Input
                    id='firstName'
                    type='text'
                    placeholder='First name'
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <label htmlFor='lastName' className='text-sm font-medium'>
                    Last Name
                  </label>
                  <Input
                    id='lastName'
                    type='text'
                    placeholder='Last name'
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <label htmlFor='email' className='text-sm font-medium'>
                  Email
                </label>
                <Input
                  id='email'
                  type='email'
                  placeholder='Enter your email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className='space-y-2'>
                <label htmlFor='password' className='text-sm font-medium'>
                  Password
                </label>
                <Input
                  id='password'
                  type='password'
                  placeholder='Enter your password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className='space-y-2'>
                <label htmlFor='confirmPassword' className='text-sm font-medium'>
                  Confirm Password
                </label>
                <Input
                  id='confirmPassword'
                  type='password'
                  placeholder='Confirm your password'
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <div className='text-red-600 text-sm'>{error}</div>}
              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleConfirmSignUp} className='space-y-4'>
              <div className='space-y-2'>
                <label htmlFor='confirmationCode' className='text-sm font-medium'>
                  Confirmation Code
                </label>
                <Input
                  id='confirmationCode'
                  type='text'
                  placeholder='Enter confirmation code'
                  value={confirmationCode}
                  onChange={e => setConfirmationCode(e.target.value)}
                  required
                />
              </div>
              {error && <div className='text-red-600 text-sm'>{error}</div>}
              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? 'Confirming...' : 'Confirm account'}
              </Button>
            </form>
          )}

          <div className='mt-4 text-center text-sm'>
            Already have an account?{' '}
            <Link to='/login' className='text-primary hover:underline'>
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
