'use client';

import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

type ConnectWalletButtonProps = {
  variant?: 'desktop' | 'mobile';
  className?: string;
};

export default function ConnectWalletButton({ variant, className = '' }: ConnectWalletButtonProps) {
  const { connected } = useWallet();

  // Show "Connect wallet" when disconnected
  const label = connected ? undefined : 'Connect wallet';

  return (
    <WalletMultiButton className={className}>
      {label}
    </WalletMultiButton>
  );
}
