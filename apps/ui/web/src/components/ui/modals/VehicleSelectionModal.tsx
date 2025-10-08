import * as React from 'react';
import { Check } from 'lucide-react';
import { ModalBackdrop } from './ModalBackdrop';
import { CloseButton } from '../buttons/closebutton/CloseButton';
import { CardCarousel } from '../../layouts/cardcarousel/CardCarousel';
import { VehicleCard, Vehicle } from '../cards/vehiclecard/VehicleCard';

export interface VehicleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  currentVehicleId?: string;
  onVehicleSelect: (vehicle: Vehicle) => void;
}

export const VehicleSelectionModal: React.FC<VehicleSelectionModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  currentVehicleId,
  onVehicleSelect,
}) => {
  const handleVehicleClick = (vehicle: Vehicle) => {
    onVehicleSelect(vehicle);
    onClose();
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose} maxWidth='max-w-6xl'>
      <div className='relative'>
        {/* Header */}
        <div className='relative mb-6 min-h-[2.5rem] flex items-start justify-between'>
          <div className='flex-1' />
          <h2 className='text-2xl font-bold text-glass-text flex-shrink mx-4'>Select Vehicle</h2>
          <div className='flex-1 flex justify-end'>
            <CloseButton onClick={onClose} position='relative' />
          </div>
        </div>

        {/* Content */}
        {vehicles.length > 0 ? (
          <CardCarousel>
            {vehicles.map(vehicle => (
              <div key={vehicle.id} className='relative'>
                <VehicleCard vehicle={vehicle} onCardClick={handleVehicleClick} />
                {currentVehicleId === vehicle.id && (
                  <div className='absolute top-4 left-4 bg-primary text-white rounded-full p-2 shadow-lg pointer-events-none z-10'>
                    <Check className='h-5 w-5' />
                  </div>
                )}
              </div>
            ))}
          </CardCarousel>
        ) : (
          <div className='py-12 text-center'>
            <p className='text-glass-text/60'>No vehicles available</p>
          </div>
        )}
      </div>
    </ModalBackdrop>
  );
};
