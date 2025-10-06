import { LogOut, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { GlassButton } from '../../ui/buttons/glassbutton/GlassButton';
import { CloseButton } from '../../ui/buttons/closebutton/CloseButton';

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
      {isOpen && (
        <div className='fixed inset-0 bg-black/20 backdrop-blur-sm z-40' onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='flex flex-col h-full'>
          {/* Header */}
          <div className='flex items-center justify-between p-6 border-b border-gray-100 relative'>
            <h2 className='text-xl font-semibold text-gray-900'>Menu</h2>
            <CloseButton onClick={onClose} variant='ghost' position='relative' />
          </div>

          {/* User Profile Section */}
          <div className='p-6 border-b border-gray-100'>
            <div className='flex items-center space-x-4'>
              {/* Avatar */}
              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg'>
                {getInitials()}
              </div>

              {/* User Info */}
              <div className='flex-1 min-w-0'>
                <p className='text-lg font-semibold text-gray-900 truncate'>{getDisplayName()}</p>
                <p className='text-sm text-gray-500 truncate'>
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
                className='w-full justify-start text-left hover:bg-gray-100'
                onClick={handleMyGarage}
              >
                <Car className='h-5 w-5 mr-3' />
                My Garage
              </GlassButton>
            </nav>
          </div>

          {/* Bottom Actions */}
          <div className='p-4 border-t border-gray-100'>
            <GlassButton
              variant='ghost'
              className='w-full justify-start text-left hover:bg-red-50 hover:text-red-600'
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
