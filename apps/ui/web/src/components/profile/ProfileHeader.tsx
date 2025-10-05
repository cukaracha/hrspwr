import React from 'react';
import { Card, CardContent } from '../ui/card';
import { User, CheckCircle, XCircle } from 'lucide-react';

type ProfileHeaderProps = {
  profileCompletion: number;
  animatedProgress: number;
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profileCompletion, animatedProgress }) => {
  return (
    <div className='mb-8'>
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
        <div className='flex-1'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Profile Management</h1>
          <p className='text-gray-600'>Manage your account information and preferences</p>
        </div>

        <div className='lg:w-80'>
          <Card className='bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2'>
                  <User className='h-5 w-5 text-blue-600' />
                  <span className='font-semibold text-gray-800'>Profile Completion</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-lg font-bold text-blue-600'>{profileCompletion}%</span>
                  {profileCompletion === 100 ? (
                    <CheckCircle className='h-5 w-5 text-green-500' />
                  ) : (
                    <XCircle className='h-5 w-5 text-orange-500' />
                  )}
                </div>
              </div>
              <div className='w-full bg-white rounded-full h-3 shadow-inner overflow-hidden'>
                <div
                  className='bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm relative'
                  style={{ width: `${animatedProgress}%` }}
                >
                  <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse'></div>
                </div>
              </div>
              <p className='text-xs text-gray-600 mt-3 text-center'>
                {profileCompletion === 100 ? (
                  <span className='text-green-600 font-medium'>🎉 Profile Complete!</span>
                ) : (
                  `${11 - Math.ceil(profileCompletion / 9)} more fields to complete`
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
