import { useState } from 'react';
import { Menu, Upload, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from '../components/ui/cards/glasscard/GlassCard';
import { GlassButton } from '../components/ui/buttons/glassbutton/GlassButton';
import Sidebar from '../components/Sidebar';
import { vinLookup, fileToBase64, VinLookupResponse } from '../services/agentsApi';

export default function VinDecoder() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<VinLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdditionalDetailsOpen, setIsAdditionalDetailsOpen] = useState(false);
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
            <GlassCard
              variant='default'
              className='cursor-default hover:bg-white/10 hover:shadow-lg hover:border-white/20 active:scale-100 pointer-events-none'
            >
              <GlassCardContent className='p-8 pointer-events-auto'>
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
                            <p className='text-lg font-semibold text-gray-700'>
                              Click to upload VIN plate image
                            </p>
                            <p className='text-sm text-gray-500 mt-1'>
                              PNG, JPG, or JPEG (max 5MB)
                            </p>
                          </div>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Decode Button */}
                  <GlassButton
                    onClick={handleDecodeVin}
                    disabled={!selectedFile || isLoading}
                    loading={isLoading}
                    variant='default'
                    size='lg'
                    className='w-full h-14 text-lg'
                  >
                    {!isLoading && <Upload className='mr-2 h-5 w-5' />}
                    {isLoading ? 'Decoding VIN...' : 'Decode VIN'}
                  </GlassButton>

                  {/* Error Display */}
                  {error && (
                    <div className='bg-red-50 border-2 border-red-200 rounded-xl p-4'>
                      <p className='text-red-800 font-medium'>Error: {error}</p>
                    </div>
                  )}

                  {/* Vehicle Information Display */}
                  {apiResponse && (
                    <div className='space-y-4'>
                      {/* Primary Information Card */}
                      <GlassCard
                        variant='default'
                        className='cursor-default hover:bg-white/10 hover:shadow-lg hover:border-white/20 active:scale-100'
                      >
                        <GlassCardHeader>
                          <GlassCardTitle className='text-2xl'>Vehicle Information</GlassCardTitle>
                        </GlassCardHeader>
                        <GlassCardContent className='space-y-4'>
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <InfoItem label='VIN' value={apiResponse.vin} />
                            <InfoItem label='Year' value={apiResponse.model_year} />
                            <InfoItem label='Make' value={apiResponse.make} />
                            <InfoItem label='Model' value={apiResponse.model} />
                            <InfoItem label='Trim' value={apiResponse.trim} />
                            <InfoItem label='Series' value={apiResponse.series} />
                            <InfoItem label='Body Class' value={apiResponse.body_class} />
                            <InfoItem label='Vehicle Type' value={apiResponse.vehicle_type} />
                            <InfoItem label='Manufacturer' value={apiResponse.manufacturer_name} />
                            <InfoItem
                              label='Plant Location'
                              value={
                                apiResponse.plant_city && apiResponse.plant_country
                                  ? `${apiResponse.plant_city}, ${apiResponse.plant_country}`
                                  : apiResponse.plant_city || apiResponse.plant_country
                              }
                            />
                            <InfoItem label='Drive Type' value={apiResponse.drive_type} />
                            <InfoItem
                              label='Engine'
                              value={
                                apiResponse.engine_number_of_cylinders
                                  ? `${apiResponse.engine_number_of_cylinders} Cylinders`
                                  : undefined
                              }
                            />
                          </div>
                        </GlassCardContent>
                      </GlassCard>

                      {/* Additional Details - Collapsible */}
                      <Collapsible
                        open={isAdditionalDetailsOpen}
                        onOpenChange={setIsAdditionalDetailsOpen}
                      >
                        <GlassCard
                          variant='ghost'
                          className='cursor-default hover:bg-white/5 hover:shadow-md hover:border-white/20 active:scale-100'
                        >
                          <GlassCardHeader>
                            <CollapsibleTrigger asChild>
                              <button className='flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity'>
                                <GlassCardTitle className='text-xl'>
                                  Additional Details
                                </GlassCardTitle>
                                <ChevronDown
                                  className={`h-5 w-5 opacity-70 transition-transform duration-200 ${
                                    isAdditionalDetailsOpen ? 'transform rotate-180' : ''
                                  }`}
                                />
                              </button>
                            </CollapsibleTrigger>
                          </GlassCardHeader>
                          <CollapsibleContent>
                            <GlassCardContent className='space-y-6'>
                              {/* Specifications */}
                              <DetailSection
                                title='Specifications'
                                items={[
                                  { label: 'Doors', value: apiResponse.doors },
                                  { label: 'Seats', value: apiResponse.number_of_seats },
                                  { label: 'Seat Rows', value: apiResponse.number_of_seat_rows },
                                  {
                                    label: 'Wheelbase',
                                    value: apiResponse['wheel_base_(inches)_from']
                                      ? `${apiResponse['wheel_base_(inches)_from']}"`
                                      : undefined,
                                  },
                                  {
                                    label: 'Number of Wheels',
                                    value: apiResponse.number_of_wheels,
                                  },
                                  {
                                    label: 'Front Wheel Size',
                                    value: apiResponse['wheel_size_front_(inches)']
                                      ? `${apiResponse['wheel_size_front_(inches)']}"`
                                      : undefined,
                                  },
                                  {
                                    label: 'Rear Wheel Size',
                                    value: apiResponse['wheel_size_rear_(inches)']
                                      ? `${apiResponse['wheel_size_rear_(inches)']}"`
                                      : undefined,
                                  },
                                  { label: 'Axles', value: apiResponse.axles },
                                  {
                                    label: 'Steering Location',
                                    value: apiResponse.steering_location,
                                  },
                                ]}
                              />

                              {/* Engine & Performance */}
                              <DetailSection
                                title='Engine & Performance'
                                items={[
                                  {
                                    label: 'Cylinders',
                                    value: apiResponse.engine_number_of_cylinders,
                                  },
                                  {
                                    label: 'Displacement (L)',
                                    value: apiResponse['displacement_(l)'],
                                  },
                                  {
                                    label: 'Displacement (cc)',
                                    value: apiResponse['displacement_(cc)'],
                                  },
                                  {
                                    label: 'Displacement (ci)',
                                    value: apiResponse['displacement_(ci)'],
                                  },
                                  { label: 'Fuel Type', value: apiResponse['fuel_type_-_primary'] },
                                  {
                                    label: 'Horsepower',
                                    value: apiResponse['engine_brake_(hp)_from']
                                      ? `${apiResponse['engine_brake_(hp)_from']} HP`
                                      : undefined,
                                  },
                                  {
                                    label: 'Top Speed',
                                    value: apiResponse['top_speed_(mph)']
                                      ? `${apiResponse['top_speed_(mph)']} mph`
                                      : undefined,
                                  },
                                ]}
                              />

                              {/* Transmission */}
                              <DetailSection
                                title='Transmission'
                                items={[
                                  {
                                    label: 'Transmission Style',
                                    value: apiResponse.transmission_style,
                                  },
                                  {
                                    label: 'Transmission Speeds',
                                    value: apiResponse.transmission_speeds
                                      ? `${apiResponse.transmission_speeds}-Speed`
                                      : undefined,
                                  },
                                ]}
                              />

                              {/* Safety Features */}
                              <DetailSection
                                title='Safety Features'
                                items={[
                                  {
                                    label: 'ABS',
                                    value: apiResponse['anti-lock_braking_system_(abs)'],
                                  },
                                  {
                                    label: 'ESC',
                                    value: apiResponse['electronic_stability_control_(esc)'],
                                  },
                                  {
                                    label: 'Traction Control',
                                    value: apiResponse.traction_control,
                                  },
                                  {
                                    label: 'TPMS Type',
                                    value:
                                      apiResponse['tire_pressure_monitoring_system_(tpms)_type'],
                                  },
                                  { label: 'Seat Belt Type', value: apiResponse.seat_belt_type },
                                  { label: 'Pretensioner', value: apiResponse.pretensioner },
                                  {
                                    label: 'Front Airbags',
                                    value: apiResponse.front_air_bag_locations,
                                  },
                                  {
                                    label: 'Side Airbags',
                                    value: apiResponse.side_air_bag_locations,
                                  },
                                  {
                                    label: 'Curtain Airbags',
                                    value: apiResponse.curtain_air_bag_locations,
                                  },
                                  {
                                    label: 'Knee Airbags',
                                    value: apiResponse.knee_air_bag_locations,
                                  },
                                ]}
                              />

                              {/* Driver Assistance */}
                              <DetailSection
                                title='Driver Assistance'
                                items={[
                                  {
                                    label: 'Adaptive Cruise Control',
                                    value: apiResponse['adaptive_cruise_control_(acc)'],
                                  },
                                  {
                                    label: 'Forward Collision Warning',
                                    value: apiResponse['forward_collision_warning_(fcw)'],
                                  },
                                  {
                                    label: 'Crash Imminent Braking',
                                    value: apiResponse['crash_imminent_braking_(cib)'],
                                  },
                                  {
                                    label: 'Dynamic Brake Support',
                                    value: apiResponse['dynamic_brake_support_(dbs)'],
                                  },
                                  {
                                    label: 'Blind Spot Warning',
                                    value: apiResponse['blind_spot_warning_(bsw)'],
                                  },
                                  {
                                    label: 'Lane Departure Warning',
                                    value: apiResponse['lane_departure_warning_(ldw)'],
                                  },
                                  {
                                    label: 'Lane Keeping Assistance',
                                    value: apiResponse['lane_keeping_assistance_(lka)'],
                                  },
                                  { label: 'Backup Camera', value: apiResponse.backup_camera },
                                  { label: 'Parking Assist', value: apiResponse.parking_assist },
                                ]}
                              />

                              {/* Convenience Features */}
                              <DetailSection
                                title='Convenience Features'
                                items={[
                                  {
                                    label: 'Keyless Ignition',
                                    value: apiResponse.keyless_ignition,
                                  },
                                  {
                                    label: 'Auto-Reverse Windows/Sunroof',
                                    value:
                                      apiResponse['auto-reverse_system_for_windows_and_sunroofs'],
                                  },
                                  {
                                    label: 'Daytime Running Lights',
                                    value: apiResponse['daytime_running_light_(drl)'],
                                  },
                                  {
                                    label: 'Automatic High Beams',
                                    value: apiResponse.semiautomatic_headlamp_beam_switching,
                                  },
                                  {
                                    label: 'Adaptive Driving Beam',
                                    value: apiResponse['adaptive_driving_beam_(adb)'],
                                  },
                                  {
                                    label: 'Automatic Crash Notification',
                                    value:
                                      apiResponse[
                                        'automatic_crash_notification_(acn)_/_advanced_automatic_crash_notification_(aacn)'
                                      ],
                                  },
                                ]}
                              />

                              {/* Pricing & Other */}
                              <DetailSection
                                title='Other Information'
                                items={[
                                  {
                                    label: 'Base Price',
                                    value: apiResponse['base_price_($)']
                                      ? `$${parseFloat(apiResponse['base_price_($)']).toLocaleString()}`
                                      : undefined,
                                  },
                                  {
                                    label: 'Vehicle Descriptor',
                                    value: apiResponse.vehicle_descriptor,
                                  },
                                  { label: 'Error/Status', value: apiResponse.error_text },
                                ]}
                              />
                            </GlassCardContent>
                          </CollapsibleContent>
                        </GlassCard>
                      </Collapsible>
                    </div>
                  )}
                </div>
              </GlassCardContent>
            </GlassCard>
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

// Helper component for displaying individual info items
function InfoItem({ label, value }: { label: string; value?: string }) {
  if (!value || value === 'Not Applicable') return null;

  return (
    <div className='space-y-1'>
      <p className='text-sm font-medium opacity-70'>{label}</p>
      <p className='text-base font-semibold'>{value}</p>
    </div>
  );
}

// Helper component for detail sections
function DetailSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value?: string }>;
}) {
  const visibleItems = items.filter(item => item.value && item.value !== 'Not Applicable');

  if (visibleItems.length === 0) return null;

  return (
    <div className='space-y-3'>
      <h4 className='text-lg font-bold border-b border-white/20 pb-2'>{title}</h4>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {visibleItems.map(item => (
          <InfoItem key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </div>
  );
}
