import * as React from 'react';
import { cn } from '../../../lib/utils';
import { GlassBackdrop } from '../../layouts/backdrops/glassBackdrop/GlassBackdrop';

export interface ModalBackdropProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export const ModalBackdrop: React.FC<ModalBackdropProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-2xl',
  className,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <GlassBackdrop isOpen={isOpen} onClick={onClose} zIndex={50} />

      {/* Modal Container */}
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none'>
        <div
          className={cn(
            'w-full pointer-events-auto animate-in zoom-in-95 duration-200',
            maxWidth,
            className
          )}
          onClick={e => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );
};
