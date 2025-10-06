import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import { MenuButton } from '../sidebar/MenuButton';
import { GradientBackground } from '../backgrounds/gradientbackground/GradientBackground';

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className='min-h-screen'>
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Menu Button */}
      <MenuButton onClick={() => setIsSidebarOpen(true)} />

      {/* Page Content */}
      <Outlet />

      {/* Background */}
      <GradientBackground className='fixed inset-0 -z-10' />
    </div>
  );
}
