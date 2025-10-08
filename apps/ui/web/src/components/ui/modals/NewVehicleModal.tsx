import * as React from 'react';
import { Upload, Check, Car } from 'lucide-react';
import { GlassButton } from '../buttons/glassbutton/GlassButton';
import { GlassCard, GlassCardContent } from '../cards/glasscard/GlassCard';
import {
  vinLookup,
  fileToBase64,
  VinLookupResponse,
  PartsCategoriesResponse,
  partsCategoriesLookup,
} from '../../../services/agentsApi';
import { ModalBackdrop } from './ModalBackdrop';
import { CloseButton } from '../buttons/closebutton/CloseButton';
import { Alert } from '../alerts/Alert';
import { GlassDropzone } from '../inputs/glassdropzone/GlassDropzone';

export interface NewVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleAdded?: (
    vehicleData: VinLookupResponse,
    partsCategories?: PartsCategoriesResponse
  ) => void;
}

export const NewVehicleModal: React.FC<NewVehicleModalProps> = ({
  isOpen,
  onClose,
  onVehicleAdded,
}) => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState('Decoding VIN...');
  const [error, setError] = React.useState<string | null>(null);
  const [successData, setSuccessData] = React.useState<VinLookupResponse | null>(null);
  const [partsCategoriesError, setPartsCategoriesError] = React.useState<string | null>(null);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setError(null);
  };

  const handleDecodeVin = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage('Extracting VIN...');

    try {
      // Convert file to base64
      const base64Image = await fileToBase64(selectedFile);

      // Call VIN lookup API
      const response = await vinLookup(base64Image);

      // Show "Decoding VIN..." for 3 seconds
      setLoadingMessage('Decoding VIN...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Now lookup parts categories
      setLoadingMessage('Gathering data...');
      try {
        const categoriesResponse = await partsCategoriesLookup(response);

        // Both APIs succeeded - set success state and notify parent
        setSuccessData(response);
        onVehicleAdded?.(response, categoriesResponse);
      } catch (categoriesErr) {
        // Parts categories lookup failed, but VIN decode succeeded
        const errorMessage =
          categoriesErr instanceof Error
            ? categoriesErr.message
            : 'Failed to load parts categories';
        setPartsCategoriesError(errorMessage);

        // Still set success state and notify parent with VIN data only
        setSuccessData(response);
        onVehicleAdded?.(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decode VIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError(null);
    setSuccessData(null);
    setPartsCategoriesError(null);
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={handleClose}>
      <GlassCard
        variant='default'
        className='cursor-default hover:shadow-2xl active:scale-100 max-h-[90vh] overflow-y-auto relative'
      >
        {/* Close Button */}
        <div className='absolute top-2 right-2 z-10'>
          <CloseButton onClick={handleClose} position='relative' />
        </div>

        {/* Header */}
        <div className='relative p-6'>
          <h2 className='text-lg sm:text-xl md:text-2xl font-bold text-glass-text text-center flex items-center justify-center gap-2'>
            <Car className='h-6 w-6' />
            Add New Vehicle
          </h2>
        </div>

        {/* Content */}
        <GlassCardContent className='space-y-6 p-4'>
          {/* Success State */}
          {successData ? (
            <>
              {/* Centered Success Display */}
              <div className='flex flex-col items-center justify-center py-8 space-y-4'>
                <div className='w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center'>
                  <Check className='h-10 w-10 text-green-600' />
                </div>
                <div className='text-center'>
                  <p className='text-lg font-semibold text-glass-text'>
                    Vehicle Added Successfully!
                  </p>
                  <p className='text-sm text-glass-text/80 mt-1'>
                    {`${successData.model_year || ''} ${successData.make || ''} ${successData.model || ''}`.trim()}
                  </p>
                </div>
              </div>
              {/* Warning for partial failure */}
              {partsCategoriesError && (
                <Alert
                  variant='warning'
                  title='Parts Categories Unavailable'
                  message={partsCategoriesError}
                />
              )}
              <GlassButton
                onClick={handleClose}
                variant='default'
                size='lg'
                className='w-full h-12'
              >
                Close
              </GlassButton>
            </>
          ) : (
            <>
              {/* Upload Area */}
              <GlassDropzone
                onFileSelect={handleFileSelect}
                accept='image/*'
                maxSize={5}
                value={selectedFile}
                disabled={isLoading}
              />

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
                <span>{isLoading ? loadingMessage : 'Decode VIN'}</span>
              </GlassButton>
            </>
          )}
        </GlassCardContent>
      </GlassCard>
    </ModalBackdrop>
  );
};
