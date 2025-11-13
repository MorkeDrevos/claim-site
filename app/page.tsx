// app/page.tsx
'use client';

import { FormEvent, useState } from 'react';

type Status = 'idle' | 'checking' | 'eligible' | 'not-eligible';

export default function Home() {
  const [wallet, setWallet] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const [snapshotDate] = useState<string>('Snapshot: TBA');
  const [claimWindow] = useState<string>('First claim round: TBA');
  const [eligibilityScore, setEligibilityScore] = useState<string>('--');
  const [estimatedReward, setEstimatedReward] = useState<string>('--');

  function handlePreviewCheck(e: FormEvent) {
    e.preventDefault();
    const trimmed = wallet.trim();

    if (!trimmed) {
      setMessage('Enter a Solana wallet to check your preview status.');
      setStatus('idle');
      return;
    }

    setStatus('checking');
    setMessage(null);

    // Temporary “live preview” behaviour.
    setTimeout(() => {
      const isEligible = trimmed.length % 2 === 0;

      setEligibilityScore(isEligible ? 'Preview: eligible' : 'Preview: not eligible');
      setEstimatedReward(isEligible ? 'Reward calculated at launch' : '—');

      setStatus(isEligible ? 'eligible' : 'not-eligible');
      setMessage(
        isEligible
          ? 'This wallet would qualify in the first $CLAIM pool based on the current preview logic.'
          : 'This wallet would not qualify in the first $CLAIM pool based on the current preview logic.'
      );
    }, 900);
  }

  const statusLabel =
    status === 'idle'
      ? 'Waiting for wallet'
      : status === 'checking'
      ? 'Checking…'
      : status === 'eligible'
      ? 'Preview: eligible'
      : 'Preview: not eligible';

  return (
    <main className="claim-page">
      <div className="claim-shell">
        {/* Top bar */}
        <div className="claim-topbar">
          <div className="claim-badge">$CLAIM · LIVE CLAIM PORTAL</div>
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

        {/* MAIN SECTION: CLAIM POOL FIRST */}
        <section id="claim-pool" className="claim-main">
          {/* Left side – main claim pool card */}
          <div className="pool-card primary">
            <div className="pool-card-header">
              <div>
                <span className="pool-label">Your claim pool</span>
                <div style={{ marginTop: 4, fontSize: 15, fontWeight: 500 }}>
                  Connect your wallet to check $CLAIM rewards
                </div>
              </div>
              <span className="pool-chip chip-waiting">Round 1 · Preparing</span>
            </div>

            <p className="pool-wallet-placeholder">
              This is the official $CLAIM portal. As soon as the first pool opens,
              this card will show your snapshot, eligibility and reward amount.
            </p>

            <form className="wallet-form" onSubmit={handlePreviewCheck}>
              <label className="label" htmlFor="wallet">
                Solana wallet address
              </label>
              <input
                id="wallet"
                type="text"
                placeholder="Paste your Solana wallet"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                className="wallet-input"
              />
              <button
                type="submit"
                className="primary-button full"
                disabled={status === 'checking'}
              >
                {status === 'checking'
                  ? 'Checking preview status…'
                  : 'Check claim preview'}
              </button>
              {message && <p className="status-message">{message}</p>}
            </form>

            <div className="panel-divider" />

            {/* Live-style pool summary */}
            <div className="panel-grid">
              <div className="panel-item">
                <span className="panel-label">Wallet status</span>
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

            <div className="pool-progress">
              <div className="pool-progress-bar">
                <div className="pool-progress-fill" />
              </div>
              <div className="pool-progress-legend">
                <span>1 · Contract deployed</span>
                <span>2 · Snapshot confirmed</span>
                <span>3 · Claim window live</span>
              </div>
            </div>

            <button className="primary-button disabled full" disabled>
              Claim button appears here when Round 1 opens
            </button>

            <p className="panel-footnote" style={{ marginTop: 8 }}>
              Until the first round is opened, this portal runs in{' '}
              <strong>live preview mode</strong>: you can test wallets and see how the
              claim flow will behave.
            </p>
          </div>

          {/* Right side – explanation / status */}
          <div className="pool-card secondary">
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>$CLAIM · The Token of Timing</h2>
            <p style={{ marginTop: 0, fontSize: 13, color: 'var(--text-soft)' }}>
              This portal is the single home for every $CLAIM distribution. When a
              pool is active you&apos;ll see your eligibility and rewards here, not in
              random forms or spreadsheets.
            </p>

            <div className="pill-row" style={{ marginTop: 8, marginBottom: 14 }}>
              <span className="pill pill-live">Portal · Online</span>
              <span className="pill pill-soft">Round 1 · Not opened yet</span>
            </div>

            <h3 style={{ fontSize: 14, margin: '0 0 8px' }}>How each claim round works</h3>
            <ol className="pool-steps">
              <li>
                <span className="step-title">1 · Snapshot</span>
                <span className="step-text">
                  A specific block and date are announced. Balances and activity at
                  that point define eligibility.
                </span>
              </li>
              <li>
                <span className="step-title">2 · Connect & review</span>
                <span className="step-text">
                  Connect your wallet. The portal shows you why you are (or are not)
                  eligible and what you can claim.
                </span>
              </li>
              <li>
                <span className="step-title">3 · Claim on-chain</span>
                <span className="step-text">
                  Confirm the transaction in your wallet. Tokens are sent
                  immediately, and this card updates to &quot;Claimed&quot;.
                </span>
              </li>
            </ol>

            <p className="small-note">
              Final documentation, audits and contract addresses will be published
              before Round 1 opens. Always verify announcements from the official
              $CLAIM channels only.
            </p>
          </div>
        </section>

        {/* Lower section – softer hero / context */}
        <section className="claim-pool">
          <div className="pool-header">
            <h2>Why this portal exists</h2>
            <p>
              $CLAIM is designed to make timing and eligibility transparent. Instead
              of scattered snapshots and mystery airdrops, every reward round runs
              through this portal with clear rules and on-chain verification.
            </p>
          </div>
        </section>

        <footer className="claim-footer">
          <span>© {new Date().getFullYear()} $CLAIM · Claim portal.</span>
          <span className="footer-dot" />
          <span>Live preview · First pool opening soon</span>
        </footer>
      </div>
    </main>
  );
}
