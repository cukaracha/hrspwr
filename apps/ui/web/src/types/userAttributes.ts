// Standard Cognito User Attributes
export interface StandardUserAttributes {
  email?: string;
  given_name?: string; // Cognito API uses given_name (snake_case)
  family_name?: string; // Cognito API uses family_name (snake_case)
  phone_number?: string; // Cognito API uses phone_number (snake_case)
  birthdate?: string; // YYYY-MM-DD format
  gender?: string;
  address?: string;
}

// Custom User Attributes (prefixed with custom: in Cognito)
export interface CustomUserAttributes {
  studentID?: string;
  accountStatus?: AccountStatus;
  enrollmentStatus?: EnrollmentStatus;
  emergencyContact?: string;
}

// Complete User Attributes (combines standard and custom)
export interface UserAttributes extends StandardUserAttributes {
  // Custom attributes with 'custom:' prefix as stored in Cognito
  'custom:studentID'?: string;
  'custom:accountStatus'?: AccountStatus;
  'custom:enrollmentStatus'?: EnrollmentStatus;
  'custom:emergencyContact'?: string;
}

// User Profile (for frontend use - more user-friendly names)
export interface UserProfile {
  email: string;
  fullName: string; // Frontend combines given_name + family_name
  firstName: string; // Maps to given_name
  lastName: string; // Maps to family_name
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: Gender;
  address?: string;
}

// Predefined Options
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'graduated';

export type EnrollmentStatus =
  | 'enrolled'
  | 'not_enrolled'
  | 'withdrawn'
  | 'deferred'
  | 'completed'
  | 'transferred';

export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | 'other';

// Dropdown Options for UI
export const ACCOUNT_STATUS_OPTIONS: { value: AccountStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'graduated', label: 'Graduated' },
];

export const ENROLLMENT_STATUS_OPTIONS: { value: EnrollmentStatus; label: string }[] = [
  { value: 'enrolled', label: 'Currently Enrolled' },
  { value: 'not_enrolled', label: 'Not Enrolled' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'deferred', label: 'Deferred' },
  { value: 'completed', label: 'Completed' },
  { value: 'transferred', label: 'Transferred' },
];

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  { value: 'other', label: 'Other' },
];

// Utility Functions for Attribute Conversion
export class UserAttributeUtils {
  /**
   * Convert Cognito attributes to UserProfile format
   */
  static cognitoToProfile(attributes: UserAttributes): UserProfile {
    return {
      email: attributes.email || '',
      fullName: [attributes.given_name, attributes.family_name].filter(Boolean).join(' '),
      firstName: attributes.given_name || '',
      lastName: attributes.family_name || '',
      phoneNumber: attributes.phone_number,
      dateOfBirth: attributes.birthdate,
      gender: attributes.gender as Gender,
      address: attributes.address,
    };
  }

  /**
   * Convert UserProfile to Cognito attributes format
   */
  static profileToCognito(profile: Partial<UserProfile>): Partial<UserAttributes> {
    const attributes: Partial<UserAttributes> = {};

    // Standard attributes
    if (profile.email) attributes.email = profile.email;
    if (profile.firstName) attributes.given_name = profile.firstName;
    if (profile.lastName) attributes.family_name = profile.lastName;
    if (profile.phoneNumber) attributes.phone_number = profile.phoneNumber;
    if (profile.dateOfBirth) attributes.birthdate = profile.dateOfBirth;
    if (profile.gender) attributes.gender = profile.gender;
    if (profile.address) attributes.address = profile.address;

    return attributes;
  }

  /**
   * Get display label for account status
   */
  static getAccountStatusLabel(status?: AccountStatus): string {
    const option = ACCOUNT_STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || 'Unknown';
  }

  /**
   * Get display label for enrollment status
   */
  static getEnrollmentStatusLabel(status?: EnrollmentStatus): string {
    const option = ENROLLMENT_STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || 'Unknown';
  }

  /**
   * Get display label for gender
   */
  static getGenderLabel(gender?: Gender): string {
    const option = GENDER_OPTIONS.find(opt => opt.value === gender);
    return option?.label || 'Not specified';
  }

  /**
   * Format phone number for display
   */
  static formatPhoneNumber(phone?: string): string {
    if (!phone) return '';

    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }

    return phone; // Return original if not standard format
  }

  /**
   * Format date for display (from YYYY-MM-DD to readable format)
   */
  static formatDateOfBirth(date?: string): string {
    if (!date) return '';

    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return date; // Return original if invalid
    }
  }

  /**
   * Convert date from display format to YYYY-MM-DD
   */
  static toDateInputFormat(date?: string): string {
    if (!date) return '';

    try {
      const dateObj = new Date(date);
      return dateObj.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }
}

// Validation Functions
export class UserAttributeValidators {
  /**
   * Validate student ID format
   */
  static validateStudentID(studentID: string): { isValid: boolean; error?: string } {
    if (!studentID.trim()) {
      return { isValid: false, error: 'Student ID is required' };
    }

    if (studentID.length < 3) {
      return { isValid: false, error: 'Student ID must be at least 3 characters' };
    }

    if (studentID.length > 20) {
      return { isValid: false, error: 'Student ID cannot exceed 20 characters' };
    }

    // Allow alphanumeric and common separators
    if (!/^[A-Za-z0-9\-_]+$/.test(studentID)) {
      return {
        isValid: false,
        error: 'Student ID can only contain letters, numbers, hyphens, and underscores',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
    if (!phone.trim()) {
      return { isValid: true }; // Optional field
    }

    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length < 10) {
      return { isValid: false, error: 'Phone number must be at least 10 digits' };
    }

    if (cleaned.length > 15) {
      return { isValid: false, error: 'Phone number cannot exceed 15 digits' };
    }

    return { isValid: true };
  }

  /**
   * Validate date of birth
   */
  static validateDateOfBirth(date: string): { isValid: boolean; error?: string } {
    if (!date.trim()) {
      return { isValid: true }; // Optional field
    }

    try {
      const dateObj = new Date(date);
      const now = new Date();

      if (isNaN(dateObj.getTime())) {
        return { isValid: false, error: 'Invalid date format' };
      }

      if (dateObj > now) {
        return { isValid: false, error: 'Date of birth cannot be in the future' };
      }

      // Check if person is at least 13 years old (COPPA compliance)
      const thirteenYearsAgo = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());
      if (dateObj > thirteenYearsAgo) {
        return { isValid: false, error: 'Must be at least 13 years old' };
      }

      // Check if person is not older than 120 years
      const oneHundredTwentyYearsAgo = new Date(
        now.getFullYear() - 120,
        now.getMonth(),
        now.getDate()
      );
      if (dateObj < oneHundredTwentyYearsAgo) {
        return { isValid: false, error: 'Invalid date of birth' };
      }

      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Invalid date format' };
    }
  }

  /**
   * Validate emergency contact
   */
  static validateEmergencyContact(contact: string): { isValid: boolean; error?: string } {
    if (!contact.trim()) {
      return { isValid: true }; // Optional field
    }

    if (contact.length < 5) {
      return { isValid: false, error: 'Emergency contact must be at least 5 characters' };
    }

    if (contact.length > 100) {
      return { isValid: false, error: 'Emergency contact cannot exceed 100 characters' };
    }

    return { isValid: true };
  }

  /**
   * Validate address
   */
  static validateAddress(address: string): { isValid: boolean; error?: string } {
    if (!address.trim()) {
      return { isValid: true }; // Optional field
    }

    if (address.length < 10) {
      return { isValid: false, error: 'Address must be at least 10 characters' };
    }

    if (address.length > 200) {
      return { isValid: false, error: 'Address cannot exceed 200 characters' };
    }

    return { isValid: true };
  }
}
