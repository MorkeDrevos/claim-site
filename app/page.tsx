'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type AnalyticsTab = 'overview' | 'rounds' | 'wallets';

function SoftCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop-blur">
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState<AnalyticsTab>('overview');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Subtle glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
        <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl animate-pulse" />
      </div>

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

      <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-10 sm:px-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
              Snapshot overview
            </h1>
            <p className="text-xs text-slate-500">
              Preview analytics · Subject to change
            </p>
          </div>

          {/* Little menu pills */}
          <div className="flex flex-wrap items-center gap-2">
            {(['overview', 'rounds', 'wallets'] as AnalyticsTab[]).map(
              (key) => {
                const labels: Record<AnalyticsTab, string> = {
                  overview: 'Overview',
                  rounds: 'Snapshot rounds',
                  wallets: 'Wallet view',
                };
                const isActive = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                    }`}
                  >
                    {labels[key]}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* Top stats cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SoftCard>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Wallets in snapshot
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-50">
              15,234
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Unique wallets captured in this snapshot set.
            </p>
          </SoftCard>

          <SoftCard>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Total $CLAIM allocated
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-50">
              42,000,000 <span className="text-sm text-slate-400">$CLAIM</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Tokens reserved for all snapshot-based pools.
            </p>
          </SoftCard>

          <SoftCard>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Rounds
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-50">4</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Planned claim windows tied to this analytics set.
            </p>
          </SoftCard>

          <SoftCard>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Next event
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-50">
              Round 1 · First live window
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Exact time will be announced in the portal and mirrored here.
            </p>
          </SoftCard>
        </div>

        {/* Tab content */}
        {tab === 'overview' && (
          <SoftCard>
            <p className="text-sm text-slate-300">
              Analytics are scoped to balances at the official snapshot block.
              Numbers are provided as a preview to help serious holders
              understand how each round is structured before the audited
              contracts go live.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-[12px] text-slate-400">
              <li>
                Wallet counts and allocations may be rebalanced before final
                deployment.
              </li>
              <li>
                Individual wallet breakdowns will be available after the first
                round settles on-chain.
              </li>
              <li>
                Final rules and pool sizes are always mirrored in the main
                portal UI.
              </li>
            </ul>
          </SoftCard>
        )}

        {tab === 'rounds' && (
          <SoftCard>
            <p className="mb-4 text-sm font-medium text-slate-200">
              Snapshot rounds
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Round</th>
                    <th className="py-2 pr-4">Snapshot block</th>
                    <th className="py-2 pr-4">Eligible wallets</th>
                    <th className="py-2 pr-4">Total $CLAIM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/80">
                  <tr>
                    <td className="py-3 pr-4 text-slate-100">Round 1</td>
                    <td className="py-3 pr-4 font-mono text-[11px]">
                      219038421
                    </td>
                    <td className="py-3 pr-4">9,840</td>
                    <td className="py-3 pr-4">10,500,000</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-slate-100">Round 2</td>
                    <td className="py-3 pr-4 font-mono text-[11px]">
                      219540200
                    </td>
                    <td className="py-3 pr-4">7,120</td>
                    <td className="py-3 pr-4">10,500,000</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-slate-100">Round 3</td>
                    <td className="py-3 pr-4 font-mono text-[11px]">
                      220012345
                    </td>
                    <td className="py-3 pr-4">5,420</td>
                    <td className="py-3 pr-4">10,500,000</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-slate-100">Round 4</td>
                    <td className="py-3 pr-4 font-mono text-[11px]">
                      220456789
                    </td>
                    <td className="py-3 pr-4">3,870</td>
                    <td className="py-3 pr-4">10,500,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SoftCard>
        )}

        {tab === 'wallets' && (
          <SoftCard>
            <p className="text-sm text-slate-300">
              Wallet-level analytics will unlock after the first claim window
              settles. At that point this view will let you:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-[12px] text-slate-400">
              <li>Search for a wallet and see its total historical claims.</li>
              <li>
                Check which rounds a wallet was eligible for and which ones it
                actually claimed.
              </li>
              <li>
                Export a simple CSV of all wallet claim activity for your own
                records.
              </li>
            </ul>
            <p className="mt-3 text-[11px] text-slate-500">
              Until then, numbers above are high-level preview data only.
            </p>
          </SoftCard>
        )}

        <p className="mt-8 text-[11px] text-slate-500">
          © 2025 $CLAIM portal · Analytics preview · Subject to change.
        </p>
      </div>
    </main>
  );
}
