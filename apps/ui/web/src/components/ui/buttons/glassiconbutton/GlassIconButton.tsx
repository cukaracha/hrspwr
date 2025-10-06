import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../lib/utils';

const glassIconButtonVariants = cva(
  'rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-300',
  {
    variants: {
      variant: {
        light: 'bg-white/10 border border-white/20 text-white',
        dark: 'bg-black/10 border border-black/20 text-black',
        ghost: 'bg-white/5 border border-white/10 text-white/80',
      },
      size: {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
      },
      position: {
        'top-right': 'absolute top-4 right-4',
        'top-left': 'absolute top-4 left-4',
        'bottom-right': 'absolute bottom-4 right-4',
        'bottom-left': 'absolute bottom-4 left-4',
        relative: 'relative',
      },
      visibility: {
        always: 'opacity-100',
        hover: 'opacity-0 group-hover:opacity-100',
      },
    },
    defaultVariants: {
      variant: 'light',
      size: 'md',
      position: 'relative',
      visibility: 'always',
    },
  }
);

const iconSizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export interface GlassIconButtonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassIconButtonVariants> {
  icon: React.ReactNode;
}

const GlassIconButton = React.forwardRef<HTMLDivElement, GlassIconButtonProps>(
  ({ className, variant, size = 'md', position, visibility, icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassIconButtonVariants({ variant, size, position, visibility }), className)}
        {...props}
      >
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement, {
              className: cn(
                iconSizeMap[size || 'md'],
                (icon as React.ReactElement).props.className
              ),
            })
          : icon}
      </div>
    );
  }
);
GlassIconButton.displayName = 'GlassIconButton';

export { GlassIconButton, glassIconButtonVariants };
