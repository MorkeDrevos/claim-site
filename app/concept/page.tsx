'use client';

import React from 'react';
import Link from 'next/link';

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
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -right-40 top-32 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-slate-900/80 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 ring-1 ring-slate-700/80">
              <span className="text-[14px] font-semibold text-emerald-300">
                C
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                CLAIM PORTAL
              </span>
              <span className="text-sm font-medium text-slate-100">
                $CLAIM – Token of Timing
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-slate-700/70 bg-slate-900/70 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200 hover:bg-slate-800"
          >
            Back to portal
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <SoftCard>
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Concept overview
            </p>
            <h1 className="text-[28px] sm:text-[34px] font-semibold leading-tight tracking-[-0.02em] text-slate-50">
              Rewards earned by presence, not random forms.
            </h1>
            <p className="text-[14px] leading-relaxed text-slate-300">
              CLAIM is built around timing. Each round uses a single on-chain
              snapshot and a short live window where eligible wallets can lock
              in their share of the reward pool.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[13px] text-slate-400">
              <li>Hold the minimum amount of $CLAIM at the snapshot.</li>
              <li>Show up during the live claim window and lock in.</li>
              <li>Rewards are auto-distributed once the window closes.</li>
            </ul>
            <p className="pt-3 text-[12px] text-slate-500">
              This page is a simple concept draft. For live timings and reward
              pools, use the main CLAIM portal.
            </p>
          </div>
        </SoftCard>
      </div>
    </main>
  );
}
