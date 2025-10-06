import * as React from 'react';
import { cn } from '../../../../lib/utils';

export interface GradientBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'warm' | 'cool' | 'purple';
}

const variantStyles = {
  default: (
    <>
      <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl' />
      <div className='absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-indigo-200/30 to-blue-200/30 rounded-full blur-3xl' />
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-slate-200/20 to-gray-200/20 rounded-full blur-3xl' />
    </>
  ),
  warm: (
    <>
      <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-orange-200/30 to-red-200/30 rounded-full blur-3xl' />
      <div className='absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 rounded-full blur-3xl' />
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-amber-200/20 to-rose-200/20 rounded-full blur-3xl' />
    </>
  ),
  cool: (
    <>
      <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-3xl' />
      <div className='absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-teal-200/30 to-cyan-200/30 rounded-full blur-3xl' />
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-sky-200/20 to-indigo-200/20 rounded-full blur-3xl' />
    </>
  ),
  purple: (
    <>
      <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl' />
      <div className='absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-violet-200/30 to-purple-200/30 rounded-full blur-3xl' />
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-fuchsia-200/20 to-purple-200/20 rounded-full blur-3xl' />
    </>
  ),
};

const GradientBackground = React.forwardRef<HTMLDivElement, GradientBackgroundProps>(
  ({ variant = 'default', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('fixed inset-0 overflow-hidden pointer-events-none', className)}
        {...props}
      >
        {variantStyles[variant]}
      </div>
    );
  }
);
GradientBackground.displayName = 'GradientBackground';

export { GradientBackground };
