'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from './Toast';
import schedule from '../data/claim-schedule.json';
import { getPhaseForNow, ClaimSchedule } from '../lib/claimSchedule';

function useAutoReloadOnNewBuild() {
  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null = null;
    let initialBuildId: string | null = null;

    const check = async () => {
      try {
        const res = await fetch('/api/build-info', { cache: 'no-store' });
        if (!res.ok) return;

        const data = await res.json();
        const latest = data?.buildId ?? null;

        if (!initialBuildId) {
          // First run – remember current build id
          initialBuildId = latest;
                } else if (latest && initialBuildId && latest !== initialBuildId) {
          // New build detected -> mark and reload
          try {
            window.localStorage.setItem('claim_portal_recently_updated', '1');
          } catch {
            // ignore storage errors
          }
          window.location.reload();
          return;
        }
      } catch (e) {
        console.error('build-info check failed', e);
      } finally {
        if (!cancelled) {
          timeoutId = window.setTimeout(check, 10_000); // every 10s
        }
      }
    };

    check();

    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);
}

/* ───────────────────────────
   Types
─────────────────────────── */

type PortalTab = 'eligibility' | 'rewards' | 'history';
type PoolStatus = 'not-opened' | 'open' | 'closed';
type Tone = 'neutral' | 'success' | 'warning' | 'muted';

type MissionRowMode = 'plain' | 'pill';

type MissionRow = {
  label: string;
  value: string;
  tone: Tone;
  mode?: MissionRowMode; // default = 'plain'
};

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
  // round
  roundNumber?: number;

  // wallet / network
  walletConnected: boolean;
  walletShort: string;
  networkLabel: string;

  // snapshot
  snapshotLabel: string;
  snapshotBlock: string;

  // window status
  claimWindowStatus: string;
  windowPhase?: WindowPhase;

  // schedule timings (match JSON)
  snapshotAt?: string | null;
  claimWindowOpensAt?: string | null;
  claimWindowClosesAt?: string | null;
  distributionStartsAt?: string | null;
  distributionDoneAt?: string | null;

  // backend / contract status
  frontEndStatus: string;
  contractStatus: string;
  firstPoolStatus: PoolStatus;

  // pool + eligibility
  eligibleAmount: number;
  claimHistory: ClaimHistoryEntry[];
  rewardPoolAmountClaim?: number | null;
  rewardPoolAmountUsd?: number | null;

  // helper
  numericCountdown?: string;
};

/* ───────────────────────────
   Constants
─────────────────────────── */

const MIN_HOLDING = 1_000_000;
const JUPITER_BUY_URL = 'https://jup.ag/swap/SOL-CLAIM';
// TEMP: JSON schedule doesn’t define `mode` yet, ignore type warning here
// @ts-ignore
const SCHEDULE = schedule as ClaimSchedule;
const SNAPSHOT_FOMO_WINDOW_MINUTES = 5; // or 10, whatever you want

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
   Countdown helpers
─────────────────────────── */

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
  // Toast & state, etc...
  const { addToast, ToastContainer } = useToast();

  const [state, setState] = useState<ClaimPortalState | null>(null);
  const [justUpdated, setJustUpdated] = useState(false);  // 👈 ADD THIS

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

  const [preFlash, setPreFlash] = useState(false);
  const [justSnapshotFired, setJustSnapshotFired] = useState(false);
  const snapshotFiredRef = useRef(false);

  // 🔥 NEW: random FOMO banner text
  const [fomoBanner, setFomoBanner] = useState<string | null>(null);

  // Enable the auto-reload hook
  useAutoReloadOnNewBuild();

  // Detect "we just reloaded because of a new build"
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const flag = window.localStorage.getItem('claim_portal_recently_updated');
      if (flag === '1') {
        setJustUpdated(true);
        window.localStorage.removeItem('claim_portal_recently_updated');

        // hide after a few seconds
        const id = window.setTimeout(() => setJustUpdated(false), 6000);
        return () => window.clearTimeout(id);
      }
    } catch {
      // ignore
    }
  }, []);

  const fomoMessages = [
  "Snapshot engine is arming - make sure your wallet holds the minimum.",
  "Live window approaching - don’t miss your share.",
  "Reminder: Only eligible wallets share the pool — check your balance."
];

function getRandomFomoMessage() {
  return fomoMessages[Math.floor(Math.random() * fomoMessages.length)];
}

    /* ───────────────────────────
     Phase + countdown (safe when state is null)
  ─────────────────────────── */

  // Force a re-render every second so time-based logic updates live
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      forceTick((x) => x + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Purely schedule-based timings (no `state` used here)
  const nowMs = Date.now();

  const snapshotMs =
    SCHEDULE.snapshotAt ? new Date(SCHEDULE.snapshotAt).getTime() : null;
  const opensMs =
    SCHEDULE.windowOpensAt ? new Date(SCHEDULE.windowOpensAt).getTime() : null;
  const closesMs =
    SCHEDULE.windowClosesAt
      ? new Date(SCHEDULE.windowClosesAt).getTime()
      : null;
  const distStartMs =
    SCHEDULE.distributionStartsAt
      ? new Date(SCHEDULE.distributionStartsAt).getTime()
      : null;
  const distDoneMs =
    SCHEDULE.distributionDoneAt
      ? new Date(SCHEDULE.distributionDoneAt).getTime()
      : null;

    // 🔥 Random FOMO banner between 30min and 5min before window opens
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!opensMs) return; // no window = nothing to do

    // 30min and 5min before open (in ms)
    const thirtyMin = 30 * 60 * 1000;
    const fiveMin = 5 * 60 * 1000;

    const fireWindowStart = opensMs - thirtyMin;
    const fireWindowEnd = opensMs - fiveMin;

    const now = Date.now();

    // If it's already too late (inside last 5min or after), skip
    if (now >= fireWindowEnd) return;

    // Clamp random time so it's always >= now
    const effectiveStart = Math.max(now, fireWindowStart);
    const range = Math.max(fireWindowEnd - effectiveStart, 0);

    if (range === 0) return;

    const randomTime = effectiveStart + Math.random() * range;
    const delay = randomTime - now;

    // schedule hype banner
    const id = window.setTimeout(() => {
      setFomoBanner(getRandomFomoMessage());

      // optional: auto-hide after ~20s
      const hideId = window.setTimeout(() => {
        setFomoBanner(null);
      }, 20_000);

      // store hideId on window so cleanup can cancel it if needed
      (window as any).__claimFomoHideId && window.clearTimeout(
        (window as any).__claimFomoHideId
      );
      (window as any).__claimFomoHideId = hideId;
    }, delay);

    return () => {
      window.clearTimeout(id);
      const hideId = (window as any).__claimFomoHideId;
      if (hideId) window.clearTimeout(hideId);
    };
  }, [opensMs]);

  // Monotonic phase ladder
  let currentPhase: WindowPhase = 'scheduled';

  if (snapshotMs && nowMs >= snapshotMs) currentPhase = 'snapshot';
  if (opensMs && nowMs >= opensMs) currentPhase = 'open';
  if (closesMs && nowMs >= closesMs) currentPhase = 'closed';
  if (distStartMs && nowMs >= distStartMs) currentPhase = 'distribution';
  if (distDoneMs && nowMs >= distDoneMs) currentPhase = 'done';

  // What are we counting toward?
  let countdownTargetIso: string | null = null;

  switch (currentPhase) {
    case 'scheduled':
    case 'snapshot':
      // We hype the claim window, not the snapshot
      countdownTargetIso = SCHEDULE.windowOpensAt ?? null;
      break;
    case 'open':
      countdownTargetIso = SCHEDULE.windowClosesAt ?? null;
      break;
    case 'closed':
      countdownTargetIso = SCHEDULE.distributionStartsAt ?? null;
      break;
    case 'distribution':
      countdownTargetIso = SCHEDULE.distributionDoneAt ?? null;
      break;
    case 'done':
    default:
      countdownTargetIso = null; // no countdown once done
  }

  const countdownLabel = useCountdown(countdownTargetIso);

  // Helpers used for styling
  const isLive = currentPhase === 'open';
  const isSnapshotPhase = currentPhase === 'snapshot';
  const isDistributionPhase = currentPhase === 'distribution';
  const isDone = currentPhase === 'done';
  const isClosedOnly = currentPhase === 'closed';
  const isDistributing = isDistributionPhase;

  const shouldShowCountdown =
  currentPhase === 'scheduled' ||
  currentPhase === 'snapshot' ||
  currentPhase === 'open';

  const isRestingClosed =
  isClosedOnly && !isDistributionPhase && !isDone;

  const isClosed =
    currentPhase === 'closed' ||
    currentPhase === 'distribution' ||
    currentPhase === 'done';

  const claimTone: Tone =
    isLive
      ? 'success'
      : isSnapshotPhase
      ? 'warning'
      : isDistributionPhase
      ? 'warning'
      : 'muted';

  // Flash highlight in the last 3 seconds before a phase change
  useEffect(() => {
    if (!countdownTargetIso) {
      setPreFlash(false);
      return;
    }

    const targetMs = new Date(countdownTargetIso).getTime();
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
    const id = window.setInterval(check, 300);
    return () => {
      window.clearInterval(id);
      setPreFlash(false);
    };
  }, [countdownTargetIso]);

  // Final 10-second pulse
  let isFinalTen = false;
  if (countdownTargetIso) {
    const targetMs = new Date(countdownTargetIso).getTime();
    const diff = targetMs - Date.now();
    isFinalTen = diff > 0 && diff <= 10_000;
  }



  /* ───────────────────────────
     Load portal state (polling)
  ─────────────────────────── */

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    async function loadPortalState() {
      try {
        const res = await getClaimPortalState();

        const snapshotAt =
          (res as any).snapshotAt ?? (res as any).snapshotTakenAt ?? null;

        const distributionDoneAt =
          (res as any).distributionDoneAt ??
          (res as any).distributionCompletedAt ??
          null;

        const phaseInfo = getPhaseForNow(SCHEDULE);
        const countdown = formatCountdown(phaseInfo.countdownTarget);

        const mergedState: ClaimPortalState = {
          ...res,
          snapshotAt,
          distributionDoneAt,
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
    intervalId = window.setInterval(loadPortalState, 15000);

    return () => {
      cancelled = true;
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, []);

  /* ───────────────────────────
     Contract + wallet helpers
  ─────────────────────────── */

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

  /* ───────────────────────────
     Loading / error guards
  ─────────────────────────── */

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

  /* ───────────────────────────
     Safe destructure
  ─────────────────────────── */

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

  // Choose where snapshot time comes from
  // Prefer JSON schedule; fall back to backend field if needed
  const effectiveSnapshotIso =
    SCHEDULE.snapshotAt ?? snapshotAt ?? null;

  const snapshotBaseMs = effectiveSnapshotIso
    ? new Date(effectiveSnapshotIso).getTime()
    : null;

  // Has the snapshot for this round actually happened?
  const hasSnapshotHappened =
    snapshotBaseMs !== null &&
    !Number.isNaN(snapshotBaseMs) &&
    Date.now() >= snapshotBaseMs;

  const snapshotDiffMs =
    snapshotBaseMs !== null && !Number.isNaN(snapshotBaseMs)
      ? snapshotBaseMs - Date.now()
      : null;

  const isSnapshotSoon =
    snapshotDiffMs !== null &&
    snapshotDiffMs > 0 &&
    snapshotDiffMs <= SNAPSHOT_FOMO_WINDOW_MINUTES * 60 * 1000;

  // Short human label, e.g. "09:15"
  const snapshotTimeLabel =
    effectiveSnapshotIso && hasSnapshotHappened
      ? new Date(effectiveSnapshotIso).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

  // For "Latest snapshot:" line
  const snapshotDateLabel =
    effectiveSnapshotIso
      ? new Date(effectiveSnapshotIso).toLocaleString()
      : '—';

  // UI helpers for hero strip
  const showSnapshotPreFomo =
    currentPhase === 'scheduled' && isSnapshotSoon;

  const showSnapshotLocked =
    currentPhase === 'snapshot' && !!snapshotTimeLabel;

  // One-shot flash when snapshot fires
// useEffect(() => {
//   let timeoutId: number | undefined;
//
//   if (hasSnapshotHappened && !snapshotFiredRef.current) {
//     snapshotFiredRef.current = true;
//     setJustSnapshotFired(true);
//
//     timeoutId = window.setTimeout(() => {
//       setJustSnapshotFired(false);
//     }, 4000); // 4 seconds of extra “boom” after snapshot
//   }
//
//   return () => {
//     if (timeoutId) window.clearTimeout(timeoutId);
//   };
// }, [hasSnapshotHappened]);

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
          : currentPhase === 'done'
          ? 'Rewards distributed'
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
     Claim handler
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
     Progress bar + status summary
  ─────────────────────────── */

      const steps: { id: WindowPhase | 'closed'; label: string }[] = [
  { id: 'scheduled', label: 'Opens soon' },
  { id: 'snapshot', label: 'Snapshot window' }, // or 'Snapshot phase'
  { id: 'open', label: 'Claim window open' },
  { id: 'closed', label: 'Claim window closed' },
  {
    id: 'distribution',
    label: isDone
      ? 'Rewards distributed'
      : 'Reward distribution in progress',
  },
];
  
// Treat the final "done" phase as the same step as "distribution"
const effectivePhaseForSteps =
  currentPhase === 'done' ? 'distribution' : currentPhase;

const activeIndex = steps.findIndex((s) => s.id === effectivePhaseForSteps);
const activeStep = activeIndex >= 0 ? steps[activeIndex] : null;

    let progressMessage = '';
  if (currentPhase === 'scheduled') {
  progressMessage = isSnapshotSoon
    ? 'Snapshot engine is nearly armed. It can trigger shortly before the window opens – make sure your wallet holds the minimum.'
    : 'Claim window scheduled. Countdown shows when it opens.';
  } else if (currentPhase === 'snapshot') {
  progressMessage = snapshotTimeLabel
    ? `Snapshot locked at ${snapshotTimeLabel}. Eligibility for this round is set.`
    : 'Snapshot engine is armed. It can trigger at any moment – make sure your wallet holds the minimum.';
  } else if (currentPhase === 'open') {
  progressMessage =
      'Claim window open. Lock in your share before the countdown hits zero.';
  } else if (currentPhase === 'closed') {
  progressMessage =
      'Claim window closed. No new wallets can lock in for this round.';
  } else if (currentPhase === 'distribution') {
  progressMessage =
    'Rewards are being sent out - watch your wallet, this round is paying.';
  } else if (currentPhase === 'done') {
  progressMessage =
    'Round complete. Rewards landed – get ready for the next cycle.';
  }


  let statusSummary =
    'All systems nominal. Autonomous settlement sequence is active.';
  const hasAnyIssue = hasBackendIssue || hasContractIssue;

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
    'All systems nominal. This round is paying out - rewards are streaming on-chain.';
  } else if (currentPhase === 'done') {
    statusSummary =
    'All systems nominal. Rewards for this round are fully distributed. Standing by for the next window.';
  } else if (currentPhase === 'closed') {
    statusSummary =
      'All systems nominal. Claim window closed and standing by for the next round.';
  }

  let statusDotColor = 'bg-emerald-400';

  if (hasBackendIssue || hasContractIssue) statusDotColor = 'bg-amber-400';
  if (currentPhase === 'closed') statusDotColor = 'bg-slate-500';
  if (currentPhase === 'done') statusDotColor = 'bg-emerald-400';

  /* ───────────────────────────
     Render
  ─────────────────────────── */

   return (
    <main className="relative min-h-screen bg-slate-950 text-slate-50 overflow-x-hidden">
      {/* Update banner – shows after auto reload from new build */}
      {justUpdated && (
        <div className="fixed top-[56px] left-0 right-0 z-50 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/70 bg-emerald-500/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.5)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
            <span>Portal updated · You&apos;re on the latest build</span>
          </div>
        </div>
      )}

      {/* HERO BG */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/60 via-emerald-500/20 to-slate-950" />
        <div className="absolute -left-40 top-4 h-80 w-80 rounded-full bg-emerald-400/60 blur-3xl opacity-90" />
        <div className="absolute -right-40 top-10 h-80 w-80 rounded-full bg-sky-400/55 blur-3xl opacity-80" />
        <div className="absolute inset-x-[-40px] bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent" />
      </div>

      {/* TOP NAV */}
      <header className="sticky top-0 z-40 border-b border-slate-900/80 bg-black/60 backdrop-blur shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45)]">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-2 sm:gap-4 px-4 py-3 sm:px-6">
          {/* Left: logo + title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 ring-1 ring-slate-700/80 overflow-hidden shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all group-hover:ring-emerald-400/70 group-hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]">
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

          {/* Right nav */}
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

            {/* CA pill */}
            <button
              type="button"
              onClick={handleCopyCa}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/70 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200 hover:bg-slate-800 hover:border-emerald-400/60 hover:text-emerald-200 transition-all"
            >
              <span className="text-[10px] tracking-[0.22em] text-slate-400">
                CA
              </span>
              <span className="font-mono text-[11px] text-slate-100">
                {shortCa}
              </span>
            </button>

            <span className="hidden text-xs text-slate-500 sm:inline">
              {networkLabel}
            </span>

            <button
              type="button"
              onClick={handleConnectClick}
              className="hidden sm:inline-flex items-center rounded-full px-5 py-2 bg-gradient-to-r from-emerald-400/25 to-emerald-500/30 border border-emerald-400/40 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.25)] hover:from-emerald-400/35 hover:to-emerald-500/40 hover:border-emerald-400 hover:text-white transition-all"
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

      {/* MAIN CONTENT */}
      <div className="mx-auto w-full max-w-6xl px-0 sm:px-6 pb-14 pt-10">
        {/* HERO / CLAIM CARD */}
        <SoftCard>
          <div className="flex items-start justify-between gap-6">
            
           {/* LEFT COLUMN */}
<div className="flex flex-col">
  {/* Label + icon */}
  <p
    className={[
      'flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em]',
      isDone ? 'text-emerald-300' : 'text-slate-400',
    ].join(' ')}
  >
    {/* icon only when not done */}
    {!isDone && (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-[13px] w-[13px] text-emerald-300 opacity-90"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="9" className="opacity-30" />
        <circle cx="12" cy="12" r="5" className="opacity-60" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    )}

    {isDone
      ? 'ROUND COMPLETE • REWARDS SENT'
      : isLive
      ? 'WINDOW CLOSES IN'
      : isClosedOnly
      ? 'REWARDS DISTRIBUTION STARTS IN'
      : isDistributing
      ? 'REWARDS ON THE WAY'
      : 'NEXT WINDOW IN'}
  </p>

  {/* Countdown OR phase text */}
  {shouldShowCountdown && countdownTargetIso && !isDone && (
    <div className={isLive ? 'relative mt-1.5' : 'mt-1.5'}>
      {isLive && (
        <div className="absolute inset-0 -z-10 blur-2xl opacity-20 bg-emerald-400/40" />
      )}
      <p
        className={[
          'text-[38px] sm:text-[34px] font-bold tracking-tight text-slate-50 leading-none',
          isFinalTen ? 'animate-[pulse_0.35s_ease-in-out_infinite]' : '',
        ].join(' ')}
      >
        {countdownLabel || '--:--:--'}
      </p>
    </div>
  )}

  {!shouldShowCountdown && (
    <p className="mt-2 text-[13px] text-slate-400/90 max-w-xl">
      {currentPhase === 'closed'
        ? 'Claim window closed. Rewards for this round are being prepared - payout starts shortly.'
        : currentPhase === 'distribution'
        ? 'Rewards are being paid out right now. Check your wallet and recent activity.'
        : 'Check your wallet - this round just paid out. Next window will be announced soon.'}
    </p>
  )}

  {/* Snapshot pre-warning (before it fires) */}
  {showSnapshotPreFomo && (
    <div
      className="
        mt-2 inline-flex items-center gap-3
        rounded-full border border-amber-400/70
        bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-emerald-400/15
        px-4 py-1.5
        shadow-[0_0_24px_rgba(251,191,36,0.65)]
      "
    >
      <div className="relative flex h-[18px] w-[32px] items-center justify-center">
        <span className="absolute h-[18px] w-[32px] rounded-full bg-amber-400/25 blur-md opacity-80" />
        <span className="absolute h-[14px] w-[28px] rounded-full border border-amber-300/70 bg-amber-300/10" />
        <span className="relative h-[8px] w-[8px] rounded-full bg-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.95)] animate-ping" />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-50">
        Snapshot engine is arming - make sure your wallet holds the minimum.
      </p>
    </div>
  )}

  {/* Snapshot locked pill */}
  {showSnapshotLocked && (
    <div
      className={[
        'mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 border',
        'bg-emerald-500/8 border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.4)]',
        justSnapshotFired
          ? 'ring-2 ring-emerald-300/80 shadow-[0_0_24px_rgba(16,185,129,0.9)] animate-[pulse_0.7s_ease-in-out_infinite]'
          : '',
      ].join(' ')}
    >
      <span className="relative inline-flex h-[10px] w-[20px] items-center justify-start rounded-full border border-emerald-300/70 bg-emerald-300/10 shadow-[0_0_14px_rgba(16,185,129,0.9)]">
        <span className="ml-[3px] h-[6px] w-[6px] rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.95)]" />
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-100">
        Snapshot locked at {snapshotTimeLabel} - eligibility for this round is locked.
      </span>
    </div>
  )}
</div> 

                    <div className="flex flex-col items-end text-right">
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400/80">
    CURRENT ROUND POOL
  </p>

                        <div className="relative group">
                          <button
                            type="button"
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-800/80 text-slate-300 text-[10px] font-bold border border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition"
                          >
                            ?
                          </button>
                          <div className="pointer-events-none absolute left-full ml-3 top-2 w-72 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                            <div className="rounded-2xl border border-slate-700/70 bg-slate-900/95 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.55)] text-left">
                              <p className="text-[12px] text-slate-200 leading-relaxed">
                                Rewards are paid in{' '}
                                <span className="text-emerald-300 font-medium">
                                  $CLAIM
                                </span>{' '}
                                and shared equally among wallets that locked in
                                during the live window.{' '}
                                <span className="text-emerald-300 font-medium">
                                  USD values are approximate.
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-1.5 flex items-end justify-end">
                        <p className="text-[24px] sm:text-[32px] font-semibold tracking-tight text-slate-50 leading-none">
                          {rewardAmountText}
                          <span className="ml-1 text-[14px] sm:text-[15px] text-emerald-300 font-semibold leading-none">
                            $CLAIM
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
  type="button"
  onClick={handleClaimClick}
  disabled={!canClaim}
  className={[
    // layout
    'mt-6 w-full flex items-center justify-center',
    // shape + text
    'rounded-[999px] border px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.32em]',
    'transition-all duration-300',
    // states
    canClaim
      ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.65)] hover:bg-emerald-400'
      : isClosedOnly
      ? 'bg-slate-900 text-slate-500 border-slate-700 cursor-not-allowed'
      : isDistributing
      ? 'bg-slate-950/80 text-emerald-200 border-emerald-400/50 cursor-default'
      : isDone
      ? 'bg-slate-950/80 text-emerald-200 border-emerald-400/60 cursor-default'
      : 'bg-slate-950/80 text-slate-200 border-emerald-400/40 shadow-[0_0_18px_rgba(16,185,129,0.35)] cursor-not-allowed',
    canClaim && isPulseOn ? 'animate-pulse' : '',
  ].join(' ')}
>
  {canClaim
    ? 'Lock in my share'
    : isClosedOnly
    ? 'Claim window closed'
    : isDistributing
    ? 'Distribution in progress'
    : isDone
    ? 'Rewards distributed'
    : 'Opens soon'}
</button>

                  {/* Bullets */}
                  <div className="mt-6 space-y-0 text-[11.5px] text-slate-400/80 leading-relaxed">
                    <p>
                      •{' '}
                      <span className="text-emerald-300/70 font-medium">
                        Show up
                      </span>{' '}
                      during the live window and{' '}
                      <span className="text-emerald-300/70 font-medium">
                        lock in your share
                      </span>
                      .
                    </p>
                    <p>
                      • Eligibility: hold 1,000,000 $CLAIM at the{' '}
                      <span className="text-emerald-300/70 font-medium">
                        snapshot
                      </span>{' '}
                      - wallets below the minimum sit out that round.
                    </p>
                    <p>
                      • Rewards are auto-distributed in{' '}
                      <span className="text-emerald-300/70 font-medium">
                        $CLAIM
                      </span>{' '}
                      via the{' '}
                      <span className="text-emerald-300/70 font-medium">
                        on-chain rewards engine
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>

              {/* MOBILE CONNECT CTA */}
              <div className="block sm:hidden mt-2 mb-2">
                <button
                  type="button"
                  onClick={handleConnectClick}
                  className="w-full flex items-center justify-center rounded-[28px] px-6 py-4 text-[13px] font-semibold uppercase tracking-[0.32em] bg-gradient-to-b from-emerald-500/10 via-slate-900/80 to-slate-900/90 text-slate-100 border border-emerald-400/40 shadow-[0_0_28px_rgba(16,185,129,0.45)] active:scale-[0.98] transition-all"
                >
                  {connectedWallet
                    ? `${connectedWallet.name} connected`
                    : effectiveWalletConnected
                    ? 'Wallet connected'
                    : 'Connect wallet'}
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN – Mission Control */}
            <div className="w-full md:max-w-xs mt-8 md:mt-[18px]">
              <SoftCard className="relative space-y-4 py-7 min-h-[340px]">
                {/* Header row */}
                <div className="flex items-baseline justify-between pr-1">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.32em] text-slate-500">
                    Round {roundNumber ?? 1}
                  </p>
                  <span
                    className={[
                      'text-[12px] font-semibold uppercase tracking-[0.32em]',
                      hasAnyIssue ? 'text-amber-300' : 'text-emerald-400',
                    ].join(' ')}
                  >
                    {hasAnyIssue ? '⚠ Mission Control' : 'Mission Control'}
                  </span>
                </div>

                {/* Snapshot info */}
                <div className="space-y-1">
                  <p className="text-[20px] font-semibold text-slate-100">
                    Snapshot #{snapshotBlock}
                  </p>
                  <p className="text-[12px] text-slate-400">
                    {currentPhase === 'open'
                      ? 'window open'
                      : currentPhase === 'scheduled'
                      ? 'window scheduled'
                      : currentPhase === 'distribution'
                      ? 'distributing'
                      : 'window closed'}
                  </p>
                </div>

                {/* Status rows */}
                <div className="mt-3 space-y-3">
                  {missionRows.map((row) => {
                    const isPill = row.mode === 'pill';
                    const plainValueClass =
                      row.tone === 'success'
                        ? 'text-[12px] text-emerald-300'
                        : row.tone === 'warning'
                        ? 'text-[12px] text-amber-300'
                        : 'text-[12px] text-slate-400';

                    const showWarningUnderline =
                      row.tone === 'warning' && !isPill;

                    return (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-[12.5px] text-slate-300 whitespace-nowrap">
                          {row.label}
                        </span>

                        {isPill ? (
                          <span
                            className={[
                              'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5',
                              'text-[10px] font-semibold uppercase tracking-[0.22em] whitespace-nowrap border',
                              row.tone === 'success'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                                : row.tone === 'warning'
                                ? 'bg-amber-500/10 text-amber-200 border-amber-500/40'
                                : 'bg-slate-900/80 text-slate-300 border-slate-700/70',
                            ].join(' ')}
                          >
                            <span
                              className={[
                                'h-1.5 w-1.5 rounded-full',
                                row.tone === 'success'
                                  ? 'bg-emerald-400'
                                  : row.tone === 'warning'
                                  ? 'bg-amber-400'
                                  : 'bg-slate-500/70',
                              ].join(' ')}
                            />
                            {row.value}
                          </span>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className={plainValueClass}>{row.value}</span>
                            {showWarningUnderline && (
                              <span className="mt-0.5 h-[1px] w-full rounded-full bg-amber-400/90 shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-pulse" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Autopilot strip */}
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Smart-contract autopilot
                  </span>
                  <div className="h-4 w-px bg-slate-700/60" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                    Enabled
                  </span>
                </div>

                {/* Status band */}
                <div className="mt-4 border-t border-slate-800/70 pt-3 space-y-1">
                  <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/90 shadow-[0_18px_40px_rgba(0,0,0,0.7)] overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <span
                        className={[
                          'mt-[2px] h-2 w-2 rounded-full flex-none',
                          statusDotColor,
                          'shadow-[0_0_10px_currentColor]',
                          'animate-[pulse_2.6s_ease-in-out_infinite]',
                        ].join(' ')}
                      />
                      <div className="flex-1 space-y-0.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          System status
                        </p>
                        <p className="text-[13px] leading-snug text-slate-300">
                          {statusSummary}
                        </p>
                      </div>
                    </div>
                    <div className="h-px w-full bg-gradient-to-r from-emerald-400/40 via-transparent to-sky-400/40" />
                  </div>
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

            {/* desktop timeline */}
            <div className="mt-1 hidden sm:flex items-center justify-between gap-3">
              {steps.map((step, index) => {
                const isDone = activeIndex >= index;
                const isActiveStep = step.id === currentPhase;

                return (
                  <div
                    key={step.id}
                    className="flex flex-1 flex-col items-center"
                  >
                    <div
                      className={[
                        'h-2 w-full rounded-full',
                        index === 0 ? '' : 'ml-1',
                        isDone ? 'bg-emerald-400' : 'bg-slate-800',
                      ].join(' ')}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className={[
                          'h-2.5 w-2.5 rounded-full border',
                          isDone
                            ? 'bg-emerald-400 border-emerald-300'
                            : 'bg-slate-800 border-slate-600',
                          isActiveStep
                            ? 'animate-[pulse_1.6s_ease-in-out_infinite]'
                            : '',
                        ].join(' ')}
                      />
                      <span
                        className={[
                          'tracking-wide',
                          isDone
                            ? 'text-[12px] font-semibold text-slate-300'
                            : 'text-[12px] font-medium text-slate-500',
                        ].join(' ')}
                      >
                        {step.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* mobile bar */}
            <div className="mt-2 sm:hidden space-y-2">
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{
                    width:
                      activeIndex >= 0
                        ? `${((activeIndex + 1) / steps.length) * 100}%`
                        : '0%',
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {activeStep ? activeStep.label : 'Round progress'}
              </p>
            </div>

            <p className="mt-3 text-[12px] text-slate-200">{progressMessage}</p>
          </div>
        </SoftCard>

        {/* Three mini-cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* pool size */}
          <SoftCard>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Current reward pool
            </p>
            <div className="mt-2 space-y-1">
              <p className="text-[18px] sm:text-[20px] font-semibold text-slate-50">
                {rewardAmountText}
                <span className="ml-1 text-[15px] sm:text-[16px] text-emerald-400">
                  CLAIM
                </span>
              </p>
              <p className="text-[13px] text-slate-400">
                ≈{' '}
                <span className="font-semibold text-emerald-300">
                  {rewardUsdText} USD
                </span>
              </p>
            </div>
            <div className="mt-4 border-t border-slate-800/70 pt-3 flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Contract address
              </p>
              <button
                type="button"
                onClick={handleCopyCa}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-[11px] font-medium text-slate-200 border border-slate-700/80 hover:border-emerald-400/60 hover:text-emerald-200 hover:bg-slate-900/90 transition-colors"
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

          {/* minimum holding */}
          <SoftCard>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Minimum holding
            </p>
            <div className="mt-2 space-y-1">
              <p className="text-[18px] sm:text-[20px] font-semibold text-slate-50">
                {MIN_HOLDING.toLocaleString('en-US')} CLAIM
              </p>
              <p className="text-[13px] text-slate-400">
                Held in the connected wallet at snapshot.
              </p>
            </div>
            <div className="mt-4">
              <a
                href={JUPITER_BUY_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500/15 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300 hover:bg-emerald-500/25 transition-colors"
              >
                Buy $CLAIM on Jupiter
              </a>
            </div>
          </SoftCard>

          {/* your eligibility */}
          <SoftCard>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Your eligibility
            </p>
            <div className="mt-2 space-y-1">
              <p
                className={
                  eligibilityTitle === 'Wallet not connected'
                    ? 'text-[18px] sm:text-[20px] font-semibold text-emerald-300'
                    : isEligible
                    ? 'text-[18px] sm:text-[20px] font-semibold text-emerald-300'
                    : 'text-[18px] sm:text-[20px] font-semibold text-amber-300'
                }
              >
                {eligibilityTitle}
              </p>
              <p className="text-[13px] text-slate-400">{eligibilityBody}</p>
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

        {/* Tabs + snapshot info */}
        <section className="mt-10 grid gap-6 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)]">
          {/* LEFT: tabs */}
          <SoftCard>
            <div className="mb-5 inline-flex rounded-full bg-slate-900/80 p-1 text-[11px] font-semibold uppercase tracking-[0.22em]">
              {(['eligibility', 'rewards', 'history'] as PortalTab[]).map(
                (tab) => {
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
                }
              )}
            </div>

            <hr className="border-slate-800/80" />

            <div className="mt-5 space-y-4 leading-relaxed text-slate-300">
              {activeTab === 'eligibility' && (
                <div className="space-y-4">
                  <p className="text-[13px]">
                    The CLAIM pool is driven by proof-of-presence. Eligibility
                    comes from balances at specific snapshot blocks, not random
                    forms.
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-[13px] text-slate-400">
                    <li>
                      Hold at least{' '}
                      {MIN_HOLDING.toLocaleString('en-US')} CLAIM at the
                      snapshot block.
                    </li>
                    <li>
                      A single on-chain snapshot is taken each round and its
                      timing is intentionally flexible.
                    </li>
                    <li>
                      Optional bonus rules may reward long-term or early
                      participants.
                    </li>
                  </ul>
                  <p className="text-[11px] text-slate-500">
                    Eligibility is derived solely from the wallet’s token
                    balance as it existed at the snapshot slot for each round.
                  </p>
                </div>
              )}

              {activeTab === 'rewards' && (
                <div className="space-y-4">
                  <p className="text-[13px]">
                    Rewards are earned by presence. If you show up during the
                    live claim window and lock your share, you receive an equal
                    split of that round’s pool.
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-[13px] text-slate-400">
                    <li>Everyone who locks in receives an equal share.</li>
                    <li>Fewer wallets claiming = larger share per wallet.</li>
                    <li>
                      Rewards are distributed automatically after the window
                      closes.
                    </li>
                  </ul>
                  <p className="text-[11px] text-slate-500">
                    Claim windows follow strict timing via Solana timestamps.
                  </p>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <p className="text-[13px]">
                    Past rounds and distributions will appear here.
                  </p>
                  {claimHistory.length === 0 ? (
                    <p className="text-[11px] text-slate-500">
                      No claim history yet.
                    </p>
                  ) : (
                    <ul className="space-y-3 text-[13px] text-slate-400">
                      {claimHistory.map((entry, i) => (
                        <li
                          key={i}
                          className="rounded-lg bg-slate-900/50 p-3 text-[13px]"
                        >
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
          </SoftCard>

          {/* RIGHT: snapshot info */}
          <SoftCard className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Snapshot info
            </p>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-slate-50">
                Snapshot #{snapshotBlock}{' '}
                <span className="text-slate-400">• {networkLabel}</span>
              </p>
              <p className="text-[13px] leading-relaxed text-slate-400">
                Each round uses a single snapshot taken before the claim window
                opens. Wallets holding at least the minimum required amount of
                $CLAIM at that moment are eligible for that round - wallets
                below the minimum sit out until the next snapshot.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/70">
              <p className="text-[11px] text-slate-500">
                Latest snapshot:{' '}
                <span className="text-slate-300">{snapshotDateLabel}</span>
              </p>
            </div>
            <p className="pt-3 text-[11px] text-slate-500">
              © 2025 CLAIM portal · Subject to change. Built for serious
              holders, not random forms.
            </p>
          </SoftCard>
        </section>
      </div>

      {/* Sticky Buy CTA (desktop) */}
      <div className="hidden sm:block fixed bottom-4 right-4 z-50">
        <a
          href={JUPITER_BUY_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-full bg-emerald-500/90 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-950 shadow-[0_0_24px_rgba(16,185,129,0.65)] hover:bg-emerald-400 hover:text-slate-950 transition-colors"
        >
          Buy $CLAIM on Jupiter
        </a>
      </div>

      <ToastContainer />
    </main>
  );
}
