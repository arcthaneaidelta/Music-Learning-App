import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, Undo2 } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'undo';
  text: string;
  undoAction?: () => void;
  durationMs?: number;
}

interface ToastContextType {
  showToast: (msg: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { ...msg, id };

    setToasts((prev) => [...prev.slice(-2), newToast]); // max 3

    const duration = msg.durationMs || (msg.type === 'undo' ? 5000 : 4000);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container positioned bottom-center */}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-toast flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 bg-ink text-[#F4F1EB] rounded-md shadow-2 text-xs font-ui border border-ink-2/40 w-full animate-in fade-in slide-in-from-bottom-2 duration-180"
          >
            <div className="flex items-center gap-2.5 truncate">
              {t.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              )}
              {t.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-error shrink-0" />
              )}
              {t.type === 'info' && <Info className="w-4 h-4 text-info shrink-0" />}
              {t.type === 'undo' && <Undo2 className="w-4 h-4 text-warning shrink-0" />}
              <span className="truncate">{t.text}</span>
            </div>
            {t.undoAction && (
              <button
                type="button"
                onClick={() => {
                  t.undoAction!();
                  removeToast(t.id);
                }}
                className="text-accent hover:underline font-semibold uppercase tracking-wider text-[11px] shrink-0 ml-2"
              >
                Undo
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
