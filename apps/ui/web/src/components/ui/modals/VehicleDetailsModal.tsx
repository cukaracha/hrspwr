import * as React from 'react';
import { ModalBackdrop } from './ModalBackdrop';
import { CloseButton } from '../buttons/closebutton/CloseButton';
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from '../cards/glasscard/GlassCard';
import { CollapsibleCard } from '../cards/collapsiblecard/CollapsibleCard';
import { Vehicle } from '../cards/vehiclecard/VehicleCard';
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
  if (!vehicle) return null;

  const apiData = vehicle.apiData;

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <GlassCard
        variant='default'
        className='cursor-default hover:bg-white/10 hover:shadow-2xl active:scale-100 max-h-[90vh] overflow-y-auto w-full max-w-4xl'
      >
        {/* Header */}
        <GlassCardHeader className='relative'>
          <GlassCardTitle className='text-3xl'>Vehicle Information</GlassCardTitle>
          <CloseButton onClick={onClose} />
        </GlassCardHeader>

        {/* Content */}
        <GlassCardContent className='space-y-4'>
          {/* Primary Information Card */}
          <GlassCard
            variant='default'
            className='cursor-default hover:bg-white/10 hover:shadow-2xl active:scale-100'
          >
            <GlassCardHeader>
              <GlassCardTitle className='text-2xl'>Primary Information</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {getPrimaryInfoFields(apiData, vehicle).map(item => (
                  <InfoItem key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Additional Details - Collapsible */}
          {apiData && (
            <CollapsibleCard title='Additional Details' defaultOpen={false}>
              <div className='space-y-6'>
                <DetailSection title='Specifications' items={getSpecificationsFields(apiData)} />
                <DetailSection title='Engine & Performance' items={getEngineFields(apiData)} />
                <DetailSection title='Transmission' items={getTransmissionFields(apiData)} />
                <DetailSection title='Safety Features' items={getSafetyFields(apiData)} />
                <DetailSection
                  title='Driver Assistance'
                  items={getDriverAssistanceFields(apiData)}
                />
                <DetailSection title='Convenience Features' items={getConvenienceFields(apiData)} />
                <DetailSection title='Other Information' items={getOtherInfoFields(apiData)} />
              </div>
            </CollapsibleCard>
          )}
        </GlassCardContent>
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
