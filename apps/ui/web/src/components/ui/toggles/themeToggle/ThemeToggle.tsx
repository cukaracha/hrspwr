import * as React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { GlassButton } from '../../buttons/glassbutton/GlassButton';

export interface ThemeToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

const ThemeToggle = React.forwardRef<HTMLButtonElement, ThemeToggleProps>(
  ({ className, ...props }, ref) => {
    const { setTheme, actualTheme } = useTheme();

    const toggleTheme = () => {
      // Toggle between light and dark only
      if (actualTheme === 'dark') {
        setTheme('light');
      } else {
        setTheme('dark');
      }
    };

    return (
      <GlassButton ref={ref} variant='ghost' className={className} onClick={toggleTheme} {...props}>
        {actualTheme === 'dark' ? (
          <>
            <Sun className='h-5 w-5 mr-3' />
            Switch to Light Mode
          </>
        ) : (
          <>
            <Moon className='h-5 w-5 mr-3' />
            Switch to Dark Mode
          </>
        )}
      </GlassButton>
    );
  }
);
ThemeToggle.displayName = 'ThemeToggle';

export { ThemeToggle };
