import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { GradientBackground } from '../components/ui/backgrounds/gradientbackground/GradientBackground';
import { MenuButton } from '../components/ui/layouts/menubutton/MenuButton';

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
      {isAuthenticated && <MenuButton onClick={() => setIsSidebarOpen(true)} />}

      {/* Background decorative elements */}
      <GradientBackground />

      {/* Main Content */}
      <main className='w-full'>
        <Outlet />
      </main>
    </div>
  );
};

export default ChatLayout;
