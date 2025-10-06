import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { GlassCard } from '../glasscard/GlassCard';
import { GlassBadge } from '../../badges/glassbadge/GlassBadge';
import { GlassIconButton } from '../../buttons/glassiconbutton/GlassIconButton';

export interface Vehicle {
  id: string;
  year: string;
  make: string;
  model: string;
  trim?: string;
  imageUrl?: string;
  vin?: string;
}

export interface VehicleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  vehicle: Vehicle;
  onCardClick?: (vehicle: Vehicle) => void;
}

const VehicleCard = React.forwardRef<HTMLDivElement, VehicleCardProps>(
  ({ vehicle, onCardClick, className, ...props }, ref) => {
    const handleClick = () => {
      onCardClick?.(vehicle);
    };

    return (
      <GlassCard
        ref={ref}
        variant='default'
        className={cn(
          'flex-shrink-0 w-[calc(100vw-2rem)] max-w-[280px] h-[380px] sm:max-w-[320px] sm:h-[420px] md:max-w-[360px] md:h-[460px] overflow-hidden group',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {/* Cover Art Image with Gradient Overlay */}
        <div className='relative w-full h-full'>
          {/* Background Image */}
          <div
            className='absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110'
            style={{
              backgroundImage: vehicle.imageUrl
                ? `url(${vehicle.imageUrl})`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          />

          {/* Gradient Overlays */}
          <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent' />
          <div className='absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20' />

          {/* Content */}
          <div className='absolute inset-0 flex flex-col justify-end p-6'>
            {/* Vehicle Info */}
            <div className='space-y-2 transform transition-transform duration-300 group-hover:translate-y-[-8px]'>
              {/* Year Badge */}
              <div className='inline-block'>
                <GlassBadge>{vehicle.year}</GlassBadge>
              </div>

              {/* Make & Model */}
              <h3 className='text-2xl sm:text-3xl font-bold text-white leading-tight'>
                {vehicle.make}
              </h3>
              <p className='text-xl sm:text-2xl font-semibold text-white/90'>{vehicle.model}</p>

              {/* Trim (if available) */}
              {vehicle.trim && (
                <p className='text-sm sm:text-base text-white/70 font-medium'>{vehicle.trim}</p>
              )}

              {/* VIN (if available) - Hidden on mobile, shown on hover on desktop */}
              {vehicle.vin && (
                <p className='hidden sm:block text-xs text-white/60 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                  VIN: {vehicle.vin}
                </p>
              )}
            </div>

            {/* Decorative Elements */}
            <GlassIconButton
              icon={<ChevronRight />}
              variant='light'
              size='md'
              position='top-right'
              visibility='hover'
            />
          </div>
        </div>
      </GlassCard>
    );
  }
);
VehicleCard.displayName = 'VehicleCard';

export { VehicleCard };
