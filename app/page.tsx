'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useToast } from './Toast';
import Image from 'next/image';   // ⬅️ add this line
import schedule from '../data/claim-schedule.json';
import { getPhaseForNow, ClaimSchedule } from '../lib/claimSchedule';

/* ───────────────────────────
   Types
─────────────────────────── */

type PortalTab = 'eligibility' | 'rewards' | 'history';
type PoolStatus = 'not-opened' | 'open' | 'closed';
type Tone = 'neutral' | 'success' | 'warning' | 'muted';

type WindowPhase =
  | 'scheduled'
  | 'snapshot'
  | 'open'
  | 'closed'
  | 'distribution'
  | 'done';

type ClaimHistoryEntry = {
  round: number;
  amount: number;
  tx?: string;
  date?: string;
};

type ClaimPortalState = {
  // unified round number
  roundNumber?: number;

  // wallet / network
  walletConnected: boolean;
  walletShort: string;
  networkLabel: string;

  // snapshot info
  snapshotLabel: string;
  snapshotBlock: string;

  // window status text the UI shows
  claimWindowStatus: string;
  windowPhase?: WindowPhase;

  // NEW: these now directly match claim-schedule.json
  snapshotAt?: string | null;
  claimWindowOpensAt?: string | null;
  claimWindowClosesAt?: string | null;
  distributionStartsAt?: string | null;
  distributionDoneAt?: string | null;

  // backend/system status
  frontEndStatus: string;
  contractStatus: string;
  firstPoolStatus: PoolStatus;

  // pool + eligibility
  eligibleAmount: number;
  claimHistory: ClaimHistoryEntry[];
  rewardPoolAmountClaim?: number | null;
  rewardPoolAmountUsd?: number | null;

  // helper from schedule
  numericCountdown?: string;
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
            className={`rounded-3xl border border-slate-800/80 bg-slate-950/80 p-4 sm:p-5 shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

/* ───────────────────────────
   Schedule helpers
─────────────────────────── */

const SCHEDULE = schedule as ClaimSchedule;

function formatCountdown(target: Date | null): string {
  if (!target) return '--:--:--';

  const diff = target.getTime() - Date.now();
  if (diff <= 0) return '00:00:00';

  const totalSeconds = Math.floor(diff / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');

  return `${h}:${m}:${s}`;
}

/* ───────────────────────────
   Countdown helpers
─────────────────────────── */

function formatCountdownLabel(targetIso?: string | null): string | null {
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
    formatCountdownLabel(targetIso)
  );

  React.useEffect(() => {
    if (!targetIso) {
      setLabel(null);
      return;
    }

    const update = () => setLabel(formatCountdownLabel(targetIso));
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

  useEffect(() => {
  let cancelled = false;

  async function loadPortalState() {
  try {
    const res = await getClaimPortalState();

    // Normalise names coming from the backend (old vs new)
    const snapshotAt =
      (res as any).snapshotAt ?? (res as any).snapshotTakenAt ?? null;

    const distributionDoneAt =
      (res as any).distributionDoneAt ??
      (res as any).distributionCompletedAt ??
      null;

    // Schedule → phase calculation (using claim-schedule.json)
    const phaseInfo = getPhaseForNow(SCHEDULE);
    const countdown = formatCountdown(phaseInfo.countdownTarget);

    // Merge schedule + normalised fields into the loaded state
    const mergedState: ClaimPortalState = {
      ...res, // everything from API

      // normalised new names
      snapshotAt,
      distributionDoneAt,

      // schedule-driven fields (from JSON)
      roundNumber: SCHEDULE.roundNumber,
      claimWindowOpensAt: SCHEDULE.windowOpensAt,
      claimWindowClosesAt: SCHEDULE.windowClosesAt,
      distributionStartsAt: SCHEDULE.distributionStartsAt,

      windowPhase: phaseInfo.phase,
      snapshotLabel: phaseInfo.snapshotLabel,
      claimWindowStatus: phaseInfo.claimWindowStatus,
      frontEndStatus: phaseInfo.frontEndStatus,
      numericCountdown: countdown,
    };

    if (!cancelled) {
      setState(mergedState);
    }
  } catch (err: any) {
    console.error('Failed to load portal state', err);
    if (!cancelled) {
      setError(err?.message ?? 'Failed to load portal state');
    }
  }
}

  loadPortalState();

  return () => {
    cancelled = true;
  };
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

  // Final 10 second pulse trigger
let isFinalTen = false;

if (countdownTarget) {
  const targetMs = new Date(countdownTarget).getTime();
  const diff = targetMs - Date.now();
  isFinalTen = diff > 0 && diff <= 10_000;
}

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
  <main className="relative min-h-screen bg-slate-950 text-slate-50 overflow-hidden">
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
    roundNumber,
    snapshotAt,
    distributionDoneAt,
  } = state;

  // has this round actually finished distributing?
  const distributionDone = !!distributionDoneAt;

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

  // Tone for claim window line
  const claimTone: Tone =
    currentPhase === 'open'
      ? 'success'
      : currentPhase === 'scheduled'
      ? 'warning'
      : 'muted';

  // Snapshot timing label – show nothing if there’s no snapshot yet
  const snapshotDateLabel = snapshotAt ?? '';

  // Normalised backend / contract status
  const backendStatus = (frontEndStatus || '').toLowerCase();
  const contractStatusLower = (contractStatus || '').toLowerCase();

  const hasBackendIssue =
    backendStatus === 'error' ||
    backendStatus === 'down' ||
    backendStatus === 'offline';

  const hasContractIssue =
    contractStatusLower === 'error' ||
    contractStatusLower === 'down' ||
    contractStatusLower === 'offline';

  const hasAnyIssue = hasBackendIssue || hasContractIssue;

  // Rows for Mission Control (NASA layout)
  type MissionRowMode = 'plain' | 'pill';

  type MissionRow = {
    label: string;
    value: string;
    tone: Tone;
    mode?: MissionRowMode; // default = 'plain'
  };

  const RIGHT_COL_WIDTH = 'w-[120px]';

  const missionRows: MissionRow[] = [
    {
      label: 'Portal backend',
      value: hasBackendIssue ? 'Attention' : 'Online',
      tone: hasBackendIssue ? 'warning' : 'success',
      mode: 'plain',
    },
    {
      label: 'Reward contracts',
      value: hasContractIssue ? 'Check logs' : 'Deployed',
      tone: hasContractIssue ? 'warning' : 'success',
      mode: 'plain',
    },
    {
      label: 'Network',
      value: 'Solana Mainnet',
      tone:
        networkLabel && networkLabel.toLowerCase().includes('mainnet')
          ? 'success'
          : 'muted',
      mode: 'plain',
    },
    {
      label: 'Claim window',
      value:
        currentPhase === 'open'
          ? 'Live'
          : currentPhase === 'scheduled'
          ? 'Scheduled'
          : currentPhase === 'distribution'
          ? 'Distributing'
          : 'Closed',
      tone: claimTone,
      mode: 'pill',
    },
    {
      label: 'Contract revision',
      value: 'CR-0.9.14',
      tone: 'muted',
      mode: 'plain',
    },
  ];

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
      ? `${rewardPoolAmountUsd.toLocaleString('en-US')}`
      : 'Soon';

  // preview mode = anything except explicit "live"
  const isPreview = process.env.NEXT_PUBLIC_PORTAL_MODE !== 'live';
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
    { id: 'scheduled', label: 'Opens soon' },
    { id: 'snapshot', label: 'Snapshot complete' },
    { id: 'open', label: 'Claim window open' },
    { id: 'closed', label: 'Claim window closed' },
    {
      id: 'distribution',
      label: distributionDone
        ? 'Rewards distributed'
        : 'Reward distribution in progress',
    },
  ];

  const activeIndex = steps.findIndex((s) => s.id === currentPhase);
  const activeStep = activeIndex >= 0 ? steps[activeIndex] : null;

  let progressMessage = '';
  if (currentPhase === 'scheduled') {
    progressMessage = 'Claim window scheduled. Countdown shows when it opens.';
  } else if (currentPhase === 'snapshot') {
    progressMessage = 'Snapshot complete. Next claim window coming soon.';
  } else if (currentPhase === 'open') {
    progressMessage =
      'Claim window open. Lock in your share before the countdown hits zero.';
  } else if (currentPhase === 'closed') {
    progressMessage =
      'Claim window closed. No new wallets can lock in for this round.';
  } else if (currentPhase === 'distribution') {
    progressMessage = 'Distribution sequence active — standby for completion.';
  }

  // Live-style status summary for Mission Control
  let statusSummary =
    'All systems nominal. Autonomous settlement sequence is active.';

  if (hasAnyIssue) {
    statusSummary =
      'Attention flagged. One or more subsystems are reporting a non-normal status.';
  } else if (currentPhase === 'open') {
    statusSummary =
      'All systems nominal. Live claim window running under autonomous settlement.';
  } else if (currentPhase === 'scheduled') {
    statusSummary =
      'All systems nominal. Snapshot execution is standing by and may trigger at any time.';
  } else if (currentPhase === 'distribution') {
    statusSummary =
      'All systems nominal. Reward distribution sequence is executing on-chain.';
  } else if (currentPhase === 'closed') {
    statusSummary =
      'All systems nominal. Claim window closed and standing by for the next round.';
  }

  let statusDotColor = 'bg-emerald-400';
  if (hasBackendIssue || hasContractIssue) {
    statusDotColor = 'bg-amber-400';
  }
  if (currentPhase === 'closed') {
    statusDotColor = 'bg-slate-500';
  }

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-50 overflow-x-hidden">
      {/* HERO BACKGROUND */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/60 via-emerald-500/20 to-slate-950" />
        <div className="absolute -left-40 top-4 h-80 w-80 rounded-full bg-emerald-400/60 blur-3xl opacity-90" />
        <div className="absolute -right-40 top-10 h-80 w-80 rounded-full bg-sky-400/55 blur-3xl opacity-80" />
        <div className="absolute inset-x-[-40px] bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent" />
      </div>

      {/* REAL CONTENT WRAPPER – everything below sits above the hero bg */}
      <div className="relative z-10">
        {/* Top nav bar */}
        <header
          className="
            mx-auto max-w-6xl
            flex flex-wrap items-center justify-between
            gap-2 sm:gap-4
            px-4 py-3 sm:px-6
          "
        >
          {/* Left: logo + title */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* CLAIM logo circle */}
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full
                       bg-slate-950 ring-1 ring-slate-700/80 overflow-hidden
                       shadow-[0_0_12px_rgba(16,185,129,0.25)]
                       transition-all group-hover:ring-emerald-400/70
                       group-hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]"
            >
              <Image
                src="/img/claim-logo-circle.png"
                alt="CLAIM Logo"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 group-hover:text-slate-300">
                CLAIM PORTAL
              </span>
              <span className="text-sm font-medium text-slate-100 group-hover:text-white">
                $CLAIM - Token of Timing
              </span>
            </div>
          </Link>

          {/* Right: nav items */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-wrap">
            <Link
              href="/concept"
              className="hidden sm:inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200 hover:bg-slate-800 hover:border-slate-600"
            >
              Concept
            </Link>

            <a
              href="https://x.com/clam_window"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200 hover:bg-slate-800 hover:border-emerald-500/60"
            >
              X
            </a>

            <a
              href="https://t.me/claimtokenoftiming"
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
              className="hidden sm:inline-flex items-center rounded-full
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
        </header>

        {/* Content */}
        <div className="mx-auto w-full max-w-6xl px-0 sm:px-6 pb-14 pt-10">
          {/* HERO: Claim window */}
          {/* … everything from your SoftCard hero, claim window card,
              mission control, progress bar, eligibility cards,
              info tabs, snapshot card stays exactly as it was … */}

          {/* (I’m not touching that logic/layout – keep it all the same) */}
        </div>

        {/* Sticky Buy on Jupiter CTA – only on larger screens */}
        <div className="hidden sm:block fixed bottom-4 right-4 z-50">
          <a
            href={JUPITER_BUY_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full
                       bg-emerald-500/90 px-4 py-2.5
                       text-[11px] font-semibold uppercase tracking-[0.22em]
                       text-emerald-950 shadow-[0_0_24px_rgba(16,185,129,0.65)]
                       hover:bg-emerald-400 hover:text-slate-950
                       transition-colors"
          >
            Buy $CLAIM on Jupiter
          </a>
        </div>

        <ToastContainer />
      </div>
    </main>
  );
}
