export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400/80">
            $CLAIM • The Burning Bear
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold">
            $CLAIM – The Token of Timing
          </h1>
          <p className="text-sm sm:text-base text-slate-300">
            This is the official claim portal for future rewards connected to
            The Burning Bear ecosystem.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6 space-y-4 text-left">
          <h2 className="text-lg font-medium">Claim portal status</h2>
          <p className="text-sm text-slate-300">
            The on-chain claim system is currently being prepared.
            Once it&apos;s live, you&apos;ll be able to:
          </p>
          <ul className="text-sm text-slate-200 list-disc list-inside space-y-1">
            <li>Connect your wallet</li>
            <li>See your eligible $CLAIM / BBURN rewards</li>
            <li>Confirm and execute your claim on Solana</li>
          </ul>
          <p className="text-xs text-slate-400 pt-2">
            For now, this page is a placeholder while the smart contract
            and claim logic are being finalised.
          </p>
        </div>

        <div className="text-xs sm:text-sm text-slate-400 space-y-1">
          <p>Always verify links from official channels:</p>
          <p>
            X: <span className="text-slate-100">@MorkeDrevos</span>
          </p>
          <p>
            Telegram: <span className="text-slate-100">The Burning Bear</span>
          </p>
        </div>
      </div>
    </main>
  );
}
