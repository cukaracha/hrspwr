import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import Sidebar from '../components/Sidebar';

const ChatLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      {/* Sidebar */}
      {isAuthenticated && (
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}

      {/* Top Left Menu Button */}
      {isAuthenticated && (
        <div className='absolute top-6 left-6 z-30'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsSidebarOpen(true)}
            className='hover:bg-white/20 backdrop-blur-sm border border-white/20'
          >
            <Menu className='h-5 w-5' />
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className='w-full'>
        <Outlet />
      </main>
    </div>
  );
};

export default ChatLayout;
