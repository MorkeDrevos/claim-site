'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

type ToastType = 'success' | 'error' | 'warning';

type Toast = {
  id: number;
  type: ToastType;
  title: string;
  message: string;
};

type ToastContextValue = {
  addToast: (type: ToastType, title: string, message: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message: string) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      // auto-dismiss after 4s
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainerImpl toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  // expose addToast + a component for your page to render
  return {
    addToast: ctx.addToast,
    ToastContainer: EmptyToastContainerProxy,
  };
}

/**
 * This component is just a no-op placeholder – the “real”
 * container is rendered inside ToastProvider so it always
 * sits at the top of the app.
 */
function EmptyToastContainerProxy() {
  return null;
}

function ToastContainerImpl({
  toasts,
  onClose,
}: {
  toasts: Toast[];
  onClose: (id: number) => void;
}) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const toneClasses =
          toast.type === 'success'
            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-50'
            : toast.type === 'error'
            ? 'border-rose-500/60 bg-rose-500/10 text-rose-50'
            : 'border-amber-400/60 bg-amber-500/10 text-amber-50';

        return (
          <div
            key={toast.id}
            className={[
              'rounded-2xl border px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.65)]',
              'backdrop-blur bg-slate-950/90',
              toneClasses,
            ].join(' ')}
          >
            <div className="flex items-start gap-3">
              <div className="mt-[3px] h-2 w-2 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
              <div className="flex-1">
                <p className="text-[12px] font-semibold uppercase tracking-[0.22em]">
                  {toast.title}
                </p>
                <p className="mt-1 text-[13px] text-slate-200">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onClose(toast.id)}
                className="ml-2 text-[11px] text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
