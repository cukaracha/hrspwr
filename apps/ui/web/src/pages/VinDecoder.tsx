import { useState } from 'react';
import { Menu, Upload, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import Sidebar from '../components/Sidebar';
import { vinLookup, fileToBase64, VinLookupResponse } from '../services/agentsApi';

export default function VinDecoder() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<VinLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setApiResponse(null);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDecodeVin = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      // Convert file to base64
      const base64Image = await fileToBase64(selectedFile);

      // Call VIN lookup API
      const response = await vinLookup(base64Image);

      // Set the response
      setApiResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decode VIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setApiResponse(null);
    setError(null);

    // Clear file input
    const fileInput = document.getElementById('vin-image-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      {/* Sidebar */}
      {isAuthenticated && (
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}

      {/* Top Left Menu Button */}
      {isAuthenticated && (
        <div className='absolute top-6 left-6 z-30'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsSidebarOpen(true)}
            className='hover:bg-white/20 backdrop-blur-sm border border-white/20'
          >
            <Menu className='h-5 w-5' />
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className='flex flex-col items-center justify-center min-h-screen px-4 py-8'>
        <div className='w-full max-w-4xl mx-auto space-y-10'>
          {/* Main Heading */}
          <div className='text-center space-y-4'>
            <h1 className='text-6xl md:text-7xl font-bold bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent leading-normal pb-2'>
              VIN Decoder
            </h1>
            <p className='text-2xl md:text-3xl text-gray-600 font-light'>
              Upload a photo of a VIN plate to decode vehicle information
            </p>
          </div>

          {/* Upload Area */}
          <div className='w-full max-w-3xl mx-auto'>
            <div className='bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border-2 border-gray-200/70'>
              {/* File Input */}
              <div className='space-y-6'>
                <div className='flex flex-col items-center justify-center border-3 border-dashed border-gray-300 rounded-2xl p-8 hover:border-blue-400 transition-all duration-300'>
                  <input
                    id='vin-image-input'
                    type='file'
                    accept='image/*'
                    onChange={handleFileSelect}
                    className='hidden'
                  />
                  <label
                    htmlFor='vin-image-input'
                    className='cursor-pointer flex flex-col items-center space-y-4'
                  >
                    {previewUrl ? (
                      <div className='relative'>
                        <img
                          src={previewUrl}
                          alt='VIN plate preview'
                          className='max-w-full max-h-64 rounded-lg shadow-lg'
                        />
                        <div className='absolute top-2 right-2'>
                          <Button
                            type='button'
                            size='sm'
                            variant='outline'
                            onClick={e => {
                              e.preventDefault();
                              handleClear();
                            }}
                            className='bg-white/90 hover:bg-white'
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className='w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center'>
                          <ImageIcon className='h-10 w-10 text-blue-600' />
                        </div>
                        <div className='text-center'>
                          <p className='text-lg font-semibold text-gray-700'>
                            Click to upload VIN plate image
                          </p>
                          <p className='text-sm text-gray-500 mt-1'>PNG, JPG, or JPEG (max 5MB)</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>

                {/* Decode Button */}
                <Button
                  onClick={handleDecodeVin}
                  disabled={!selectedFile || isLoading}
                  className='w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isLoading ? (
                    <div className='flex items-center space-x-2'>
                      <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                      <span>Decoding VIN...</span>
                    </div>
                  ) : (
                    <div className='flex items-center space-x-2'>
                      <Upload className='h-5 w-5' />
                      <span>Decode VIN</span>
                    </div>
                  )}
                </Button>

                {/* Error Display */}
                {error && (
                  <div className='bg-red-50 border-2 border-red-200 rounded-xl p-4'>
                    <p className='text-red-800 font-medium'>Error: {error}</p>
                  </div>
                )}

                {/* API Response Display */}
                {apiResponse && (
                  <div className='bg-gray-50 border-2 border-gray-200 rounded-xl p-6 space-y-4'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-xl font-bold text-gray-900'>API Response</h3>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(apiResponse, null, 2));
                        }}
                      >
                        Copy JSON
                      </Button>
                    </div>
                    <pre className='bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-96 overflow-y-auto'>
                      {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className='text-center space-y-2'>
            <p className='text-sm text-gray-500'>
              The API will extract the VIN from your image and return vehicle details
            </p>
            <p className='text-xs text-gray-400'>Powered by AWS Textract, Bedrock, and RapidAPI</p>
          </div>
        </div>

        {/* Background decorative elements */}
        <div className='fixed inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl'></div>
          <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200/30 to-blue-200/30 rounded-full blur-3xl'></div>
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-slate-200/20 to-gray-200/20 rounded-full blur-3xl'></div>
        </div>
      </div>
    </div>
  );
}
