import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { AlertTriangle } from 'lucide-react';

type DeleteAccountModalProps = {
  isOpen: boolean;
  password: string;
  onPasswordChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
};

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  password,
  onPasswordChange,
  onCancel,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen) return null;
  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <Card className='w-full max-w-md mx-4'>
        <CardHeader>
          <div className='flex items-center gap-3'>
            <AlertTriangle className='h-6 w-6 text-red-500' />
            <div>
              <CardTitle className='text-red-600'>Delete Account</CardTitle>
              <CardDescription>
                This action cannot be undone. Please enter your password to confirm.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Password *</label>
            <Input
              type='password'
              value={password}
              onChange={e => onPasswordChange(e.target.value)}
              placeholder='Enter your password'
            />
          </div>
          <div className='bg-red-50 border border-red-200 rounded-md p-3'>
            <p className='text-sm text-red-700'>
              <strong>Warning:</strong> Deleting your account will permanently remove all your data,
              including profile information, assignments, and course progress. This action cannot be
              undone.
            </p>
          </div>
        </CardContent>
        <CardFooter className='flex justify-end gap-3'>
          <Button variant='outline' onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={onConfirm}
            disabled={isDeleting || !password.trim()}
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DeleteAccountModal;
