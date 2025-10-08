import * as React from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { GlassButton } from '../../buttons/glassbutton/GlassButton';

export interface GlassDropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in MB
  value?: File | null;
  disabled?: boolean;
}

export const GlassDropzone = React.forwardRef<HTMLDivElement, GlassDropzoneProps>(
  (
    { onFileSelect, accept = 'image/*', maxSize = 5, value, disabled, className, ...props },
    ref
  ) => {
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [dragActive, setDragActive] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Generate preview URL when value changes
    React.useEffect(() => {
      if (value) {
        const url = URL.createObjectURL(value);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } else {
        setPreviewUrl(null);
      }
    }, [value]);

    const validateFile = (file: File): string | null => {
      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSize) {
        return `File size must be less than ${maxSize}MB`;
      }

      // Check file type if accept is specified
      if (accept) {
        const acceptTypes = accept.split(',').map(t => t.trim());
        const fileType = file.type;
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;

        const isValidType = acceptTypes.some(type => {
          if (type === 'image/*' && fileType.startsWith('image/')) return true;
          if (type === fileType) return true;
          if (type === fileExtension) return true;
          return false;
        });

        if (!isValidType) {
          return `File type must be one of: ${accept}`;
        }
      }

      return null;
    };

    const handleFileSelect = (file: File | null) => {
      setError(null);

      if (!file) {
        onFileSelect(null);
        return;
      }

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      onFileSelect(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      handleFileSelect(file);
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;

      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const file = e.dataTransfer.files?.[0] || null;
      handleFileSelect(file);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setError(null);
      onFileSelect(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const handleClick = () => {
      if (!disabled) {
        inputRef.current?.click();
      }
    };

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        <div
          className={cn(
            'relative flex flex-col items-center justify-center',
            'border-2 border-dashed rounded-2xl p-8',
            'transition-all duration-300',
            'bg-white/5 backdrop-blur-sm',
            dragActive && !disabled && 'border-primary bg-primary/10 scale-[1.02]',
            !dragActive && !disabled && 'border-primary hover:border-primary/80 hover:bg-white/10',
            disabled && 'border-glass-border/50 opacity-50 cursor-not-allowed',
            !disabled && 'cursor-pointer'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={inputRef}
            type='file'
            accept={accept}
            onChange={handleChange}
            disabled={disabled}
            className='hidden'
          />

          {previewUrl ? (
            <div className='relative w-full'>
              <img
                src={previewUrl}
                alt='Preview'
                className='max-w-full max-h-64 mx-auto rounded-lg shadow-lg'
              />
              {!disabled && (
                <div className='absolute top-2 right-2'>
                  <GlassButton
                    type='button'
                    size='sm'
                    variant='ghost'
                    onClick={handleClear}
                    className='h-8 w-8 p-0'
                  >
                    <X className='h-4 w-4' />
                  </GlassButton>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className='w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4'>
                <ImageIcon className='h-10 w-10 text-primary' />
              </div>
              <div className='text-center'>
                <p className='text-lg font-semibold text-glass-text'>
                  {dragActive ? 'Drop image here' : 'Click to upload or drag and drop'}
                </p>
                <p className='text-sm text-glass-text/60 mt-1'>
                  {accept.includes('image') ? 'PNG, JPG, or JPEG' : 'Select a file'} (max {maxSize}
                  MB)
                </p>
              </div>
            </>
          )}
        </div>

        {error && <p className='text-sm text-red-500 font-medium px-2'>{error}</p>}
      </div>
    );
  }
);

GlassDropzone.displayName = 'GlassDropzone';
