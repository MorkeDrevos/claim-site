'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

/* ───────────────────────────
   Types (match /api/portal-state)
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
};

/* ───────────────────────────
   Small UI helpers
─────────────────────────── */

function PillLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
      {children}
    </span>
  );
}

function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: Tone;
}) {
  const toneClasses: Record<Tone, string> = {
    neutral: 'bg-slate-800 text-slate-100 ring-1 ring-slate-700',
    success: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40',
    warning: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40',
    muted: 'bg-slate-800/60 text-slate-400 ring-1 ring-slate-700/60',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-800/70 bg-slate-950/80 px-6 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
      {children}
    </section>
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
  if (diff <= 0) return 'opens very soon';

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

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
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [targetIso]);

  return label;
}

/* ───────────────────────────
   API fetcher
─────────────────────────── */

async function getClaimPortalState(): Promise<ClaimPortalState> {
  const res = await fetch('/api/portal-state', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to load portal state');
  }
  return res.json();
}

/* ───────────────────────────
   Page
─────────────────────────── */

const MIN_ELIGIBLE_HOLD = 100_000;
const JUPITER_URL =
  'https://jup.ag/swap/SOL-CLAIM'; // TODO: swap URL with real $CLAIM route

export default function ClaimPoolPage() {
  const [state, setState] = useState<ClaimPortalState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>('eligibility');

  // Hook order: states → countdown → effect
  const countdownLabel = useCountdown(state?.claimWindowOpensAt ?? null);

  useEffect(() => {
    getClaimPortalState()
      .then(setState)
      .catch((err) => {
        console.error(err);
        setError('Unable to load portal data right now.');
      });
  }, []);

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-slate-50">
        <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-slate-50">
        <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <p className="text-sm text-slate-400">Loading…</p>
        </div>
      </main>
    );
  }

  const {
    walletConnected,
    walletShort,
    networkLabel,
    snapshotLabel,
    snapshotBlock,
    claimWindowStatus,
    eligibleAmount,
    frontEndStatus,
    contractStatus,
    firstPoolStatus,
    claimHistory,
  } = state;

  const isEligible =
    walletConnected && typeof eligibleAmount === 'number'
      ? eligibleAmount >= MIN_ELIGIBLE_HOLD
      : false;

  /* ───────── HERO layout: concept in 3 seconds ───────── */

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-900/80 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-700/80">
              <span className="text-[11px] font-semibold tracking-[0.18em] text-slate-100">
                $
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                CLAIM PORTAL
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-100">
                  $CLAIM
                </span>
                <nav className="hidden items-center gap-3 text-xs sm:flex">
                  <Link
                    href="/"
                    className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-100 ring-1 ring-slate-700"
                  >
                    Claim pool
                  </Link>
                  <Link
                    href="/analytics"
                    className="rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 ring-1 ring-slate-800 hover:bg-slate-900/60 hover:text-slate-200"
                  >
                    Analytics (soon)
                  </Link>
                </nav>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-950 shadow-[0_0_25px_rgba(16,185,129,0.55)] hover:bg-emerald-400"
          >
            Connect wallet
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-14 pt-10 sm:px-6">
        {/* HERO ROW */}
        <section className="grid gap-8 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:items-start">
          {/* Left – concept */}
          <div className="space-y-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-500">
              $CLAIM · TOKEN OF TIMING
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              Claim pool – Round 1
            </h1>

            <p className="max-w-xl text-sm text-slate-300">
              A reward pool opens. Everyone who clicks{' '}
              <span className="font-semibold">CLAIM</span> during the window
              shares the pool equally. Fewer claimers means a bigger share per
              wallet.
            </p>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 text-xs text-slate-200">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                How this round works
              </p>
              <ol className="space-y-1 list-decimal pl-4">
                <li>
                  Hold at least{' '}
                  <span className="font-semibold">
                    {MIN_ELIGIBLE_HOLD.toLocaleString('en-US')} $CLAIM
                  </span>{' '}
                  in your wallet.
                </li>
                <li>
                  When the window opens, connect your wallet and click CLAIM
                  once.
                </li>
                <li>
                  After the window closes, all claimers split the pool equally.
                </li>
              </ol>
              <p className="mt-3 text-[11px] text-slate-500">
                This page is a preview. Exact pool size and rules will be
                finalized before the snapshot.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <StatusBadge label={snapshotLabel} tone="muted" />
              <span>Snapshot determines who can join Round 1.</span>
            </div>
          </div>

          {/* Right – next window */}
          <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Next claim window
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  {claimWindowStatus}
                </p>
              </div>
              <StatusBadge label="Preview only" tone="muted" />
            </div>

            {countdownLabel && (
              <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200 border border-emerald-500/30">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Time until opening
                </p>
                <p className="mt-1 text-sm font-medium">
                  Opens in {countdownLabel}
                </p>
              </div>
            )}

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Eligibility requires a minimum balance of{' '}
                <span className="font-semibold">
                  {MIN_ELIGIBLE_HOLD.toLocaleString('en-US')} $CLAIM
                </span>{' '}
                in the connected wallet at snapshot.
              </p>
              <p className="text-[11px] text-slate-500">
                Once live, the CLAIM button will appear here and in the pool
                section below.
              </p>
            </div>
          </div>
        </section>

        {/* WALLET + ELIGIBILITY STRIP */}
        <Card>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            {/* Wallet summary */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Connected wallet
              </p>
              <p className="text-sm text-slate-100">
                {walletShort || 'Wallet not connected'}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <StatusBadge label={networkLabel} tone="muted" />
              </div>
            </div>

            {/* Eligibility summary */}
            <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Eligibility for Round 1
                </p>
                <StatusBadge
                  label={
                    !walletConnected
                      ? 'Connect to check'
                      : isEligible
                      ? 'Eligible'
                      : 'Below minimum'
                  }
                  tone={
                    !walletConnected ? 'muted' : isEligible ? 'success' : 'warning'
                  }
                />
              </div>

              <div className="text-slate-200">
                {!walletConnected && (
                  <p>
                    Connect a wallet to see if it meets the{' '}
                    {MIN_ELIGIBLE_HOLD.toLocaleString('en-US')} $CLAIM minimum.
                  </p>
                )}
                {walletConnected && isEligible && (
                  <p>
                    This wallet currently meets the{' '}
                    {MIN_ELIGIBLE_HOLD.toLocaleString('en-US')} $CLAIM minimum
                    for Round 1.
                  </p>
                )}
                {walletConnected && !isEligible && (
                  <p>
                    This wallet is below the{' '}
                    {MIN_ELIGIBLE_HOLD.toLocaleString('en-US')} $CLAIM minimum.
                    You can still qualify by accumulating more before the
                    snapshot.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
                <span>
                  Estimated eligible amount:{' '}
                  <span className="font-semibold text-slate-100">
                    {typeof eligibleAmount === 'number'
                      ? eligibleAmount.toLocaleString('en-US')
                      : '0'}{' '}
                    $CLAIM
                  </span>
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1">
                    Min: {MIN_ELIGIBLE_HOLD.toLocaleString('en-US')} $CLAIM
                  </span>
                  {walletConnected && !isEligible && (
                    <a
                      href={JUPITER_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950 hover:bg-emerald-400"
                    >
                      Get $CLAIM on Jupiter
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ROUND DETAILS + PORTAL STATUS */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Round details */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <PillLabel>Round 1 details</PillLabel>
              </div>

              <div className="grid gap-4 text-sm text-slate-200 sm:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Snapshot block
                  </p>
                  <p>{snapshotBlock}</p>
                  <p className="text-[11px] text-slate-500">
                    Eligibility is based on balances at this block height.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Minimum holding
                  </p>
                  <p>
                    {MIN_ELIGIBLE_HOLD.toLocaleString('en-US')} $CLAIM
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Wallets below this threshold cannot join this round.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Reward split
                  </p>
                  <p>Equal split per claimer</p>
                  <p className="text-[11px] text-slate-500">
                    1 claimer → 100% · 5 claimers → 20% each · 100 claimers →
                    1% each.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Portal status */}
          <Card>
            <div className="flex items-start justify-between gap-4">
              <PillLabel>Portal status</PillLabel>
              <StatusBadge label="Preview mode" tone="muted" />
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Front-end</span>
                <StatusBadge label={frontEndStatus} tone="success" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">CLAIM contract</span>
                <StatusBadge
                  label={contractStatus}
                  tone={contractStatus === 'In progress' ? 'warning' : 'success'}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">First pool</span>
                <StatusBadge
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

            <p className="mt-5 text-xs leading-relaxed text-slate-500">
              Once the claim contract is deployed and audited, this card will
              show the official contract address, audit links and real-time pool
              metrics mirrored from Solana.
            </p>
          </Card>
        </div>

        {/* TABS – keep as deep-dive */}
        <Card>
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-3">
            {(['eligibility', 'rewards', 'history'] as PortalTab[]).map(
              (tab) => {
                const labels: Record<PortalTab, string> = {
                  eligibility: 'Eligibility',
                  rewards: 'Rewards',
                  history: 'Claim history',
                };
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.18em] ${
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

          {/* Tab content */}
          <div className="pt-4 text-sm text-slate-300">
            {activeTab === 'eligibility' && (
              <div className="space-y-3">
                <p>
                  $CLAIM is a timing game. Eligibility is defined by balances at
                  specific snapshot blocks, not by manual forms.
                </p>
                <ul className="list-disc space-y-1 pl-5 text-slate-400">
                  <li>
                    Snapshot block and date will be announced before each round.
                  </li>
                  <li>
                    Round 1 requires at least{' '}
                    {MIN_ELIGIBLE_HOLD.toLocaleString('en-US')} $CLAIM.
                  </li>
                  <li>
                    Optional bonus rules may reward long-term or early
                    participants.
                  </li>
                </ul>
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="space-y-3">
                <p>
                  Rewards are distributed in cycles. Each claim pool defines its
                  size, snapshot rules and any vesting before the snapshot is
                  taken.
                </p>
                <p className="text-xs text-slate-500">
                  Full tokenomics and schedule will be published before the
                  first live round.
                </p>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                {claimHistory.length === 0 ? (
                  <p className="text-slate-400">
                    Once live, this section will show a simple history for your
                    connected wallet: amounts claimed per round, with
                    transaction links and any unclaimed allocations still
                    available.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {claimHistory.map((entry, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs"
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
                            $CLAIM
                          </p>
                        </div>
                        {entry.tx && (
                          <a
                            href={entry.tx}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300 hover:text-emerald-200"
                          >
                            View tx
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        <footer className="mt-2 flex flex-wrap items-center justify-between gap-3 pb-4 text-[11px] text-slate-500">
          <span>© 2025 $CLAIM portal · Preview UI · Subject to change.</span>
          <span>Powered by Solana · Built for serious holders, not random forms.</span>
        </footer>
      </div>
    </main>
  );
}
