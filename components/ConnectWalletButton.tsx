'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

type ConnectWalletButtonProps = {
  className?: string;
  variant?: 'desktop' | 'mobile';
};

export default function ConnectWalletButton({
  className = '',
  variant,
}: ConnectWalletButtonProps) {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const variantPadding =
    variant === 'mobile'
      ? 'px-4 py-2.5'
      : 'px-4 py-2.5';

  const label = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}…${publicKey
        .toBase58()
        .slice(-4)}`
    : 'Connect wallet';

  const handleClick = () => {
    setVisible(true); // always open wallet modal
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'rounded-full',
        variantPadding,
        'text-[11px] font-semibold tracking-wide text-white',
        'bg-gradient-to-r from-emerald-400/25 to-emerald-500/30',
        'border border-emerald-400/40',
        'shadow-[0_0_18px_rgba(16,185,129,0.35)]',
        'hover:from-emerald-400/35 hover:to-emerald-500/40',
        'hover:border-emerald-400 hover:text-white',
        'transition-all',
        'flex items-center justify-center',
        className,
      ].join(' ')}
    >
      {label}
    </button>
  );
}
