'use client';

import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import '@solana/wallet-adapter-react-ui/styles.css';

import WalletContextProvider from '../components/WalletContextProvider';
import { ToastProvider } from './Toast';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <WalletContextProvider>
      <ToastProvider>
        {children}
        <Analytics />
      </ToastProvider>
    </WalletContextProvider>
  );
}
