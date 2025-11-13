import Link from 'next/link';

type PoolStatus = 'not-opened' | 'open' | 'closed';

type SnapshotMetric = {
  round: number;
  snapshotBlock: string;
  eligibleWallets: number | 'TBA';
  totalClaim: number | 'TBA';
};

type AnalyticsState = {
  totalSnapshotWallets: number | 'TBA';
  totalAllocatedClaim: number | 'TBA';
  totalRounds: number | 'TBA';
  nextEventLabel: string;
  firstPoolStatus: PoolStatus;
  snapshots: SnapshotMetric[];
};

// TODO: replace with real analytics data (from your program / indexer / API)
function getAnalyticsState(): AnalyticsState {
  return {
    totalSnapshotWallets: 'TBA',
    totalAllocatedClaim: 'TBA',
    totalRounds: 1,
    nextEventLabel: 'Round 1 snapshot – date TBA',
    firstPoolStatus: 'not-opened',
    snapshots: [
      {
        round: 1,
        snapshotBlock: 'To be announced',
        eligibleWallets: 'TBA',
        totalClaim: 'TBA',
      },
    ],
  };
}

function PillLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-300">
      {children}
    </span>
  );
}

function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'muted';
}) {
  const toneClasses: Record<typeof tone, string> = {
    neutral: 'bg-slate-800 text-slate-100 ring-1 ring-slate-700',
    success: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40',
    warning: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40',
    muted: 'bg-slate-800/60 text-slate-400 ring-1 ring-slate-700/60',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${toneClasses[tone]}`}>
      {label}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-800/70 bg-slate-950/80 px-6 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
      {children}
    </section>
  );
}

export default function AnalyticsPage() {
  const {
    totalSnapshotWallets,
    totalAllocatedClaim,
    totalRounds,
    nextEventLabel,
    firstPoolStatus,
    snapshots,
  } = getAnalyticsState();

  const firstPoolTone: 'neutral' | 'success' | 'warning' | 'muted' =
    firstPoolStatus === 'open' ? 'success' : firstPoolStatus === 'not-opened' ? 'muted' : 'warning';

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-900/80 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          {/* Left: logo + section */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-700/80">
              <span className="text-[11px] font-semibold tracking-[0.18em] text-slate-100">
                $
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                CLAIM PORTAL
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-100">$CLAIM</span>
                <nav className="hidden items-center gap-3 text-xs sm:flex">
                  <Link
                    href="/"
                    className="rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 ring-1 ring-slate-800 hover:bg-slate-900/60 hover:text-slate-200"
                  >
                    Claim pool
                  </Link>
                  <Link
                    href="/analytics"
                    className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-100 ring-1 ring-slate-700"
                  >
                    Analytics
                  </Link>
                </nav>
              </div>
            </div>
          </div>

          {/* Right: placeholder button */}
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Snapshot analytics
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-14 pt-8 sm:px-6 sm:pt-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-500">
              $CLAIM • ANALYTICS
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
                Snapshot overview
              </h1>
              <StatusBadge
                label={
                  firstPoolStatus === 'not-opened'
                    ? 'First pool: not opened'
                    : firstPoolStatus === 'open'
                    ? 'First pool: open'
                    : 'First pool: closed'
                }
                tone={firstPoolTone}
              />
            </div>
            <p className="max-w-xl text-sm text-slate-400">
              High-level metrics for $CLAIM snapshot rounds. Replace these placeholder values with real data from
              your claim contract or indexer when ready.
            </p>
          </div>

          <p className="mt-1 text-[11px] text-right text-slate-500 sm:mt-0">
            <span className="font-semibold text-slate-300">Preview analytics</span> · Subject to change.
          </p>
        </div>

        {/* KPI row */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <div className="space-y-1 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Wallets in snapshot
              </p>
              <p className="text-xl font-semibold text-slate-50">
                {typeof totalSnapshotWallets === 'number'
                  ? totalSnapshotWallets.toLocaleString('en-US')
                  : totalSnapshotWallets}
              </p>
              <p className="text-[11px] text-slate-500">Current / upcoming snapshot set.</p>
            </div>
          </Card>

          <Card>
            <div className="space-y-1 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Total CLAIM allocated
              </p>
              <p className="text-xl font-semibold text-slate-50">
                {typeof totalAllocatedClaim === 'number'
                  ? `${totalAllocatedClaim.toLocaleString('en-US')}`
                  : totalAllocatedClaim}{' '}
                <span className="text-xs text-slate-400">$CLAIM</span>
              </p>
              <p className="text-[11px] text-slate-500">Across all snapshot rounds so far.</p>
            </div>
          </Card>

          <Card>
            <div className="space-y-1 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Rounds
              </p>
              <p className="text-xl font-semibold text-slate-50">
                {typeof totalRounds === 'number' ? totalRounds : totalRounds}
              </p>
              <p className="text-[11px] text-slate-500">Completed + scheduled pools.</p>
            </div>
          </Card>

          <Card>
            <div className="space-y-1 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Next event
              </p>
              <p className="text-sm font-semibold text-slate-100">{nextEventLabel}</p>
              <p className="text-[11px] text-slate-500">Update this as you announce timelines.</p>
            </div>
          </Card>
        </div>

        {/* Snapshot table */}
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <PillLabel>Snapshot rounds</PillLabel>
            <p className="text-[11px] text-slate-500">
              Mirror this table from your on-chain snapshot registry or indexer.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Round
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Snapshot block
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Eligible wallets
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Total $CLAIM
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {snapshots.map((s) => (
                  <tr key={s.round}>
                    <td className="px-4 py-3 text-slate-200">Round {s.round}</td>
                    <td className="px-4 py-3 text-slate-300">{s.snapshotBlock}</td>
                    <td className="px-4 py-3 text-right text-slate-200">
                      {typeof s.eligibleWallets === 'number'
                        ? s.eligibleWallets.toLocaleString('en-US')
                        : s.eligibleWallets}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-200">
                      {typeof s.totalClaim === 'number'
                        ? `${s.totalClaim.toLocaleString('en-US')} $CLAIM`
                        : s.totalClaim}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Footer mini */}
        <footer className="mt-2 flex flex-wrap items-center justify-between gap-3 pb-4 text-[11px] text-slate-500">
          <span>© 2025 $CLAIM portal · Analytics preview.</span>
          <span>Mirror of on-chain data once live.</span>
        </footer>
      </div>
    </main>
  );
}
