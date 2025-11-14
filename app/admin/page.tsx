'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type WindowPhase = 'scheduled' | 'snapshot' | 'open' | 'closed' | 'distribution';

type ClaimPortalState = {
  roundNumber?: number;

  walletConnected: boolean;
  walletShort: string;
  networkLabel: string;
  snapshotLabel: string;
  snapshotBlock: string;

  claimWindowStatus: string;
  claimWindowOpensAt?: string | null;
  claimWindowClosesAt?: string | null;

  frontEndStatus: string;
  contractStatus: string;
  firstPoolStatus: 'not-opened' | 'open' | 'closed';

  eligibleAmount: number;
  claimHistory: any[];

  rewardPoolAmountClaim?: number | null;
  rewardPoolAmountUsd?: number | null;

  windowPhase?: WindowPhase;
  snapshotTakenAt?: string | null;
  distributionCompletedAt?: string | null;
};

const PHASE_ORDER: WindowPhase[] = [
  'scheduled',
  'snapshot',
  'open',
  'closed',
  'distribution',
];

const PHASE_LABEL: Record<WindowPhase, string> = {
  scheduled: 'Window scheduled',
  snapshot: 'Snapshot taken',
  open: 'Live claim window',
  closed: 'Window closed',
  distribution: 'Rewards distributed',
};

function formatIso(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('.000', '');
}

export default function AdminPage() {
  const [data, setData] = useState<ClaimPortalState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/portal-state', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const json = (await res.json()) as ClaimPortalState;
      setData(json);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to load portal state');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const currentPhase: WindowPhase =
    (data?.windowPhase as WindowPhase | undefined) ?? 'scheduled';

  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              CLAIM · ADMIN
            </p>
            <h1 className="text-xl font-semibold text-slate-50">
              Round control & status
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-slate-700/70 bg-slate-900/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200 hover:bg-slate-800 hover:border-slate-600"
            >
              Go to portal
            </Link>
            <button
              type="button"
              onClick={load}
              className="rounded-full bg-slate-100 text-slate-900 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] hover:bg-white"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Loading / error */}
        {loading && (
          <p className="text-sm text-slate-400 mb-4">
            Loading portal state…
          </p>
        )}

        {error && (
          <p className="mb-4 text-sm text-red-400">
            Error: {error}
          </p>
        )}

        {data && (
          <>
            {/* Summary card */}
            <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-2">
                Current round
              </p>
              <div className="grid gap-4 sm:grid-cols-4 text-sm">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Round</p>
                  <p className="font-semibold text-slate-100">
                    {data.roundNumber ?? 1}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Phase</p>
                  <p className="font-semibold text-emerald-300">
                    {PHASE_LABEL[currentPhase]}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Reward pool</p>
                  <p className="font-semibold text-slate-100">
                    {data.rewardPoolAmountClaim != null
                      ? `${data.rewardPoolAmountClaim.toLocaleString('en-US')} CLAIM`
                      : 'TBA'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Portal status</p>
                  <p className="font-semibold text-slate-100">
                    {data.frontEndStatus} / {data.contractStatus}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Claim window status: {data.claimWindowStatus}
              </p>
            </div>

            {/* Phase progress */}
            <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Round {data.roundNumber ?? 1} · phase progression
              </p>

              <div className="mt-4 flex items-center gap-3">
                {PHASE_ORDER.map((phase, index) => {
                  const isDone = currentIndex > index;
                  const isActive = currentIndex === index;

                  return (
                    <div key={phase} className="flex-1 flex items-center">
                      <div className="flex flex-col items-center flex-none">
                        <div
                          className={[
                            'h-3 w-3 rounded-full border',
                            isActive
                              ? 'border-emerald-400 bg-emerald-400'
                              : isDone
                              ? 'border-emerald-500 bg-emerald-500/70'
                              : 'border-slate-700 bg-slate-900',
                          ].join(' ')}
                        />
                        <span className="mt-2 text-[10px] text-center text-slate-400 leading-snug">
                          {PHASE_LABEL[phase]}
                        </span>
                      </div>
                      {index < PHASE_ORDER.length - 1 && (
                        <div className="ml-3 flex-1 h-px rounded-full bg-slate-800">
                          <div
                            className={[
                              'h-px rounded-full',
                              currentIndex > index
                                ? 'bg-emerald-500'
                                : 'bg-slate-800',
                            ].join(' ')}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-4 text-xs sm:grid-cols-3 text-slate-400">
                <div>
                  <p className="font-semibold text-slate-300 mb-1">
                    Open window
                  </p>
                  <p>Opens at: {formatIso(data.claimWindowOpensAt)}</p>
                  <p>Closes at: {formatIso(data.claimWindowClosesAt)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-300 mb-1">
                    Snapshot
                  </p>
                  <p>Block: {data.snapshotBlock}</p>
                  <p>Taken at: {formatIso(data.snapshotTakenAt)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-300 mb-1">
                    Distribution
                  </p>
                  <p>Completed at: {formatIso(data.distributionCompletedAt)}</p>
                </div>
              </div>
            </div>

            {/* Raw JSON */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-2">
                Raw portalState.json (from API)
              </p>
              <pre className="whitespace-pre-wrap break-all text-[11px] text-slate-300">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
