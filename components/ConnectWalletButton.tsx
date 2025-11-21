'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function ConnectWalletButton() {
  // We attach our own class so we can style it reliably
  return <WalletMultiButton className="claim-wallet-btn" />;
}
