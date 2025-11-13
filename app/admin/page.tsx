'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type ClaimWindowStatusRaw = 'scheduled' | 'open' | 'closed';

type RawClaimWindow = {
  status: ClaimWindowStatusRaw;
  opensAt: string;
  closesAt: string;
};

type RawPortalState = {
  round: number;
  networkLabel: string;
  snapshotLabel: string;
  snapshotBlock: string;
  claimWindow: RawClaimWindow;
  // we keep it loose – other fields just pass through
  [key: string]: any;
};

function formatShort(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.toISOString().slice(0, 16).replace('T', ' · ')} UTC`;
  } catch {
    return iso;
  }
}

export default function AdminPage() {
  const [raw, setRaw] = useState<RawPortalState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [status, setStatus] = useState<ClaimWindowStatusRaw>('scheduled');
  const [startInMinutes, setStartInMinutes] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(10);

  // Fetch current config
  useEffect(() => {
    fetch('/api/admin-portal')
      .then((res) => res.json())
      .then((data) => {
        setRaw(data);
        if (data?.claimWindow?.status) {
          setStatus(data.claimWindow.status);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load current portal config');
        setLoading(false);
      });
  }, []);

  const { liveOpensAt, liveClosesAt } = useMemo(() => {
    if (!raw?.claimWindow) return { liveOpensAt: null, liveClosesAt: null };
    return {
      liveOpensAt: raw.claimWindow.opensAt,
      liveClosesAt: raw.claimWindow.closesAt,
    };
  }, [raw]);

  // Build updated JSON preview whenever form changes
  const previewJson = useMemo(() => {
    if (!raw) return '';

    const now = new Date();
    const openDate = new Date(now.getTime() + startInMinutes * 60_000);
    const closeDate = new Date(openDate.getTime() + durationMinutes * 60_000);

    const updated: RawPortalState = {
      ...raw,
      claimWindow: {
        status,
        opensAt: openDate.toISOString(),
        closesAt: closeDate.toISOString(),
      },
    };

    return JSON.stringify(updated, null, 2);
  }, [raw, status, startInMinutes, durationMinutes]);

  const handleCopy = () => {
    if (!previewJson) return;
    navigator.clipboard
      .writeText(previewJson)
      .catch((err) => console.error('Clipboard error', err));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-sm text-slate-400">Loading admin portal…</p>
        </div>
      </main>
    );
  }

  if (error || !raw) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-10 space-y-4">
          <h1 className="text-xl font-semibold">CLAIM admin</h1>
          <p className="text-sm text-red-400">{error ?? 'No config found'}</p>
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 hover:bg-slate-700"
          >
            ← Back to portal
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              $CLAIM • INTERNAL ADMIN
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Reward window controller
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Generate a new <span className="font-semibold">claimWindow</span>{' '}
              config, then paste it into{' '}
              <code className="rounded bg-slate-900 px-1 py-0.5 text-[11px]">
                data/portalState.json
              </code>{' '}
              and commit.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 hover:bg-slate-900"
            >
              View portal
            </Link>
          </div>
        </header>

        {/* Live status */}
        <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Current live window
            </p>
            <p className="text-sm text-slate-300">
              Status:{' '}
              <span className="font-semibold text-slate-50">
                {raw.claimWindow.status}
              </span>
            </p>
            <p className="text-xs text-slate-400">
              Opens:{' '}
              <span className="font-mono">
                {liveOpensAt ? formatShort(liveOpensAt) : '—'}
              </span>
              <br />
              Closes:{' '}
              <span className="font-mono">
                {liveClosesAt ? formatShort(liveClosesAt) : '—'}
              </span>
            </p>
          </div>

          {/* Form */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              New window settings
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Status
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                {(['scheduled', 'open', 'closed'] as ClaimWindowStatusRaw[]).map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatus(value)}
                      className={`rounded-full px-3 py-1 font-semibold tracking-[0.18em] ${
                        status === value
                          ? 'bg-emerald-500 text-emerald-950'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {value.toUpperCase()}
                    </button>
                  )
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Usually use <span className="font-semibold">SCHEDULED</span>{' '}
                with a future open time, or <span className="font-semibold">OPEN</span>{' '}
                if you want it live immediately.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Start in (minutes from now)
                </label>
                <input
                  type="number"
                  min={0}
                  value={startInMinutes}
                  onChange={(e) =>
                    setStartInMinutes(Number(e.target.value) || 0)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  For a surprise pool, set e.g.{' '}
                  <span className="font-semibold">3</span> minutes.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  value={durationMinutes}
                  onChange={(e) =>
                    setDurationMinutes(Number(e.target.value) || 1)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  How long the CLAIM button is live for this window.
                </p>
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              The admin will calculate new{' '}
              <code className="rounded bg-slate-900 px-1 py-0.5 text-[10px]">
                opensAt
              </code>{' '}
              and{' '}
              <code className="rounded bg-slate-900 px-1 py-0.5 text-[10px]">
                closesAt
              </code>{' '}
              in UTC from these values.
            </p>
          </div>
        </section>

        {/* JSON preview */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-100">
              2. Paste this into <code>data/portalState.json</code>
            </h2>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center rounded-full bg-slate-800 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 hover:bg-slate-700"
            >
              Copy JSON
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Replace the entire file contents with this JSON, commit to{' '}
            <code className="rounded bg-slate-900 px-1 py-0.5 text-[10px]">
              main
            </code>
            , and Vercel will redeploy. You can generate another window any time
            – even twice in the same hour.
          </p>
          <pre className="max-h-[420px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-relaxed text-emerald-100">
            {previewJson}
          </pre>
        </section>
      </div>
    </main>
  );
}
