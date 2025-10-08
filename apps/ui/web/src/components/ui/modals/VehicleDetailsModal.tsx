import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { ModalBackdrop } from './ModalBackdrop';
import { CloseButton } from '../buttons/closebutton/CloseButton';
import { GlassCard, GlassCardContent } from '../cards/glasscard/GlassCard';
import { GlassButton } from '../buttons/glassbutton/GlassButton';
import { GlassBadge } from '../badges/glassbadge/GlassBadge';
import { Vehicle } from '../cards/vehiclecard/VehicleCard';
import { CollapsibleSection } from '../collapsible/collapsiblesection/CollapsibleSection';
import {
  getPrimaryInfoFields,
  getSpecificationsFields,
  getEngineFields,
  getTransmissionFields,
  getSafetyFields,
  getDriverAssistanceFields,
  getConvenienceFields,
  getOtherInfoFields,
} from '../../utils/vehicleDataMapper';

export interface VehicleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

export const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({
  isOpen,
  onClose,
  vehicle,
}) => {
  const navigate = useNavigate();

  if (!vehicle) return null;

  const apiData = vehicle.apiData;

  const handleFindParts = () => {
    if (!vehicle.vin) {
      alert('VIN is required to search for parts');
      return;
    }

    if (!vehicle.partsCategories?.metadata) {
      alert('Vehicle metadata is required to search for parts');
      return;
    }

    // Navigate to parts search page with vehicle data
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

    // Close the modal
    onClose();
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <GlassCard
        variant='default'
        className='cursor-default hover:bg-white/10 hover:shadow-2xl active:scale-100 max-h-[90vh] overflow-hidden w-full max-w-4xl flex flex-col relative'
      >
        {/* Close Button - Positioned at top right of card */}
        <div className='absolute top-0 right-0 z-10'>
          <CloseButton onClick={onClose} />
        </div>

        {/* Hero Image Section */}
        <div className='relative w-full h-64 flex-shrink-0'>
          {/* Background Image */}
          <div
            className='absolute inset-0 bg-cover bg-center'
            style={{
              backgroundImage: vehicle.imageUrl
                ? `url(${vehicle.imageUrl})`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          />

          {/* Gradient Overlays */}
          <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent' />
          <div className='absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20' />

          {/* Vehicle Info Overlay */}
          <div className='absolute inset-0 flex flex-col justify-end p-6'>
            <div className='space-y-2'>
              {/* Year Badge */}
              <div className='inline-block'>
                <GlassBadge>{vehicle.year}</GlassBadge>
              </div>

              {/* Make & Model */}
              <h3 className='text-3xl font-bold text-white leading-tight'>{vehicle.make}</h3>
              <p className='text-2xl font-semibold text-white/90'>{vehicle.model}</p>

              {/* VIN */}
              {vehicle.vin && <p className='text-xs text-white/60 font-mono'>VIN: {vehicle.vin}</p>}
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className='flex-1 overflow-y-auto'>
          <GlassCardContent className='space-y-0'>
            {/* Primary Information Section */}
            <div className='py-6'>
              <h4 className='text-xl font-bold text-glass-text mb-4'>Primary Information</h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {getPrimaryInfoFields(apiData, vehicle).map(item => (
                  <InfoItem key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            </div>

            {/* Additional Details - Collapsible */}
            {apiData && (
              <CollapsibleSection title='Additional Details' defaultOpen={false}>
                <div className='space-y-6'>
                  <DetailSection title='Specifications' items={getSpecificationsFields(apiData)} />
                  <DetailSection title='Engine & Performance' items={getEngineFields(apiData)} />
                  <DetailSection title='Transmission' items={getTransmissionFields(apiData)} />
                  <DetailSection title='Safety Features' items={getSafetyFields(apiData)} />
                  <DetailSection
                    title='Driver Assistance'
                    items={getDriverAssistanceFields(apiData)}
                  />
                  <DetailSection
                    title='Convenience Features'
                    items={getConvenienceFields(apiData)}
                  />
                  <DetailSection title='Other Information' items={getOtherInfoFields(apiData)} />
                </div>
              </CollapsibleSection>
            )}

            {/* Vehicle Metadata - Collapsible */}
            {vehicle.partsCategories?.metadata && (
              <CollapsibleSection title='Vehicle Metadata' defaultOpen={false}>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <InfoItem
                    label='Country Filter ID'
                    value={vehicle.partsCategories.metadata.countryFilterId.toString()}
                  />
                  <InfoItem
                    label='Manufacturer ID'
                    value={vehicle.partsCategories.metadata.manufacturerId.toString()}
                  />
                  <InfoItem
                    label='Model ID'
                    value={vehicle.partsCategories.metadata.modelId.toString()}
                  />
                  <InfoItem
                    label='Vehicle ID'
                    value={vehicle.partsCategories.metadata.vehicleId.toString()}
                  />
                </div>
              </CollapsibleSection>
            )}

            {/* Parts Categories - Collapsible */}
            {vehicle.partsCategories?.categories && (
              <CollapsibleSection title='Parts Categories' defaultOpen={false}>
                <div className='space-y-4'>
                  <pre className='bg-black/5 rounded-lg p-4 overflow-x-auto text-xs text-glass-text/80 font-mono max-h-96 overflow-y-auto'>
                    {JSON.stringify(vehicle.partsCategories.categories, null, 2)}
                  </pre>
                </div>
              </CollapsibleSection>
            )}

            {/* Find Parts Button */}
            <div className='py-6'>
              <GlassButton
                variant='default'
                size='lg'
                className='w-full h-12'
                onClick={handleFindParts}
              >
                <Search className='mr-2 h-5 w-5' />
                Find Parts
              </GlassButton>
            </div>
          </GlassCardContent>
        </div>
      </GlassCard>
    </ModalBackdrop>
  );
};

// Helper component for displaying individual info items
function InfoItem({ label, value }: { label: string; value?: string }) {
  if (!value || value === 'Not Applicable') return null;

  return (
    <div className='space-y-1'>
      <p className='text-sm font-medium text-glass-text/60'>{label}</p>
      <p className='text-base font-semibold text-glass-text'>{value}</p>
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
      <h4 className='text-lg font-bold text-glass-text border-b border-glass-border pb-2'>
        {title}
      </h4>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {visibleItems.map(item => (
          <InfoItem key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </div>
  );
}
