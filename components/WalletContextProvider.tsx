'use client';

import React, { ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  GlowWalletAdapter,
  LedgerWalletAdapter,
  CoinbaseWalletAdapter,
  TokenPocketWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

// If you prefer a custom RPC, put it here:
const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC ??
  'https://api.mainnet-beta.solana.com';

export default function WalletContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const network = WalletAdapterNetwork.Mainnet;

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new BackpackWalletAdapter(),
      new GlowWalletAdapter(),
      new LedgerWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TokenPocketWalletAdapter(),
      // You can add more here if you want
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
