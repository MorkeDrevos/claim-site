'use client';

import React, { useMemo } from 'react';
import { clusterApiUrl } from '@solana/web3.js';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

// @ts-ignore – using runtime types from wallet-adapter
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  LedgerWalletAdapter,
  BraveWalletAdapter,
  CoinbaseWalletAdapter,
  ExodusWalletAdapter,
  TokenPocketWalletAdapter,
} from '@solana/wallet-adapter-wallets';

type Props = {
  children: React.ReactNode;
};

export default function WalletContextProvider({ children }: Props) {
  const endpoint = useMemo(() => clusterApiUrl('mainnet-beta'), []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new LedgerWalletAdapter(),
      new BraveWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new ExodusWalletAdapter(),
      new TokenPocketWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
