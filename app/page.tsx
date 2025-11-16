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

  const targetMs = new Date(targetIso).getTime();
  if (Number.isNaN(targetMs)) return null;

  const diff = targetMs - Date.now();
  if (diff <= 0) return '00:00:00';

  const totalSeconds = Math.floor(diff / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

function useCountdown(targetIso?: string | null): string | null {
  const [label, setLabel] = React.useState<string | null>(() =>
    formatCountdown(targetIso)
  );

  React.useEffect(() => {
    if (!targetIso) {
      setLabel(null);
      return;
    }

    const update = () => setLabel(formatCountdown(targetIso));
    update();

    const id = setInterval(update, 1000);
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

  if (w.solana?.isPhantom) return { name: 'Phantom', provider: w.solana };
  if (w.backpack?.solana) return { name: 'Backpack', provider: w.backpack.solana };
  if (w.solflare?.connect) return { name: 'Solflare', provider: w.solflare };
  if (w.xnft?.solana) return { name: 'Backpack xNFT', provider: w.xnft.solana };

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

  const [preFlash, setPreFlash] = useState(false);

  /* ── Phase + countdown (safe when state is null) ── */

  // Force small re-render every second so phase naturally flips
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      forceTick((x) => x + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Contract address (TEMP: SOL mint)
  const CLAIM_CA = 'So11111111111111111111111111111111111111112';
  const shortCa = `${CLAIM_CA.slice(0, 4)}…${CLAIM_CA.slice(-4)}`;

  const handleCopyCa = async () => {
    try {
      await navigator.clipboard.writeText(CLAIM_CA);
      addToast(
        'success',
        'Contract copied',
        'Token contract address has been copied to your clipboard.'
      );
    } catch (err) {
      console.error('Clipboard error', err);
      addToast(
        'error',
        'Unable to copy',
        'Please copy the contract address manually for now.'
      );
    }
  };

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

  // Prefer automatic timing based on opens/closes
  if (opensAtMs && closesAtMs) {
    if (nowMs < opensAtMs) {
      phase = 'scheduled';
    } else if (nowMs >= opensAtMs && nowMs < closesAtMs) {
      phase = 'open';
    } else {
      phase = 'closed';
    }
  } else if (opensAtMs && !closesAtMs) {
    phase = nowMs < opensAtMs ? 'scheduled' : 'open';
  } else {
    // Fallback to backend phase/status
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
  const closesAt = state?.claimWindowClosesAt ?? null;

  let countdownTarget: string | null = null;
  if (phase === 'scheduled') {
    countdownTarget = opensAt || null;
  } else if (phase === 'open') {
    countdownTarget = closesAt || opensAt || null;
  } else if (phase === 'closed') {
    countdownTarget = opensAt || null; // next window if known
  }

  const countdownLabel = useCountdown(countdownTarget);

  // Flash highlight in the last 3 seconds before a phase change
  useEffect(() => {
    if (!countdownTarget) {
      setPreFlash(false);
      return;
    }

    const targetMs = new Date(countdownTarget).getTime();
    if (!targetMs) return;

    const check = () => {
      const diff = targetMs - Date.now();
      if (diff <= 3000 && diff >= 0) {
        setPreFlash(true);
      } else if (diff < 0 || diff > 3000) {
        setPreFlash(false);
      }
    };

    check();
    const id = setInterval(check, 300);
    return () => {
      clearInterval(id);
      setPreFlash(false);
    };
  }, [countdownTarget]);

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

  // Derived from phase
  const isLive = phase === 'open';
  const isClosed = phase === 'closed';

  let currentPhase: WindowPhase;
  if (isLive) {
    currentPhase = 'open';
  } else if (isClosed) {
    currentPhase = windowPhase === 'distribution' ? 'distribution' : 'closed';
  } else if (windowPhase === 'snapshot') {
    currentPhase = 'snapshot';
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
    { id: 'snapshot', label: 'Snapshot complete' },
    { id: 'open', label: 'Claim window open' },
    { id: 'closed', label: 'Claim window closed' },
    { id: 'distribution', label: 'Rewards distributed' },
  ];

  const activeIndex = steps.findIndex((s) => s.id === currentPhase);
  const isActive = index === activeIndex;
  const activeStep = activeIndex >= 0 ? steps[activeIndex] : null;

  let progressMessage = '';
  if (currentPhase === 'scheduled') {
    progressMessage = 'Claim window scheduled. Countdown shows when it opens.';
  } else if (currentPhase === 'snapshot') {
    progressMessage = 'Snapshot complete. Next claim window coming soon.';
  } else if (currentPhase === 'open') {
    progressMessage = 'Claim window open. Lock in your share before the countdown hits zero.';
  } else if (currentPhase === 'closed') {
    progressMessage = 'Claim window closed. No new wallets can lock in for this round.';
  } else if (currentPhase === 'distribution') {
    progressMessage = 'Rewards have been distributed for this round.';
  }

  const snapshotDateLabel = snapshotTakenAt
    ? new Date(snapshotTakenAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'To be announced';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Subtle moving glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
        <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl animate-pulse" />
      </div>

      {/* Top nav – sticky */}
      <header className="sticky top-0 z-40 border-b border-slate-900/80 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Left: logo + title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-700/80 transition-all group-hover:ring-emerald-400/70">
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

          {/* Right: nav items */}
          <div className="flex items-center gap-3">
            <Link
              href="/concept"
              className="hidden sm:inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200 hover:bg-slate-800 hover:border-slate-600"
            >
              Concept
            </Link>

            <a
              href="https://x.com/yourhandle"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200 hover:bg-slate-800 hover:border-emerald-500/60"
            >
              X
            </a>

            <a
              href="https://t.me/yourtelegram"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200 hover:bg-slate-800 hover:border-emerald-500/60"
            >
              TG
            </a>

            {/* Contract address pill */}
            <button
              type="button"
              onClick={handleCopyCa}
              className="inline-flex items-center gap-2 rounded-full 
                         border border-slate-700/70 
                         bg-slate-900/70 
                         px-4 py-1.5
                         text-[10px] font-semibold uppercase tracking-[0.22em]
                         text-slate-200
                         hover:bg-slate-800 hover:border-emerald-400/60 hover:text-emerald-200
                         transition-all"
            >
              <span className="text-[10px] tracking-[0.22em] text-slate-400">
                CA
              </span>

              <span className="font-mono text-[11px] text-slate-100">
                {shortCa}
              </span>
            </button>

            {/* Network label */}
            <span className="hidden text-xs text-slate-500 sm:inline">
              {networkLabel}
            </span>

            {/* Wallet button */}
            <button
              type="button"
              onClick={handleConnectClick}
              className="inline-flex items-center rounded-full
                         px-5 py-2
                         bg-gradient-to-r from-emerald-400/25 to-emerald-500/30
                         border border-emerald-400/40
                         text-[11px] font-semibold uppercase tracking-[0.22em]
                         text-emerald-200
                         shadow-[0_0_18px_rgba(16,185,129,0.25)]
                         hover:from-emerald-400/35 hover:to-emerald-500/40
                         hover:border-emerald-400
                         hover:text-white
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
              {/* Header text */}
              <div className="space-y-2">
                <h1
                  className="text-[18px] sm:text-[30px] font-semibold 
                               leading-[1.25]
                               bg-gradient-to-r from-slate-200/90 to-slate-300/90 
                               bg-clip-text text-transparent"
                >
                  Rewards earned by presence - show up, click and get your share.
                </h1>
              </div>

              {/* CLAIM WINDOW CARD */}
              <div
                className={[
                  'mt-3 rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/8 via-slate-950/80 to-slate-950/90 p-4 shadow-[0_24px_80px_rgba(16,185,129,0.45)]',
                  preFlash ? 'animate-pulse' : '',
                ].join(' ')}
              >
                {/* Top row – Countdown left, reward pool right */}
                <div className="flex flex-wrap items-start justify-between gap-6">
                  {/* Countdown (dominant, left) */}
                  <div className="space-y-2">
                    {/* Header text ABOVE the timer */}
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {isLive
                        ? 'Window closes in'
                        : isClosed
                        ? 'Next window in'
                        : 'Window opens in'}
                    </p>

                    {/* Big numeric countdown */}
                    <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
                      {isClosed ? '' : countdownLabel || '--:--:--'}
                    </p>
                  </div>

                  {/* Reward pool */}
                  <div className="space-y-1 text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Reward pool
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-slate-50">
                      {rewardAmountText}
                      <span className="ml-1 text-[16px] sm:text-[17px] text-emerald-400">
                        $CLAIM
                      </span>
                    </p>
                    <p className="text-xs font-medium text-emerald-300">
                      ≈ <span className="font-semibold">{rewardUsdText}</span>
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

                {/* Eligibility text */}
                <div className="mt-6 text-[12px] leading-relaxed text-slate-400">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-600/60 bg-slate-900/80 text-[10px] mr-2">
                    i
                  </span>
                  To be eligible, you must hold at least{' '}
                  {MIN_HOLDING.toLocaleString('en-US')} $CLAIM{' '}
                  <span className="font-semibold text-emerald-300">
                    at the snapshot.
                  </span>{' '}
                  When the claim window opens, click{' '}
                  <span className="font-semibold text-emerald-300">
                    LOCK IN MY SHARE
                  </span>{' '}
                  to register your wallet’s share for that round.
                </div>
              </div>
              {/* end CLAIM WINDOW CARD */}
            </div>

            {/* RIGHT COLUMN – snapshot info / status */}
            <div className="w-full max-w-xs space-y-4">
              <SoftCard className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Round {roundNumber ?? 1}
                </p>

                <div className="space-y-2">
                  <p className="text-sm text-slate-300">
                    {snapshotLabel}{' '}
                    <span className="font-mono text-[11px] text-slate-500">
                      (#{snapshotBlock})
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {claimWindowStatus}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusPill
                    label={networkLabel}
                    tone="muted"
                  />
                  <StatusPill
                    label={`Backend: ${frontEndStatus}`}
                    tone={frontEndStatus === 'ok' ? 'success' : 'warning'}
                  />
                  <StatusPill
                    label={`Contract: ${contractStatus}`}
                    tone={contractStatus === 'ok' ? 'success' : 'warning'}
                  />
                </div>
              </SoftCard>
            </div>
          </div>
        </SoftCard>

        {/* Round progress bar */}
        <SoftCard className="mt-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Round {roundNumber ?? 1} progress
              </p>
            </div>

            <div className="mt-1 flex items-center justify-between gap-3">
              {steps.map((step, index) => {
                const isDone = activeIndex >= index;
                return (
                  <div key={step.id} className="flex flex-1 flex-col items-center">
                    <div
                      className={[
                        'h-2 w-full rounded-full',
                        index === 0 ? '' : 'ml-1',
                        isDone ? 'bg-emerald-400' : 'bg-slate-800',
                      ].join(' ')}
                    />
                    <div
  className={[
    'h-2.5 w-2.5 rounded-full border transition-all',
    isDone
      ? 'bg-emerald-400 border-emerald-300'
      : 'bg-slate-800 border-slate-600',
    isActive ? 'animate-pulse' : ''
  ].join(' ')}
/>
                      <span
  className={[
    'tracking-wide',
    isDone ? 'text-[13px] font-semibold text-slate-300' : 'text-[13px] font-medium text-slate-500'
  ].join(' ')}
>
  {step.label}
</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-[13px] text-emerald-300">{progressMessage}</p>
          </div>
        </SoftCard>

        {/* Preview Eligibility Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Current Reward Pool */}
          <SoftCard>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Current reward pool
            </p>

            <div className="mt-1.5 space-y-1">
              <p className="text-[20px] sm:text-[22px] font-bold text-slate-50 drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]">
                {rewardAmountText}
                <span className="ml-1 text-[16px] sm:text-[17px] text-emerald-400">
                  $CLAIM
                </span>
              </p>

              <p className="text-xs font-medium text-emerald-300">
                ≈ <span className="font-semibold">{rewardUsdText}</span>
              </p>
            </div>

            <div className="mt-4 border-t border-slate-800/70 pt-3 flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Contract address
              </p>

              <button
                type="button"
                onClick={handleCopyCa}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1
                           text-[11px] font-medium text-slate-200 border border-slate-700/80
                           hover:border-emerald-400/60 hover:text-emerald-200 hover:bg-slate-900/90
                           transition-colors"
              >
                <span className="font-mono text-[11px] text-slate-300">
                  {shortCa}
                </span>
                <span className="text-[9px] uppercase tracking-[0.18em] text-slate-400">
                  Copy CA
                </span>
              </button>
            </div>
          </SoftCard>

          {/* Minimum holding */}
          <SoftCard>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Minimum holding
            </p>

            <div className="mt-2 space-y-1">
              <p className="text-2xl font-bold text-slate-50">
                {MIN_HOLDING.toLocaleString('en-US')} CLAIM
              </p>
              <p className="text-xs text-slate-400">
                Held in the connected wallet at snapshot.
              </p>
            </div>

            <div className="mt-4 border-t border-slate-800/70 pt-3">
              <a
                href={JUPITER_BUY_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300 hover:bg-emerald-500/25"
              >
                Buy $CLAIM on Jupiter
              </a>
            </div>
          </SoftCard>

          {/* Your eligibility */}
          <SoftCard>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Your eligibility
            </p>

            <div className="mt-2 space-y-1">
              <p
                className={
                  eligibilityTitle === 'Wallet not connected'
                    ? 'text-lg font-semibold text-emerald-300'
                    : isEligible
                    ? 'text-lg font-semibold text-emerald-300'
                    : 'text-lg font-semibold text-amber-300'
                }
              >
                {eligibilityTitle}
              </p>
              <p className="text-xs text-slate-400">{eligibilityBody}</p>
            </div>

            {effectiveWalletConnected && (
              <div className="mt-4 border-t border-slate-800/70 pt-3">
                <p className="text-[11px] text-slate-500">
                  Wallet:{' '}
                  <span className="font-mono text-slate-200">
                    {effectiveWalletShort || '—'}
                  </span>
                </p>
              </div>
            )}
          </SoftCard>
        </div>

{/* Info + rules section (tabs + snapshot info) */}
<section className="mt-10 grid gap-6 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)]">
  {/* LEFT: Tabs – eligibility / reward logic / history */}
  <SoftCard>
    {/* Tabs */}
    <div className="mb-5 inline-flex rounded-full bg-slate-900/80 p-1 text-[11px] font-semibold uppercase tracking-[0.22em]">
      {(['eligibility', 'rewards', 'history'] as PortalTab[]).map((tab) => {
        const isActive = activeTab === tab;
        const label =
          tab === 'eligibility'
            ? 'Eligibility rules'
            : tab === 'rewards'
            ? 'Reward logic'
            : 'Claim history';

        return (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              'rounded-full px-4 py-1.5 transition-colors',
              isActive
                ? 'bg-slate-50 text-slate-950'
                : 'text-slate-400 hover:text-slate-100',
            ].join(' ')}
          >
            {label}
          </button>
        );
      })}
    </div>

    <hr className="border-slate-800/80" />

    {/* TAB CONTENT */}
<div className="mt-5 space-y-4 leading-relaxed text-slate-300">

  {/* Eligibility rules */}
  {activeTab === 'eligibility' && (
    <div className="space-y-4">
      <p className="text-[13px]">
        The CLAIM pool is driven by proof-of-presence. Eligibility comes from
        balances at specific snapshot blocks, not random forms.
      </p>

      <ul className="list-disc pl-5 space-y-2 text-[13px] text-slate-400">
        <li>
          Hold at least {MIN_HOLDING.toLocaleString('en-US')} CLAIM at the snapshot block.
        </li>
        <li>Snapshot block and date are announced before each round.</li>
        <li>Optional bonus rules may reward long-term or early participants.</li>
      </ul>

      <p className="text-[11px] text-slate-500">
        The final rule set for each round will be published before the snapshot
        and mirrored here inside the portal.
      </p>
    </div>
  )}

  {/* Reward logic */}
  {activeTab === 'rewards' && (
    <div className="space-y-4">
      <p className="text-[13px]">
        Rewards are earned by presence — if you show up during the live claim
        window and lock your share, you receive an equal split of that round’s pool.
      </p>

      <ul className="list-disc pl-5 space-y-2 text-[13px] text-slate-400">
        <li>Everyone who locks in receives an equal share.</li>
        <li>Fewer wallets claiming = larger share per wallet.</li>
        <li>Rewards are distributed automatically after the window closes.</li>
      </ul>

      <p className="text-[11px] text-slate-500">
        Claim windows follow strict timing via Solana timestamps.
      </p>
    </div>
  )}

  {/* Claim history */}
  {activeTab === 'history' && (
    <div className="space-y-4">
      <p className="text-[13px]">Past rounds and distributions will appear here.</p>

      {claimHistory.length === 0 ? (
        <p className="text-[11px] text-slate-500">No claim history yet.</p>
      ) : (
        <ul className="space-y-3 text-[13px] text-slate-400">
          {claimHistory.map((entry, i) => (
            <li key={i} className="rounded-lg bg-slate-900/50 p-3 text-[13px]">
              <p className="font-medium text-slate-200">
                Round {entry.round} —{' '}
                {entry.amount.toLocaleString('en-US')} CLAIM
              </p>
              {entry.date && (
                <p className="text-[11px] text-slate-500">
                  {new Date(entry.date).toLocaleString()}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )}

</div>

    {/* Tab content goes here */}
  </SoftCard>

  {/* RIGHT: Snapshot info */}
  <SoftCard className="space-y-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
      Snapshot info
    </p>

    <div className="space-y-2">
      <p className="text-lg font-semibold text-slate-50">
        Snapshot #{snapshotBlock}{' '}
        <span className="text-slate-400">• {networkLabel}</span>
      </p>
      <p className="text-[13px] leading-relaxed text-slate-300">
  Snapshots can occur any time between the previous window being scheduled and
  the next claim window opening. If you’re not holding the minimum required
  amount of $CLAIM when it hits, your wallet sits out that round.
</p>
    </div>

    <div className="pt-2 border-t border-slate-800/70">
      <p className="text-[11px] text-slate-500">
        Latest snapshot:{' '}
        <span className="text-slate-300">{snapshotDateLabel}</span>
      </p>
    </div>

    <p className="pt-3 text-[11px] text-slate-500">
      © 2025 CLAIM portal · Subject to change. Built for serious holders, not
      random forms.
    </p>
  </SoftCard>
</section>

      </div>

      <ToastContainer />
    </main>
  );
}
