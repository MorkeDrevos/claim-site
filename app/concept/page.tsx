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
      {/* Subtle moving glows (same vibe as portal) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute -right-40 top-32 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              CLAIM · Token of Timing
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-slate-50">
              Concept draft · v1.0
            </h1>
          </div>
          <Link
            href="/"
            className="hidden sm:inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200 hover:bg-slate-800 hover:border-slate-600"
          >
            Back to portal
          </Link>
        </header>

        <SoftCard>
          <div className="space-y-4 text-sm leading-relaxed text-slate-300">
            <p>
              CLAIM is a timing-based reward system: you earn by showing up
              during short, scheduled windows rather than staking or filling out
              forms.
            </p>
            <p>
              Each round has a single snapshot, a live claim window, and an
              automated distribution phase. Wallets that held the minimum
              amount of $CLAIM at snapshot and lock in during the window share
              that round&apos;s pool equally.
            </p>
            <p className="text-[11px] text-slate-500">
              This page is a living concept document &ndash; details, numbers,
              and mechanics can evolve as we test the system with real data.
            </p>
          </div>
        </SoftCard>
      </div>
    </main>
  );
}
