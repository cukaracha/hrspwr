import * as React from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { GlassButton } from '../buttons/glassbutton/GlassButton';
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from '../cards/glasscard/GlassCard';
import { vinLookup, fileToBase64, VinLookupResponse } from '../../../services/agentsApi';
import { ModalBackdrop } from './ModalBackdrop';
import { CloseButton } from '../buttons/closebutton/CloseButton';
import { Alert } from '../alerts/Alert';

export interface NewVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleAdded?: (vehicleData: VinLookupResponse) => void;
}

export const NewVehicleModal: React.FC<NewVehicleModalProps> = ({
  isOpen,
  onClose,
  onVehicleAdded,
}) => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);

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

    try {
      // Convert file to base64
      const base64Image = await fileToBase64(selectedFile);

      // Call VIN lookup API
      const response = await vinLookup(base64Image);

      // Notify parent component
      onVehicleAdded?.(response);

      // Close modal
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decode VIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);

    // Clear file input
    const fileInput = document.getElementById('modal-vin-image-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={handleClose}>
      <GlassCard
        variant='default'
        className='cursor-default hover:bg-white/10 hover:shadow-2xl active:scale-100 max-h-[90vh] overflow-y-auto'
      >
        {/* Header */}
        <GlassCardHeader className='relative'>
          <GlassCardTitle className='text-3xl'>Add New Vehicle</GlassCardTitle>
          <CloseButton onClick={handleClose} />
        </GlassCardHeader>

        {/* Content */}
        <GlassCardContent className='space-y-6'>
          {/* Upload Area */}
          <div className='flex flex-col items-center justify-center border-3 border-dashed border-gray-300 rounded-2xl p-8 hover:border-blue-400 transition-all duration-300'>
            <input
              id='modal-vin-image-input'
              type='file'
              accept='image/*'
              onChange={handleFileSelect}
              className='hidden'
            />
            <label
              htmlFor='modal-vin-image-input'
              className='cursor-pointer flex flex-col items-center space-y-4 w-full'
            >
              {previewUrl ? (
                <div className='relative w-full'>
                  <img
                    src={previewUrl}
                    alt='VIN plate preview'
                    className='max-w-full max-h-64 mx-auto rounded-lg shadow-lg'
                  />
                  <div className='absolute top-2 right-2'>
                    <GlassButton
                      type='button'
                      size='sm'
                      variant='ghost'
                      onClick={e => {
                        e.preventDefault();
                        handleClear();
                      }}
                    >
                      Clear
                    </GlassButton>
                  </div>
                </div>
              ) : (
                <>
                  <div className='w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center'>
                    <ImageIcon className='h-10 w-10 text-blue-600' />
                  </div>
                  <div className='text-center'>
                    <p className='text-lg font-semibold text-glass-text'>
                      Click to upload VIN plate image
                    </p>
                    <p className='text-sm text-glass-text/60 mt-1'>PNG, JPG, or JPEG (max 5MB)</p>
                  </div>
                </>
              )}
            </label>
          </div>

          {/* Error Display */}
          {error && <Alert variant='error' message={error} />}

          {/* Action Button */}
          <GlassButton
            onClick={handleDecodeVin}
            disabled={!selectedFile || isLoading}
            loading={isLoading}
            variant='default'
            size='lg'
            className='w-full h-12'
          >
            {!isLoading && <Upload className='mr-2 h-5 w-5' />}
            {isLoading ? 'Decoding VIN...' : 'Decode VIN'}
          </GlassButton>
        </GlassCardContent>
      </GlassCard>
    </ModalBackdrop>
  );
};
