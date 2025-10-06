import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GlassButton } from '../components/ui/buttons/glassbutton/GlassButton';
import { GlassInput } from '../components/ui/inputs/glassinput/GlassInput';
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
} from '../components/ui/cards/glasscard/GlassCard';
import { SignUpModal } from '../components/ui/modals/SignUpModal';
import { Alert } from '../components/ui/alerts/Alert';
import { GradientBackground } from '../components/layouts/backgrounds/gradientbackground/GradientBackground';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      let errorMessage = 'An error occurred during login';

      // Handle specific Cognito errors
      if (err.name === 'UserNotConfirmedException') {
        errorMessage = 'Please check your email and click the verification link before logging in';
      } else if (err.name === 'NotAuthorizedException') {
        errorMessage = 'Email or password incorrect. Please try again.';
      } else if (err.name === 'UserNotFoundException') {
        errorMessage = 'No account found with this email address';
      } else if (err.name === 'TooManyFailedAttemptsException') {
        errorMessage =
          'Too many failed attempts. Please try again in 15 minutes or contact support.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <GlassCard className='w-full max-w-md cursor-default active:scale-100'>
        <GlassCardHeader className='space-y-1'>
          <GlassCardTitle className='text-3xl text-center'>Welcome back</GlassCardTitle>
          <GlassCardDescription className='text-center'>
            Enter your credentials to access your account
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
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
            <div className='space-y-2'>
              <label htmlFor='password' className='text-sm font-medium text-glass-text'>
                Password
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-glass-text/40 h-4 w-4 z-10' />
                <GlassInput
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Enter your password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className='pl-10 pr-10'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-glass-text/40 hover:text-glass-text z-10'
                >
                  {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
            </div>
            {error && <Alert variant='error' message={error} />}
            <GlassButton
              type='submit'
              className='w-full h-12'
              disabled={isLoading}
              loading={isLoading}
              size='lg'
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </GlassButton>
          </form>

          <div className='mt-4 text-center text-sm text-glass-text'>
            Don&apos;t have an account?{' '}
            <button
              onClick={() => setIsSignUpModalOpen(true)}
              className='text-brand-primary hover:underline font-medium'
            >
              Sign up
            </button>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Sign Up Modal */}
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onSignUpSuccess={() => {
          // Modal will close automatically, no need to do anything here
        }}
      />

      {/* Gradient Background */}
      <GradientBackground className='fixed inset-0 -z-10' />
    </div>
  );
};

export default Login;
