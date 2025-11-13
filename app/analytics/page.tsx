'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

/* ========= Types (must match /api/analytics) ========= */

type PoolStatus = 'not-opened' | 'open' | 'closed';

type SnapshotMetric = {
  round: number;
  snapshotBlock: string;
  eligibleWallets: number;
  totalClaim: number;
};

type AnalyticsState = {
  totalSnapshotWallets: number;
  totalAllocatedClaim: number;
  totalRounds: number;
  nextEventLabel: string;
  firstPoolStatus: PoolStatus;
  snapshotMetrics: SnapshotMetric[];
};

/* ========= API fetcher ========= */

async function getAnalyticsState(): Promise<AnalyticsState> {
  const res = await fetch('/api/analytics', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load analytics state');
  return res.json();
}

/* ========= Page ========= */

export default function AnalyticsPage() {
  const [state, setState] = useState<AnalyticsState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalyticsState()
      .then(setState)
      .catch((err) => {
        console.error(err);
        setError('Unable to load analytics data right now.');
      });
  }, []);

  if (error) {
    return (
      <main className="min-h-screen bg-black text-slate-50">
        <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="min-h-screen bg-black text-slate-50">
        <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <p className="text-sm text-slate-400">Loading analytics…</p>
        </div>
      </main>
    );
  }

  const {
    totalSnapshotWallets,
    totalAllocatedClaim,
    totalRounds,
    nextEventLabel,
    snapshotMetrics,
  } = state;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-900/80 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 ring-1 ring-slate-700"
            >
              ← Back to portal
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Snapshot overview</h1>
        <p className="mt-1 text-sm text-slate-400">Preview analytics · Subject to change</p>

        {/* Top stats */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Wallets in snapshot" value={totalSnapshotWallets} />
          <StatCard label="Total $CLAIM allocated" value={totalAllocatedClaim} suffix="$CLAIM" />
          <StatCard label="Rounds" value={totalRounds} />
          <StatCard label="Next event" value={nextEventLabel} />
        </div>

        {/* Table */}
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Snapshot rounds</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/70">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60 text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left">Round</th>
                  <th className="px-4 py-3 text-left">Snapshot block</th>
                  <th className="px-4 py-3 text-left">Eligible wallets</th>
                  <th className="px-4 py-3 text-left">Total $CLAIM</th>
                </tr>
              </thead>
              <tbody>
                {snapshotMetrics.map((m) => (
                  <tr key={m.round} className="border-t border-slate-800 text-slate-200">
                    <td className="px-4 py-3">{m.round}</td>
                    <td className="px-4 py-3">{m.snapshotBlock}</td>
                    <td className="px-4 py-3">{m.eligibleWallets.toLocaleString('en-US')}</td>
                    <td className="px-4 py-3">
                      {m.totalClaim.toLocaleString('en-US')} <span className="text-xs text-slate-400">$CLAIM</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="mt-10 text-xs text-slate-500">
          © 2025 $CLAIM portal · Analytics preview.
        </footer>
      </div>
    </main>
  );
}

/* ========= Small stat card ========= */

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | string;
  suffix?: string;
}) {
  const formatted =
    typeof value === 'number' ? value.toLocaleString('en-US') : value;

  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-100">
        {formatted}
        {suffix && (
          <span className="ml-1 text-xs font-normal text-slate-400">{suffix}</span>
        )}
      </p>
    </div>
  );
}
