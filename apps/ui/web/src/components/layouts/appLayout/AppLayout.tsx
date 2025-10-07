import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import { GradientBackground } from '../backgrounds/gradientbackground/GradientBackground';
import { GlassBanner } from '../banners/glassbanner/GlassBanner';

// Map routes to page titles
const routeTitles: Record<string, string> = {
  '/': 'Home',
  '/garage': 'My Garage',
  '/browse': 'Browse',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Get current page title based on route
  const pageTitle = routeTitles[location.pathname] || 'App';

  return (
    <div className='min-h-screen'>
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Glass Banner with Menu Button and Title */}
      <GlassBanner title={pageTitle} onMenuClick={() => setIsSidebarOpen(true)} />

      {/* Page Content - Add padding to account for fixed banner */}
      <div className='pt-16 sm:pt-20'>
        <Outlet />
      </div>

      {/* Background */}
      <GradientBackground className='fixed inset-0 -z-10' />
    </div>
  );
}
