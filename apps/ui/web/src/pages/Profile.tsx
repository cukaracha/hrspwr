import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types/userAttributes';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfilePictureCard from '../components/profile/ProfilePictureCard';
import PersonalInfoCard from '../components/profile/PersonalInfoCard';
import SecuritySettingsCard from '../components/profile/SecuritySettingsCard';
import ActionsCard from '../components/profile/ActionsCard';
import DeleteAccountModal from '../components/profile/DeleteAccountModal';
import ImageDeleteModal from '../components/profile/ImageDeleteModal';
import Toast, { ToastItem } from '../components/ui/toast';

const Profile: React.FC = () => {
  const { userProfile, refreshUserAttributes, changePassword, isAdmin, isTeacher, isStudent } =
    useAuth();

  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    security: false,
  });

  // Profile picture state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImageDeleteConfirm, setShowImageDeleteConfirm] = useState(false);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Add drag and drop functionality
  const [isDragOver, setIsDragOver] = useState(false);

  // Enhanced progress calculation with animations
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Add completion status for each field
  const [fieldValidation, setFieldValidation] = useState<
    Record<string, { isValid: boolean; message: string }>
  >({});

  // Add toast state
  const [toasts, setToasts] = useState<Array<ToastItem>>([]);

  // Add ripple effect state
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Toast helper
  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(toast => toast.id !== id)), 5000);
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone: remove unnecessary escapes for () to satisfy no-useless-escape
    if (formData.phoneNumber && !/^\+?[\d\s\-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (formData.dateOfBirth) {
      const date = new Date(formData.dateOfBirth);
      const today = new Date();
      if (isNaN(date.getTime()) || date > today) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Initialize form data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setFormData(userProfile);
      // Load profile image from localStorage if available
      const savedImage = localStorage.getItem('profileImage');
      if (savedImage) setProfileImage(savedImage);
    }
  }, [userProfile]);

  const calculateProfileCompletion = () => {
    // Use formData instead of userProfile for real-time progress
    const currentData = isEditing ? formData : userProfile;
    if (!currentData) return 0;

    const fields = [
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'dateOfBirth',
      'gender',
      'address',
    ];

    const completedFields = fields.filter(
      field =>
        currentData[field as keyof UserProfile] &&
        String(currentData[field as keyof UserProfile]).trim() !== ''
    ).length;

    return Math.round((completedFields / fields.length) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(profileCompletion);
    }, 100);
    return () => clearTimeout(timer);
  }, [profileCompletion]);

  // --- Handlers that must be referenced in effects/props ---

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setMessage(null);

    try {
      // Create a custom update function that includes empty values
      const customUpdateProfile = async (updates: Partial<UserProfile>) => {
        // Convert to Cognito format manually to include empty values
        const cognitoUpdates: Record<string, string> = {};

        // Standard attributes - include even if empty
        if (updates.email !== undefined) cognitoUpdates.email = updates.email;
        if (updates.firstName !== undefined) cognitoUpdates.given_name = updates.firstName;
        if (updates.lastName !== undefined) cognitoUpdates.family_name = updates.lastName;
        if (updates.phoneNumber !== undefined)
          cognitoUpdates.phone_number = updates.phoneNumber || '';
        if (updates.dateOfBirth !== undefined) cognitoUpdates.birthdate = updates.dateOfBirth || '';
        if (updates.gender !== undefined) cognitoUpdates.gender = updates.gender || '';
        if (updates.address !== undefined) cognitoUpdates.address = updates.address || '';

        // Import the updateUserAttributes function
        const { updateUserAttributes } = await import('@aws-amplify/auth');

        // Update attributes in Cognito
        await updateUserAttributes({
          userAttributes: cognitoUpdates,
        });
      };

      // Save
      await customUpdateProfile(formData);
      await refreshUserAttributes();
      setIsEditing(false);
      addToast('success', 'Profile updated successfully!');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating profile:', error);
      addToast(
        'error',
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [formData, refreshUserAttributes, addToast, validateForm]);

  const handleCancel = useCallback(() => {
    setFormData(userProfile || {});
    setErrors({});
    setMessage(null);
    setIsEditing(false);
  }, [userProfile]);

  const handlePasswordCancel = useCallback(() => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordErrors({});
    setPasswordStrength(0);
    setShowPasswordChange(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            if (isEditing) handleSave();
            break;
          case 'e':
            e.preventDefault();
            if (!isEditing) setIsEditing(true);
            break;
        }
      }
      if (e.key === 'Escape') {
        if (isEditing) handleCancel();
        if (showPasswordChange) handlePasswordCancel();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isEditing, showPasswordChange, handleSave, handleCancel, handlePasswordCancel]);

  // Enhanced validation with real-time feedback
  const validateField = (field: keyof UserProfile, value: string) => {
    switch (field) {
      case 'email':
        if (!value) return { isValid: false, message: 'Email is required' };
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return { isValid: false, message: 'Please enter a valid email address' };
        }
        return { isValid: true, message: '' };
      case 'phoneNumber':
        // Fix no-useless-escape here as well
        if (value && !/^\+?[\d\s\-()]+$/.test(value)) {
          return { isValid: false, message: 'Please enter a valid phone number' };
        }
        return { isValid: true, message: '' };
      // Add more field validations...
      default:
        return { isValid: true, message: '' };
    }
  };

  // Update input change handler
  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Real-time validation
    const validation = validateField(field, value);
    setFieldValidation(prev => ({ ...prev, [field]: validation }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));

    // Calculate password strength
    if (field === 'newPassword') {
      let strength = 0;
      if (value.length >= 8) strength += 25;
      if (/[a-z]/.test(value)) strength += 25;
      if (/[A-Z]/.test(value)) strength += 25;
      if (/\d/.test(value)) strength += 25;
      setPasswordStrength(strength);
    }

    // Clear error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-orange-500';
    if (passwordStrength <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        addToast('error', 'Please select a valid image file');
        setIsUploadingImage(false);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addToast('error', 'Image size must be less than 5MB');
        setIsUploadingImage(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const imageData = e.target?.result as string;
        setProfileImage(imageData);
        // Save to localStorage for persistence
        localStorage.setItem('profileImage', imageData);
        setIsUploadingImage(false);
        addToast('success', 'Profile picture updated successfully!');
      };
      reader.onerror = () => {
        setIsUploadingImage(false);
        addToast('error', 'Failed to read image file');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    // Remove from localStorage
    localStorage.removeItem('profileImage');
    setShowImageDeleteConfirm(false);
    addToast('success', 'Profile picture removed');
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSave = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    setIsChangingPassword(true);
    setMessage(null);

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      addToast('success', 'Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordStrength(0);
      setShowPasswordChange(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error changing password:', error);
      addToast(
        'error',
        error instanceof Error
          ? error.message
          : 'Failed to change password. Please check your current password and try again.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      addToast('error', 'Please enter your password to confirm account deletion');
      return;
    }

    setIsDeletingAccount(true);
    setMessage(null);

    try {
      // Note: You'll need to implement the actual account deletion logic in your AuthContext
      // For now, this is a placeholder that shows the confirmation flow
      // eslint-disable-next-line no-console
      console.log('Deleting account with password:', deletePassword);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      addToast(
        'success',
        'Account deletion request submitted. You will receive a confirmation email.'
      );
      setShowDeleteConfirm(false);
      setDeletePassword('');

      // In a real implementation, you would:
      // 1. Call your backend API to delete the account
      // 2. Sign out the user
      // 3. Redirect to login page
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting account:', error);
      addToast(
        'error',
        error instanceof Error ? error.message : 'Failed to delete account. Please try again.'
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const exportProfileData = () => {
    if (!userProfile) return;

    const dataStr = JSON.stringify(userProfile, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'profile-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const getUserRole = () => {
    if (isAdmin()) return 'Administrator';
    if (isTeacher()) return 'Teacher';
    if (isStudent()) return 'Student';
    return 'User';
  };

  const addRipple = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(ripple => ripple.id !== id)), 600);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const event = { target: { files: [file] } } as any;
      handleImageUpload(event);
    }
  };

  if (!userProfile) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-6xl'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-1/4 mb-4'></div>
          <div className='h-4 bg-gray-200 rounded w-1/2 mb-8'></div>
          <div className='space-y-6'>
            <div className='h-64 bg-gray-200 rounded'></div>
            <div className='h-64 bg-gray-200 rounded'></div>
            <div className='h-64 bg-gray-200 rounded'></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8 max-w-6xl'>
      <ProfileHeader profileCompletion={profileCompletion} animatedProgress={animatedProgress} />

      {/* Message Display */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
        />
      ))}

      <ProfilePictureCard
        profileImage={profileImage}
        isUploadingImage={isUploadingImage}
        isDragOver={isDragOver}
        onImageUpload={handleImageUpload}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onRequestDeletePicture={() => setShowImageDeleteConfirm(true)}
      />

      <PersonalInfoCard
        formData={formData}
        isEditing={isEditing}
        errors={errors}
        fieldValidation={fieldValidation}
        expanded={expandedSections.personal}
        onToggleExpand={() => toggleSection('personal')}
        onInputChange={handleInputChange}
        onEdit={() => setIsEditing(true)}
        onCancel={handleCancel}
        onSave={e => {
          addRipple(e);
          handleSave();
        }}
        isLoading={isLoading}
        getUserRole={getUserRole}
        ripples={ripples}
      />

      <SecuritySettingsCard
        showPasswordChange={showPasswordChange}
        onShowPasswordChange={() => setShowPasswordChange(true)}
        onCancelPasswordChange={handlePasswordCancel}
        passwordData={passwordData}
        passwordErrors={passwordErrors}
        passwordStrength={passwordStrength}
        getPasswordStrengthColor={getPasswordStrengthColor}
        getPasswordStrengthText={getPasswordStrengthText}
        onPasswordInputChange={(field, value) => handlePasswordChange(field, value)}
        onSavePassword={handlePasswordSave}
        isChangingPassword={isChangingPassword}
      />

      <ActionsCard
        onExport={exportProfileData}
        onRequestDeleteAccount={() => setShowDeleteConfirm(true)}
      />

      <DeleteAccountModal
        isOpen={showDeleteConfirm}
        password={deletePassword}
        onPasswordChange={setDeletePassword}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletePassword('');
        }}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeletingAccount}
      />

      <ImageDeleteModal
        isOpen={showImageDeleteConfirm}
        onCancel={() => setShowImageDeleteConfirm(false)}
        onConfirm={removeProfileImage}
      />
    </div>
  );
};

export default Profile;
