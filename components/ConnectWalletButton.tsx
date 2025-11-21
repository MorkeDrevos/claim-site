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
  const { publicKey } = useWallet();

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
    : null;

  // Label:
  // - not connected → "Connect wallet"
  // - connected → short address
  const label = shortAddress ?? 'Connect wallet';

  const variantClasses =
    variant === 'mobile'
      ? // mobile: full width, taller
        'w-full justify-center px-5 py-3.5'
      : // desktop: compact pill
        'px-4 py-2.5';

  return (
    <WalletMultiButton
      className={[
        'flex items-center',
        'rounded-full',
        variantClasses,
        'text-[11px] font-semibold tracking-wide text-white',
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
