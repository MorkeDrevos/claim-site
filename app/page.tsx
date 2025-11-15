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

  roundNumber?: number; // 👈 add this
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

function SoftCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop-blur">
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

export default function ClaimPoolPage() {
  const { addToast, ToastContainer } = useToast();

  const [state, setState] = useState<ClaimPortalState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>('eligibility');
  const [isPulseOn, setIsPulseOn] = useState(false);

  // Inline message (shown under the CTA button)
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

    /* ── Phase + countdown (state can be null here) ── */

  const claimWindowStatusSafe = state?.claimWindowStatus ?? '';
  const lowerStatus = claimWindowStatusSafe.toLowerCase();

  // Raw phase directly from JSON, if present
  const rawWindowPhase = (state as any)?.windowPhase as WindowPhase | undefined;

  // Base phase only for countdown (we don’t need snapshot/distribution here)
  let phaseForCountdown: 'scheduled' | 'open' | 'closed' = 'scheduled';

  if (rawWindowPhase === 'open') {
    phaseForCountdown = 'open';
  } else if (
    rawWindowPhase === 'closed' ||
    rawWindowPhase === 'snapshot' ||
    rawWindowPhase === 'distribution'
  ) {
    phaseForCountdown = 'closed';
  } else if (lowerStatus.includes('closed')) {
    phaseForCountdown = 'closed';
  } else if (lowerStatus.includes('closes')) {
    phaseForCountdown = 'open';
  } else {
    phaseForCountdown = 'scheduled';
  }

  const opensAt = state?.claimWindowOpensAt ?? null;
  const closesAt = (state as any)?.claimWindowClosesAt ?? null;
  const countdownTarget =
    phaseForCountdown === 'open' ? (closesAt ?? opensAt) : opensAt;

  const countdownLabel = useCountdown(countdownTarget);  

  /* ── Initial load + polling ── */

  useEffect(() => {
    let alive = true;

    const load = () => {
      getClaimPortalState()
        .then((data) => {
          if (!alive) return;

          const statusSafe = data.claimWindowStatus?.toLowerCase?.() ?? '';
          const rawPhase = (data as any)?.windowPhase;

          let nextPhase: 'scheduled' | 'open' | 'closed' = 'scheduled';
          if (rawPhase) {
            nextPhase = rawPhase;
          } else if (statusSafe.includes('closed')) {
            nextPhase = 'closed';
          } else if (statusSafe.includes('closes')) {
            nextPhase = 'open';
          } else {
            nextPhase = 'scheduled';
          }

          const prevPhase = lastWindowPhaseRef.current;

          // Pulse whenever we *enter* OPEN (including first load)
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

   /* ── Loading / error shells ───────────────── */

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

  /* ── Safe destructure (state is now non-null) ───────────────── */

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

    const isLive = phaseForCountdown === 'open';
  const isClosed = phaseForCountdown === 'closed';

  /**
   * currentPhase drives the progress bar:
   *  - "scheduled"
   *  - "snapshot"
   *  - "open"
   *  - "closed"
   *  - "distribution"
   *
   * Priority:
   * 1. Use windowPhase from JSON if present
   * 2. Otherwise derive from snapshotTakenAt / distributionCompletedAt / countdown phase
   */
  const currentPhase: WindowPhase =
    (windowPhase as WindowPhase | undefined) ??
    (snapshotTakenAt
      ? distributionCompletedAt
        ? 'distribution'
        : 'snapshot'
      : isLive
      ? 'open'
      : isClosed
      ? 'closed'
      : 'scheduled');

  /* LIVE vs PREVIEW toggle via env */
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

  // Human-readable window timing text (used in the claim box)
  const windowTimingText = (() => {
    if (isLive) {
      if (!countdownLabel) return 'Closes soon';
      if (countdownLabel === 'now') return 'Closes any second';
      return `Closes in ${countdownLabel}`;
    }

    if (isClosed) {
      return 'Waiting for the next round';
    }

    // Scheduled / upcoming
    if (!countdownLabel) return 'Time to be announced';
    if (countdownLabel === 'now') return 'Opens any second';
    return `Opens in ${countdownLabel}`;
  })();

  // Button only active when LIVE + not preview.
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

  // ───────────────────────────
  // Render
  // ───────────────────────────

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
          {/* Left: logo + title */}
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
                CLAIM — Token of Timing
              </span>
            </div>
          </Link>

          {/* Right: network + analytics + concept + connect */}
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
              className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200 hover:bg-slate-800 hover:border-slate-600"
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

                  {/* Title (no countdown here) */}
                  <h1 className="text-[26px] leading-tight font-semibold tracking-tight text-slate-50 sm:text-[34px]">
                    {isLive
                      ? 'Live claim window'
                      : isClosed
                      ? 'Waiting for the next round'
                      : 'Next claim window'}
                  </h1>
                </div>
              </div>

              {/* Reward pool line */}
              <p className="mt-3 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Reward pool this window{' '}
                <span className="text-emerald-300 text-[18px] sm:text-[26px] font-bold drop-shadow-[0_0_10px_rgba(16,185,129,0.55)]">
                  {rewardAmountText} $CLAIM
                </span>{' '}
                <span className="text-[18px] sm:text-[11px] text-slate-500">
                  ({rewardUsdText} USD)
                </span>
              </p>

              {/* CLAIM WINDOW CARD */}
              <div className="mt-3 rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/8 via-slate-950/80 to-slate-950/90 p-4 shadow-[0_24px_80px_rgba(16,185,129,0.45)]">
                {/* Top row: label + status */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {isLive
                        ? 'Window closes in'
                        : isClosed
                        ? 'Window closed'
                        : 'Window opens in'}
                    </p>
                    <p className="text-base font-semibold text-slate-50">
                      {windowTimingText}
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

                {/* Big CTA bar */}
                <button
                  type="button"
                  onClick={handleClaimClick}
                  disabled={!canClaim}
                  className={[
                    'mt-6 flex w-full items-center justify-center rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-[0.32em]',
                    'transition-all duration-300',
                    canClaim
                      ? 'bg-emerald-500 text-emerald-950 shadow-[0_0_32px_rgba(16,185,129,0.8)] hover:bg-emerald-400'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed',
                    canClaim && isPulseOn ? 'animate-pulse' : '',
                  ].join(' ')}
                >
                  {canClaim ? 'Lock in my share' : 'Available when live'}
                </button>

                {/* Footer: close time + snapshot */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <p>{claimWindowStatus}</p>
                  <p>
                    Snapshot {snapshotBlock} · {networkLabel}
                  </p>
                </div>

                {/* Explanation inside card */}
                <div className="mt-5 border-t border-slate-800/60 pt-4 text-[12px] leading-relaxed text-slate-400">
                  <p className="mb-1">
                    To be eligible, you must hold at least{' '}
                    <span className="font-semibold text-emerald-300">
                      {MIN_HOLDING.toLocaleString('en-US')}&nbsp;$CLAIM
                    </span>{' '}
                    at the snapshot. When the claim window opens, click{' '}
                    <span className="font-semibold text-emerald-300">
                      LOCK IN MY SHARE
                    </span>{' '}
                    to register your wallet for that round. All registered
                    wallets{' '}
                    <span className="font-semibold text-emerald-300">
                      split the reward pool equally.
                    </span>{' '}
                  </p>

                  <p className="mt-2 text-[11px] text-slate-500">
                    Snapshots for the next round can be taken at any time
                    between the last window closing and the next one opening —{' '}
                    if you&apos;re not holding{' '}
                    {MIN_HOLDING.toLocaleString('en-US')} $CLAIM when it hits,
                    your wallet sits out that round.
                  </p>
                </div>
              </div>
            </div>

            
          </div>
        </SoftCard>

        {/* Round progress bar */}
<SoftCard>
  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
    Round {(state as any).roundNumber ?? 1} progress
  </p>

  {/* Steps line */}
  <div className="mt-3 flex items-center gap-3">
    {(
      [
        { id: 'scheduled',    label: 'Upcoming window' },
        { id: 'snapshot',     label: 'Eligibility locked' },
        { id: 'open',         label: 'Claim window open' },
        { id: 'closed',       label: 'Claim window closed' },
        { id: 'distribution', label: 'Round complete' },
      ] as { id: WindowPhase | 'closed'; label: string }[]
    ).map((step, index, all) => {
      const displayPhase = currentPhase;
      const currentIndex = all.findIndex((s) => s.id === displayPhase);
      const isDone = currentIndex > index;
      const isActive = currentIndex === index;

      return (
        <div key={step.id} className="flex-1 flex items-center">
          {/* Dot area */}
          <div className="flex flex-col items-center flex-none">
            {/* PING animation */}
            <div className="relative h-4 w-4 flex items-center justify-center">
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

            {/* Step label */}
            <span className="mt-2 text-[11px] text-center text-slate-300 leading-snug">
              {step.label}
            </span>
          </div>

          {/* Connecting line */}
          {index < all.length - 1 && (
            <div className="ml-3 flex-1 h-px rounded-full bg-slate-800">
              <div
                className={[
                  'h-px rounded-full transition-colors',
                  isDone ? 'bg-emerald-500' : 'bg-slate-800',
                ].join(' ')}
              />
            </div>
          )}
        </div>
      );
    })}
  </div>

  {/* YOU ARE HERE + explanation text */}
  <div className="mt-3 text-left">
    {currentPhase === 'distribution' && (
      <p className="text-[11px] text-emerald-300 font-semibold tracking-[0.22em] uppercase mb-1">
        YOU ARE HERE · ROUND COMPLETE
      </p>
    )}

    <p className="text-[11px] text-slate-500">
      {currentPhase === 'scheduled' &&
        'Upcoming window is scheduled. Once it opens, you will be able to lock in your share.'}
      {currentPhase === 'snapshot' &&
        'Eligibility is locked for this round. Next up is the live claim window where eligible wallets lock in their share.'}
      {currentPhase === 'open' &&
        'Claim window open. Lock in your share before the countdown hits zero.'}
      {currentPhase === 'closed' &&
        'Claim window closed. No new wallets can lock in for this round.'}
      {currentPhase === 'distribution' &&
        'Round complete. Rewards have been distributed.'}
    </p>
  </div>
</SoftCard>

        {/* === Preview Eligibility Cards === */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Reward Pool */}
          <SoftCard>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Current Reward Pool
            </p>
            <p className="mt-2 text-xl font-bold text-slate-100">
              {rewardAmountText} CLAIM
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
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

                  <p className="mt-3 text-[11px] text-amber-300">
                    Snapshots can be taken at any time within the announced
                    snapshot window. If you’re not holding when the snapshot
                    lands, this wallet won’t count for that round.
                  </p>

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
                Eligibility is based on balances recorded in this snapshot set.
                When the audited contract is live, this card will also show
                links to Merkle proofs or other verification tools.
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

      {/* end of content wrapper */}
      <ToastContainer />


{/* RIGHT COLUMN: Claim control + system status */}
            <div className="w-full max-w-xs space-y-4 md:w-auto">
              {/* Claim control */}
              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Claim control
                </p>
                <div className="mt-3 space-y-2">
                  <button
                    type="button"
                    onClick={handleConnectClick}
                    className="w-full rounded-2xl bg-slate-100/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-100 ring-1 ring-slate-700 hover:bg-slate-100/10"
                  >
                    {connectedWallet
                      ? `${connectedWallet.name}: ${effectiveWalletShort}`
                      : effectiveWalletConnected
                      ? effectiveWalletShort
                      : 'Connect wallet'}
                  </button>
                  <p className="text-[11px] text-slate-500">
                    {isPreview
                      ? 'During live rounds this button will trigger the on-chain claim call. In this preview version it is visual only.'
                      : 'During live rounds this button will trigger the on-chain claim transaction for this wallet.'}
                  </p>
                </div>
              </div>

              {/* System status + “All systems operational” */}
              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-xs">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  System status
                </p>

                <div className="mt-3 space-y-1.5 text-[12px] leading-relaxed text-slate-300">
                  <p>
                    <span className="text-slate-400">Portal front-end</span>
                    <span className="text-slate-200">
                      {' · '}
                      {isPreview ? 'Preview only (not live)' : frontEndStatus}
                    </span>
                  </p>

                  <p>
                    <span className="text-slate-400">CLAIM contract</span>
                    <span className="text-slate-200">
                      {' · '}
                      {contractStatus === 'Deployed'
                        ? 'Deployed and ready for live rounds'
                        : contractStatus}
                    </span>
                  </p>

                  <p>
                    <span className="text-slate-400">Reward pool</span>
                    <span className="text-slate-200">
                      {' · '}
                      {firstPoolStatus === 'open'
                        ? 'First pool is currently open'
                        : firstPoolStatus === 'closed'
                        ? 'First pool has closed'
                        : 'First pool not opened yet'}
                    </span>
                  </p>

                  <p className="pt-1 flex items-center gap-1.5 text-[11px] font-medium text-emerald-300">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    </span>
                    All systems operational
                  </p>
                </div>
              </div>
            </div>


    </main>
  );
}
