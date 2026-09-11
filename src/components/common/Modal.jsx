import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const mainContainer = document.querySelector('.app-main-content');
      if (mainContainer) {
        mainContainer.style.overflow = 'hidden';
      }
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'auto';
      const mainContainer = document.querySelector('.app-main-content');
      if (mainContainer) {
        mainContainer.style.overflow = 'auto';
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 md:p-8 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-4rem)] md:max-h-[85vh] flex flex-col transition-all animate-scale-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/95 backdrop-blur-xs flex-shrink-0 z-20">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content with Smooth Scrolling */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 overflow-y-auto overflow-x-hidden flex-1 min-h-0 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
