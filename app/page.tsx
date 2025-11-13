'use client';

import { FormEvent, useState } from 'react';

type Status = 'idle' | 'checking' | 'eligible' | 'not-eligible';

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
    }, 700);
  }

  return (
    <main className="page">
      {/* Top ribbon */}
      <div className="ribbon">
        <span className="ribbon-pill">$CLAIM</span>
        <span className="ribbon-text">
          Claim portal preview · On-chain logic & final rules are still in development.
        </span>
      </div>

      <section className="hero">
        {/* Left side */}
        <div className="hero-left">
          <p className="eyebrow">$CLAIM · The Token of Timing</p>
          <h1 className="hero-title">
            Your future rewards, <span className="accent">one claim away.</span>
          </h1>
          <p className="hero-body">
            This will be the official portal for future $CLAIM distributions.
            Once live, you&apos;ll be able to connect a Solana wallet, verify
            eligibility, and claim tokens in one place.
          </p>

          <ul className="hero-bullets">
            <li>Single home for all future $CLAIM drops</li>
            <li>Clear rules and on-chain transparency</li>
            <li>Designed for timing-based and snapshot-based rewards</li>
          </ul>

          <div className="hero-cta-row">
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Follow $CLAIM updates
            </a>
            <span className="hero-disclaimer">
              This page is not live claim logic yet – UI preview only.
            </span>
          </div>
        </div>

        {/* Right side – demo checker */}
        <div className="hero-right">
          <div className="card checker-card">
            <p className="card-eyebrow">Preview · Claim portal</p>
            <h2 className="card-title">Check claim preview</h2>
            <p className="card-subtitle">
              Demo-only checker while the smart contract and final rules are wired in.
            </p>

            <form onSubmit={handleSubmit} className="checker-form">
              <label htmlFor="wallet" className="field-label">
                Wallet address
              </label>
              <input
                id="wallet"
                type="text"
                className="field-input"
                placeholder="Paste your Solana wallet address"
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
                  Paste a wallet and run the demo check. Real eligibility will come from
                  on-chain data later.
                </p>
              )}
              {status === 'checking' && (
                <p className="status-info">Checking wallet format…</p>
              )}
              {status === 'eligible' && (
                <div className="status-good">
                  <strong>Eligible (demo only)</strong>
                  <p>
                    In a real launch, this wallet would pass the basic snapshot check.
                  </p>
                </div>
              )}
              {status === 'not-eligible' && (
                <div className="status-bad">
                  <strong>Not eligible (demo only)</strong>
                  <p>
                    In a real launch, this would likely mean no match in the claim
                    snapshot or invalid format.
                  </p>
                </div>
              )}
            </div>

            <p className="card-footnote">
              Next step: connect this checker to real on-chain data and plug in the final
              $CLAIM contract.
            </p>
          </div>

          <div className="card status-card">
            <h3>Portal status</h3>
            <ul>
              <li>
                Design &amp; front-end
                <span className="tag tag-live">Live</span>
              </li>
              <li>
                Eligibility rules
                <span className="tag tag-draft">Drafting</span>
              </li>
              <li>
                On-chain claim contract
                <span className="tag tag-progress">In progress</span>
              </li>
              <li>
                First claim window
                <span className="tag tag-tba">TBA</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it will work */}
      <section className="steps">
        <h2 className="steps-title">How the CLAIM portal will work</h2>
        <div className="steps-grid">
          <article className="step">
            <div className="step-badge">1</div>
            <h3>Connect your wallet</h3>
            <p>
              You&apos;ll connect a Solana wallet (Phantom, Backpack, etc.). The portal
              will only read balances and snapshot data required for eligibility.
            </p>
          </article>

          <article className="step">
            <div className="step-badge">2</div>
            <h3>View eligibility</h3>
            <p>
              You&apos;ll see why you are or aren&apos;t eligible – based on holdings,
              timing, and any campaign-specific rules, all shown clearly.
            </p>
          </article>

          <article className="step">
            <div className="step-badge">3</div>
            <h3>Claim rewards</h3>
            <p>
              If eligible, you&apos;ll confirm the claim and receive your $CLAIM tokens
              directly to your wallet in a single transaction.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
