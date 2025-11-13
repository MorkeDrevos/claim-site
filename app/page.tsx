'use client';

import { FormEvent, useState } from 'react';

type Status = 'idle' | 'checking' | 'eligible' | 'not-eligible' | 'error';

export default function Home() {
  const [wallet, setWallet] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  function handleCheck(e: FormEvent) {
    e.preventDefault();
    if (!wallet.trim()) return;

    setStatus('checking');

    // Demo-only eligibility logic.
    // We’ll replace this with real on-chain / API logic later.
    setTimeout(() => {
      const okLength = wallet.trim().length >= 32 && wallet.trim().length <= 60;
      const looksLikeSol = /^[1-9A-HJ-NP-Za-km-z]+$/.test(wallet.trim());

      if (okLength && looksLikeSol) {
        setStatus('eligible');
      } else {
        setStatus('not-eligible');
      }
    }, 700);
  }

  return (
    <main className="page">
      {/* Top ribbon */}
      <div className="ribbon">
        <span className="ribbon-pill">🔥 The Burning Bear ecosystem</span>
        <span className="ribbon-text">
          $CLAIM is not live yet – this portal is a preview of the future rewards hub.
        </span>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero-left">
          <p className="eyebrow">$CLAIM · The Token of Timing</p>
          <h1 className="hero-title">
            Your future rewards,
            <br />
            one claim away.
          </h1>
          <p className="hero-subtitle">
            This is the official claim portal for future rewards connected to the Burning Bear
            ecosystem. Once the on-chain claim system is live, you’ll be able to connect your wallet,
            verify eligibility, and claim $CLAIM / $BBURN rewards in one place.
          </p>

          <div className="hero-bullets">
            <div className="bullet">
              <span className="bullet-dot" />
              <span>Official home for all future $CLAIM distributions</span>
            </div>
            <div className="bullet">
              <span className="bullet-dot" />
              <span>Transparent rules and clear eligibility requirements</span>
            </div>
            <div className="bullet">
              <span className="bullet-dot" />
              <span>Backed by the same deflationary vision as The Burning Bear</span>
            </div>
          </div>

          <div className="hero-cta">
            <a
              href="https://x.com/MorkeDrevos"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Follow updates on X
            </a>
            <a
              href="https://t.me/+cQ8qtgNnoYA2YTU"
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
            >
              Join The Burning Bear Telegram
            </a>
          </div>

          <p className="disclaimer">
            Nothing on this page is financial advice. Rewards, eligibility rules, and timelines are
            subject to change until officially announced.
          </p>
        </div>

        {/* Right column – Eligibility card */}
        <div className="hero-right">
          <div className="card">
            <p className="card-label">Preview · Claim portal</p>
            <h2 className="card-title">Check claim preview</h2>
            <p className="card-text">
              This is a <strong>demo-only</strong> checker while the smart contract and final claim
              rules are being wired in. It does not reflect real eligibility yet.
            </p>

            <form onSubmit={handleCheck} className="card-form">
              <label htmlFor="wallet" className="field-label">
                Wallet address
              </label>
              <input
                id="wallet"
                type="text"
                placeholder="Paste your Solana wallet address"
                value={wallet}
                onChange={(e) => {
                  setWallet(e.target.value);
                  setStatus('idle');
                }}
                className="field-input"
              />

              <button type="submit" className="btn btn-full" disabled={!wallet.trim()}>
                {status === 'checking' ? 'Checking…' : 'Run demo check'}
              </button>
            </form>

            <div className="card-status">
              {status === 'idle' && (
                <p className="status-muted">
                  Paste a wallet and run the demo check. Real eligibility will come from on-chain
                  data later.
                </p>
              )}
              {status === 'checking' && (
                <p className="status-info">Talking to the CLAIM oracles…</p>
              )}
              {status === 'eligible' && (
                <div className="status-pill status-ok">
                  <span>✅ Demo result: Eligible</span>
                  <p>
                    In the live version, this wallet would be able to claim a reward. Exact amounts
                    and rules will be announced before launch.
                  </p>
                </div>
              )}
              {status === 'not-eligible' && (
                <div className="status-pill status-bad">
                  <span>⚠️ Demo result: Not eligible yet</span>
                  <p>
                    In the real system this could mean not enough holdings, no snapshot match, or
                    outside the claim window. For now, it’s only a placeholder outcome.
                  </p>
                </div>
              )}
              {status === 'error' && (
                <div className="status-pill status-bad">
                  <span>❌ Something went wrong</span>
                  <p>Please try again. If this keeps happening, check back a bit later.</p>
                </div>
              )}
            </div>

            <div className="card-footer">
              <p>
                Next step: connect this checker to real on-chain data and plug in the final $CLAIM
                claim contract.
              </p>
            </div>
          </div>

          <div className="status-box">
            <h3>Portal status</h3>
            <ul>
              <li>Design & front-end: <span className="status-tag status-done">Live</span></li>
              <li>Eligibility rules: <span className="status-tag status-wip">Drafting</span></li>
              <li>On-chain claim contract: <span className="status-tag status-wip">In progress</span></li>
              <li>First claim window: <span className="status-tag status-soon">TBA</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ / info */}
      <section className="section">
        <h2 className="section-title">How the CLAIM portal will work</h2>
        <div className="section-grid">
          <div className="info-card">
            <h3>1. Connect your wallet</h3>
            <p>
              You’ll connect a Solana wallet (Phantom, Backpack, etc.). The portal will read your
              balances and snapshot data to check if you’re eligible.
            </p>
          </div>
          <div className="info-card">
            <h3>2. Verify eligibility</h3>
            <p>
              You’ll see exactly why you are (or are not yet) eligible – based on holdings, timing,
              and any special campaign rules.
            </p>
          </div>
          <div className="info-card">
            <h3>3. Claim rewards</h3>
            <p>
              If eligible, you’ll confirm the claim in your wallet. The contract will send your
              tokens and update your claim status on-chain.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-bottom">
        <h2 className="section-title">Stay safe, stay official</h2>
        <p className="section-text">
          This domain and the links above are the only trusted sources for $CLAIM and Burning Bear
          claim information. If a site asks you to “revoke blacklist” or send SOL to get rewards,
          it’s a scam.
        </p>
      </section>
    </main>
  );
}
