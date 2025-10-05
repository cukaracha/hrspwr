import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { AlertTriangle } from 'lucide-react';

type ImageDeleteModalProps = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const ImageDeleteModal: React.FC<ImageDeleteModalProps> = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <Card className='w-full max-w-md mx-4'>
        <CardHeader>
          <div className='flex items-center gap-3'>
            <AlertTriangle className='h-6 w-6 text-orange-500' />
            <div>
              <CardTitle className='text-orange-600'>Remove Profile Picture</CardTitle>
              <CardDescription>
                Are you sure you want to remove your profile picture?
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='bg-orange-50 border border-orange-200 rounded-md p-3'>
            <p className='text-sm text-orange-700'>
              This action will permanently remove your profile picture. You can always upload a new
              one later.
            </p>
          </div>
        </CardContent>
        <CardFooter className='flex justify-end gap-3'>
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button variant='destructive' onClick={onConfirm}>
            Remove Picture
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ImageDeleteModal;
