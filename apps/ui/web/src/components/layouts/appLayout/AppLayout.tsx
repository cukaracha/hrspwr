import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import { GlassBanner } from '../banners/glassbanner/GlassBanner';

// Map routes to page titles
const routeTitles: Record<string, string> = {
  '/': 'My Garage',
  '/garage': 'My Garage',
  '/browse': 'Browse',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Get current page title based on route
  const getPageTitle = () => {
    if (location.pathname.startsWith('/parts-search')) {
      return 'Parts Search';
    }
    return routeTitles[location.pathname] || 'App';
  };

  const pageTitle = getPageTitle();

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
      <div
        className='fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat blur-sm'
        style={{ backgroundImage: 'url(/backgrounds/bg5.png)' }}
      />
    </div>
  );
}
