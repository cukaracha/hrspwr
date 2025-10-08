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
import { VehicleSelectionModal } from '../components/ui/modals/VehicleSelectionModal';
import { Vehicle } from '../components/ui/cards/vehiclecard/VehicleCard';

interface VehicleData {
  year: string;
  make: string;
  model: string;
  vin: string;
  vehicleId: number;
  countryFilterId: number;
  categories: unknown;
  imageUrl?: string;
}

interface PartResultCache {
  [partName: string]: PartLookupResult;
}

// Mock vehicles data - TODO: Replace with actual vehicle context/API
const mockVehicles: Vehicle[] = [
  {
    id: '1',
    year: '2023',
    make: 'Tesla',
    model: 'Model 3',
    trim: 'Performance',
    imageUrl:
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=60',
    vin: '5YJ3E1EA5KF123456',
    partsCategories: {
      metadata: {
        countryFilterId: 1,
        manufacturerId: 100,
        modelId: 1000,
        vehicleId: 10000,
      },
      categories: {},
    },
  },
  {
    id: '2',
    year: '2022',
    make: 'BMW',
    model: 'M4',
    trim: 'Competition',
    imageUrl:
      'https://images.unsplash.com/photo-1617531653520-bd466c28f515?w=800&auto=format&fit=crop&q=60',
    vin: 'WBS8M9C51N5L12345',
    partsCategories: {
      metadata: {
        countryFilterId: 1,
        manufacturerId: 200,
        modelId: 2000,
        vehicleId: 20000,
      },
      categories: {},
    },
  },
  {
    id: '3',
    year: '2021',
    make: 'Porsche',
    model: '911',
    trim: 'Carrera S',
    imageUrl:
      'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=800&auto=format&fit=crop&q=60',
    vin: 'WP0AB2A99MS123456',
    partsCategories: {
      metadata: {
        countryFilterId: 1,
        manufacturerId: 300,
        modelId: 3000,
        vehicleId: 30000,
      },
      categories: {},
    },
  },
];

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
  const [isVehicleModalOpen, setIsVehicleModalOpen] = React.useState(false);
  const [currentVehicleId, setCurrentVehicleId] = React.useState<string | undefined>(undefined);

  // Redirect if no vehicle data
  React.useEffect(() => {
    if (!vehicleData) {
      navigate('/');
    }
  }, [vehicleData, navigate]);

  // Set current vehicle ID based on VIN match
  React.useEffect(() => {
    if (vehicleData?.vin) {
      const matchedVehicle = mockVehicles.find(v => v.vin === vehicleData.vin);
      if (matchedVehicle) {
        setCurrentVehicleId(matchedVehicle.id);
      }
    }
  }, [vehicleData]);

  // Handle vehicle selection from modal
  const handleVehicleSelect = (vehicle: Vehicle) => {
    if (!vehicle.partsCategories?.metadata) {
      setError('Selected vehicle is missing metadata');
      return;
    }

    // Navigate to parts search page with new vehicle data
    navigate(`/parts-search/${vehicle.vin}`, {
      state: {
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        vin: vehicle.vin,
        vehicleId: vehicle.partsCategories.metadata.vehicleId,
        countryFilterId: vehicle.partsCategories.metadata.countryFilterId,
        categories: vehicle.partsCategories.categories,
        imageUrl: vehicle.imageUrl,
      },
    });

    // Update current vehicle ID
    setCurrentVehicleId(vehicle.id);

    // Reset parts search state
    setSelectedFile(null);
    setDetectedParts([]);
    setSelectedPart('');
    setPartsCache({});
    setError(null);
  };

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
    <div className='container mx-auto px-4 py-8 space-y-6 max-w-2xl'>
      {/* Vehicle Info Card */}
      <GlassCard
        variant='default'
        className='overflow-hidden p-0 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]'
        onClick={() => setIsVehicleModalOpen(true)}
      >
        <div className='flex flex-col sm:flex-row items-stretch relative max-h-48 sm:max-h-32'>
          {/* Vehicle Thumbnail */}
          {vehicleData.imageUrl && (
            <div className='flex-shrink-0 w-full h-48 sm:w-40 sm:h-32 bg-gradient-to-br from-blue-500 to-purple-600'>
              <img
                src={vehicleData.imageUrl}
                alt={`${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`}
                className='w-full h-full object-cover object-center'
              />
            </div>
          )}

          {/* Vehicle Details */}
          <div className='flex flex-col justify-center p-3 sm:pl-4 flex-1 bg-gradient-to-t from-black/60 to-transparent sm:bg-none absolute sm:relative bottom-0 sm:bottom-auto w-full sm:w-auto'>
            <div className='flex items-center gap-2 mb-1'>
              <GlassBadge variant='primary'>{vehicleData.year}</GlassBadge>
            </div>
            <div className='flex items-center gap-2 mb-1'>
              <h3 className='text-xl sm:text-lg font-bold text-white sm:text-glass-text leading-none shadow-lg sm:shadow-none'>
                {vehicleData.make}
              </h3>
              <p className='text-xl sm:text-lg font-semibold text-white/90 sm:text-glass-text/90 leading-none shadow-lg sm:shadow-none'>
                {vehicleData.model}
              </p>
            </div>
            <div className='text-xs sm:text-sm text-white/70 sm:text-glass-text/70 font-mono shadow-lg sm:shadow-none truncate'>
              VIN: {vehicleData.vin}
            </div>
            <div className='text-xs text-white/50 sm:text-glass-text/50 mt-1 italic shadow-lg sm:shadow-none'>
              Click to change vehicle
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Photo Upload Section */}
      <GlassCard
        variant='default'
        className='p-4 hover:bg-glass-bg hover:shadow-lg hover:border-glass-border active:scale-100'
      >
        <GlassCardHeader className='p-0 pb-4'>
          <GlassCardTitle className='text-lg sm:text-xl flex items-center gap-2'>
            <Upload className='h-5 w-5' />
            Upload Parts Photo
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className='space-y-4 p-0'>
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

      {/* Vehicle Selection Modal */}
      <VehicleSelectionModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        vehicles={mockVehicles}
        currentVehicleId={currentVehicleId}
        onVehicleSelect={handleVehicleSelect}
      />
    </div>
  );
}
