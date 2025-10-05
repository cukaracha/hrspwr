import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Shield } from 'lucide-react';

type SecuritySettingsCardProps = {
  showPasswordChange: boolean;
  onShowPasswordChange: () => void;
  onCancelPasswordChange: () => void;
  passwordData: { currentPassword: string; newPassword: string; confirmPassword: string };
  passwordErrors: Record<string, string>;
  passwordStrength: number;
  getPasswordStrengthColor: () => string;
  getPasswordStrengthText: () => string;
  onPasswordInputChange: (
    field: 'currentPassword' | 'newPassword' | 'confirmPassword',
    value: string
  ) => void;
  onSavePassword: () => void;
  isChangingPassword: boolean;
};

const SecuritySettingsCard: React.FC<SecuritySettingsCardProps> = ({
  showPasswordChange,
  onShowPasswordChange,
  onCancelPasswordChange,
  passwordData,
  passwordErrors,
  passwordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthText,
  onPasswordInputChange,
  onSavePassword,
  isChangingPassword,
}) => {
  return (
    <Card className='mb-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50'>
      <CardHeader>
        <div className='flex justify-between items-start'>
          <div className='flex items-center gap-3'>
            <Shield className='h-6 w-6 text-green-500' />
            <div>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security and password</CardDescription>
            </div>
          </div>
          {!showPasswordChange && (
            <Button variant='outline' onClick={onShowPasswordChange}>
              Change Password
            </Button>
          )}
        </div>
      </CardHeader>

      {showPasswordChange && (
        <>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Current Password *
                </label>
                <Input
                  type='password'
                  value={passwordData.currentPassword}
                  onChange={e => onPasswordInputChange('currentPassword', e.target.value)}
                  className={passwordErrors.currentPassword ? 'border-red-500' : ''}
                />
                {passwordErrors.currentPassword && (
                  <p className='text-red-500 text-sm mt-1'>{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  New Password *
                </label>
                <Input
                  type='password'
                  value={passwordData.newPassword}
                  onChange={e => onPasswordInputChange('newPassword', e.target.value)}
                  className={passwordErrors.newPassword ? 'border-red-500' : ''}
                />
                {passwordErrors.newPassword && (
                  <p className='text-red-500 text-sm mt-1'>{passwordErrors.newPassword}</p>
                )}

                {passwordData.newPassword && (
                  <div className='mt-2'>
                    <div className='flex items-center justify-between text-xs text-gray-600 mb-1'>
                      <span>Password strength:</span>
                      <span
                        className={`font-medium ${getPasswordStrengthColor().replace('bg-', 'text-')}`}
                      >
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-1.5'>
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <p className='text-xs text-gray-500 mt-1'>
                  Must be at least 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Confirm New Password *
                </label>
                <Input
                  type='password'
                  value={passwordData.confirmPassword}
                  onChange={e => onPasswordInputChange('confirmPassword', e.target.value)}
                  className={passwordErrors.confirmPassword ? 'border-red-500' : ''}
                />
                {passwordErrors.confirmPassword && (
                  <p className='text-red-500 text-sm mt-1'>{passwordErrors.confirmPassword}</p>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className='flex justify-end gap-3'>
            <Button
              variant='outline'
              onClick={onCancelPasswordChange}
              disabled={isChangingPassword}
            >
              Cancel
            </Button>
            <Button onClick={onSavePassword} disabled={isChangingPassword}>
              {isChangingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default SecuritySettingsCard;
