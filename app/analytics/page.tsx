'use client';

import React from 'react';
import Link from 'next/link';

type SnapshotRound = {
  round: number;
  snapshotBlock: string;
  eligibleWallets: number;
  totalClaim: number;
};

const MOCK_ROUNDS: SnapshotRound[] = [
  {
    round: 1,
    snapshotBlock: '219038421',
    eligibleWallets: 15_234,
    totalClaim: 42_000_000,
  },
];

export default function AnalyticsPage() {
  const totalWallets = 15_234;
  const totalAllocated = 42_000_000;
  const rounds = MOCK_ROUNDS.length;
  const nextEvent = 'To be announced';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-900/80 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-100 ring-1 ring-slate-700 hover:bg-slate-800"
          >
            ← Back to portal
          </Link>

          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Analytics preview
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-10 sm:px-6">
        <section className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              Snapshot overview
            </h1>
            <p className="text-sm text-slate-500">
              Preview analytics · Subject to change
            </p>
          </div>

          {/* Stat row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Wallets in snapshot
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-50">
                {totalWallets.toLocaleString('en-US')}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Total $CLAIM allocated
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-50">
                {totalAllocated.toLocaleString('en-US')}&nbsp;
                <span className="text-base text-slate-400">$CLAIM</span>
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Rounds
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-50">
                {rounds}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Next event
              </p>
              <p className="mt-2 text-sm font-medium text-slate-100">
                {nextEvent}
              </p>
            </div>
          </div>

          {/* Rounds table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 px-5 py-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Snapshot rounds
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Round</th>
                    <th className="py-3 pr-4">Snapshot block</th>
                    <th className="py-3 pr-4">Eligible wallets</th>
                    <th className="py-3 pr-4">Total $CLAIM</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ROUNDS.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-center text-sm text-slate-500"
                      >
                        Round analytics will appear here after the first window
                        completes.
                      </td>
                    </tr>
                  ) : (
                    MOCK_ROUNDS.map((round) => (
                      <tr
                        key={round.round}
                        className="border-b border-slate-900/60 last:border-0"
                      >
                        <td className="py-3 pr-4 text-slate-100">
                          Round {round.round}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-slate-300">
                          {round.snapshotBlock}
                        </td>
                        <td className="py-3 pr-4">
                          {round.eligibleWallets.toLocaleString('en-US')}
                        </td>
                        <td className="py-3 pr-4">
                          {round.totalClaim.toLocaleString('en-US')}{' '}
                          <span className="text-xs text-slate-500">
                            $CLAIM
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-4 text-[11px] text-slate-500">
            © 2025 CLAIM portal · Analytics preview · Final numbers will follow
            the audited contract and on-chain distributions.
          </p>
        </section>
      </div>
    </main>
  );
}
