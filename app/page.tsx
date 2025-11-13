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

  // optional reward info
  rewardPoolTokens?: number;
  rewardPoolUsd?: number;
};

type Phase = 'scheduled' | 'open' | 'closed' | 'unknown';

/* ───────────────────────────
   UI helpers
─────────────────────────── */

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
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}

function PillLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-700/80 bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
      {children}
    </span>
  );
}

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-slate-800/80 bg-slate-950/80 px-6 py-5 shadow-[0_26px_80px_rgba(0,0,0,0.65)] backdrop-blur transition-all ${className}`}
    >
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
  if (diff <= 0) return null;

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
    formatCountdown(targetIso),
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
   API
─────────────────────────── */

async function getClaimPortalState(): Promise<ClaimPortalState> {
  const res = await fetch('/api/portal-state', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to load portal state');
  }
  return res.json();
}

function getPhaseFromStatus(status?: string): Phase {
  if (!status) return 'unknown';
  const s = status.toLowerCase();
  if (s.startsWith('opens')) return 'scheduled';
  if (s.startsWith('closes') || s.startsWith('open')) return 'open';
  if (s.includes('closed')) return 'closed';
  return 'unknown';
}

/* ───────────────────────────
   Page
─────────────────────────── */

export default function ClaimPoolPage() {
  const [state, setState] = useState<ClaimPortalState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>('eligibility');

  const [phase, setPhase] = useState<Phase>('unknown');
  const [justOpened, setJustOpened] = useState(false);
  const phaseRef = useRef<Phase>('unknown');

  const minHolding = 100_000;

  // Poll state
  useEffect(() => {
    let alive = true;

    const load = () => {
      getClaimPortalState()
        .then((next) => {
          if (!alive) return;
          setState(next);
          setError(null);
          setPhase(getPhaseFromStatus(next.claimWindowStatus));
        })
        .catch((err) => {
          console.error(err);
          if (!alive) return;
          setError('Unable to load portal data right now.');
        });
    };

    load();
    const id = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // detect scheduled → open for subtle glow
  useEffect(() => {
    const prev = phaseRef.current;
    if (prev === 'scheduled' && phase === 'open') {
      setJustOpened(true);
      const t = setTimeout(() => setJustOpened(false), 2200);
      phaseRef.current = phase;
      return () => clearTimeout(t);
    }
    phaseRef.current = phase;
    return;
  }, [phase]);

  if (error) {
    return (
      <main className="min-h-screen bg-[#020617] text-slate-50">
        <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="min-h-screen bg-[#020617] text-slate-50">
        <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <p className="text-sm text-slate-400">Loading…</p>
        </div>
      </main>
    );
  }

  const countdownLabel = useCountdown(state.claimWindowOpensAt ?? null);

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
    rewardPoolTokens,
    rewardPoolUsd,
  } = state;

  const showBuyButton = walletConnected && eligibleAmount === 0;

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

      {/* Content */}
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-14 pt-8 sm:px-6 sm:pt-10">
        {/* Hero */}
        <section className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-500">
                $CLAIM • TOKEN OF TIMING
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-[32px]">
                  Claim pool – Round 1
                </h1>
                <StatusBadge label={snapshotLabel} tone="muted" />
              </div>
              <p className="max-w-xl text-[15px] leading-relaxed text-slate-300">
                A reward pool opens. Everyone who clicks{' '}
                <span className="font-semibold text-slate-50">CLAIM</span>{' '}
                during the window shares the pool equally. Fewer claimers means
                a bigger share per wallet.
              </p>
            </div>

            <p className="mt-1 text-[11px] text-right text-slate-500 sm:mt-0">
              <span className="font-semibold text-slate-300">
                Front-end preview
              </span>{' '}
              · Terms may change before Round 1 opens.
            </p>
          </div>

          {/* Main hero card */}
          <Card
            className={`relative overflow-hidden ${
              justOpened
                ? 'ring-2 ring-emerald-500/80 shadow-[0_0_55px_rgba(16,185,129,0.6)]'
                : ''
            }`}
          >
            {/* soft glow bg */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-emerald-500/8 via-transparent to-sky-500/6" />

            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              {/* Left: window info */}
              <div className="max-w-xl space-y-3">
                <PillLabel>Next claim window</PillLabel>
                <p className="text-2xl font-semibold text-slate-50 sm:text-[26px]">
                  {claimWindowStatus}
                </p>

                <p className="text-[15px] leading-relaxed text-slate-300">
                  When the window is live, a{' '}
                  <span className="font-semibold text-slate-50">CLAIM</span>{' '}
                  button appears inside this portal. Click once during the
                  window to join the pool. After the window closes, all
                  successful claimers split the pool equally.
                </p>

                <div className="mt-3 text-sm">
                  {countdownLabel ? (
                    <p className="font-medium text-emerald-300">
                      Opens in{' '}
                      <span className="font-semibold">{countdownLabel}</span>
                    </p>
                  ) : (
                    <p className="text-emerald-300">
                      Opening now – watch for the CLAIM button.
                    </p>
                  )}
                </div>
              </div>

              {/* Right: reward pool + quick stats */}
              <div className="w-full max-w-xs space-y-4 rounded-2xl bg-slate-950/80 px-4 py-4 ring-1 ring-slate-800/80">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Current reward pool
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-semibold text-slate-50">
                    {typeof rewardPoolTokens === 'number'
                      ? rewardPoolTokens.toLocaleString('en-US')
                      : 'TBA'}{' '}
                    <span className="text-sm font-normal text-slate-400">
                      $CLAIM
                    </span>
                  </p>
                  <p className="text-sm text-slate-400">
                    {typeof rewardPoolUsd === 'number'
                      ? `≈ $${rewardPoolUsd.toLocaleString('en-US', {
                          maximumFractionDigits: 0,
                        })} USD`
                      : ''}
                  </p>
                </div>

                <div className="mt-3 space-y-1 text-[12px] text-slate-400">
                  <p>
                    Min holding:{' '}
                    <span className="font-semibold text-slate-200">
                      {minHolding.toLocaleString('en-US')} $CLAIM
                    </span>{' '}
                    at the snapshot block.
                  </p>
                  <p>
                    Snapshot block:{' '}
                    <span className="font-mono text-slate-300">
                      {snapshotBlock}
                    </span>
                  </p>
                </div>

                {showBuyButton && (
                  <a
                    href="https://jup.ag/swap/SOL-CLAIM" // adjust CA pair later
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-950 shadow hover:bg-sky-400"
                  >
                    Buy $CLAIM on Jupiter
                  </a>
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* Connected wallet strip */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-200">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Connected wallet
              </p>
              <p className="text-sm text-slate-200">
                {walletConnected ? walletShort : 'Wallet not connected'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge label={networkLabel} tone="muted" />
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-slate-600/80 bg-slate-950 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 hover:border-slate-400"
              >
                {walletConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        </Card>

        {/* Two cards: your position + portal status */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Your position */}
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <PillLabel>Your position</PillLabel>
                <p className="text-sm font-medium text-slate-200">
                  Claim pool · Round 1
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Wallet in snapshot set
                </p>
                <p>
                  {walletConnected ? 'Pending check' : 'Connect to preview'} –
                  min{' '}
                  {minHolding.toLocaleString('en-US')}
                  &nbsp;$CLAIM.
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Estimated eligible amount
                </p>
                <p className="text-lg font-semibold text-slate-50">
                  {typeof eligibleAmount === 'number'
                    ? eligibleAmount.toLocaleString('en-US')
                    : 'TBA'}{' '}
                  <span className="text-xs text-slate-400">$CLAIM</span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Claim window
                </p>
                <p className="text-sm text-slate-200">
                  {countdownLabel ? (
                    <>
                      {claimWindowStatus}{' '}
                      <span className="text-emerald-300">
                        · Opens in {countdownLabel}
                      </span>
                    </>
                  ) : (
                    claimWindowStatus
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Snapshot block
                </p>
                <p>{snapshotBlock}</p>
              </div>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-slate-500">
              This preview does not move any funds and does not require a
              signature. Final eligibility will be mirrored from the audited
              on-chain contract once Round 1 is live.
            </p>
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

        {/* Tabs */}
        <Card>
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
              },
            )}
          </div>

          <div className="pt-4 text-sm text-slate-300">
            {activeTab === 'eligibility' && (
              <div className="space-y-3">
                <p className="text-[15px] leading-relaxed text-slate-300">
                  The $CLAIM pool is built around timing. Your eligibility is
                  determined by balances and activity at specific snapshot
                  blocks — not by random forms or manual lists.
                </p>
                <ul className="list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-slate-300">
                  <li>
                    You must hold at least{' '}
                    {minHolding.toLocaleString('en-US')} $CLAIM at the snapshot
                    block for the round.
                  </li>
                  <li>
                    Snapshot block and date will be announced before each round.
                  </li>
                  <li>
                    Optional bonus rules may reward long-term or early
                    participants.
                  </li>
                </ul>
                <p className="text-xs text-slate-500">
                  The final rule set for Round 1 will be published before the
                  snapshot is taken and mirrored here inside the portal.
                </p>
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="space-y-3">
                <p className="text-[15px] leading-relaxed text-slate-300">
                  Rewards will be distributed in clearly defined rounds. Each
                  pool will specify the reward size, snapshot rules and vesting
                  conditions (if any) before the snapshot is taken.
                </p>
                <p className="text-xs text-slate-500">
                  Detailed tokenomics and pool sizes will appear here once the
                  first round parameters are finalized.
                </p>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                {claimHistory.length === 0 ? (
                  <p className="text-[15px] leading-relaxed text-slate-300">
                    Once the first pool is live, this section will show a simple
                    history for your connected wallet: amounts claimed per
                    round, with transaction links and any unclaimed allocations
                    that are still available.
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
          <span>Powered by Solana · Built for timing, not forms.</span>
        </footer>
      </div>
    </main>
  );
}
