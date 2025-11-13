export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-black text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-14 pt-10 sm:px-6">
        <header className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-500">
            $CLAIM • ANALYTICS
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
            Analytics dashboard (coming soon)
          </h1>
          <p className="max-w-xl text-sm text-slate-400">
            This section will mirror key on-chain metrics for the $CLAIM pools — holders, volume, pool
            utilization and distribution — once the first contract is live.
          </p>
        </header>

        <section className="rounded-3xl border border-dashed border-slate-800/80 bg-slate-950/60 px-6 py-10 text-sm text-slate-300">
          <p className="font-medium text-slate-200">Planned modules:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-400">
            <li>Pool overview – TVL, utilization, active rounds.</li>
            <li>Holder distribution – long-term vs short-term participants.</li>
            <li>Snapshot timelines – upcoming and historical snapshots.</li>
            <li>Reward flows – total CLAIM allocated and claimed per round.</li>
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            For now, use the Claim pool view to preview eligibility and stay updated on Round 1.
          </p>
        </section>
      </div>
    </main>
  );
}
