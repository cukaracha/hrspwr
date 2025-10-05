import { Outlet, useNavigate, Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';

const Layout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center'>
              <Link to='/' className='text-2xl font-bold text-gray-900'>
                Sample Web App
              </Link>
            </div>

            <div className='flex items-center space-x-4'>
              {user && (
                <div className='flex items-center space-x-2'>
                  <User className='h-5 w-5 text-gray-500' />
                  <span className='text-sm text-gray-700'>{user.username}</span>
                </div>
              )}
              <Button variant='ghost' size='sm' onClick={handleLogout}>
                <LogOut className='h-4 w-4 mr-2' />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
