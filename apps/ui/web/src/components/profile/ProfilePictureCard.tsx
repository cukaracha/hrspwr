import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Camera, Trash2, User } from 'lucide-react';

type ProfilePictureCardProps = {
  profileImage: string | null;
  isUploadingImage: boolean;
  isDragOver: boolean;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onRequestDeletePicture: () => void;
};

const ProfilePictureCard: React.FC<ProfilePictureCardProps> = ({
  profileImage,
  isUploadingImage,
  isDragOver,
  onImageUpload,
  onDragOver,
  onDragLeave,
  onDrop,
  onRequestDeletePicture,
}) => {
  return (
    <Card className='mb-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50'>
      <CardHeader>
        <div className='flex items-center gap-3'>
          <Camera className='h-6 w-6 text-purple-500' />
          <div>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Upload a profile picture to personalize your account</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='flex items-center gap-6'>
          <div
            className={`relative group transition-all duration-300 ${isDragOver ? 'scale-105 ring-4 ring-purple-300' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className='w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-white shadow-xl'>
              {profileImage ? (
                <img src={profileImage} alt='Profile' className='w-full h-full object-cover' />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-gray-400'>
                  <User className='h-16 w-16' />
                </div>
              )}
            </div>
            {isDragOver && (
              <div className='absolute inset-0 bg-purple-500 bg-opacity-20 rounded-full flex items-center justify-center'>
                <Camera className='h-8 w-8 text-purple-600' />
              </div>
            )}
            {isUploadingImage && (
              <div className='absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
              </div>
            )}
            <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100'>
              <Camera className='h-8 w-8 text-white' />
            </div>
          </div>

          <div className='flex flex-col gap-3'>
            <div>
              <input
                type='file'
                id='profile-image'
                accept='image/*'
                onChange={onImageUpload}
                className='hidden'
                disabled={isUploadingImage}
              />
              <label htmlFor='profile-image'>
                <Button
                  variant='outline'
                  className='cursor-pointer'
                  disabled={isUploadingImage}
                  asChild
                >
                  <span>
                    <Camera className='h-4 w-4 mr-2' />
                    {profileImage ? 'Change Picture' : 'Upload Picture'}
                  </span>
                </Button>
              </label>
            </div>

            {profileImage && (
              <Button
                variant='outline'
                onClick={onRequestDeletePicture}
                className='w-full md:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300'
                disabled={isUploadingImage}
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Remove Picture
              </Button>
            )}

            <p className='text-xs text-gray-500'>Supported formats: JPG, PNG, GIF (max 5MB)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfilePictureCard;
