'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

function SoftCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop-blur">
      {children}
    </div>
  );
}

export default function ConceptPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Subtle moving glows (same vibe as portal) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
        <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl animate-pulse" />
      </div>

      {/* Header */}
      <header className="border-b border-slate-900/80 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          {/* Left: logo + title (clickable) */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-700/80 overflow-hidden group-hover:ring-emerald-400/70 transition">
              <Image
                src="/img/claim-logo-circle.png"
                alt="$CLAIM logo"
                width={36}
                height={36}
                className="h-9 w-9 object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 group-hover:text-slate-300 transition">
                CLAIM
              </span>
              <span className="text-sm font-medium text-slate-100">
                Token of Timing · Concept
              </span>
            </div>
          </Link>

          {/* Right: nav pills */}
          <nav className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em]">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-4 py-2 text-slate-200 hover:bg-slate-800 hover:border-slate-600"
            >
              Portal
            </Link>

            {/* Active pill */}
            <span className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-slate-900">
              Concept
            </span>
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-6">
        <SoftCard>
          <div className="space-y-8">
            {/* Title + meta */}
            <div className="space-y-2">
              <h1 className="text-[26px] sm:text-[32px] font-semibold text-slate-50 tracking-tight">
                $CLAIM — The Token of Timing
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <p className="uppercase tracking-[0.22em] text-emerald-300 font-semibold">
                  Abstract
                </p>
                <span className="h-px w-6 bg-slate-700/70" />
                <p>Concept draft · v1.0</p>
              </div>
            </div>

            {/* Abstract */}
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-300 max-w-3xl">
              <p>
                $CLAIM introduces a new economic layer to the blockchain: a{' '}
                <span className="text-emerald-300 font-semibold">
                  proof-of-presence
                </span>{' '}
                system where rewards are earned not by staking or locking tokens,
                but by{' '}
                <span className="text-emerald-300 font-semibold">
                  showing up at the right time
                </span>
                . At regular intervals, a live{' '}
                <span className="text-emerald-300 font-semibold">
                  Claim Window
                </span>{' '}
                opens with a fixed Reward Pool. Anyone holding the required
                minimum at snapshot can click{' '}
                <span className="text-emerald-300 font-semibold">Claim</span>{' '}
                during this window. Everyone who clicks shares the pool equally —
                the fewer people who show up, the larger each share becomes.
              </p>

              <p>
                $CLAIM transforms{' '}
                <span className="text-emerald-300 font-semibold">
                  timing, participation, and human presence
                </span>{' '}
                into economic value.
              </p>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-slate-800/70" />

            {/* 1. Concept Overview */}
            <div className="space-y-3">
              <h2 className="text-[20px] font-semibold text-slate-50 tracking-tight">
                1. Concept Overview
              </h2>
              <p className="text-[15px] leading-relaxed text-slate-300 max-w-3xl">
                The $CLAIM ecosystem gamifies engagement while maintaining
                fairness through verifiable human interaction. Every claim cycle
                generates a Reward Pool. When the Claim Window opens, eligible
                holders can click{' '}
                <span className="text-emerald-300 font-semibold">Claim</span> on
                the official portal. Once the window closes, all wallets that
                clicked are included in the distribution.
              </p>

              <p className="text-[15px] leading-relaxed text-slate-300">
                No staking. No waiting. No complex mechanics,{' '}
                <span className="text-emerald-300 font-semibold">
                  just presence
                </span>
                .
              </p>

              <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[14px]">
                <li>People must show up, not just hold.</li>
                <li>Each Claim Window resets the game.</li>
                <li>The system favors real humans over passive capital.</li>
                <li>Timing, coordination, and attention matter again.</li>
              </ul>

              <p className="text-[15px] text-slate-300">
                This creates a new on-chain behavior:{' '}
                <span className="font-semibold text-emerald-300">
                  attention mining
                </span>
                .
              </p>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-slate-800/70" />

            {/* 2. How It Works */}
            <div className="space-y-3">
              <h2 className="text-[20px] font-semibold text-slate-50 tracking-tight">
                2. How It Works (10-Second Summary)
              </h2>

              <ol className="space-y-3 text-[15px] text-slate-300 max-w-3xl">
                <li>
                  <span className="font-semibold text-emerald-300">
                    1. Snapshot happens
                  </span>
                  <br />
                  Hold the required minimum $CLAIM at that moment.
                </li>
                <li>
                  <span className="font-semibold text-emerald-300">
                    2. A Claim Window opens
                  </span>
                  <br />
                  A fixed Reward Pool becomes available.
                </li>
                <li>
                  <span className="font-semibold text-emerald-300">
                    3. Show up and click Claim
                  </span>
                  <br />
                  No race conditions, no gas wars, no tricks.
                </li>
                <li>
                  <span className="font-semibold text-emerald-300">
                    4. All claimers share the pool equally
                  </span>
                  <br />
                  Fewer claimers → larger share per wallet.
                </li>
              </ol>

              <div className="mt-2 text-[14px] text-slate-400">
                <p>Examples:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>1 claimer → 100% of the pool</li>
                  <li>5 claimers → 20% each</li>
                  <li>50 claimers → 2% each</li>
                  <li>100 claimers → 1% each</li>
                </ul>
              </div>

              <p className="text-[15px] text-slate-300">
                The game is simple:{' '}
                <span className="font-semibold text-emerald-300">
                  show up, click, get your share
                </span>
                .
              </p>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-slate-800/70" />

            {/* 3. System Goals */}
            <div className="space-y-3">
              <h2 className="text-[20px] font-semibold text-slate-50 tracking-tight">
                3. System Goals
              </h2>

              <ul className="list-disc pl-5 text-[15px] space-y-1 text-slate-300 max-w-3xl">
                <li>Reward real engagement, not idle capital</li>
                <li>Create predictable cycles of activity</li>
                <li>Make timing matter again</li>
                <li>Allow anyone to participate equally</li>
                <li>Runs autonomously</li>
              </ul>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-slate-800/70" />

            {/* 4. Why Unique */}
            <div className="space-y-3">
              <h2 className="text-[20px] font-semibold text-slate-50 tracking-tight">
                4. Why $CLAIM Is Unique
              </h2>

              <p className="text-[15px] text-slate-300 max-w-3xl">
                Unlike staking or yield systems that reward wallet size:
              </p>

              <ul className="list-disc pl-5 text-[15px] space-y-1 text-slate-300 max-w-3xl">
                <li>Whales have no advantage</li>
                <li>Every claimer receives the same reward</li>
                <li>Participation is binary, not proportional</li>
                <li>Rewards come from presence, not capital power</li>
              </ul>

              <p className="text-[15px] text-slate-300 max-w-3xl">
                This makes $CLAIM one of the first tokens to truly reward{' '}
                <span className="font-semibold text-emerald-300">
                  human attention
                </span>{' '}
                over capital power.
              </p>
            </div>
          </div>
        </SoftCard>
      </div>
    </main>
  );
}
