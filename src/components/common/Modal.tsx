import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  maxWidth = 'md'
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className={`bg-[#121317] rounded-[10px] border border-[#1C1D22] w-full ${maxWidthClasses[maxWidth]} p-6 space-y-4 shadow-2xl overflow-hidden`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-[#1C1D22] pb-3">
          <div className="flex items-center gap-2 text-white font-serif text-lg font-normal">
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#9194A1] hover:text-white p-1 rounded hover:bg-[#1C1D22] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-[#C7C9D1]">{children}</div>

        {footer && <div className="pt-2 border-t border-[#1C1D22] flex items-center justify-end gap-2.5">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
