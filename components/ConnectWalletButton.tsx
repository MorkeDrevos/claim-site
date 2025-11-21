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

  const variantPadding =
    variant === 'mobile'
      ? 'px-4 py-2.5'
      : 'px-4 py-2.5';

  // If not connected, we override the label.
  // If connected, we pass no children so WalletMultiButton shows the address.
  const label = connected ? undefined : 'CONNECT WALLET';

  return (
    <WalletMultiButton
      className={[
        'rounded-full',
        variantPadding,
        'text-[11px] font-semibold uppercase tracking-[0.22em] text-white',
        'bg-gradient-to-r from-emerald-400/25 to-emerald-500/30',
        'border border-emerald-400/40',
        'shadow-[0_0_18px_rgba(16,185,129,0.35)]',
        'hover:from-emerald-400/35 hover:to-emerald-500/40',
        'hover:border-emerald-400 hover:text-white',
        'transition-all',
        className,
      ].join(' ')}
    >
      {label}
    </WalletMultiButton>
  );
}
