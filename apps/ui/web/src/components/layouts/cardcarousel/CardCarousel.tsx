import * as React from 'react';
import { cn } from '../../../lib/utils';

export interface CardCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardCarousel = React.forwardRef<HTMLDivElement, CardCarouselProps>(
  ({ children, className, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isDesktop, setIsDesktop] = React.useState(false);

    React.useEffect(() => {
      // Detect if device supports hover (desktop)
      const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
      setIsDesktop(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setIsDesktop(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const handleCardHover = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDesktop || !containerRef.current) return;

        const card = e.currentTarget;
        const container = containerRef.current;
        const cardRect = card.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Check if card is partially outside viewport (left or right edge)
        const isPartiallyHidden =
          cardRect.left < containerRect.left || cardRect.right > containerRect.right;

        if (isPartiallyHidden) {
          // Scroll card into view centered
          card.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
          });
        }
      },
      [isDesktop]
    );

    // Merge refs
    React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    return (
      <div
        ref={containerRef}
        className={cn(
          // Horizontal scrolling container
          'flex justify-center gap-6 overflow-x-auto overflow-y-hidden',
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
          <div className='snap-center' onMouseEnter={handleCardHover}>
            {child}
          </div>
        ))}
      </div>
    );
  }
);
CardCarousel.displayName = 'CardCarousel';

export { CardCarousel };
