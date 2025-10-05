import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { User, ChevronUp, ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import { UserProfile, GENDER_OPTIONS } from '../../types/userAttributes';

type PersonalInfoCardProps = {
  formData: Partial<UserProfile>;
  isEditing: boolean;
  errors: Record<string, string>;
  fieldValidation: Record<string, { isValid: boolean; message: string }>;
  expanded: boolean;
  onToggleExpand: () => void;
  onInputChange: (field: keyof UserProfile, value: string) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (e: React.MouseEvent) => void;
  isLoading: boolean;
  getUserRole: () => string;
  ripples: Array<{ id: number; x: number; y: number }>;
};

const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({
  formData,
  isEditing,
  errors,
  fieldValidation,
  expanded,
  onToggleExpand,
  onInputChange,
  onEdit,
  onCancel,
  onSave,
  isLoading,
  getUserRole,
  ripples,
}) => {
  return (
    <Card className='mb-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50'>
      <CardHeader>
        <div className='flex justify-between items-start'>
          <div className='flex items-center gap-3'>
            <User className='h-6 w-6 text-blue-500' />
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic profile information and contact details</CardDescription>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
              {getUserRole()}
            </span>
            {!isEditing && (
              <Button
                variant='outline'
                onClick={onEdit}
                className='bg-white'
                title='Edit Profile (Ctrl+E)'
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        <div className='border rounded-lg'>
          <button
            type='button'
            onClick={onToggleExpand}
            className='w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors'
          >
            <div className='flex items-center gap-2'>
              <User className='h-5 w-5 text-gray-500' />
              <span className='font-medium text-gray-900'>Basic Information</span>
            </div>
            {expanded ? <ChevronUp className='h-5 w-5' /> : <ChevronDown className='h-5 w-5' />}
          </button>

          {expanded && (
            <div className='overflow-hidden transition-all duration-500 ease-in-out'>
              <div className='px-4 pb-4 space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      First Name *
                    </label>
                    <Input
                      type='text'
                      value={formData.firstName || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onInputChange('firstName', e.target.value)
                      }
                      disabled={!isEditing}
                      className={errors.firstName ? 'border-red-500' : ''}
                    />
                    {errors.firstName && (
                      <p className='text-red-500 text-sm mt-1'>{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Last Name *
                    </label>
                    <Input
                      type='text'
                      value={formData.lastName || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onInputChange('lastName', e.target.value)
                      }
                      disabled={!isEditing}
                      className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && (
                      <p className='text-red-500 text-sm mt-1'>{errors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Email Address *
                    </label>
                    <div className='relative'>
                      <Input
                        type='email'
                        value={formData.email || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          onInputChange('email', e.target.value)
                        }
                        disabled={!isEditing}
                        className={`${fieldValidation.email?.isValid === true ? 'border-green-300 bg-green-50' : fieldValidation.email?.isValid === false ? 'border-red-300 bg-red-50' : 'border-gray-300'} transition-all duration-200`}
                      />
                      {fieldValidation.email?.isValid && (
                        <CheckCircle className='inline h-4 w-4 text-green-500 ml-2' />
                      )}
                      {fieldValidation.email?.isValid === false && (
                        <XCircle className='inline h-4 w-4 text-red-500 ml-2' />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Phone Number
                    </label>
                    <Input
                      type='tel'
                      value={formData.phoneNumber || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onInputChange('phoneNumber', e.target.value)
                      }
                      disabled={!isEditing}
                      placeholder='+1 (555) 123-4567'
                      className={errors.phoneNumber ? 'border-red-500' : ''}
                    />
                    {errors.phoneNumber && (
                      <p className='text-red-500 text-sm mt-1'>{errors.phoneNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Date of Birth
                    </label>
                    <Input
                      type='date'
                      value={formData.dateOfBirth || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onInputChange('dateOfBirth', e.target.value)
                      }
                      disabled={!isEditing}
                      className={errors.dateOfBirth ? 'border-red-500' : ''}
                    />
                    {errors.dateOfBirth && (
                      <p className='text-red-500 text-sm mt-1'>{errors.dateOfBirth}</p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Gender</label>
                    <select
                      value={formData.gender || ''}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        onInputChange('gender', e.target.value)
                      }
                      disabled={!isEditing}
                      className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      <option value=''>Select gender</option>
                      {GENDER_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Address</label>
                  <Input
                    type='text'
                    value={formData.address || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onInputChange('address', e.target.value)
                    }
                    disabled={!isEditing}
                    placeholder='Enter your full address'
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {isEditing && (
        <CardFooter className='flex justify-end gap-3'>
          <Button variant='outline' onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className='relative overflow-hidden bg-blue-600 hover:bg-blue-700'
          >
            {ripples.map(ripple => (
              <span
                key={ripple.id}
                className='absolute bg-white bg-opacity-30 rounded-full animate-ping'
                style={{ left: ripple.x - 10, top: ripple.y - 10, width: 20, height: 20 }}
              />
            ))}
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default PersonalInfoCard;
