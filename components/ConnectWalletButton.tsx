'use client';

import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function ConnectWalletButton({
  fullWidth = false,
}: {
  fullWidth?: boolean;
}) {
  return (
    <div
      className={[
        // Width handling
        fullWidth ? 'w-full' : 'w-auto',

        // Shared styling wrapper
        'relative group',
      ].join(' ')}
    >
      {/* Outer glow frame */}
      <div
        className="
          absolute inset-0 rounded-2xl 
          bg-gradient-to-br from-emerald-400/20 via-slate-600/10 to-transparent
          blur-[14px] opacity-0 group-hover:opacity-40 transition
        "
      />

      {/* Actual button */}
      <WalletMultiButton
        className={[
          'z-[5] relative rounded-2xl',

          // Typography
          'text-[16px] font-semibold',

          // Background
          'bg-slate-900/80 backdrop-blur',
          'border border-slate-700/70',

          // Hover styling
          'hover:bg-slate-800/80 hover:border-emerald-500/60 hover:text-emerald-300',

          // Padding / size
          fullWidth
            ? 'w-full px-5 py-4 flex justify-center'
            : 'px-5 py-2',

          // Animation
          'transition-all duration-200',
        ].join(' ')}
      />
    </div>
  );
}
