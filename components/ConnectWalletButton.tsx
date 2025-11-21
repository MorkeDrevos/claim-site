'use client';

import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

type ConnectWalletButtonProps = {
  className?: string;
  variant?: 'desktop' | 'mobile';
};

export default function ConnectWalletButton({
  className = '',
  variant,
}: ConnectWalletButtonProps) {
  // Small tweak per variant if you want
  const variantPadding =
    variant === 'mobile'
      ? 'px-4 py-2.5'
      : 'px-4 py-2.5'; // same for now, but easy to change later

  return (
    <WalletMultiButton
      className={[
        // shape + spacing
        'rounded-full',
        variantPadding,

        // text
        'text-[11px] font-semibold uppercase tracking-[0.22em] text-white',

        // colours (match BUY $CLAIM button)
        'bg-gradient-to-r from-emerald-400/25 to-emerald-500/30',
        'border border-emerald-400/40',
        'shadow-[0_0_18px_rgba(16,185,129,0.35)]',

        // hover
        'hover:from-emerald-400/35 hover:to-emerald-500/40',
        'hover:border-emerald-400 hover:text-white',

        'transition-all',
        className,
      ].join(' ')}
    />
  );
}
