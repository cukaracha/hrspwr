import * as React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';

export interface GlassMenuItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface GlassMenuProps {
  items: GlassMenuItem[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const GlassMenu = React.forwardRef<HTMLDivElement, GlassMenuProps>(
  (
    { items, value, onChange, placeholder = 'Select an option', disabled, loading, className },
    _ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    const selectedItem = items.find(item => item.value === value);

    const handleSelect = (itemValue: string) => {
      const item = items.find(i => i.value === itemValue);
      if (item && !item.disabled) {
        onChange?.(itemValue);
        setIsOpen(false);
      }
    };

    const handleToggle = () => {
      if (!disabled && !loading) {
        setIsOpen(!isOpen);
      }
    };

    return (
      <div ref={containerRef} className={cn('relative w-full', className)}>
        {/* Trigger Button */}
        <button
          type='button'
          onClick={handleToggle}
          disabled={disabled || loading}
          className={cn(
            'w-full flex items-center justify-between',
            'px-4 py-3 rounded-xl',
            'bg-white/10 backdrop-blur-md',
            'border border-glass-border',
            'text-glass-text font-medium',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            !disabled && !loading && 'hover:bg-white/15 hover:border-primary/50 cursor-pointer',
            (disabled || loading) && 'opacity-50 cursor-not-allowed',
            isOpen && 'bg-white/15 border-primary/50'
          )}
        >
          <span className={cn('truncate', !selectedItem && 'text-glass-text/50')}>
            {selectedItem ? selectedItem.label : placeholder}
          </span>

          {loading ? (
            <Loader2 className='h-5 w-5 text-glass-text/60 animate-spin flex-shrink-0' />
          ) : (
            <ChevronDown
              className={cn(
                'h-5 w-5 text-glass-text/60 transition-transform duration-200 flex-shrink-0',
                isOpen && 'transform rotate-180'
              )}
            />
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && !loading && (
          <div
            className={cn(
              'absolute z-50 w-full mt-2',
              'bg-white/10 backdrop-blur-md',
              'border border-glass-border rounded-xl',
              'shadow-2xl',
              'max-h-64 overflow-y-auto',
              'animate-in fade-in-0 zoom-in-95 duration-200'
            )}
          >
            <div className='py-2'>
              {items.length === 0 ? (
                <div className='px-4 py-3 text-sm text-glass-text/50 text-center'>
                  No options available
                </div>
              ) : (
                items.map(item => (
                  <button
                    key={item.value}
                    type='button'
                    onClick={() => handleSelect(item.value)}
                    disabled={item.disabled}
                    className={cn(
                      'w-full text-left px-4 py-3',
                      'text-glass-text font-medium',
                      'transition-all duration-150',
                      'focus:outline-none',
                      !item.disabled && 'hover:bg-white/10 cursor-pointer',
                      item.disabled && 'opacity-50 cursor-not-allowed',
                      item.value === value && 'bg-primary/20 text-primary'
                    )}
                  >
                    {item.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

GlassMenu.displayName = 'GlassMenu';
