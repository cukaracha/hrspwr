import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Upload } from 'lucide-react';
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from '../components/ui/cards/glasscard/GlassCard';
import { GlassButton } from '../components/ui/buttons/glassbutton/GlassButton';
import { GlassDropzone } from '../components/ui/inputs/glassdropzone/GlassDropzone';
import { GlassMenu, GlassMenuItem } from '../components/ui/menus/glassmenu/GlassMenu';
import { Alert } from '../components/ui/alerts/Alert';
import { GlassBadge } from '../components/ui/badges/glassbadge/GlassBadge';
import { fileToBase64, photoAnalyzer, partsLookup, PartLookupResult } from '../services/agentsApi';

interface VehicleData {
  year: string;
  make: string;
  model: string;
  vin: string;
  vehicleId: number;
  countryFilterId: number;
  categories: unknown;
}

interface PartResultCache {
  [partName: string]: PartLookupResult;
}

export default function PartsSearch() {
  const location = useLocation();
  const navigate = useNavigate();

  // Vehicle data from navigation state
  const vehicleData = location.state as VehicleData | null;

  // Component state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [detectedParts, setDetectedParts] = React.useState<string[]>([]);
  const [selectedPart, setSelectedPart] = React.useState<string>('');
  const [partsCache, setPartsCache] = React.useState<PartResultCache>({});
  const [isLoadingParts, setIsLoadingParts] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Redirect if no vehicle data
  React.useEffect(() => {
    if (!vehicleData) {
      navigate('/');
    }
  }, [vehicleData, navigate]);

  // Handle photo analysis
  const handleAnalyzePhoto = async () => {
    if (!selectedFile || !vehicleData) return;

    setIsAnalyzing(true);
    setError(null);
    setDetectedParts([]);
    setSelectedPart('');
    setPartsCache({});

    try {
      // Convert file to base64
      const base64Image = await fileToBase64(selectedFile);

      // Call photo analyzer API
      const response = await photoAnalyzer(base64Image);

      if (response.parts && response.parts.length > 0) {
        setDetectedParts(response.parts);

        // Immediately fetch parts details for all detected parts
        await fetchPartsDetails(response.parts);
      } else {
        setError('No parts detected in the image. Please try another photo.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze photo');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fetch parts details for all detected parts
  const fetchPartsDetails = async (parts: string[]) => {
    if (!vehicleData) return;

    setIsLoadingParts(true);

    try {
      const response = await partsLookup(
        parts,
        vehicleData.vehicleId,
        vehicleData.countryFilterId,
        vehicleData.categories
      );

      // Cache the results using the ORIGINAL part names from photo analyzer
      const cache: PartResultCache = {};
      response.results.forEach((result, index) => {
        const originalPartName = parts[index];
        cache[originalPartName] = result;
      });
      setPartsCache(cache);

      // Automatically select the first part
      if (parts.length > 0) {
        setSelectedPart(parts[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch parts details');
    } finally {
      setIsLoadingParts(false);
    }
  };

  // Convert detected parts to menu items
  const menuItems: GlassMenuItem[] = detectedParts.map(part => ({
    value: part,
    label: part,
  }));

  // Get current part details
  const currentPartDetails = selectedPart ? partsCache[selectedPart] : null;

  if (!vehicleData) {
    return null;
  }

  return (
    <div className='container mx-auto px-4 py-8 space-y-6'>
      {/* Vehicle Info Card */}
      <GlassCard variant='default'>
        <GlassCardHeader>
          <GlassCardTitle className='text-2xl'>Vehicle Information</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className='flex flex-wrap items-center gap-4'>
            <GlassBadge>{vehicleData.year}</GlassBadge>
            <div className='flex-1 min-w-[200px]'>
              <h3 className='text-2xl font-bold text-glass-text'>{vehicleData.make}</h3>
              <p className='text-xl font-semibold text-glass-text/90'>{vehicleData.model}</p>
            </div>
            <div className='text-sm text-glass-text/70 font-mono'>VIN: {vehicleData.vin}</div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Photo Upload Section */}
      <GlassCard variant='default'>
        <GlassCardHeader>
          <GlassCardTitle className='text-2xl flex items-center gap-2'>
            <Upload className='h-6 w-6' />
            Upload Parts Photo
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className='space-y-4'>
          <GlassDropzone
            value={selectedFile}
            onFileSelect={setSelectedFile}
            accept='image/*'
            maxSize={5}
            disabled={isAnalyzing}
          />

          {error && <Alert variant='error' message={error} />}

          <GlassButton
            onClick={handleAnalyzePhoto}
            disabled={!selectedFile || isAnalyzing}
            loading={isAnalyzing}
            variant='default'
            size='lg'
            className='w-full h-12'
          >
            {!isAnalyzing && <Search className='mr-2 h-5 w-5' />}
            <span>{isAnalyzing ? 'Analyzing Photo...' : 'Analyze Parts'}</span>
          </GlassButton>
        </GlassCardContent>
      </GlassCard>

      {/* Parts Selection and Details */}
      {detectedParts.length > 0 && (
        <GlassCard variant='default'>
          <GlassCardHeader>
            <GlassCardTitle className='text-2xl'>Detected Parts</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className='space-y-6'>
            {/* Parts Dropdown */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-glass-text/80'>
                Select a part to view details:
              </label>
              <GlassMenu
                items={menuItems}
                value={selectedPart}
                onChange={setSelectedPart}
                placeholder='Choose a part...'
                loading={isLoadingParts}
              />
            </div>

            {/* Part Details */}
            {selectedPart && (
              <div className='space-y-4 pt-4 border-t border-glass-border'>
                {isLoadingParts ? (
                  <div className='flex items-center justify-center py-8'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
                  </div>
                ) : currentPartDetails ? (
                  <>
                    {currentPartDetails.status === 'SUCCESS' ? (
                      <div className='space-y-4'>
                        {/* Part Name */}
                        <div>
                          <h3 className='text-xl font-bold text-glass-text mb-2'>
                            {currentPartDetails.part.part_name}
                          </h3>
                        </div>

                        {/* OEM Part Numbers */}
                        {currentPartDetails.oem_numbers.length > 0 && (
                          <div className='space-y-2'>
                            <h4 className='text-sm font-semibold text-glass-text/80 uppercase tracking-wide'>
                              OEM Part Numbers
                            </h4>
                            <div className='flex flex-wrap gap-2'>
                              {currentPartDetails.oem_numbers.map((oemNumber, index) => (
                                <GlassBadge key={index} className='font-mono'>
                                  {oemNumber}
                                </GlassBadge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sample Image */}
                        {currentPartDetails.s3image_uri && (
                          <div className='space-y-2'>
                            <h4 className='text-sm font-semibold text-glass-text/80 uppercase tracking-wide'>
                              Sample Image
                            </h4>
                            <div className='rounded-xl overflow-hidden border border-glass-border bg-white/5'>
                              <img
                                src={currentPartDetails.s3image_uri}
                                alt={currentPartDetails.part.part_name}
                                className='w-full h-auto max-h-96 object-contain'
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Alert
                        variant='warning'
                        title='Part Not Found'
                        message={
                          currentPartDetails.message || 'Unable to find details for this part.'
                        }
                      />
                    )}
                  </>
                ) : (
                  <Alert variant='info' message='No details available for this part.' />
                )}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}
