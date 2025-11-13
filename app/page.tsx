'use client';

import React, { useState } from 'react';

type TabKey = 'eligibility' | 'rewards' | 'history';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'eligibility', label: 'Eligibility' },
  { key: 'rewards', label: 'Rewards' },
  { key: 'history', label: 'Claim history' },
];

export default function ClaimPoolPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('eligibility');

  // TODO: Replace all mock data below with real on-chain / API values.
  const walletConnected = false;
  const walletShort = 'Wallet not connected';
  const snapshotLabel = 'Snapshot – TBA';
  const roundLabel = 'Claim pool · Round 1';
  const eligibleAmount = '0 $CLAIM';
  const statusPill = walletConnected ? 'Eligible (preview)' : 'Connect a wallet';

  return (
    <div className="min-h-screen bg-black text-slate-100">
      {/* Top nav */}
      <header className="border-b border-white/5 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold">
              $
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                CLAIM portal
              </span>
              <span className="text-sm text-slate-200">$CLAIM</span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-xs text-slate-400 sm:flex">
            <span className="font-medium text-slate-100">Claim pool</span>
            <span className="rounded-full border border-slate-800 px-3 py-1 text-[11px] text-slate-500">
              Analytics (soon)
            </span>
          </nav>

          {/* Replace this with your real wallet connect button */}
          <button
            type="button"
            className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20"
          >
            Connect wallet
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-10">
        {/* Hero */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                $CLAIM • Pool status
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">
                Claim pool – Round 1
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-400">
                Connect a Solana wallet to check if it&apos;s in the snapshot set, preview your
                claim and see the exact claim window once it opens.
              </p>
            </div>

            <div className="mt-2 flex flex-col items-start gap-2 text-xs text-right text-slate-500 sm:items-end">
              <span className="rounded-full border border-slate-800 px-3 py-1 text-[11px] text-slate-400">
                {snapshotLabel}
              </span>
              <span className="text-[11px] text-slate-500">
                Front-end preview · Terms may change before Round 1 opens.
              </span>
            </div>
          </div>

          {/* Wallet line */}
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-1 text-sm">
              <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Connected wallet
              </span>
              <span className="font-mono text-sm text-slate-200">
                {walletShort}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full border border-slate-800 px-3 py-1 text-[11px] text-slate-400">
                Network: Solana devnet
              </span>
              {/* Same placeholder connect as in header; you can remove one of them later */}
              <button
                type="button"
                className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20"
              >
                {walletConnected ? 'Change wallet' : 'Connect'}
              </button>
            </div>
          </div>
        </section>

        {/* Top cards */}
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Your position card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Your position
                </p>
                <p className="mt-1 text-sm text-slate-300">{roundLabel}</p>
              </div>
              <span className="rounded-full border border-slate-800 px-3 py-1 text-[11px] text-slate-300">
                {statusPill}
              </span>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <InfoRow label="Wallet in snapshot set" value={walletConnected ? 'TBA' : '—'} />
              <InfoRow label="Estimated eligible amount" value={eligibleAmount} />
              <InfoRow label="Claim window" value="Not opened yet" />
              <InfoRow label="Snapshot block" value="To be announced" />
            </div>

            <p className="mt-5 text-xs leading-relaxed text-slate-500">
              This preview does not move any funds and does not require a signature.  
              Final eligibility will be mirrored from the audited on-chain contract
              once Round 1 is live.
            </p>
          </div>

          {/* Portal status card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Portal status
              </p>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
                Preview mode
              </span>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <StatusRow label="Front-end" value="Online" tone="good" />
              <StatusRow label="CLAIM contract" value="In progress" tone="warn" />
              <StatusRow label="First pool" value="Not opened" tone="muted" />
            </div>

            <p className="mt-5 text-xs leading-relaxed text-slate-500">
              Once the claim contract is deployed and audited, this card will show the official
              contract address, audit links and real-time pool metrics mirrored from Solana.
            </p>
          </div>
        </section>

        {/* Tabs section */}
        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          {/* Tabs */}
          <div className="flex gap-4 border-b border-slate-800 pb-2 text-xs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative pb-2 font-medium ${
                  activeTab === tab.key
                    ? 'text-slate-100'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute inset-x-0 -bottom-[1px] h-[2px] rounded-full bg-slate-100" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="mt-5 text-sm text-slate-300">
            {activeTab === 'eligibility' && <EligibilityCopy />}
            {activeTab === 'rewards' && <RewardsCopy />}
            {activeTab === 'history' && <HistoryCopy />}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-slate-900 pt-4 text-center text-[11px] text-slate-500">
          © 2025 $CLAIM portal · Preview UI · Subject to change
        </footer>
      </main>
    </div>
  );
}

/* ------- Small subcomponents ------- */

function InfoRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
      <span className="text-slate-500">{props.label}</span>
      <span className="font-medium text-slate-100">{props.value}</span>
    </div>
  );
}

function StatusRow(props: { label: string; value: string; tone?: 'good' | 'warn' | 'muted' }) {
  const { label, value, tone = 'muted' } = props;

  const pillClasses =
    tone === 'good'
      ? 'bg-emerald-500/10 text-emerald-200 border-emerald-400/40'
      : tone === 'warn'
      ? 'bg-amber-500/10 text-amber-200 border-amber-400/40'
      : 'bg-slate-800/60 text-slate-300 border-slate-700';

  return (
    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`rounded-full border px-2.5 py-1 text-[11px] ${pillClasses}`}>
        {value}
      </span>
    </div>
  );
}

/* ------- Tab copy blocks (short, clean) ------- */

function EligibilityCopy() {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-300">
      <p>
        The $CLAIM pool is built around timing. Your eligibility is determined by balances and
        activity at specific snapshot blocks — not by random forms or manual lists.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-slate-400">
        <li>Snapshot block and date will be announced before each round.</li>
        <li>Minimum token holdings or LP thresholds may apply.</li>
        <li>Optional bonuses can reward long-term or early participants.</li>
      </ul>
      <p className="text-slate-400">
        The final rule set for Round 1 will be published before the snapshot is taken and mirrored
        here inside the portal.
      </p>
    </div>
  );
}

function RewardsCopy() {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-300">
      <p>
        Round 1 is designed as a simple, transparent claim: wallets that meet the eligibility rules
        will be able to claim a fixed amount of $CLAIM per snapshot position.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-slate-400">
        <li>Rewards are shown in this portal before the claim window opens.</li>
        <li>Claims will be executed on Solana — this UI only prepares the transaction.</li>
        <li>Unclaimed rewards after the deadline may roll into future rounds.</li>
      </ul>
      <p className="text-slate-400">
        Exact Round 1 parameters (cap, vesting, rollover rules) will be finalised and published
        together with the audited contract.
      </p>
    </div>
  );
}

function HistoryCopy() {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-300">
      <p>
        Once the first pool is live, this section will show a simple history for your connected
        wallet:
      </p>
      <ul className="list-disc space-y-1 pl-5 text-slate-400">
        <li>Snapshot rounds in which the wallet appeared.</li>
        <li>Amounts claimed per round, with transaction links.</li>
        <li>Any unclaimed allocations that are still available.</li>
      </ul>
      <p className="text-slate-400">
        For now, you can use this preview UI to get familiar with the flow and wallet connection
        without moving any funds.
      </p>
    </div>
  );
}
