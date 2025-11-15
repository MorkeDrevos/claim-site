'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useToast } from './Toast';

/* ───────────────────────────
   Types
─────────────────────────── */

type PortalTab = 'eligibility' | 'rewards' | 'history';
type PoolStatus = 'not-opened' | 'open' | 'closed';
type Tone = 'neutral' | 'success' | 'warning' | 'muted';

type WindowPhase = 'scheduled' | 'open' | 'closed' | 'snapshot' | 'distribution';

type ClaimHistoryEntry = {
  round: number;
  amount: number;
  tx?: string;
  date?: string;
};

type ClaimPortalState = {
  roundNumber?: number;

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

  windowPhase?: WindowPhase;
  snapshotTakenAt?: string | null;
  distributionCompletedAt?: string | null;
};

/* ───────────────────────────
   Constants
─────────────────────────── */

const MIN_HOLDING = 1_000_000;
const JUPITER_BUY_URL = 'https://jup.ag/swap/SOL-CLAIM';

/* ───────────────────────────
   UI helpers
─────────────────────────── */

type StatusPillProps = {
  label: string;
  tone?: Tone;
};

function StatusPill({ label, tone = 'neutral' }: StatusPillProps) {
  const toneClasses: Record<Tone, string> = {
    neutral: 'bg-slate-900/80 text-slate-200 ring-1 ring-slate-700/70',
    success: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40',
    warning: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40',
    muted: 'bg-slate-800/60 text-slate-400 ring-1 ring-slate-700/60',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}

function SoftCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

/* ───────────────────────────
   Countdown helpers
─────────────────────────── */

function formatCountdown(targetIso?: string | null): string | null {
  if (!targetIso) return null;

  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) return null;

  const now = Date.now();
  const diff = target - now;

  if (Math.abs(diff) < 1_000) return 'now';

  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours % 24 > 0) parts.push(`${hours % 24}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && days === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

function useCountdown(targetIso?: string | null): string | null {
  const [label, setLabel] = useState<string | null>(() =>
    formatCountdown(targetIso)
  );

  useEffect(() => {
    if (!targetIso) {
      setLabel(null);
      return;
    }

    const update = () => setLabel(formatCountdown(targetIso));
    update();

    const id = setInterval(update, 1_000);
    return () => clearInterval(id);
  }, [targetIso]);

  return label;
}

/* ───────────────────────────
   Wallet detection (multi-wallet)
─────────────────────────── */

type DetectedWallet = {
  name: string;
  provider: any;
};

function detectWallet(): DetectedWallet | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;

  if (w.solana?.isPhantom) {
    return { name: 'Phantom', provider: w.solana };
  }
  if (w.backpack?.solana) {
    return { name: 'Backpack', provider: w.backpack.solana };
  }
  if (w.solflare?.connect) {
    return { name: 'Solflare', provider: w.solflare };
  }
  if (w.xnft?.solana) {
    return { name: 'Backpack xNFT', provider: w.xnft.solana };
  }

  return null;
}

/* ───────────────────────────
   API fetcher
─────────────────────────── */

async function getClaimPortalState(): Promise<ClaimPortalState> {
  const res = await fetch('/api/portal-state', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load portal state');
  return res.json();
}

/* ───────────────────────────
   Page component
─────────────────────────── */

function parseCountdownLabel(label: string | null) {
  // Default 00:00:00
  let hours = '00';
  let minutes = '00';
  let seconds = '00';

  if (!label || !label.trim()) {
    return { hours, minutes, seconds };
  }

  // label examples: "4h 7m 30s", "12m 05s", "9s"
  const parts = label.split(/\s+/);

  for (const part of parts) {
    if (part.endsWith('h')) {
      const n = part.slice(0, -1);
      if (!Number.isNaN(Number(n))) hours = n.padStart(2, '0');
    } else if (part.endsWith('m')) {
      const n = part.slice(0, -1);
      if (!Number.isNaN(Number(n))) minutes = n.padStart(2, '0');
    } else if (part.endsWith('s')) {
      const n = part.slice(0, -1);
      if (!Number.isNaN(Number(n))) seconds = n.padStart(2, '0');
    }
  }

  return { hours, minutes, seconds };
}

export default function ClaimPoolPage() {
  const { addToast, ToastContainer } = useToast();

  const [state, setState] = useState<ClaimPortalState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>('eligibility');
  const [isPulseOn, setIsPulseOn] = useState(false);

  const [inlineMessage, setInlineMessage] = useState<{
    type: 'error' | 'warning' | 'success';
    title: string;
    message: string;
  } | null>(null);

  const [connectedWallet, setConnectedWallet] = useState<{
    address: string;
    name: string;
  } | null>(null);

  const walletProviderRef = useRef<any | null>(null);
  const lastWindowPhaseRef = useRef<string | null>(null);

  /* ── Phase + countdown (safe when state is null) ── */

  // 🔥 force a re-render every second so the phase naturally flips
// scheduled → open → closed without needing manual refresh
const [, forceTick] = useState(0);
useEffect(() => {
  const id = setInterval(() => {
    forceTick((x) => x + 1);
  }, 1000);
  return () => clearInterval(id);
}, []);

  const claimWindowStatusSafe = state?.claimWindowStatus ?? '';
const rawPhase = (state as any)?.windowPhase as WindowPhase | undefined;
const lowerStatus = claimWindowStatusSafe.toLowerCase();

// Parse open/close timestamps (if present)
const opensAtMs =
  state?.claimWindowOpensAt ? new Date(state.claimWindowOpensAt).getTime() : null;
const closesAtMs =
  state?.claimWindowClosesAt ? new Date(state.claimWindowClosesAt).getTime() : null;
const nowMs = Date.now();

// Base phase used for countdown (scheduled / open / closed)
let phase: 'scheduled' | 'open' | 'closed' = 'scheduled';

// 1) Prefer automatic timing based on opens/closes
if (opensAtMs && closesAtMs) {
  if (nowMs < opensAtMs) {
    // before open
    phase = 'scheduled';
  } else if (nowMs >= opensAtMs && nowMs < closesAtMs) {
    // during live window
    phase = 'open';
  } else {
    // after close
    phase = 'closed';
  }
} else if (opensAtMs && !closesAtMs) {
  // only open time known: before = scheduled, after = open
  phase = nowMs < opensAtMs ? 'scheduled' : 'open';
} else {
  // 2) Fallback to your old text/manual logic
  if (rawPhase === 'open') {
    phase = 'open';
  } else if (
    rawPhase === 'closed' ||
    rawPhase === 'snapshot' ||
    rawPhase === 'distribution'
  ) {
    phase = 'closed';
  } else if (lowerStatus.includes('closed')) {
    phase = 'closed';
  } else if (lowerStatus.includes('closes')) {
    phase = 'open';
  } else {
    phase = 'scheduled';
  }
}

  const opensAt = state?.claimWindowOpensAt ?? null;
  const closesAt = (state as any)?.claimWindowClosesAt ?? null;
  const countdownTarget =
    phase === 'open' ? (closesAt ?? opensAt) : opensAt;

  const countdownLabel = useCountdown(countdownTarget);

  /* ── Initial load + polling ── */

  useEffect(() => {
    let alive = true;

    const load = () => {
      getClaimPortalState()
        .then((data) => {
          if (!alive) return;

          const statusSafe = data.claimWindowStatus?.toLowerCase?.() ?? '';
          const raw = (data as any)?.windowPhase as WindowPhase | undefined;

          let nextPhase: 'scheduled' | 'open' | 'closed' = 'scheduled';
          if (raw === 'open') {
            nextPhase = 'open';
          } else if (
            raw === 'closed' ||
            raw === 'snapshot' ||
            raw === 'distribution'
          ) {
            nextPhase = 'closed';
          } else if (statusSafe.includes('closed')) {
            nextPhase = 'closed';
          } else if (statusSafe.includes('closes')) {
            nextPhase = 'open';
          } else {
            nextPhase = 'scheduled';
          }

          const prevPhase = lastWindowPhaseRef.current;

          if (nextPhase === 'open' && prevPhase !== 'open') {
            setIsPulseOn(true);
            setTimeout(() => setIsPulseOn(false), 3500);
          }

          lastWindowPhaseRef.current = nextPhase;
          setState(data);
          setError(null);
        })
        .catch((err) => {
          console.error(err);
          if (!alive) return;
          setError('Unable to load portal data right now.');
        });
    };

    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  /* ── Wallet connect / disconnect ── */

  const handleConnectClick = async () => {
    try {
      if (connectedWallet && walletProviderRef.current?.disconnect) {
        await walletProviderRef.current.disconnect();
        walletProviderRef.current = null;
        setConnectedWallet(null);
        return;
      }

      const detected = detectWallet();
      if (!detected) {
        window.open('https://phantom.app/', '_blank');
        return;
      }

      const { name, provider } = detected;
      const resp = await provider.connect();
      const pubkey =
        resp?.publicKey?.toString?.() ??
        provider.publicKey?.toString?.() ??
        null;

      if (pubkey) {
        setConnectedWallet({ address: pubkey, name });
        walletProviderRef.current = provider;
      }
    } catch (err) {
      console.error('Wallet connect error', err);
    }
  };

  /* ── Loading / error shells ── */

  if (!state && !error) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6">
          <p className="text-sm text-slate-400">Loading CLAIM portal…</p>
        </div>
      </main>
    );
  }

  if (error || !state) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-16 sm:px-6">
          <h1 className="text-xl font-semibold">CLAIM portal</h1>
          <p className="text-sm text-red-400">{error ?? 'No data available'}</p>
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100 hover:bg-slate-700"
          >
            Try again
          </Link>
        </div>
      </main>
    );
  }

  /* ── Safe destructure (state is now non-null) ── */

  const {
  walletConnected,
  walletShort,
  networkLabel,
  snapshotLabel,
  snapshotBlock,
  claimWindowStatus,
  frontEndStatus,
  contractStatus,
  firstPoolStatus,
  eligibleAmount,
  claimHistory,
  rewardPoolAmountClaim,
  rewardPoolAmountUsd,
  windowPhase,
  snapshotTakenAt,
  distributionCompletedAt,
  roundNumber,
} = state;

// Derived from opens/closes
const isLive = phase === 'open';
const isClosed = phase === 'closed';

// Use auto phase for the 3 main stages,
// but let you manually override to snapshot / distribution.
let currentPhase: WindowPhase;

if (windowPhase === 'snapshot' || windowPhase === 'distribution') {
  // manual phases you set in JSON
  currentPhase = windowPhase;
} else if (isLive) {
  currentPhase = 'open';
} else if (isClosed) {
  currentPhase = 'closed';
} else {
  currentPhase = 'scheduled';
}

  const isPreview = process.env.NEXT_PUBLIC_PORTAL_MODE !== 'live';

  const effectiveWalletConnected = !!connectedWallet || walletConnected;
  const effectiveWalletShort = connectedWallet
    ? `${connectedWallet.address.slice(0, 4)}…${connectedWallet.address.slice(
        -4
      )}`
    : walletShort;

  const isEligible = eligibleAmount >= MIN_HOLDING;

  const rewardAmountText =
    typeof rewardPoolAmountClaim === 'number'
      ? rewardPoolAmountClaim.toLocaleString('en-US')
      : 'TBA';

  const rewardUsdText =
    typeof rewardPoolAmountUsd === 'number'
      ? `$${rewardPoolAmountUsd.toLocaleString('en-US')}`
      : 'Soon';

    const windowTimingText = (() => {
    // Live window → countdown to close
    if (isLive) {
      if (!countdownLabel) return 'Closes soon';
      if (countdownLabel === 'now') return 'Closes any second';
      return `Closes in ${countdownLabel}`;
    }

    // Closed → next round
    if (isClosed) {
      if (!countdownLabel) return 'Waiting for the next round';
      if (countdownLabel === 'now') return 'Next window opens any second';
      return `Next window opens in ${countdownLabel}`;
    }

    // Scheduled → upcoming window
    if (!countdownLabel) return 'Time to be announced';
    if (countdownLabel === 'now') return 'Opens any second';
    return `Opens in ${countdownLabel}`;
  })();

  // 👉 Numbers-only countdown used in the big UI
const numericCountdown =
  countdownLabel && countdownLabel !== 'now'
    ? countdownLabel        // e.g. "4h 7m 30s"
    : isLive
    ? '0s'
    : '';

const { hours, minutes, seconds } = parseCountdownLabel(
  numericCountdown || null
);

  const canClaim = !isPreview && isLive;

  const eligibilityTitle = effectiveWalletConnected
    ? isEligible
      ? 'Eligible this round'
      : 'Not eligible this round'
    : 'Wallet not connected';

  const eligibilityBody = effectiveWalletConnected
    ? isEligible
      ? `This wallet met the ${MIN_HOLDING.toLocaleString(
          'en-US'
        )} CLAIM minimum at the snapshot used for this round.`
      : `This wallet held less than ${MIN_HOLDING.toLocaleString(
          'en-US'
        )} CLAIM at the snapshot used for this round.`
    : 'Connect a Solana wallet to check eligibility for this round.';

  /* ───────────────────────────
     CLAIM action handler
  ─────────────────────────── */

  const handleClaimClick = async () => {
    if (!isLive) {
      setInlineMessage({
        type: 'warning',
        title: 'Claim window is not live',
        message:
          'You can only lock your share once the live claim window is open.',
      });
      addToast(
        'warning',
        'Claim window is not live',
        'You can only lock your share once the live claim window is open.'
      );
      return;
    }

    if (!effectiveWalletConnected || !connectedWallet) {
      setInlineMessage({
        type: 'warning',
        title: 'Connect a wallet first',
        message:
          'Connect the wallet you used at snapshot before locking your share.',
      });
      addToast(
        'warning',
        'Connect a wallet first',
        'Connect the wallet you used at snapshot before locking your share.'
      );
      return;
    }

    if (!isEligible) {
      setInlineMessage({
        type: 'warning',
        title: 'Not eligible for this round',
        message: `This wallet held less than ${MIN_HOLDING.toLocaleString(
          'en-US'
        )} CLAIM at the snapshot.`,
      });
      addToast(
        'warning',
        'Not eligible for this round',
        `This wallet held less than ${MIN_HOLDING.toLocaleString(
          'en-US'
        )} CLAIM at the snapshot.`
      );
      return;
    }

    try {
      console.log('Claiming for wallet:', connectedWallet.address);

      setInlineMessage({
        type: 'success',
        title: 'Share locked in',
        message:
          'Your wallet will be included when this reward pool is distributed.',
      });

      addToast(
        'success',
        'Share locked in',
        'Your wallet will be included when this reward pool is distributed.'
      );
    } catch (err) {
      console.error('Claim error', err);

      setInlineMessage({
        type: 'error',
        title: 'Something went wrong',
        message: 'We could not lock your share. Please try again in a moment.',
      });

      addToast(
        'error',
        'Something went wrong',
        'We could not lock your share. Please try again in a moment.'
      );
    }
  };

  /* ───────────────────────────
     Render
  ─────────────────────────── */

 const steps: { id: WindowPhase | 'closed'; label: string }[] = [
  { id: 'scheduled', label: 'Upcoming window' },
  { id: 'snapshot',  label: 'Eligibility locked' },
  { id: 'open',      label: 'Claim window open' },
  { id: 'closed',    label: 'Claim window closed' },
  { id: 'distribution', label: 'Round complete' },
];

  const activeIndex = steps.findIndex((s) => s.id === currentPhase);
  const activeStep = activeIndex >= 0 ? steps[activeIndex] : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Subtle moving glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
        <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl animate-pulse" />
      </div>

      {/* Top nav */}
      <header className="border-b border-slate-900/80 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-700/80 transition-all group-hover:ring-slate-500/70">
              <span className="text-[11px] font-semibold tracking-[0.18em] text-slate-200 group-hover:text-white">
                $
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 group-hover:text-slate-300">
                CLAIM PORTAL
              </span>
              <span className="text-sm font-medium text-slate-100 group-hover:text-white">
                $CLAIM — Token of Timing
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/concept"
              className="hidden sm:inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200 hover:bg-slate-800 hover:border-slate-600"
            >
              Concept
            </Link>

            <Link
              href="/analytics"
              className="hidden sm:inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200 hover:bg-slate-800 hover:border-slate-600"
            >
              Analytics
            </Link>

            <span className="hidden text-xs text-slate-500 sm:inline">
              {networkLabel}
            </span>

            <button
  type="button"
  onClick={handleConnectClick}
  className="inline-flex items-center rounded-full 
             border border-emerald-400/40 
             bg-emerald-500/10 
             px-4 py-2 
             text-[10px] font-semibold uppercase tracking-[0.22em] 
             text-emerald-300 
             hover:bg-emerald-500/20 hover:border-emerald-400 
             transition-all"
>
  {connectedWallet
    ? `${connectedWallet.name} connected`
    : effectiveWalletConnected
    ? 'Wallet connected'
    : 'Connect wallet'}
</button>

          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-10 sm:px-6">
        {/* HERO: Claim window */}
        <SoftCard>
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            {/* LEFT COLUMN */}
            <div className="flex-1 space-y-6">
              {/* Breadcrumb */}
              <div className="space-y-2">

                {/* Live / scheduled header */}
                <div className="space-y-2">
                  {isLive ? (
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                      </span>
                      <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                        CLAIM WINDOW LIVE NOW
                      </span>
                    </div>
                  ) : (
                    <p
                      className={`text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] ${
                        isClosed ? 'text-slate-400' : 'text-emerald-200'
                      }`}
                    >
                      {isClosed ? 'Claim window closed' : 'Next claim window'}
                    </p>
                  )}

                  {/* REMOVE CLAIM WINDOW TITLE */}
                 <h1 className="text-[20px] sm:text-[34px] font-semibold leading-snug 
               bg-gradient-to-r from-slate-200 to-slate-300 bg-clip-text text-transparent">
  A time-based reward pool — lock in your wallet when the window opens.
</h1>
                </div>
              </div>

              {/* CLAIM WINDOW CARD */}
<div className="mt-3 rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/8 via-slate-950/80 to-slate-950/90 p-4 shadow-[0_24px_80px_rgba(16,185,129,0.45)]">
  {/* Top row */}
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="space-y-1">
      {/* Small label */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        {isLive
          ? 'Window closes in'
          : isClosed
          ? 'Next window in'
          : 'Window opens in'}
      </p>

      {/* Big countdown: numbers only */}
      <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
        {numericCountdown}
      </p>
    </div>

    <span
      className={`inline-flex items-center rounded-full border px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${
        isLive
          ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-200'
          : isClosed
          ? 'border-slate-700 bg-slate-900 text-slate-400'
          : 'border-emerald-400/40 bg-emerald-500/5 text-emerald-200'
      }`}
    >
      {isLive ? 'Live window' : isClosed ? 'Closed' : 'Scheduled'}
    </span>
  </div>

  {/* Reward Pool summary – moved ABOVE the button */}
  <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        Reward pool this window
      </p>

      <p className="mt-0 text-[22px] sm:text-[26px] font-bold text-emerald-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.25)] flex items-baseline gap-3">
  <p className="mt-1 flex items-baseline gap-2
  text-[28px] sm:text-[30px] font-bold tracking-tight
  text-emerald-300 drop-shadow-[0_0_6px_rgba(16,185,129,0.20)]">

  {/* CLAIM amount */}
  <span>
    {rewardAmountText}
    <span className="ml-1 text-[16px] sm:text-[22px] text-emerald-400 font-semibold">
      $CLAIM
    </span>
  </span>

  {/* USD value */}
  <span className="text-[22px] text-slate-400 font-medium">
    ≈ {rewardUsdText}
  </span>
</p>
</p>
    </div>
  </div>

  {/* Big CTA bar */}
  <button
    type="button"
    onClick={handleClaimClick}
    disabled={!canClaim}
    className={[
      'mt-6 flex w-full items-center justify-center rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-[0.32em]',
      'transition-all duration-300 border',
      canClaim
        ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-[0_0_32px_rgba(16,185,129,0.8)] hover:bg-emerald-400'
        : isClosed
        ? 'bg-slate-900 text-slate-500 border-slate-700 cursor-not-allowed'
        : 'bg-slate-950/80 text-slate-200 border-emerald-400/40 shadow-[0_0_28px_rgba(16,185,129,0.35)] cursor-not-allowed',
      canClaim && isPulseOn ? 'animate-pulse' : '',
    ].join(' ')}
  >
    {canClaim
      ? 'Lock in my share'
      : isClosed
      ? 'Window closed'
      : 'Available when live'}
  </button>

  {/* Footer – divider + eligibility text */}
  <div className="mt-6 space-y-4 text-[11px] text-slate-500">
    {/* Soft divider */}
    <div className="h-px w-full bg-gradient-to-r from-emerald-500/40 via-emerald-500/10 to-transparent" />

    {/* Eligibility Text */}
    <p className="text-[12px] leading-relaxed text-slate-400 flex items-start gap-1.5">
  <span>
    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-600/40 mr-2">
  <span className="h-1.5 w-1.5 rounded-full bg-slate-400/70" />
</span>To be eligible, you must hold at least{' '}
    {MIN_HOLDING.toLocaleString('en-US')} $CLAIM{' '}
    <span className="font-semibold text-emerald-300">at the snapshot.</span>{' '}
    When the claim window opens, click{' '}
    <span className="font-semibold text-emerald-300">LOCK IN MY SHARE</span>{' '}
    to register your wallet’s share for that round.
  </span>
</p>
  </div>
</div>

    </div>   {/* end LEFT column */}
  </div>     {/* end flex row wrapper */}
</SoftCard>

                {/* Round progress bar */}
        <div className="mt-14">
          <SoftCard>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Round {(state as any).roundNumber ?? 1} progress
            </p>

            {/* Steps line */}
            <div className="mt-3 flex items-center gap-3">
              {steps.map((step, index, all) => {
                const currentIndex = all.findIndex((s) => s.id === currentPhase);
                const isDone = currentIndex > index;
                const isActive = currentIndex === index;

                return (
                  <div key={step.id} className="flex flex-1 items-center">
                    {/* Dot + label */}
                    <div className="flex flex-none flex-col items-center">
                      <div className="relative flex h-4 w-4 items-center justify-center">
                        {isActive && (
                          <span className="absolute h-4 w-4 rounded-full bg-emerald-400/50 animate-ping" />
                        )}
                        <span
                          className={[
                            'relative block h-3 w-3 rounded-full border',
                            isActive
                              ? 'border-emerald-400 bg-emerald-400'
                              : isDone
                              ? 'border-emerald-500 bg-emerald-500/60'
                              : 'border-slate-700 bg-slate-900',
                          ].join(' ')}
                        />
                      </div>

                      <span className="mt-2 text-[13px] font-semibold text-center text-slate-200 leading-snug">
  {step.label}
</span>
                    </div>

                    {/* Connecting line */}
                    {index < all.length - 1 && (
                      <div className="ml-3 flex h-px flex-1 rounded-full bg-slate-800">
                        <div
                          className={[
                            'h-px flex-1 rounded-full transition-colors',
                            isDone ? 'bg-emerald-500' : 'bg-slate-800',
                          ].join(' ')}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Divider above status sentence */}
            <div className="mt-6 border-t border-slate-800/60" />


            {/* Phase explanation */}
            <p className="mt-4 text-[14px] font-medium">
  {currentPhase === 'scheduled' && (
    <span className="text-[13px] text-slate-400 leading-relaxed">
  Upcoming window is scheduled. Once it opens, you will be able to lock in your share.
</span>
  )}

  {currentPhase === 'snapshot' && (
    <span className="text-slate-300">
      Eligibility is locked for this round. Next up is the live claim window where eligible wallets lock in their share.
    </span>
  )}

  {currentPhase === 'open' && (
    <>
      <span className="font-semibold text-emerald-300">
        Claim window open.
      </span>
      <span className="text-slate-300">
        {' '}Lock in your share before the countdown hits zero.
      </span>
    </>
  )}

  {currentPhase === 'closed' && (
    <span className="text-slate-300">
      Claim window closed. No new wallets can lock in for this round.
    </span>
  )}

  {currentPhase === 'distribution' && (
    <span className="text-slate-300">
      Round complete. Rewards have been distributed.
    </span>
  )}
</p>
          </SoftCard>
        </div>

        {/* === Preview Eligibility Cards === */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Reward Pool */}
<SoftCard>
  <p className="text-[15px] font-semibold uppercase tracking-[0.22em] text-slate-500">
    Current Reward Pool
  </p>

  <p className="mt-2 text-xl font-bold text-slate-100">
    {rewardAmountText} CLAIM
  </p>

  <p className="text-xl text-slate-400 leading-relaxed">
    USD value: {rewardUsdText}
  </p>
</SoftCard>

          {/* Minimum Holding */}
          <SoftCard>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Minimum Holding
            </p>
            <p className="mt-2 text-xl font-bold text-slate-100">
              {MIN_HOLDING.toLocaleString('en-US')} CLAIM
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Held in the connected wallet at snapshot.
            </p>
          </SoftCard>

          {/* Your Eligibility */}
          <SoftCard>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Your Eligibility
            </p>
            <p className="mt-2 text-xl font-bold text-slate-100">
              {eligibilityTitle}
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {eligibilityBody}
            </p>
          </SoftCard>
        </div>

        {/* Lower section: rules + snapshot */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Rules + tabs */}
          <SoftCard>
            <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-slate-800 pb-3">
              {(['eligibility', 'rewards', 'history'] as PortalTab[]).map(
                (tab) => {
                  const labels: Record<PortalTab, string> = {
                    eligibility: 'Eligibility rules',
                    rewards: 'Reward logic',
                    history: 'Claim history',
                  };
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                        isActive
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                      }`}
                    >
                      {labels[tab]}
                    </button>
                  );
                }
              )}
            </div>

            <div className="space-y-3 text-[13px] leading-relaxed text-slate-300">
              {activeTab === 'eligibility' && (
                <>
                  <p className="text-[13px] text-slate-300">
                    The CLAIM pool is driven by proof-of-presence. Eligibility
                    comes from balances at specific snapshot blocks, not random
                    forms.
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-[12px] text-slate-400">
                    <li>
                      Hold at least{' '}
                      {MIN_HOLDING.toLocaleString('en-US')} CLAIM at the
                      snapshot block.
                    </li>
                    <li>
                      Snapshot block and date are announced before each round.
                    </li>
                    <li>
                      Optional bonus rules may reward long-term or early
                      participants.
                    </li>
                  </ul>
                  <p className="text-[11px] text-slate-500">
                    The final rule set for each round will be published before
                    the snapshot and mirrored here inside the portal.
                  </p>
                </>
              )}

              {activeTab === 'rewards' && (
                <>
                  <p className="text-[13px] text-slate-300">
                    Each claim window is a fixed reward pool. Everyone who
                    successfully clicks{' '}
                    <span className="font-semibold text-emerald-300">
                      LOCK IN MY SHARE
                    </span>{' '}
                    during the live window is included in the distribution.
                  </p>

                  <p className="mt-2 text-[12px] font-semibold text-emerald-300">
                    All successful claimers split the pool equally once the
                    window closes.
                  </p>

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] text-slate-400">
                    <li>One lock-in per eligible wallet per window.</li>
                    <li>Fewer claimers = larger share per wallet.</li>
                    <li>No gas wars, no race condition — just presence.</li>
                  </ul>

                  <p className="mt-2 text-[11px] text-slate-500">
                    Once the audited contract is wired, exact pool sizes and
                    on-chain distribution details will be mirrored
                    automatically.
                  </p>
                </>
              )}

              {activeTab === 'history' && (
                <>
                  {claimHistory.length === 0 ? (
                    <p className="text-[13px] text-slate-400">
                      After the first pool goes live, this section will show a
                      simple history for your connected wallet: amounts claimed
                      per round, with transaction links and any unclaimed
                      allocations that are still available.
                    </p>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {claimHistory.map((entry, i) => (
                        <div
                          key={i}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                        >
                          <div className="space-y-0.5">
                            <p className="font-medium text-slate-100">
                              Round {entry.round}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Claimed{' '}
                              {typeof entry.amount === 'number'
                                ? entry.amount.toLocaleString('en-US')
                                : entry.amount}{' '}
                              CLAIM
                            </p>
                          </div>
                          {entry.tx && (
                            <a
                              href={entry.tx}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300 hover:text-emerald-200"
                            >
                              View tx
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </SoftCard>

          {/* Snapshot + footer */}
          <SoftCard>
            <div className="space-y-2 text-sm text-slate-300">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Snapshot info
              </p>
              <p>
                Snapshot{' '}
                <span className="font-mono text-slate-100">
                  {snapshotBlock}
                </span>{' '}
                · {networkLabel}
              </p>
              <p className="text-xs text-slate-500">
  Snapshots can be taken at any time between the last window being
  scheduled and the next live claim window opening. If you’re not holding{' '}
  {MIN_HOLDING.toLocaleString('en-US')} $CLAIM when it hits, your wallet
  sits out that round.
</p>
            </div>

            <div className="mt-6 border-t border-slate-800 pt-4 text-[11px] text-slate-500">
              <p>
                © 2025 CLAIM portal · {isPreview ? 'Preview UI · ' : ''}
                Subject to change. Built for serious holders, not random forms.
              </p>
            </div>
          </SoftCard>

        </div>
      </div>

      <ToastContainer />
    </main>
  );
}
