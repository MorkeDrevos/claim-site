'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/* ───────────────────────────
   Types
─────────────────────────── */

type PortalTab = 'eligibility' | 'rewards' | 'history';
type PoolStatus = 'not-opened' | 'open' | 'closed';
type Tone = 'neutral' | 'success' | 'warning' | 'muted';

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

  frontEndStatus: string;
  contractStatus: string;
  firstPoolStatus: PoolStatus;

  eligibleAmount: number;
  claimHistory: ClaimHistoryEntry[];

  // Optional extras
  rewardPoolAmountClaim?: number | null;
  rewardPoolAmountUsd?: number | null;
  windowPhase?: 'scheduled' | 'open' | 'closed';
};

/* ───────────────────────────
   Constants
─────────────────────────── */

// ✅ 1,000,000 minimum holding
const MIN_HOLDING = 1_000_000;
const JUPITER_BUY_URL = 'https://jup.ag/swap/SOL-CLAIM'; // adjust once token is live

/* ───────────────────────────
   UI helpers
─────────────────────────── */

function StatusPill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: Tone;
}) {
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
  if (diff <= 0) return 'opens any second';

  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours % 24 > 0) parts.push(`${hours % 24}h`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);

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

    const id = setInterval(update, 60_000); // once per minute
    return () => clearInterval(id);
  }, [targetIso]);

  return label;
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
  const [state, setState] = useState<ClaimPortalState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>('eligibility');
  const [isPulseOn, setIsPulseOn] = useState(false);

  // Local wallet (Phantom) – overrides preview wallet if user connects
  const [localWallet, setLocalWallet] = useState<string | null>(null);

  const lastWindowPhaseRef = useRef<string | null>(null);

  // Countdown always called
  const countdownLabel = useCountdown(state?.claimWindowOpensAt ?? null);

  // Initial load + polling
  useEffect(() => {
    let alive = true;

    const load = () => {
      getClaimPortalState()
        .then((data) => {
          if (!alive) return;

          const prevPhase = lastWindowPhaseRef.current;
          const nextPhase = (data as any)?.windowPhase ?? null;

          // Pulse when we flip into OPEN
          if (nextPhase === 'open' && prevPhase && prevPhase !== 'open') {
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

  /* ── Wallet connect handler (Phantom) ───────────────── */

  const handleConnectClick = async () => {
    try {
      const w = window as any;
      if (w.solana && w.solana.isPhantom) {
        const resp = await w.solana.connect();
        const pubkey = resp?.publicKey?.toString();
        if (pubkey) {
          setLocalWallet(pubkey);
        }
      } else {
        // No provider – send them to Phantom
        window.open('https://phantom.app/', '_blank');
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

  /* ── Derived values ───────────────── */

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
  } = state;

  // Use live connected wallet if present
  const effectiveWalletConnected = !!localWallet || walletConnected;
  const effectiveWalletShort = localWallet
    ? `${localWallet.slice(0, 4)}…${localWallet.slice(-4)}`
    : walletShort;

  const rawPhase = (state as any).windowPhase as
    | 'scheduled'
    | 'open'
    | 'closed'
    | undefined;

  const lowerStatus = claimWindowStatus.toLowerCase();
  let phase: 'scheduled' | 'open' | 'closed' = 'scheduled';

  if (rawPhase) {
    phase = rawPhase;
  } else if (lowerStatus.includes('closed')) {
    phase = 'closed';
  } else if (lowerStatus.includes('closes')) {
    phase = 'open';
  } else {
    phase = 'scheduled';
  }

  const isLive = phase === 'open';
  const isClosed = phase === 'closed';

  const isEligible = eligibleAmount >= MIN_HOLDING;

  const rewardAmountText =
    typeof rewardPoolAmountClaim === 'number'
      ? rewardPoolAmountClaim.toLocaleString('en-US')
      : 'TBA';

  const rewardUsdText =
    typeof rewardPoolAmountUsd === 'number'
      ? `$${rewardPoolAmountUsd.toLocaleString('en-US')}`
      : 'Soon';

  /* ─────────────────────────── */

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
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-700/80">
              <span className="text-[11px] font-semibold tracking-[0.18em]">
                $
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                CLAIM PORTAL
              </span>
              <span className="text-sm font-medium text-slate-100">
                CLAIM – Token of Timing
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">
              {networkLabel}
            </span>
            <button
              type="button"
              onClick={handleConnectClick}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-950 shadow-[0_0_28px_rgba(16,185,129,0.75)] hover:bg-emerald-400"
            >
              {effectiveWalletConnected ? 'Wallet connected' : 'Connect wallet'}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-10 sm:px-6">
        {/* HERO: Next claim window */}
        <SoftCard>
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            {/* Left: window info + CLAIM button + stats */}
            <div className="flex-1 space-y-6">
              {/* Title + description */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <span>Claim pool — Round 1</span>
                  <span className="h-px w-6 bg-slate-700" />
                  <span>{snapshotLabel}</span>
                </div>

                <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-[32px]">
                  Next claim window
                </h1>

                <p className="max-w-xl text-[15px] leading-relaxed text-slate-300">
                  Hold at least{' '}
                  <span className="font-semibold text-slate-50">
                    1,000,000&nbsp;$CLAIM
                  </span>{' '}
                  at snapshot and click once while the window is live to share
                  the reward pool equally with everyone else who shows up.
                </p>
              </div>

              {/* Big CLAIM button */}
              <div
                className={`relative overflow-hidden rounded-2xl border px-4 py-4 sm:px-6 sm:py-5 ${
                  isLive
                    ? 'border-emerald-500/70 bg-gradient-to-r from-emerald-500/15 via-slate-950 to-slate-950 shadow-[0_0_40px_rgba(34,197,94,0.55)]'
                    : 'border-slate-800 bg-slate-950/80'
                } ${isPulseOn ? 'animate-pulse' : ''}`}
              >
                <div className="space-y-4">
                  <button
                    type="button"
                    disabled={!isLive}
                    className={`w-full rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-[0.26em] ${
                      isLive
                        ? 'bg-emerald-400 text-emerald-950 shadow-[0_0_36px_rgba(74,222,128,0.8)] hover:bg-emerald-300'
                        : 'cursor-not-allowed bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isLive
                      ? 'Claim this window'
                      : 'Claim button appears when live'}
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">
                        {claimWindowStatus}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {countdownLabel && !isClosed && (
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                          {isLive ? 'Closes in ' : 'Opens in '}
                          {countdownLabel}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500">
                        Snapshot {snapshotBlock} · {networkLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stat strip */}
              <div className="grid gap-3 text-xs text-slate-300 sm:grid-cols-3">
                {/* Reward pool */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Current reward pool
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-50">
                    {rewardAmountText}{' '}
                    <span className="text-xs text-slate-400">CLAIM</span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    USD value: {rewardUsdText}
                  </p>
                </div>

                {/* Minimum holding */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Minimum holding
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-50">
                    {MIN_HOLDING.toLocaleString('en-US')}{' '}
                    <span className="text-xs text-slate-400">CLAIM</span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Held in the connected wallet at snapshot.
                  </p>
                </div>

                {/* Your preview eligibility */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Your preview eligibility
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-50">
                    {effectiveWalletConnected
                      ? `${eligibleAmount.toLocaleString('en-US')} CLAIM`
                      : 'Wallet not connected'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {effectiveWalletConnected
                      ? isEligible
                        ? 'At or above the minimum for this round.'
                        : 'Below minimum. Connect a different wallet or top up.'
                      : 'Connect a Solana wallet to preview this value.'}
                  </p>
                  {effectiveWalletConnected && !isEligible && (
                    <a
                      href={JUPITER_BUY_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300 hover:text-emerald-200"
                    >
                      Buy CLAIM on Jupiter →
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right: claim control + system status */}
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
                    {effectiveWalletConnected
                      ? effectiveWalletShort
                      : 'Connect wallet'}
                  </button>
                  <p className="text-[11px] text-slate-500">
                    During live rounds this button will trigger the on-chain
                    claim call. In the preview, it&apos;s visual only.
                  </p>
                </div>
              </div>

              {/* System status */}
              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-xs">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    System status
                  </p>
                  <StatusPill label="Preview mode" tone="muted" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-400">Front-end</span>
                    <StatusPill label={frontEndStatus} tone="success" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-400">CLAIM contract</span>
                    <StatusPill
                      label={contractStatus}
                      tone={
                        contractStatus === 'In progress' ? 'warning' : 'success'
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-400">First pool</span>
                    <StatusPill
                      label={
                        firstPoolStatus === 'not-opened'
                          ? 'Not opened'
                          : firstPoolStatus === 'open'
                          ? 'Open'
                          : 'Closed'
                      }
                      tone={firstPoolStatus === 'open' ? 'success' : 'muted'}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SoftCard>

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

            <div className="space-y-3 text-sm text-slate-300">
              {activeTab === 'eligibility' && (
                <>
                  <p>
                    The CLAIM pool is driven by proof-of-presence. Eligibility
                    comes from balances at specific snapshot blocks, not random
                    forms.
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-slate-400">
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
                  <p className="text-xs text-slate-500">
                    The final rule set for each round will be published before
                    the snapshot and mirrored here inside the portal.
                  </p>
                </>
              )}

              {activeTab === 'rewards' && (
                <>
                  <p>
                    Each claim window is a fixed reward pool. Everyone who
                    successfully clicks CLAIM during the live window shares that
                    pool equally.
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-slate-400">
                    <li>
                      One click per eligible wallet per window – no extra
                      advantage for multiple clicks.
                    </li>
                    <li>
                      Fewer claimers means a larger share per wallet.
                    </li>
                    <li>
                      All successful claimers split the pool after the window
                      closes.
                    </li>
                  </ul>
                  <p className="text-xs text-slate-500">
                    Once the audited contract is wired, the exact pool sizes and
                    on-chain distribution will be mirrored automatically.
                  </p>
                </>
              )}

              {activeTab === 'history' && (
                <>
                  {claimHistory.length === 0 ? (
                    <p className="text-slate-400">
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
                © 2025 CLAIM portal · Preview UI · Subject to change. Built for
                serious holders, not random forms.
              </p>
            </div>
          </SoftCard>
        </div>
      </div>
    </main>
  );
}
