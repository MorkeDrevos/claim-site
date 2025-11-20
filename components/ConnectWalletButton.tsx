'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

type ConnectWalletButtonProps = {
  /** 
   * header  = smaller pill for the top-right nav
   * primary = big hero / mobile CTA (matches Jupiter pill)
   */
  variant?: 'primary' | 'header';
  fullWidth?: boolean;
};

export default function ConnectWalletButton({
  variant = 'primary',
  fullWidth = false,
}: ConnectWalletButtonProps) {
  const baseClasses = [
    'inline-flex items-center justify-center gap-2',
    'rounded-full border',
    'text-[13px] font-semibold uppercase tracking-[0.22em]',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-emerald-400/80 focus:ring-offset-0',
  ];

  const sizeClasses = fullWidth ? 'w-full h-[52px] px-6' : 'h-[44px] px-6';

  // 🎯 Style tuned to match the BUY $CLAIM ON JUPITER pill
  const paletteClasses =
    variant === 'header'
      ? [
          // slightly more subtle for header
          'border-emerald-400/60',
          'bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-emerald-400/20',
          'text-emerald-200',
          'shadow-[0_12px_40px_rgba(16,185,129,0.35)]',
          'hover:bg-emerald-500/20 hover:border-emerald-400',
        ].join(' ')
      : [
          // main big CTA – matches Jupiter pill
          'border-emerald-400/80',
          'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500',
          'text-slate-950',
          'shadow-[0_18px_60px_rgba(16,185,129,0.6)]',
          'hover:brightness-[1.06] active:brightness-[0.96]',
        ].join(' ');

  const className = [sizeClasses, ...baseClasses, paletteClasses].join(' ');

  return <WalletMultiButton className={className} />;
}
