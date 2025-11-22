import React, { createContext, useContext, useCallback, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // ms
}

interface ToastContextValue {
  toasts: Toast[];
  push: (message: string, type?: ToastType, duration?: number) => void;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((message: string, type: ToastType = 'info', duration: number = 3500) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, message, type, duration };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => remove(id), duration);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ toasts, push, remove }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  );
};

const typeStyles: Record<ToastType, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-gray-700',
};

const ToastContainer: React.FC<{ toasts: Toast[]; onDismiss: (id: string) => void }> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`text-white px-4 py-3 rounded shadow flex items-start gap-3 animate-fadeIn ${typeStyles[t.type]}`}
        >
          <div className="flex-1 text-sm leading-snug">{t.message}</div>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-white/70 hover:text-white transition-colors text-xs"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

// Optional simple fade-in animation utility
// Could be added to global.css if desired.