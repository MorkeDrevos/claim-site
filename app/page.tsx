'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/* ───────────────────────────
   Types
─────────────────────────── */

type PoolStatus = 'not-opened' | 'open' | 'closed';
type PortalTab = 'eligibility' | 'rewards' | 'history';
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

  claimWindowStatus: string;          // human text
  claimWindowOpensAt?: string | null;
  claimWindowClosesAt?: string | null;
  claimWindowRawStatus?: string;      // 'scheduled' | 'open' | 'closed' (optional)

  frontEndStatus: string;
  contractStatus: string;
  firstPoolStatus: PoolStatus;

  eligibleAmount: number;

  rewardPoolTokens?: number;
  rewardPoolUsd?: number;

  claimHistory: ClaimHistoryEntry[];
};

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
  const tones: Record<Tone, string> = {
    neutral:
      'bg-slate-900/80 text-slate-100 ring-1 ring-slate-700/80',
    success:
      'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40',
    warning:
      'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/40',
    muted:
      'bg-slate-900/60 text-slate-400 ring-1 ring-slate-700/60',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${tones[tone]}`}>
      {label}
    </span>
  );
}

function SmallCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-[#020617]/90 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.6)]">
      {children}
    </div>
  );
}

function formatCountdown(targetIso?: string | null): string | null {
  if (!targetIso) return null;
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) return null;

  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return 'any second';

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
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
   API
─────────────────────────── */

async function fetchPortalState(): Promise<ClaimPortalState> {
  const res = await fetch('/api/portal-state', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load portal state');
  return res.json();
}

/* ───────────────────────────
   Page
─────────────────────────── */

export default function ClaimPoolPage() {
  const [state, setState] = useState<ClaimPortalState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>('eligibility');
  const [justOpened, setJustOpened] = useState(false);

  const prevStatusRef = useRef<string | null>(null);
  const minHolding = 100_000;

  // countdown hook – always called
  const countdownLabel = useCountdown(state?.claimWindowOpensAt ?? null);

  // initial load
  useEffect(() => {
    fetchPortalState()
      .then(setState)
      .catch((err) => {
        console.error(err);
        setError('Unable to load portal right now.');
      });
  }, []);

  // background refresh every 30s
  useEffect(() => {
    const id = setInterval(() => {
      fetchPortalState()
        .then(setState)
        .catch((err) => console.error(err));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  // detect “window just went live” for subtle pulse
  useEffect(() => {
    if (!state) return;

    const raw = (
      state.claimWindowRawStatus || state.claimWindowStatus
    ).toLowerCase();

    const prev = prevStatusRef.current;
    prevStatusRef.current = raw;

    const looksOpen =
      raw.includes('open') || raw.includes('live') || raw.includes('closes');
    const prevOpen =
      (prev ?? '').includes('open') ||
      (prev ?? '').includes('live') ||
      (prev ?? '').includes('closes');

    if (!prevOpen && looksOpen) {
      setJustOpened(true);
      const t = setTimeout(() => setJustOpened(false), 4000);
      return () => clearTimeout(t);
    }
  }, [state]);

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-slate-50">
        <div className="mx-auto max-w-5xl px-4 pt-16">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-slate-50">
        <div className="mx-auto max-w-5xl px-4 pt-16">
          <p className="text-sm text-slate-400">Loading $CLAIM portal…</p>
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
    frontEndStatus,
    contractStatus,
    firstPoolStatus,
    claimHistory,
  } = state;

  const rewardPoolTokens = state.rewardPoolTokens ?? 0;
  const rewardPoolUsd = state.rewardPoolUsd ?? 0;
  const eligibleAmount = state.eligibleAmount ?? 0;

  const rewardIsLive =
    (state.claimWindowRawStatus ?? '').toLowerCase() === 'open' ||
    claimWindowStatus.toLowerCase().includes('live') ||
    claimWindowStatus.toLowerCase().includes('closes');

  // CTA logic – *visual only*, no onClick yet
  let claimLabel = 'Claim window closed';
  let claimSub = 'Watch the countdown for the next round.';
  let claimDisabled = true;

  if (!walletConnected) {
    claimLabel = 'Connect wallet';
    claimSub = 'Connect a Solana wallet to be ready when the window opens.';
  } else if (!rewardIsLive) {
    claimLabel = 'Waiting for window';
    claimSub = countdownLabel
      ? `Opens in ${countdownLabel}.`
      : 'Next window will be announced soon.';
  } else {
    claimLabel = 'Claim this round';
    claimDisabled = false;
    claimSub = 'Click once during the live window to join the pool.';
  }

  const showBuyButton = walletConnected && eligibleAmount === 0;

  const rewardCardGlow = rewardIsLive
    ? justOpened
      ? 'ring-2 ring-emerald-400/80 animate-[pulse_1.4s_ease-out_3]'
      : 'ring-1 ring-emerald-500/40'
    : 'ring-0';

  /* ───────────────────────────
     Layout
  ─────────────────────────── */

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-slate-50">
      {/* Top nav (kept minimal) */}
      <header className="border-b border-slate-900/80 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 ring-1 ring-slate-700/80">
              <span className="text-[11px] font-semibold tracking-[0.18em] text-slate-100">
                $
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                CLAIM PORTAL
              </span>
              <span className="text-sm font-semibold text-slate-100">
                $CLAIM – Token of Timing
              </span>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-950 shadow-[0_0_26px_rgba(16,185,129,0.6)] hover:bg-emerald-400"
          >
            Connect wallet
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-14 pt-10 sm:px-6">
        {/* Hero: next window + CLAIM button */}
        <section className="rounded-[32px] border border-slate-900/80 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900/60 px-6 py-7 shadow-[0_26px_90px_rgba(0,0,0,0.75)] sm:px-8 md:px-10 md:py-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            {/* Left: copy + countdown */}
            <div className="space-y-4 max-w-xl">
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill label="Claim pool – Round 1" tone="muted" />
                <StatusPill label={snapshotLabel} tone="muted" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
                  Next claim window
                </h1>
                <p className="text-sm text-slate-300">
                  A timed reward pool. Hold{' '}
                  <span className="font-semibold">
                    {minHolding.toLocaleString('en-US')} $CLAIM
                  </span>{' '}
                  at snapshot and click once while the window is live to share
                  the pool equally.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-slate-100">{claimWindowStatus}</span>
                {countdownLabel && !rewardIsLive && (
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-emerald-300">
                    Opens in {countdownLabel}
                  </span>
                )}
                {rewardIsLive && (
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/40">
                    Live now – watch for the CLAIM button
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500">
                Snapshot: <span className="font-mono">{snapshotBlock}</span> ·
                Network: {networkLabel}
              </p>
            </div>

            {/* Right: CLAIM button block */}
            <div className="w-full max-w-xs">
              <div
                className={`rounded-[26px] border border-slate-800/80 bg-slate-950/90 p-4 text-center ${rewardCardGlow}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Claim control
                </p>

                <button
                  type="button"
                  disabled={claimDisabled}
                  className={`mt-4 inline-flex h-24 w-full items-center justify-center rounded-[20px] text-sm font-semibold uppercase tracking-[0.26em] transition
                  ${
                    claimDisabled
                      ? 'bg-slate-900 text-slate-500 cursor-default'
                      : 'bg-emerald-500 text-emerald-950 shadow-[0_0_40px_rgba(16,185,129,0.7)] hover:bg-emerald-400'
                  }`}
                >
                  {claimLabel}
                </button>

                <p className="mt-3 text-[11px] text-slate-400">{claimSub}</p>

                {showBuyButton && (
                  <a
                    href="https://jup.ag/swap/SOL-CLAIM"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-100 hover:bg-slate-800"
                  >
                    Buy $CLAIM on Jupiter
                  </a>
                )}

                <p className="mt-3 text-[11px] text-slate-500">
                  This button is visual only in the preview. The live contract
                  call will be wired in later.
                </p>
              </div>
            </div>
          </div>

          {/* Hero stats row */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <SmallCard>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Current reward pool
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-50">
                {rewardPoolTokens
                  ? rewardPoolTokens.toLocaleString('en-US')
                  : 'TBA'}{' '}
                <span className="text-xs text-slate-400">$CLAIM</span>
              </p>
              <p className="text-xs text-slate-400">
                {rewardPoolUsd
                  ? `≈ $${rewardPoolUsd.toLocaleString('en-US')} USD`
                  : 'USD value will be shown once wired.'}
              </p>
            </SmallCard>

            <SmallCard>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Minimum holding
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-50">
                {minHolding.toLocaleString('en-US')}{' '}
                <span className="text-xs text-slate-400">$CLAIM</span>
              </p>
              <p className="text-xs text-slate-400">
                Held in the connected wallet at the snapshot block for this
                round.
              </p>
            </SmallCard>

            <SmallCard>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Connected wallet
              </p>
              <p className="mt-1 text-sm text-slate-100">
                {walletConnected ? walletShort : 'Not connected'}
              </p>
              <p className="text-xs text-slate-400">
                Eligible amount preview:{' '}
                <span className="font-semibold">
                  {eligibleAmount.toLocaleString('en-US')} $CLAIM
                </span>
              </p>
            </SmallCard>
          </div>
        </section>

        {/* Lower section – simple, not busy */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Tabs */}
          <div className="rounded-3xl border border-slate-900/80 bg-slate-950/80 px-6 py-5">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-3">
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

            <div className="pt-4 text-sm text-slate-300">
              {activeTab === 'eligibility' && (
                <div className="space-y-3">
                  <p>
                    The $CLAIM pool is driven by proof-of-presence. Eligibility
                    comes from balances at specific snapshot blocks, not random
                    forms.
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-slate-400">
                    <li>
                      Hold at least{' '}
                      {minHolding.toLocaleString('en-US')} $CLAIM at the
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
                    Final rule set for each round will be published before the
                    snapshot and mirrored here.
                  </p>
                </div>
              )}

              {activeTab === 'rewards' && (
                <div className="space-y-3">
                  <p>
                    Every round has a fixed reward pool. Everyone who clicks
                    CLAIM during the window shares the pool equally — fewer
                    claimers means a larger slice per wallet.
                  </p>
                  <p className="text-xs text-slate-500">
                    Vesting, bonus multipliers or future mechanics will be
                    described here once they&apos;re live.
                  </p>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3">
                  {claimHistory.length === 0 ? (
                    <p className="text-slate-400">
                      Once the first pool is live, this section will show a
                      simple timeline of your claims: round, amount and
                      transaction link per entry.
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
          </div>

          {/* System status – slim, not loud */}
          <div className="rounded-3xl border border-slate-900/80 bg-slate-950/80 px-6 py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  System status
                </p>
                <p className="text-sm text-slate-300">
                  Live view of the portal components.
                </p>
              </div>
              <StatusPill label="Preview mode" tone="muted" />
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Front-end</span>
                <StatusPill label={frontEndStatus} tone="success" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">CLAIM contract</span>
                <StatusPill
                  label={contractStatus}
                  tone={contractStatus === 'In progress' ? 'warning' : 'success'}
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

            <p className="mt-4 text-[11px] text-slate-500">
              Once the audited contract is live, this card will show addresses,
              audit links and live pool metrics mirrored from Solana.
            </p>
          </div>
        </section>

        <footer className="mt-2 flex flex-wrap items-center justify-between gap-3 pb-4 text-[11px] text-slate-500">
          <span>© 2025 $CLAIM portal · Preview UI · Subject to change.</span>
          <span>Built for people who actually show up on time.</span>
        </footer>
      </div>
    </main>
  );
}
