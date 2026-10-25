import React from 'react';
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2">
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          error: <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />,
          info: <Info className="w-4 h-4 text-[#CC9166] shrink-0" />
        };

        const borderMap = {
          success: 'border-emerald-500/30',
          error: 'border-rose-500/30',
          warning: 'border-amber-500/30',
          info: 'border-[#CC9166]/30'
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-[8px] bg-[#121317] border ${borderMap[toast.type]} shadow-xl flex items-start gap-2.5 animate-in slide-in-from-bottom-2 duration-150`}
            role="status"
          >
            {iconMap[toast.type]}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{toast.title}</div>
              <p className="text-[11px] text-[#C7C9D1] leading-relaxed break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#9194A1] hover:text-white p-0.5"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
