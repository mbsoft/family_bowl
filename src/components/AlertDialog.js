'use client';

import { useEffect } from 'react';

export default function AlertDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const borderColor = type === 'danger' 
    ? 'border-[#EF4444] dark:border-red-600'
    : type === 'warning'
    ? 'border-[#FFD700] dark:border-yellow-600'
    : 'border-[#0D4F3C] dark:border-green-600';

  const bgColor = type === 'danger'
    ? 'bg-[#EF4444]/20 dark:bg-red-600/20'
    : type === 'warning'
    ? 'bg-[#FFD700]/20 dark:bg-yellow-600/20'
    : 'bg-[#0D4F3C]/20 dark:bg-green-700/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Dialog */}
      <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-4 ${borderColor} max-w-md w-full p-6 z-10`}>
        {/* Title */}
        {title && (
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">
            {title}
          </h3>
        )}
        
        {/* Message */}
        <p className="text-gray-700 dark:text-gray-300 font-semibold mb-6">
          {message}
        </p>
        
        {/* Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={handleCancel}
            className="px-5 py-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-xl font-black uppercase tracking-wider border-4 border-gray-400 dark:border-gray-600 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-5 py-3 rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105 transition-all ${
              type === 'danger'
                ? 'bg-gradient-to-r from-[#EF4444] to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                : type === 'warning'
                ? 'bg-gradient-to-r from-[#FFD700] to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 dark:text-white'
                : 'bg-gradient-to-r from-[#0D4F3C] to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-600 dark:to-green-700 text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

