import * as React from 'react';
import { cn } from '../../../../lib/utils';

export interface CardCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardCarousel = React.forwardRef<HTMLDivElement, CardCarouselProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Horizontal scrolling container
          'flex gap-6 overflow-x-auto overflow-y-hidden',
          // Padding for cards to peek on edges
          'px-4 sm:px-8 md:px-12 lg:px-16',
          'py-8',
          // Snap scrolling for smooth card navigation
          'snap-x snap-mandatory',
          // Hide scrollbar on most browsers
          'scrollbar-hide',
          // Smooth scrolling
          'scroll-smooth',
          className
        )}
        style={{
          // For WebKit browsers (Safari, Chrome)
          WebkitOverflowScrolling: 'touch',
        }}
        {...props}
      >
        {React.Children.map(children, child => (
          <div className='snap-center'>{child}</div>
        ))}
      </div>
    );
  }
);
CardCarousel.displayName = 'CardCarousel';

export { CardCarousel };
