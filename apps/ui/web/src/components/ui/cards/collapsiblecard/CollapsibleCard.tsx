import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from '../glasscard/GlassCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../collapsible/Collapsible';

export interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  children,
  defaultOpen = false,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <GlassCard
        variant='default'
        className={cn(
          'cursor-default hover:bg-white/10 hover:shadow-2xl active:scale-100',
          className
        )}
      >
        <GlassCardHeader>
          <CollapsibleTrigger asChild>
            <button className='flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity'>
              <GlassCardTitle className='text-xl'>{title}</GlassCardTitle>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-glass-text/60 transition-transform duration-200',
                  isOpen && 'transform rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>
        </GlassCardHeader>
        <CollapsibleContent>
          <GlassCardContent>{children}</GlassCardContent>
        </CollapsibleContent>
      </GlassCard>
    </Collapsible>
  );
};
