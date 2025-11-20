'use client';

import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

type ConnectWalletButtonProps = {
  className?: string;
};

export default function ConnectWalletButton({
  className = '',
}: ConnectWalletButtonProps) {
  return (
    <WalletMultiButton
      className={[
        // base shape + text
        'rounded-full text-[11px] font-semibold uppercase tracking-[0.22em]',
        // colours
        'bg-gradient-to-r from-emerald-400/25 to-emerald-500/30',
        'border border-emerald-400/40 text-emerald-200',
        'shadow-[0_0_18px_rgba(16,185,129,0.35)]',
        'hover:from-emerald-400/35 hover:to-emerald-500/40',
        'hover:border-emerald-400 hover:text-white',
        'transition-all',
        className,
      ].join(' ')}
    />
  );
}
