'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function ConnectWalletButton({ variant }: { variant: 'desktop' | 'mobile' }) {
  const base =
    'inline-flex items-center rounded-full font-semibold uppercase tracking-[0.22em] transition-all duration-200';

  const desktop =
    'px-4 py-2 text-[11px] bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.6)]';

  const mobile =
    'w-full justify-center px-5 py-3 text-[12px] bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.6)]';

  const style = variant === 'desktop' ? desktop : mobile;

  return (
    <div className={base + ' ' + style}>
      <WalletMultiButton />
    </div>
  );
}
