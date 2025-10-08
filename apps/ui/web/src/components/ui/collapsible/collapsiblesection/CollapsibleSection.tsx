import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../Collapsible';

export interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = false,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn('border-t border-glass-border', className)}>
        <CollapsibleTrigger asChild>
          <button className='flex items-center justify-between w-full text-left py-8 hover:opacity-80 transition-opacity'>
            <h4 className='text-xl font-bold text-glass-text'>{title}</h4>
            <ChevronDown
              className={cn(
                'h-5 w-5 text-glass-text/60 transition-transform duration-200',
                isOpen && 'transform rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className='pb-8'>{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
