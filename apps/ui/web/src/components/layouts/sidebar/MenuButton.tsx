import * as React from 'react';
import { Menu } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { GlassButton } from '../../ui/buttons/glassbutton/GlassButton';

export interface MenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  position?: 'top-left' | 'top-right';
}

const positionStyles = {
  'top-left': 'absolute top-6 left-6 z-30',
  'top-right': 'absolute top-6 right-6 z-30',
};

const MenuButton = React.forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ position = 'top-left', className, onClick, ...props }, ref) => {
    return (
      <div className={positionStyles[position]}>
        <GlassButton
          ref={ref}
          variant='ghost'
          size='sm'
          onClick={onClick}
          className={cn(
            'hover:bg-white/20 backdrop-blur-sm border-transparent hover:border-white/20',
            className
          )}
          {...props}
        >
          <Menu className='h-5 w-5' />
        </GlassButton>
      </div>
    );
  }
);
MenuButton.displayName = 'MenuButton';

export { MenuButton };
