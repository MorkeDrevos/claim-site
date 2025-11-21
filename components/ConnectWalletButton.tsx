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

  const label = connected ? undefined : 'Connect wallet';

  // Jupiter-like clean desktop style
  const desktopClasses = [
    'inline-flex items-center',
    'rounded-full',
    'px-3 py-1.5',
    'text-[12px] font-semibold',  // smaller font
    'text-white',
    'bg-transparent',             // NO background
    'border border-transparent',  // no border
    'hover:text-emerald-300',     // nice subtle hover
    'transition-all',
  ].join(' ');

  // Keep mobile CLAIM pill exactly as before
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

  const variantClasses =
    variant === 'mobile' ? mobileClasses : desktopClasses;

  return (
    <WalletMultiButton className={[variantClasses, className].join(' ')}>
      {label}
    </WalletMultiButton>
  );
}
