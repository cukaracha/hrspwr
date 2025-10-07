import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../lib/utils';
import { Loader2 } from 'lucide-react';

const glassCardVariants = cva(
  'relative rounded-2xl backdrop-blur-md transition-all duration-300 ease-in-out border border-glass-border',
  {
    variants: {
      variant: {
        default:
          'bg-glass-bg shadow-lg hover:bg-glass-bg-hover hover:shadow-xl hover:border-primary active:scale-[0.98]',
        ghost:
          'bg-glass-bg/50 shadow-md hover:bg-glass-bg hover:shadow-lg hover:border-primary active:scale-[0.99]',
      },
      state: {
        normal: 'cursor-pointer',
        loading: 'cursor-wait opacity-75',
        disabled: 'cursor-not-allowed opacity-50 pointer-events-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      state: 'normal',
    },
  }
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  loading?: boolean;
  disabled?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, loading = false, disabled = false, children, ...props }, ref) => {
    const state = disabled ? 'disabled' : loading ? 'loading' : 'normal';

    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ variant, state }), className)}
        aria-disabled={disabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <div className='absolute inset-0 flex items-center justify-center bg-glass-bg/50 backdrop-blur-sm rounded-2xl z-10'>
            <Loader2 className='h-8 w-8 animate-spin text-glass-text/70' />
          </div>
        )}
        {children}
      </div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

const GlassCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
GlassCardHeader.displayName = 'GlassCardHeader';

const GlassCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight text-glass-text', className)}
    {...props}
  />
));
GlassCardTitle.displayName = 'GlassCardTitle';

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-glass-text/70', className)} {...props} />
));
GlassCardDescription.displayName = 'GlassCardDescription';

const GlassCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0 text-glass-text/90', className)} {...props} />
  )
);
GlassCardContent.displayName = 'GlassCardContent';

const GlassCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
GlassCardFooter.displayName = 'GlassCardFooter';

export {
  GlassCard,
  GlassCardHeader,
  GlassCardFooter,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
};
