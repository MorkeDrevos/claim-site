'use client';

import { FormEvent, useState } from 'react';

type Status = 'idle' | 'checking' | 'eligible' | 'not-eligible';

const TOTAL_POOL = 1_000_000; // demo only
const TOKEN_SYMBOL = '$CLAIM';

export default function Home() {
  const [wallet, setWallet] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('checking');

    setTimeout(() => {
      const w = wallet.trim();
      const valid =
        w.length >= 32 &&
        w.length <= 60 &&
        /^[1-9A-HJ-NP-Za-km-z]+$/.test(w);

      setStatus(valid ? 'eligible' : 'not-eligible');
    }, 600);
  }

  return (
    <main className="page">
      {/* Top strip */}
      <header className="top-strip">
        <span className="top-strip-pill">{TOKEN_SYMBOL}</span>
        <span className="top-strip-text">
          Claim portal preview · on-chain contract & final rules are still in
          development.
        </span>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <p className="eyebrow">{TOKEN_SYMBOL} · The Token of Timing</p>
          <h1 className="hero-title">
            Your future drops,
            <br />
            <span className="hero-accent">one claim away.</span>
          </h1>

          <p className="hero-copy">
            This portal will be the official place to claim timing-based rewards
            for {TOKEN_SYMBOL}. Once live, you&apos;ll connect a Solana wallet,
            see eligibility, and confirm claims in a few clicks.
          </p>

          <ul className="hero-list">
            <li>Single home for all future claim rounds</li>
            <li>Transparent rules and clear breakdowns</li>
            <li>On-chain settlement, one transaction per claim</li>
          </ul>

          <div className="hero-actions">
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Follow updates
            </a>
            <span className="hero-note">
              UI preview only · no real claims are live yet.
            </span>
          </div>
        </div>

        <div className="hero-right">
          {/* CLAIM POOL CARD */}
          <section className="card pool-card" aria-label="Claim pool overview">
            <h2 className="card-title">Claim pool (preview)</h2>
            <p className="card-sub">
              Demo values only. Final pool size and rules will be announced
              before the first round opens.
            </p>

            <div className="pool-row">
              <span className="pool-label">Total pool</span>
              <span className="pool-value">
                {TOTAL_POOL.toLocaleString()} {TOKEN_SYMBOL}
              </span>
            </div>

            <div className="pool-row">
              <span className="pool-label">Round</span>
              <span className="pool-pill">Round 1 · Draft</span>
            </div>

            <div className="pool-row">
              <span className="pool-label">Snapshot status</span>
              <span className="pool-status pool-status-draft">
                Snapshot design in progress
              </span>
            </div>

            <p className="pool-footnote">
              When live, you&apos;ll see a breakdown of how the pool is split:
              timing brackets, multipliers, and any bonus tiers.
            </p>
          </section>

          {/* CHECKER CARD */}
          <section className="card checker-card" aria-label="Eligibility check">
            <h2 className="card-title">Demo eligibility checker</h2>
            <p className="card-sub">
              Test the flow with a wallet address. This does NOT use real
              on-chain data yet.
            </p>

            <form onSubmit={handleSubmit} className="checker-form">
              <label htmlFor="wallet" className="field-label">
                Wallet address
              </label>
              <input
                id="wallet"
                type="text"
                className="field-input"
                placeholder="Paste a Solana wallet address"
                value={wallet}
                onChange={(e) => {
                  setWallet(e.target.value);
                  setStatus('idle');
                }}
              />

              <button
                type="submit"
                className="btn btn-full"
                disabled={!wallet.trim() || status === 'checking'}
              >
                {status === 'checking' ? 'Checking…' : 'Run demo check'}
              </button>
            </form>

            <div className="checker-status">
              {status === 'idle' && (
                <p className="status-muted">
                  For now this only validates the format. In production, it will
                  read snapshot data and apply the real rules.
                </p>
              )}
              {status === 'checking' && (
                <p className="status-info">Checking wallet format…</p>
              )}
              {status === 'eligible' && (
                <div className="status-good">
                  <strong>Format looks valid (demo eligible).</strong>
                  <p>
                    In a real round, this wallet would move to the on-chain
                    claim step if the snapshot says it qualifies.
                  </p>
                </div>
              )}
              {status === 'not-eligible' && (
                <div className="status-bad">
                  <strong>Format invalid (demo not eligible).</strong>
                  <p>
                    For production, this usually means no entry in the snapshot
                    or an invalid address.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>

      {/* FLOW EXPLAINER */}
      <section className="flow">
        <h2 className="flow-title">How the CLAIM portal will work</h2>
        <div className="flow-grid">
          <article className="flow-step">
            <div className="flow-badge">1</div>
            <h3>Connect</h3>
            <p>
              You connect a Solana wallet (Phantom, Backpack, etc.). The portal
              only reads balances and snapshots needed for the round.
            </p>
          </article>

          <article className="flow-step">
            <div className="flow-badge">2</div>
            <h3>Review</h3>
            <p>
              You see eligibility, reasoning, and any multipliers or bonuses
              that apply to your wallet for that round.
            </p>
          </article>

          <article className="flow-step">
            <div className="flow-badge">3</div>
            <h3>Claim</h3>
            <p>
              If eligible, you confirm the claim. The contract sends your
              {` ${TOKEN_SYMBOL}`} directly and marks the claim as completed
              on-chain.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
