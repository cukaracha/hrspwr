import { fetchAuthSession } from '@aws-amplify/auth';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Response from the VIN lookup API
 */
export interface VinLookupResponse {
  vin: string;
  [key: string]: any; // Allow additional fields from RapidAPI response
}

/**
 * Error response from the API
 */
export interface ApiError {
  error: string;
  details?: string;
}

/**
 * Get the current user's authentication token
 */
async function getAuthToken(): Promise<string> {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    if (!token) {
      throw new Error('No authentication token available');
    }

    return token;
  } catch (error) {
    throw new Error('Failed to get authentication token');
  }
}

/**
 * Convert a File or Blob to base64 string
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Call the VIN lookup API with a base64-encoded image
 *
 * @param base64Image - Base64-encoded image string (without data URL prefix)
 * @returns VIN lookup response
 * @throws Error if API call fails
 */
export async function vinLookup(base64Image: string): Promise<VinLookupResponse> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}agents/vin-lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        image: base64Image,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return data as VinLookupResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('VIN lookup failed');
  }
}
