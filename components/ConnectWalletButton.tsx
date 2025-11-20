'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function ConnectWalletButton() {
  const { publicKey } = useWallet();

  const shortAddress = React.useMemo(() => {
    if (!publicKey) return '';
    const s = publicKey.toBase58();
    return `${s.slice(0, 4)}...${s.slice(-4)}`;
  }, [publicKey]);

  return (
    <div className="flex items-center gap-3">
      <WalletMultiButton className="!rounded-full !bg-emerald-500 !px-5 !py-2.5 !text-sm !font-semibold !shadow-lg hover:!bg-emerald-400">
        {publicKey ? shortAddress : 'Connect wallet'}
      </WalletMultiButton>
    </div>
  );
}
