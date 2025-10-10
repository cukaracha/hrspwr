import { fetchAuthSession } from '@aws-amplify/auth';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Response from the VIN lookup API (RapidAPI TecDoc VIN Decoder)
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
 * Vehicle metadata from parts categories lookup
 */
export interface VehicleMetadata {
  countryFilterId: number;
  manufacturerId: number;
  modelId: number;
  vehicleId: number;
}

/**
 * Response from the parts categories lookup API
 */
export interface PartsCategoriesResponse {
  metadata: VehicleMetadata;
  categories: any; // Raw parts categories tree from RapidAPI
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
 * Resize an image to a maximum dimension while preserving aspect ratio
 *
 * @param file - Image file to resize
 * @param maxDimension - Maximum width or height in pixels (default: 500)
 * @returns Resized image as a Blob
 */
async function resizeImage(file: File | Blob, maxDimension: number = 500): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions while preserving aspect ratio
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/jpeg',
        0.9
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert a File or Blob to base64 string
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  // First resize the image
  const resizedBlob = await resizeImage(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(resizedBlob);
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

/**
 * Call the parts categories lookup API with vehicle information
 *
 * @param vehicleInfo - Vehicle information from VIN lookup
 * @returns Parts categories tree
 * @throws Error if API call fails
 */
export async function partsCategoriesLookup(
  vehicleInfo: VinLookupResponse
): Promise<PartsCategoriesResponse> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}agents/parts-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        vehicle_info: vehicleInfo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return data as PartsCategoriesResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Parts categories lookup failed');
  }
}

/**
 * Response from the photo analyzer API
 */
export interface PhotoAnalyzerResponse {
  parts: string[];
}

/**
 * Call the photo analyzer API with a base64-encoded image
 *
 * @param base64Image - Base64-encoded image string (without data URL prefix)
 * @returns Photo analyzer response with detected parts
 * @throws Error if API call fails
 */
export async function photoAnalyzer(base64Image: string): Promise<PhotoAnalyzerResponse> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}agents/photo-analyzer`, {
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

    return data as PhotoAnalyzerResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Photo analysis failed');
  }
}

/**
 * Part lookup result from the parts search API
 */
export interface PartLookupResult {
  part_description: string;
  status: string;
  part_name: string;
  category_id: string;
  category_name: string;
  retry_count: number;
  oem_numbers: string[];
  s3image_uri: string;
  message?: string;
}

/**
 * Response from the parts lookup API
 */
export interface PartsLookupResponse {
  results: {
    [partName: string]: PartLookupResult;
  };
  total_parts: number;
}

/**
 * Call the parts lookup API to search for OEM part numbers
 *
 * @param parts - Array of part names to search for
 * @param vehicleId - Vehicle ID from metadata
 * @param countryFilterId - Country filter ID from metadata
 * @param categories - Parts categories tree
 * @returns Parts lookup response with OEM numbers and images
 * @throws Error if API call fails
 */
export async function partsLookup(
  parts: string[],
  vehicleId: number,
  countryFilterId: number,
  categories: unknown
): Promise<PartsLookupResponse> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}agents/parts-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        parts,
        vehicle_id: vehicleId,
        country_filter_id: countryFilterId,
        categories,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return data as PartsLookupResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Parts lookup failed');
  }
}
