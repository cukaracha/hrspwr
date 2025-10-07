import { LogOut, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { GlassButton } from '../../ui/buttons/glassbutton/GlassButton';
import { CloseButton } from '../../ui/buttons/closebutton/CloseButton';
import { ThemeToggle } from '../../ui/toggles/themeToggle/ThemeToggle';
import { GlassBackdrop } from '../backdrops/glassBackdrop/GlassBackdrop';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleMyGarage = () => {
    navigate('/');
    onClose();
  };

  const getDisplayName = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    return user?.username || 'User';
  };

  const getInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase();
    }
    const username = user?.username || 'U';
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Backdrop */}
      <GlassBackdrop isOpen={isOpen} onClick={onClose} zIndex={45} />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white/70 dark:bg-black/70 backdrop-blur-md border-r border-glass-border shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='flex flex-col h-full'>
          {/* Header */}
          <div className='flex items-center justify-between h-[65px] sm:h-[81px] px-6 border-b border-border relative'>
            <h2 className='text-xl font-semibold text-foreground'>Menu</h2>
            <CloseButton onClick={onClose} variant='ghost' position='relative' />
          </div>

          {/* User Profile Section */}
          <div className='p-6 border-b border-border'>
            <div className='flex items-center space-x-4'>
              {/* Avatar */}
              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg'>
                {getInitials()}
              </div>

              {/* User Info */}
              <div className='flex-1 min-w-0'>
                <p className='text-lg font-semibold text-foreground truncate'>{getDisplayName()}</p>
                <p className='text-sm text-muted-foreground truncate'>
                  {userProfile?.email || user?.username}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className='flex-1 p-4'>
            <nav className='space-y-2'>
              <GlassButton
                variant='ghost'
                className='w-full justify-start text-left hover:bg-accent'
                onClick={handleMyGarage}
              >
                <Car className='h-5 w-5 mr-3' />
                My Garage
              </GlassButton>
              <ThemeToggle className='w-full justify-start text-left hover:bg-accent' />
            </nav>
          </div>

          {/* Bottom Actions */}
          <div className='p-4 border-t border-border'>
            <GlassButton
              variant='ghost'
              className='w-full justify-center text-center'
              onClick={handleSignOut}
            >
              <LogOut className='h-5 w-5 mr-3' />
              Sign Out
            </GlassButton>
          </div>
        </div>
      </div>
    </>
  );
}
