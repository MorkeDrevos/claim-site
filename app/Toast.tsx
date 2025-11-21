// app/Toast.tsx  (or wherever your current Toast file lives)
'use client';

import React, { useCallback, useState } from 'react';

type ToastType = 'success' | 'warning' | 'error';

type Toast = {
  id: number;
  type: ToastType;
  title: string;
  message: string;
};

let globalToastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message: string) => {
      const id = ++globalToastId;
      setToasts((prev) => [...prev, { id, type, title, message }]);

      // auto-remove after 5s
      window.setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  const ToastContainer: React.FC = () => (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const base =
          'rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur bg-slate-900/90';
        const toneClasses =
          toast.type === 'success'
            ? 'border-emerald-500/60 text-emerald-100'
            : toast.type === 'warning'
            ? 'border-amber-400/70 text-amber-50'
            : 'border-rose-500/70 text-rose-50';

        return (
          <div key={toast.id} className={`${base} ${toneClasses}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-80">
                  {toast.type}
                </p>
                <p className="mt-1 font-semibold">{toast.title}</p>
                <p className="mt-1 text-[13px] opacity-90">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-xs uppercase tracking-[0.18em] opacity-70 hover:opacity-100"
              >
                Close
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return { addToast, ToastContainer };
}
