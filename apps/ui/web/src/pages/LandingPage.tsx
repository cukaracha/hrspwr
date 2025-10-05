import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  // If user is authenticated, redirect to chat interface
  if (isAuthenticated) {
    return <Navigate to='/' replace />;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      <div className='container mx-auto px-4 py-16'>
        <div className='text-center mb-16'>
          <h1 className='text-6xl font-bold text-gray-900 mb-6'>Welcome to Sample Web App</h1>
          <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
            A modern web application built with React, TypeScript, Tailwind CSS, and Radix UI.
            Experience the power of modern web development.
          </p>
          <div className='flex gap-4 justify-center'>
            <Button asChild size='lg'>
              <Link to='/login'>Sign In</Link>
            </Button>
            <Button asChild variant='outline' size='lg'>
              <Link to='/signup'>Get Started</Link>
            </Button>
          </div>
        </div>

        <div className='grid md:grid-cols-3 gap-8 max-w-6xl mx-auto'>
          <Card>
            <CardHeader>
              <CardTitle>Modern Stack</CardTitle>
              <CardDescription>Built with the latest technologies</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-gray-600'>
                React 18, TypeScript, Vite, Tailwind CSS, and Radix UI for a modern development
                experience.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Secure Authentication</CardTitle>
              <CardDescription>AWS Amplify powered authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-gray-600'>
                Secure user authentication with AWS Cognito integration for enterprise-grade
                security.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Responsive Design</CardTitle>
              <CardDescription>Beautiful on every device</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-gray-600'>
                Fully responsive design that works perfectly on desktop, tablet, and mobile devices.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
