'use client';

import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

type ConnectWalletButtonProps = {
  className?: string;
  variant?: 'desktop' | 'mobile';
};

export default function ConnectWalletButton({
  className = '',
  variant,
}: ConnectWalletButtonProps) {
  const { connected } = useWallet();

  // When disconnected we force the label.
  // When connected, WalletMultiButton will show icon + short address.
  const label = connected ? undefined : 'Connect wallet';

  const desktopClasses = [
    'inline-flex items-center',
    'rounded-full',
    'bg-slate-900/90',
    'border border-slate-700/70',
    'px-4 py-1.5',
    'text-[13px] font-semibold text-slate-50',
    'hover:bg-slate-800 hover:border-emerald-400/70',
    'transition-all',
  ].join(' ');

  const mobileClasses = [
    'inline-flex items-center justify-center',
    'w-full rounded-full',
    'px-5 py-3.5',
    'text-[13px] font-semibold text-white',
    'bg-gradient-to-r from-emerald-400/25 to-emerald-500/30',
    'border border-emerald-400/40',
    'shadow-[0_0_18px_rgba(16,185,129,0.35)]',
    'hover:from-emerald-400/35 hover:to-emerald-500/40',
    'hover:border-emerald-400',
    'transition-all',
  ].join(' ');

  const variantClasses = variant === 'mobile' ? mobileClasses : desktopClasses;

  return (
    <WalletMultiButton
      className={[variantClasses, className].join(' ')}
    >
      {label}
    </WalletMultiButton>
  );
}
