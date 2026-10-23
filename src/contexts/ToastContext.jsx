import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(undefined);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ type, title, message, duration = 3500 }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message, title) => {
    showToast({ type: 'success', title: title || 'Success', message });
  }, [showToast]);

  const error = useCallback((message, title) => {
    showToast({ type: 'error', title: title || 'Error', message });
  }, [showToast]);

  const info = useCallback((message, title) => {
    showToast({ type: 'info', title: title || 'Info', message });
  }, [showToast]);

  const warning = useCallback((message, title) => {
    showToast({ type: 'warning', title: title || 'Notice', message });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, success, error, info, warning }}>
      {children}
      <aside aria-label="Notifications" className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarn = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
                isSuccess
                  ? 'bg-dark-900/95 border-lime/40 text-white'
                  : isError
                  ? 'bg-dark-900/95 border-rose-500/40 text-white'
                  : isWarn
                  ? 'bg-dark-900/95 border-amber-500/40 text-white'
                  : 'bg-dark-900/95 border-sky-500/40 text-white'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-lime" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {isWarn && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {!isSuccess && !isError && !isWarn && <Info className="w-5 h-5 text-sky-400" />}
              </div>
              <div className="flex-1 text-sm min-w-0">
                {toast.title && <h3 className="font-semibold text-white tracking-tight">{toast.title}</h3>}
                <p className="text-zinc-300 text-xs mt-0.5 leading-relaxed break-words">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-zinc-500 hover:text-zinc-300 p-1 -mr-1 -mt-1 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
