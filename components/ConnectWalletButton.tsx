'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

type ConnectWalletButtonProps = {
  variant?: 'header' | 'mobile';
};

export default function ConnectWalletButton({
  variant = 'header',
}: ConnectWalletButtonProps) {
  return (
    <WalletMultiButton
      className={[
        'claim-wallet-btn',                      // shared styling
        variant === 'mobile'
          ? 'claim-wallet-btn-mobile'
          : 'claim-wallet-btn-header',           // size tweak
      ].join(' ')}
    />
  );
}
