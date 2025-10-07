import * as React from 'react';
import { cn } from '../../../../lib/utils';

export interface GlassBackdropProps {
  isOpen: boolean;
  onClick?: () => void;
  className?: string;
  zIndex?: number;
}

export const GlassBackdrop: React.FC<GlassBackdropProps> = ({
  isOpen,
  onClick,
  className,
  zIndex = 50,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 bg-glass-bg backdrop-blur-md animate-in fade-in duration-200',
        `z-${zIndex}`,
        className
      )}
      onClick={onClick}
    />
  );
};
