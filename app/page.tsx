// app/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';

type Status = 'idle' | 'checking' | 'eligible' | 'not-eligible';

export default function Home() {
  const [wallet, setWallet] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const [snapshotDate, setSnapshotDate] = useState<string>('TBA');
  const [eligibilityScore, setEligibilityScore] = useState<string>('--');
  const [estimatedReward, setEstimatedReward] = useState<string>('--');
  const [claimWindow, setClaimWindow] = useState<string>('TBA');

  function handleDemoCheck(e: FormEvent) {
    e.preventDefault();
    const trimmed = wallet.trim();

    if (!trimmed) {
      setMessage('Enter a Solana wallet to run the demo check.');
      setStatus('idle');
      return;
    }

    setStatus('checking');
    setMessage(null);

    // Demo behaviour: pretend to query an API, then show mock values.
    setTimeout(() => {
      // Very simple deterministic “demo” logic based on string length
      const isEligible = trimmed.length % 2 === 0;

      setSnapshotDate('Snapshot scheduled · TBA');
      setClaimWindow('Opens with mainnet claim contract');
      setEligibilityScore(isEligible ? 'Eligible (demo)' : 'Not eligible (demo)');
      setEstimatedReward(isEligible ? 'To be calculated at launch' : '—');

      setStatus(isEligible ? 'eligible' : 'not-eligible');
      setMessage(
        isEligible
          ? 'Demo result: this wallet would qualify in a future claim scenario.'
          : 'Demo result: this wallet would not qualify in this scenario.'
      );
    }, 900);
  }

  const statusLabel =
    status === 'idle'
      ? 'Idle'
      : status === 'checking'
      ? 'Checking…'
      : status === 'eligible'
      ? 'Eligible (demo)'
      : 'Not eligible (demo)';

  return (
    <main className="claim-page">
      <div className="claim-shell">
        {/* Top mini-bar */}
        <div className="claim-topbar">
          <div className="claim-badge">CLAIM PORTAL · PREVIEW ONLY</div>
          <div className="claim-top-links">
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              className="claim-link subtle"
            >
              X (Twitter)
            </a>
            <span className="divider">•</span>
            <a
              href="https://t.me"
              target="_blank"
              rel="noreferrer"
              className="claim-link subtle"
            >
              Telegram
            </a>
          </div>
        </div>

        {/* Main layout */}
        <div className="claim-main">
          {/* Left: hero */}
          <section className="claim-hero">
            <div className="claim-logo-row">
              {/* Put your logo image in /public/claim-logo.png to use Image below */}
              <div className="logo-orb">
                <div className="logo-orb-inner" />
              </div>
              <div className="logo-text">
                <span className="logo-token">$CLAIM</span>
                <span className="logo-sub">The Token of Timing</span>
              </div>
            </div>

            <h1 className="claim-title">
              Your future rewards,
              <br />
              one claim away.
            </h1>

            <p className="claim-body">
              This is the official portal for future rewards connected to the{' '}
              <strong>$CLAIM</strong> token. Once the on-chain claim system is live,
              you&apos;ll be able to connect your wallet, verify eligibility, and
              claim rewards in one place.
            </p>

            <div className="pill-row">
              <span className="pill pill-live">Portal status · In design</span>
              <span className="pill pill-soft">Smart contract · In progress</span>
            </div>

            <div className="cta-row">
              <a
                href="#claim-pool"
                className="primary-button"
              >
                View claim pool design
              </a>
              <a
                href="mailto:team@claim.example"
                className="ghost-button"
              >
                Contact team
              </a>
            </div>

            <p className="small-note">
              Nothing on this page is financial advice. Final rules, eligibility,
              and claim logic will be confirmed when the smart contract goes live.
            </p>
          </section>

          {/* Right: demo checker */}
          <section className="claim-panel">
            <div className="panel-header">
              <h2>Claim eligibility demo</h2>
              <p>Try a wallet to see how the future checker might behave.</p>
            </div>

            <form
              className="wallet-form"
              onSubmit={handleDemoCheck}
            >
              <label className="label" htmlFor="wallet">
                Wallet address
              </label>
              <input
                id="wallet"
                type="text"
                placeholder="Paste Solana wallet address"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                className="wallet-input"
              />
              <button
                type="submit"
                className="primary-button full"
                disabled={status === 'checking'}
              >
                {status === 'checking' ? 'Running demo check…' : 'Run demo check'}
              </button>
              {message && <p className="status-message">{message}</p>}
            </form>

            <div className="panel-divider" />

            <div className="panel-grid">
              <div className="panel-item">
                <span className="panel-label">Current status</span>
                <span className={`panel-value status-${status}`}>{statusLabel}</span>
              </div>
              <div className="panel-item">
                <span className="panel-label">Snapshot</span>
                <span className="panel-value">{snapshotDate}</span>
              </div>
              <div className="panel-item">
                <span className="panel-label">Claim window</span>
                <span className="panel-value">{claimWindow}</span>
              </div>
              <div className="panel-item">
                <span className="panel-label">Eligibility</span>
                <span className="panel-value">{eligibilityScore}</span>
              </div>
              <div className="panel-item">
                <span className="panel-label">Estimated reward</span>
                <span className="panel-value">{estimatedReward}</span>
              </div>
            </div>

            <p className="panel-footnote">
              This is a visual prototype only. Final eligibility logic, rewards,
              and distribution will be fully on-chain.
            </p>
          </section>
        </div>

        {/* Claim pool section */}
        <section
          id="claim-pool"
          className="claim-pool"
        >
          <div className="pool-header">
            <h2>Your claim pool</h2>
            <p>
              When the portal is live, this section will read your wallet, show the
              snapshot used, eligibility score, and the exact reward you can claim.
            </p>
          </div>

          <div className="pool-grid">
            <div className="pool-card primary">
              <div className="pool-card-header">
                <span className="pool-label">Connected wallet</span>
                <span className="pool-chip chip-waiting">Not connected</span>
              </div>
              <p className="pool-wallet-placeholder">
                Connect Phantom, Backpack, or any Solana wallet to load balances and
                snapshot data.
              </p>

              <div className="pool-row">
                <div>
                  <span className="pool-label">Snapshot used</span>
                  <div className="pool-value">To be announced</div>
                </div>
                <div>
                  <span className="pool-label">Eligibility score</span>
                  <div className="pool-value">—</div>
                </div>
                <div>
                  <span className="pool-label">Reward estimate</span>
                  <div className="pool-value">—</div>
                </div>
              </div>

              <div className="pool-progress">
                <div className="pool-progress-bar">
                  <div className="pool-progress-fill" />
                </div>
                <div className="pool-progress-legend">
                  <span>Phase 1 · Contract deployment</span>
                  <span>Phase 2 · Snapshot</span>
                  <span>Phase 3 · Portal live</span>
                </div>
              </div>

              <button
                className="primary-button disabled full"
                disabled
              >
                Claim button will appear here
              </button>
            </div>

            <div className="pool-card secondary">
              <h3>How the claim will work</h3>
              <ol className="pool-steps">
                <li>
                  <span className="step-title">1 · Connect</span>
                  <span className="step-text">
                    Link your Solana wallet. The portal reads balances and historic
                    activity at the snapshot block.
                  </span>
                </li>
                <li>
                  <span className="step-title">2 · Review</span>
                  <span className="step-text">
                    See your eligibility, reward breakdown, and any conditions before
                    confirming.
                  </span>
                </li>
                <li>
                  <span className="step-title">3 · Claim</span>
                  <span className="step-text">
                    Confirm on-chain. Your wallet receives tokens and the portal marks
                    the claim as completed.
                  </span>
                </li>
              </ol>

              <p className="small-note">
                Final documentation, audits, and contract addresses will be announced
                before the first claim window opens.
              </p>
            </div>
          </div>
        </section>

        <footer className="claim-footer">
          <span>© {new Date().getFullYear()} $CLAIM · All rights reserved.</span>
          <span className="footer-dot" />
          <span>Preview UI · Not live yet</span>
        </footer>
      </div>
    </main>
  );
}
