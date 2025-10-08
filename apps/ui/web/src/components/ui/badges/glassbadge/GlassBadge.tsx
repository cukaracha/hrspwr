import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../lib/utils';

const glassBadgeVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-xs font-semibold backdrop-blur-sm transition-all duration-300 ease-in-out',
  {
    variants: {
      variant: {
        default:
          'bg-white/20 dark:bg-white/20 border border-gray-900 dark:border-white/30 text-gray-900 dark:text-white',
        ghost:
          'bg-white/10 dark:bg-white/10 border border-gray-900 dark:border-white/20 text-gray-900 dark:text-white',
        solid:
          'bg-white/30 dark:bg-white/30 border border-gray-900 dark:border-white/40 text-gray-900 dark:text-white',
      },
      size: {
        default: 'px-3 py-1',
        sm: 'px-2 py-0.5 text-[10px]',
        lg: 'px-4 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface GlassBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof glassBadgeVariants> {}

const GlassBadge = React.forwardRef<HTMLSpanElement, GlassBadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span className={cn(glassBadgeVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  }
);
GlassBadge.displayName = 'GlassBadge';

export { GlassBadge, glassBadgeVariants };
