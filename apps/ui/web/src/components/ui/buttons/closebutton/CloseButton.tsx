import * as React from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../lib/utils';

const closeButtonVariants = cva('p-2 rounded-full transition-colors duration-200 cursor-pointer', {
  variants: {
    variant: {
      default: 'hover:bg-white/10 text-glass-text/70 hover:text-glass-text',
      ghost: 'hover:bg-black/5 text-gray-500 hover:text-gray-700',
    },
    position: {
      'top-right': 'absolute top-6 right-6',
      'top-left': 'absolute top-6 left-6',
      relative: 'relative',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    position: 'top-right',
    size: 'md',
  },
});

const iconSizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export interface CloseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof closeButtonVariants> {}

const CloseButton = React.forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ className, variant, position, size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type='button'
        className={cn(closeButtonVariants({ variant, position, size }), className)}
        aria-label='Close'
        {...props}
      >
        <X className={iconSizeMap[size || 'md']} />
      </button>
    );
  }
);
CloseButton.displayName = 'CloseButton';

export { CloseButton, closeButtonVariants };
