'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/* ───────────────────────────
   Types
─────────────────────────── */
type PortalTab = 'eligibility' | 'rewards' | 'history';
type PoolStatus = 'not-opened' | 'open' | 'closed';

type ClaimHistoryEntry = {
  round: number;
  amount: number;
  tx?: string;
};

type ClaimPortalState = {
  walletConnected: boolean;
  walletShort: string;
  networkLabel: string;
  snapshotLabel: string;
  snapshotBlock: string;

  claimWindowStatus: string;
  claimWindowOpensAt?: string | null;
  claimWindowClosesAt?: string | null;

  frontEndStatus: string;
  contractStatus: string;
  firstPoolStatus: PoolStatus;

  eligibleAmount: number;
  claimHistory: ClaimHistoryEntry[];

  rewardPoolAmountClaim?: number | null;
  rewardPoolAmountUsd?: number | null;
  windowPhase?: 'scheduled' | 'open' | 'closed';
};

/* ───────────────────────────
   Constants
─────────────────────────── */
const MIN_HOLDING = 1_000_000;
const JUPITER_BUY_URL = 'https://jup.ag/swap/SOL-CLAIM';

/* ───────────────────────────
   Countdown helpers
─────────────────────────── */

function formatTimestamp(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const s = d.toISOString().slice(0, 16).replace('T', ' · ');
  return `${s} UTC`;
}

function formatCountdown(targetIso?: string | null): string | null {
  if (!targetIso) return null;

  const t = new Date(targetIso).getTime();
  if (Number.isNaN(t)) return null;

  const diff = t - Date.now();
  if (diff <= 0) return '00:00:00';

  const total = Math.floor(diff / 1000);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const d = Math.floor(h / 24);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (d > 0) return `${d}d ${pad(h % 24)}:${pad(m)}:${pad(s)}`;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function useCountdown(targetIso?: string | null): string | null {
  const [v, setV] = useState(() => formatCountdown(targetIso));

  useEffect(() => {
    if (!targetIso) return setV(null);

    const tick = () => setV(formatCountdown(targetIso));
    tick();

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return v;
}

/* ───────────────────────────
   API fetch
─────────────────────────── */

async function getClaimPortalState(): Promise<ClaimPortalState> {
  const res = await fetch('/api/portal-state', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch portal state');
  return res.json();
}

/* ───────────────────────────
   UI pieces
─────────────────────────── */

function SoftCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop-blur">
      {children}
    </div>
  );
}

/* ───────────────────────────
   MAIN PAGE
─────────────────────────── */

export default function ClaimPoolPage() {
  const [state, setState] = useState<ClaimPortalState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<PortalTab>('eligibility');
  const [localWallet, setLocalWallet] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const lastPhase = useRef<'scheduled' | 'open' | 'closed' | null>(null);

  // Load + poll state
  useEffect(() => {
    let alive = true;

    const load = () =>
      getClaimPortalState()
        .then((data) => {
          if (!alive) return;

          const nextPhase = data.windowPhase ?? 'scheduled';
          const prev = lastPhase.current;

          if (nextPhase === 'open' && prev !== 'open') {
            setPulse(true);
            setTimeout(() => setPulse(false), 3500);
          }

          lastPhase.current = nextPhase;
          setState(data);
          setError(null);
        })
        .catch(() => {
          if (!alive) return;
          setError('Unable to load portal data.');
        });

    load();
    const id = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  /* Phantom connect */
  const handleWallet = async () => {
    const w = window as any;
    const provider = w.solana;

    if (!provider || !provider.isPhantom) {
      window.open('https://phantom.app', '_blank');
      return;
    }

    try {
      if (localWallet && provider.disconnect) {
        await provider.disconnect();
        setLocalWallet(null);
        return;
      }

      const res = await provider.connect();
      const pk = res?.publicKey?.toString();
      if (pk) setLocalWallet(pk);
    } catch (e) {
      console.error('Wallet connect error', e);
    }
  };

  if (!state && !error)
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 p-10">
        Loading…
      </main>
    );

  if (error || !state)
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 p-10 space-y-4">
        <h1 className="text-xl font-semibold">CLAIM Portal</h1>
        <p className="text-red-400">{error}</p>
        <Link href="/" className="underline text-slate-300">
          Reload
        </Link>
      </main>
    );

  /* Derived values */
  const {
    walletConnected,
    walletShort,
    networkLabel,
    snapshotLabel,
    snapshotBlock,
    claimWindowStatus,
    claimWindowOpensAt,
    claimWindowClosesAt,
    eligibleAmount,
    claimHistory,
    firstPoolStatus,
    frontEndStatus,
    contractStatus,
    rewardPoolAmountClaim,
    rewardPoolAmountUsd,
  } = state;

  const phase =
    state.windowPhase ??
    (claimWindowStatus.toLowerCase().includes('closed')
      ? 'closed'
      : claimWindowStatus.toLowerCase().includes('open')
      ? 'open'
      : 'scheduled');

  const effectiveWallet = localWallet ?? (walletConnected ? walletShort : null);
  const eligible = eligibleAmount >= MIN_HOLDING;

  const formattedOpen = formatTimestamp(claimWindowOpensAt);
  const formattedClose = formatTimestamp(claimWindowClosesAt);

  const countdown =
    phase === 'open'
      ? useCountdown(claimWindowClosesAt)
      : useCountdown(claimWindowOpensAt);

  /* ───────────────────────────
     RENDER
  ──────────────────────────── */
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Floating glows */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 top-20 h-80 w-80 bg-emerald-500/10 blur-3xl animate-pulse rounded-full" />
        <div className="absolute -right-32 bottom-20 h-96 w-96 bg-sky-500/10 blur-3xl animate-pulse rounded-full" />
      </div>

      {/* Header */}
      <header className="border-b border-slate-900/80 bg-black/40 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center ring-1 ring-slate-700/80">
              <span className="text-[11px] font-semibold tracking-[0.18em]">
                $
              </span>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                CLAIM PORTAL
              </p>
              <p className="text-sm font-medium">CLAIM – Token of Timing</p>
            </div>
          </div>

          <button
            onClick={handleWallet}
            className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-950 shadow-[0_0_28px_rgba(16,185,129,0.7)] hover:bg-emerald-400"
          >
            {effectiveWallet ? 'Wallet Connected' : 'Connect Phantom'}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-20">
        <SoftCard>
          <h1 className="text-3xl font-semibold mb-3">Next claim window</h1>

          <p className="max-w-xl text-slate-300 mb-6">
            Hold at least{' '}
            <span className="text-white font-semibold">
              1,000,000 $CLAIM
            </span>{' '}
            at snapshot and click during the live window to share the pool
            equally.
          </p>

          {/* CLAIM BUTTON */}
          <div
            className={`rounded-2xl border px-6 py-6 mb-4 ${
              phase === 'open'
                ? 'border-emerald-500/70 bg-emerald-500/10 shadow-[0_0_40px_rgba(34,197,94,0.5)]'
                : 'border-slate-800 bg-slate-900/60'
            } ${pulse ? 'animate-pulse' : ''}`}
          >
            <button
              disabled={phase !== 'open'}
              className={`w-full rounded-full py-4 text-sm font-semibold uppercase tracking-[0.26em] ${
                phase === 'open'
                  ? 'bg-emerald-400 text-emerald-950 shadow-lg hover:bg-emerald-300'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {phase === 'open' ? 'Claim this window' : 'Window not open'}
            </button>

            {/* COUNTDOWN */}
            <div className="flex justify-between items-center mt-4 text-sm">
              <span className="text-slate-300">
                {phase === 'open' && formattedClose
                  ? `Closes on ${formattedClose}`
                  : phase === 'scheduled' && formattedOpen
                  ? `Opens on ${formattedOpen}`
                  : null}
              </span>

              {countdown && (
                <span className="rounded-full bg-slate-900 px-4 py-2 text-[18px] font-bold text-emerald-300 tracking-widest">
                  {phase === 'open' ? 'CLOSES IN ' : 'OPENS IN '}
                  {countdown}
                </span>
              )}
            </div>
          </div>
        </SoftCard>

        {/* You can keep the rest of your lower UI exactly the same */}
      </div>
    </main>
  );
}
