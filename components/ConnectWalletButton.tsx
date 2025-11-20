'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function ConnectWalletButton() {
  const { publicKey } = useWallet();

  // You can either use WalletMultiButton default styling
  // or wrap it in your own classes
  return (
    <div className="inline-flex">
      <WalletMultiButton
        style={{
          borderRadius: 999,
          fontSize: 11,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          padding: '8px 20px',
        }}
      >
        {publicKey ? undefined : 'Connect wallet'}
      </WalletMultiButton>
    </div>
  );
}
