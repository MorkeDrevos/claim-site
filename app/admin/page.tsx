'use client';

import React, { useEffect, useState } from 'react';

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

export default function AdminPage() {
  const [data, setData] = useState<ClaimPortalState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-xl font-semibold mb-4">CLAIM Admin</h1>

        <button
          onClick={load}
          className="mb-4 rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
        >
          Refresh
        </button>

        {loading && <p className="text-slate-400">Loading portal state…</p>}

        {error && (
          <p className="text-sm text-red-400">
            Error: {error}
          </p>
        )}

        {data && (
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl border border-s
