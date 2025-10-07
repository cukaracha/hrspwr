import * as React from 'react';
import { Menu } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { GlassButton } from '../../../ui/buttons/glassbutton/GlassButton';

export interface GlassBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  onMenuClick?: () => void;
}

const GlassBanner = React.forwardRef<HTMLDivElement, GlassBannerProps>(
  ({ title, onMenuClick, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'fixed top-0 left-0 right-0 z-40',
          'h-16 sm:h-20',
          'bg-glass-bg backdrop-blur-md',
          'border-b border-glass-border',
          'shadow-sm',
          className
        )}
        {...props}
      >
        <div className='flex items-center justify-between h-full px-4 sm:px-6'>
          {/* Menu Button */}
          <GlassButton
            variant='ghost'
            size='sm'
            onClick={onMenuClick}
            className='!bg-transparent shadow-none border-transparent hover:!bg-glass-bg-hover hover:shadow-md hover:border-glass-border [background-image:none] hover:[background-image:none]'
          >
            <Menu className='h-5 w-5' />
          </GlassButton>

          {/* Page Title - Centered */}
          {title && (
            <h1 className='absolute left-1/2 -translate-x-1/2 text-lg sm:text-xl md:text-2xl font-semibold text-glass-text'>
              {title}
            </h1>
          )}

          {/* Right side spacer for symmetry */}
          <div className='w-[40px] sm:w-[44px]' />
        </div>
      </div>
    );
  }
);
GlassBanner.displayName = 'GlassBanner';

export { GlassBanner };
