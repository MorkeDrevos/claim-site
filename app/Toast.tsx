'use client';

import React, { useCallback, useState } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type Toast = {
  id: number;
  type: ToastType;
  title: string;
  message: string;
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (type: ToastType, title: string, message: string) => {
      setToasts(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          type,
          title,
          message,
        },
      ]);
    },
    []
  );

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ToastContainer: React.FC = () => {
    if (!toasts.length) return null;

    return (
      <div className="fixed bottom-4 right-4 z-[9999] flex max-w-sm flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={[
              'overflow-hidden rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm',
              t.type === 'success'
                ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-50'
                : t.type === 'error'
                ? 'border-rose-500/70 bg-rose-500/15 text-rose-50'
                : t.type === 'warning'
                ? 'border-amber-400/70 bg-amber-500/15 text-amber-50'
                : 'border-slate-500/70 bg-slate-800/90 text-slate-50',
            ].join(' ')}
          >
            <div className="flex items-start gap-3">
              <div className="mt-[3px] h-2 w-2 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
              <div className="flex-1 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                  {t.title}
                </p>
                <p className="text-[13px] leading-snug opacity-90">
                  {t.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="ml-2 text-[11px] uppercase tracking-[0.18em] opacity-70 hover:opacity-100"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return { addToast, ToastContainer };
}
