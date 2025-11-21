'use client';

import React from 'react';

type ToastType = 'error' | 'success' | 'warning';

type Toast = {
  id: number;
  type: ToastType;
  title: string;
  message: string;
};

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback(
    (type: ToastType, title: string, message: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, title, message }]);

      // Auto-hide after 4.5s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const ToastContainer: React.FC = () => (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="w-72 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 text-sm text-slate-50 shadow-[0_24px_80px_rgba(0,0,0,0.9)] backdrop-blur"
        >
          <p className="mb-1 text-[13px] font-semibold">
            {t.type === 'error' && '❌ '}
            {t.type === 'warning' && '⚠️ '}
            {t.type === 'success' && '🔥 '}
            {t.title}
          </p>
          <p className="text-[12px] leading-snug text-slate-400">{t.message}</p>
        </div>
      ))}
    </div>
  );

  return { addToast, ToastContainer };
}
