import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../lib/utils';

const glassInputVariants = cva(
  'flex h-10 w-full rounded-xl backdrop-blur-md transition-all duration-300 ease-in-out border text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-glass-text/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glass-border focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50 text-glass-text',
  {
    variants: {
      variant: {
        default:
          'bg-glass-bg/50 border-glass-border shadow-md hover:bg-glass-bg hover:border-brand-primary/50 focus-visible:bg-glass-bg focus-visible:border-brand-primary',
        ghost:
          'bg-glass-bg/30 border-glass-border/50 shadow-sm hover:bg-glass-bg/50 hover:border-glass-border focus-visible:bg-glass-bg/50 focus-visible:border-glass-border',
      },
      inputSize: {
        default: 'h-10 px-3 py-2',
        sm: 'h-9 px-3 py-1.5 text-xs rounded-lg',
        lg: 'h-12 px-4 py-3 text-base rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export interface GlassInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof glassInputVariants> {}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, variant, inputSize, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(glassInputVariants({ variant, inputSize }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
GlassInput.displayName = 'GlassInput';

export { GlassInput, glassInputVariants };
