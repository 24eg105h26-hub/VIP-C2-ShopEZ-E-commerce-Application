import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast Alert View List overlay */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="pointer-events-auto flex items-center justify-between p-4 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border shadow-xl rounded-2xl gap-3"
            >
              <div className="flex items-center gap-3">
                {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                {t.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />}
                {t.type === 'info' && <Info className="h-5 w-5 text-premium-accent shrink-0" />}
                <span className="text-xs font-semibold tracking-wide text-zinc-800 dark:text-zinc-100">{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
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
