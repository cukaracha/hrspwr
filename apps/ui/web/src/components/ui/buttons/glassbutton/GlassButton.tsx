import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../lib/utils';
import { Loader2 } from 'lucide-react';

const glassButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glass-border focus-visible:ring-offset-2 focus-visible:ring-offset-transparent backdrop-blur-md border border-glass-border text-glass-text relative overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'glass-gradient shadow-lg hover:glass-gradient-hover hover:shadow-xl hover:border-brand-primary active:scale-[0.98]',
        ghost:
          'glass-gradient-ghost shadow-md hover:glass-gradient-ghost-hover hover:shadow-lg hover:border-brand-primary active:scale-[0.99]',
      },
      state: {
        normal: 'cursor-pointer',
        loading: 'cursor-wait opacity-75',
        disabled: 'cursor-not-allowed opacity-50 pointer-events-none',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-11 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      state: 'normal',
      size: 'default',
    },
  }
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const state = disabled ? 'disabled' : loading ? 'loading' : 'normal';

    return (
      <Comp
        className={cn(glassButtonVariants({ variant, state, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
GlassButton.displayName = 'GlassButton';

export { GlassButton, glassButtonVariants };
