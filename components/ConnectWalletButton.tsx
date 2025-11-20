'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function ConnectWalletButton({ fullWidth = false }: { fullWidth?: boolean }) {
  return (
    <WalletMultiButton
      className={[
        // Layout
        fullWidth ? 'w-full' : 'px-5',
        'h-[48px] rounded-2xl',

        // Font
        'text-[16px] font-semibold',

        // Colors (purple CLAIM theme)
        'bg-[#7C3AED] hover:bg-[#8B5CF6] active:bg-[#6D28D9] text-white',

        // Flex alignment
        'flex items-center justify-center gap-2',

        // Animation
        'transition-all duration-200',

        // Remove default wallet adapter shadow/borders
        '!shadow-none !border-none'
      ].join(' ')}
    />
  );
}
