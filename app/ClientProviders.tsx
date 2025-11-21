'use client';

import React from 'react';
import WalletContextProvider from '../components/WalletContextProvider';
import { ToastProvider } from './Toast';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <WalletContextProvider>
      <ToastProvider>{children}</ToastProvider>
    </WalletContextProvider>
  );
}

export default ClientProviders;
