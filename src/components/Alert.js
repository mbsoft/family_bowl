'use client';

import { useEffect, useState } from 'react';

export default function Alert({ isOpen, onClose, message, type = 'info', duration = 5000 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => {
            onClose();
          }, 300); // Wait for fade out animation
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const borderColor = type === 'error' || type === 'danger'
    ? 'border-[#EF4444] dark:border-red-600'
    : type === 'warning'
    ? 'border-[#FFD700] dark:border-yellow-600'
    : type === 'success'
    ? 'border-[#10B981] dark:border-green-600'
    : 'border-[#0D4F3C] dark:border-green-600';

  const bgColor = type === 'error' || type === 'danger'
    ? 'bg-[#EF4444]/20 dark:bg-red-600/20'
    : type === 'warning'
    ? 'bg-[#FFD700]/20 dark:bg-yellow-600/20'
    : type === 'success'
    ? 'bg-[#10B981]/20 dark:bg-[#10B981]/20'
    : 'bg-[#0D4F3C]/20 dark:bg-green-700/20';

  const textColor = type === 'error' || type === 'danger'
    ? 'text-[#EF4444] dark:text-red-400'
    : type === 'warning'
    ? 'text-gray-900 dark:text-white'
    : type === 'success'
    ? 'text-[#10B981] dark:text-[#10B981]'
    : 'text-gray-900 dark:text-white';

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full">
      <div 
        className={`${bgColor} border-4 ${borderColor} rounded-2xl p-4 shadow-2xl transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <p className={`font-bold flex-1 ${textColor}`}>
            {message}
          </p>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(), 300);
            }}
            className={`flex-shrink-0 ${textColor} hover:opacity-70 transition-opacity font-black text-xl leading-none`}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

