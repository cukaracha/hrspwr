import * as React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { GlassCard } from '../glasscard/GlassCard';

export interface CreateVehicleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  onCreateClick?: () => void;
}

const CreateVehicleCard = React.forwardRef<HTMLDivElement, CreateVehicleCardProps>(
  ({ onCreateClick, className, ...props }, ref) => {
    return (
      <GlassCard
        ref={ref}
        variant='ghost'
        className={cn(
          'flex-shrink-0 w-[calc(100vw-2rem)] max-w-[280px] h-[380px] sm:max-w-[320px] sm:h-[420px] md:max-w-[360px] md:h-[460px] overflow-hidden group',
          'border-2 border-dashed border-glass-border hover:border-glass-border/70',
          className
        )}
        onClick={onCreateClick}
        {...props}
      >
        {/* Content */}
        <div className='relative w-full h-full flex flex-col items-center justify-center p-6'>
          {/* Background Gradient */}
          <div className='absolute inset-0 glass-gradient opacity-50 group-hover:opacity-100 transition-opacity duration-300' />

          {/* Plus Icon Circle */}
          <div className='relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border-2 border-glass-border flex items-center justify-center mb-6 transform transition-all duration-300 group-hover:scale-110 group-hover:border-transparent'>
            <Plus className='w-10 h-10 sm:w-12 sm:h-12 text-glass-text/60 group-hover:text-glass-text transition-colors duration-300' />
          </div>

          {/* Text */}
          <div className='relative z-10 text-center space-y-2'>
            <h3 className='text-xl sm:text-2xl font-bold text-glass-text/90 group-hover:text-glass-text transition-colors duration-300'>
              Add New Vehicle
            </h3>
            <p className='text-sm sm:text-base text-glass-text/60 group-hover:text-glass-text/80 transition-colors duration-300'>
              Upload VIN plate photo
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }
);
CreateVehicleCard.displayName = 'CreateVehicleCard';

export { CreateVehicleCard };
