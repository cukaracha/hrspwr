import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export type ToastItem = { id: number; type: 'success' | 'error'; message: string };

type ToastProps = {
  toast: ToastItem;
  onRemove: () => void;
};

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => (
  <div
    className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 transform translate-x-0 ${
      toast.type === 'success'
        ? 'bg-green-50 border-green-400 text-green-800'
        : 'bg-red-50 border-red-400 text-red-800'
    }`}
  >
    <div className='flex items-center gap-2'>
      {toast.type === 'success' ? (
        <CheckCircle className='h-5 w-5' />
      ) : (
        <XCircle className='h-5 w-5' />
      )}
      <span>{toast.message}</span>
      <button onClick={onRemove} className='ml-2 text-gray-500 hover:text-gray-700'>
        ×
      </button>
    </div>
  </div>
);

export default Toast;
