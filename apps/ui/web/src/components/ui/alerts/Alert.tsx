import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const alertVariants = cva('rounded-xl p-4 border-2 transition-all duration-300', {
  variants: {
    variant: {
      error: 'bg-red-50 border-red-200 text-red-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

const iconMap = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  message: string;
  showIcon?: boolean;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, message, showIcon = true, ...props }, ref) => {
    const Icon = iconMap[variant || 'info'];

    return (
      <div ref={ref} className={cn(alertVariants({ variant }), className)} {...props}>
        <div className='flex items-start gap-3'>
          {showIcon && <Icon className='h-5 w-5 flex-shrink-0 mt-0.5' />}
          <div className='flex-1'>
            {title && <p className='font-semibold mb-1'>{title}</p>}
            <p className='font-medium'>{message}</p>
          </div>
        </div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export { Alert, alertVariants };
