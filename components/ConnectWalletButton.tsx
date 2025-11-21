'use client';

import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

type ConnectWalletButtonProps = {
  variant?: 'header' | 'mobile';
};

export default function ConnectWalletButton({
  variant = 'header',
}: ConnectWalletButtonProps) {
  const sizeClass =
    variant === 'mobile'
      ? 'claim-wallet-btn-mobile'
      : 'claim-wallet-btn-header';

  return (
    <WalletMultiButton
      className={`claim-wallet-btn ${sizeClass}`}
    />
  );
}
