'use client';

import { useState, FormEvent } from 'react';

type Tab = 'eligibility' | 'rewards' | 'history';

export default function Home() {
  const [wallet, setWallet] = useState('');
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(false);
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [previewReward, setPreviewReward] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('eligibility');

  function handleConnect() {
    if (!wallet.trim()) return;
    setConnected(true);
    // Fake initial preview
    handleCheckPreview();
  }

  function handleDisconnect() {
    setConnected(false);
    setEligible(null);
    setPreviewReward(null);
  }

  function handleCheckPreview(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!wallet.trim()) return;

    setChecking(true);

    // Temporary mock logic (remove later when real on-chain check is wired)
    setTimeout(() => {
      const isEligible = wallet.trim().length % 2 === 0;
      setEligible(isEligible);
      setPreviewReward(
        isEligible ? 'Preview: 2,340 $CLAIM (subject to final snapshot)' : null
      );
      setChecking(false);
    }, 800);
  }

  const statusLabel = !connected
    ? 'Wallet not connected'
    : checking
    ? 'Checking…'
    : eligible === null
    ? 'Connected · run preview'
    : eligible
    ? 'Eligible (preview)'
    : 'Not eligible (preview)';

  const statusTone =
    !connected || eligible === null
      ? 'neutral'
      : eligible
      ? 'positive'
      : 'negative';

  return (
    <main className="claim-dash-root">
      {/* Sidebar */}
      <aside className="claim-sidebar">
        <div className="sidebar-header">
          <div className="logo-circle">
            {/* If you have the CLAIM logo PNG, put it as background in CSS or add <img> here */}
            <span className="logo-mark">C</span>
          </div>
          <div className="logo-text">
            <span className="logo-name">$CLAIM</span>
            <span className="logo-sub">Claim portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Portal</div>
          <button className="nav-item nav-item-active">
            <span className="nav-dot" />
            Claim pool
          </button>
          <button className="nav-item" disabled>
            Analytics (soon)
          </button>

          <div className="nav-section-label">External</div>
          <a
            href="https://x.com"
            target="_blank"
            rel="noreferrer"
            className="nav-item link"
          >
            X (Twitter)
          </a>
          <a
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            className="nav-item link"
          >
            Telegram
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="badge-soft">Portal · Online (preview)</div>
          <div className="sidebar-footnote">
            First on-chain claim round will appear here as soon as the pool is live.
          </div>
        </div>
      </aside>

      {/* Main content */}
      <section className="claim-main">
        {/* Top header */}
        <header className="claim-header">
          <div>
            <h1>$CLAIM · Claim pool</h1>
            <p>
              Connect a Solana wallet to check your status for the upcoming claim
              pool.
            </p>
          </div>

          <div className="wallet-box">
            <form onSubmit={handleCheckPreview} className="wallet-inline-form">
              <input
                type="text"
                placeholder="Paste Solana wallet"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                className="wallet-input"
              />
              {!connected ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleConnect}
                  disabled={!wallet.trim()}
                >
                  Connect
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </button>
              )}
            </form>

            <div className={`wallet-status wallet-status-${statusTone}`}>
              <span className="dot" />
              <span>{statusLabel}</span>
            </div>
          </div>
        </header>

        {/* Claim pool + meta */}
        <div className="claim-main-grid">
          {/* Claim pool card */}
          <div className="card card-main">
            <div className="card-header">
              <div>
                <div className="pill-live">Claim pool · Round 1</div>
                <h2>Your position</h2>
              </div>
              <span className="tag-soft">Snapshot · TBA</span>
            </div>

            {!connected ? (
              <div className="card-body">
                <p className="muted">
                  Connect a wallet above to see if it qualifies for the first
                  $CLAIM pool. This preview does not move any funds and does not
                  require a signature.
                </p>
                <ul className="bullet-list">
                  <li>Check if this wallet is in the current snapshot set.</li>
                  <li>Preview how many tokens you&apos;ll be able to claim.</li>
                  <li>See the exact claim window and deadline once it&apos;s live.</li>
                </ul>
              </div>
            ) : (
              <div className="card-body">
                <div className="stat-grid">
                  <div className="stat">
                    <span className="stat-label">Wallet</span>
                    <span className="stat-value mono">
                      {wallet.slice(0, 4)}…{wallet.slice(-4)}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Preview status</span>
                    <span
                      className={`stat-value highlight highlight-${statusTone}`}
                    >
                      {eligible === null
                        ? 'Run preview'
                        : eligible
                        ? 'Eligible'
                        : 'Not eligible'}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Preview reward</span>
                    <span className="stat-value">
                      {previewReward ?? '—'}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Claim window</span>
                    <span className="stat-value">TBA</span>
                  </div>
                </div>

                <button
                  className="btn-primary full"
                  onClick={handleCheckPreview}
                  disabled={checking}
                >
                  {checking ? 'Checking preview…' : 'Run eligibility preview'}
                </button>

                <p className="fineprint">
                  This is a live preview of how the portal will behave. Final
                  eligibility and rewards are locked in at the published snapshot
                  block and may differ slightly from this preview.
                </p>
              </div>
            )}
          </div>

          {/* Side meta card */}
          <div className="card card-side">
            <h3>Portal status</h3>
            <div className="status-row">
              <span>Front-end</span>
              <span className="status-pill status-ok">Online</span>
            </div>
            <div className="status-row">
              <span>Claim contract</span>
              <span className="status-pill status-wait">In progress</span>
            </div>
            <div className="status-row">
              <span>First pool</span>
              <span className="status-pill status-wait">Not opened</span>
            </div>

            <hr className="divider" />

            <p className="muted small">
              When the contract is deployed and audited, this card will show the
              official contract address, audit links and real-time pool metrics.
            </p>
          </div>
        </div>

        {/* TABS SECTION */}
        <div className="card tabs-card">
          <div className="tabs-nav">
            <button
              className={`tab-btn ${activeTab === 'eligibility' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('eligibility')}
            >
              Eligibility
            </button>
            <button
              className={`tab-btn ${activeTab === 'rewards' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('rewards')}
            >
              Rewards
            </button>
            <button
              className={`tab-btn ${activeTab === 'history' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Claim history
            </button>
          </div>

          <div className="tabs-body">
            {activeTab === 'eligibility' && (
              <div className="tab-panel">
                <h3>How eligibility is calculated</h3>
                <p>
                  The $CLAIM pool is built around <strong>timing</strong>. Your
                  eligibility is determined by balances and activity at specific
                  snapshot blocks, not by random forms or manual lists.
                </p>
                <ul className="bullet-list">
                  <li>Snapshot block + date (announced before each round).</li>
                  <li>Minimum token holdings or LP position thresholds.</li>
                  <li>Optional bonus rules for long-term or early participants.</li>
                </ul>
                <p className="muted small">
                  The final rule set for Round 1 will be published before the
                  snapshot is taken and mirrored here inside the portal.
                </p>
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="tab-panel">
                <h3>Reward structure</h3>
                <p>
                  Each claim round has a fixed pool of $CLAIM tokens. Eligible
                  wallets receive a share based on their weight at the snapshot.
                </p>
                <ul className="bullet-list">
                  <li>Total pool size (Round 1): <strong>TBA</strong>.</li>
                  <li>Distribution curve: pro-rata with caps to avoid outliers.</li>
                  <li>
                    Any unclaimed tokens after the deadline are recycled into future
                    rounds.
                  </li>
                </ul>
                <p className="muted small">
                  Exact numbers go live once Round 1 is fully configured and
                  audited. This tab then becomes a live dashboard.
                </p>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="tab-panel">
                <h3>Claim history</h3>
                {!connected ? (
                  <p className="muted">
                    Connect a wallet to see its past and future claim rounds here.
                    Once the first pool is complete, this tab will show on-chain
                    history for this wallet only.
                  </p>
                ) : (
                  <div>
                    <p className="muted">
                      No on-chain claims recorded for this wallet yet.
                    </p>
                    <div className="history-placeholder">
                      <div className="history-row">
                        <span>Round</span>
                        <span>Amount</span>
                        <span>Status</span>
                      </div>
                      <div className="history-row dim">
                        <span>1</span>
                        <span>—</span>
                        <span>Not opened</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="claim-footer">
          <span>© {new Date().getFullYear()} $CLAIM portal</span>
          <span>·</span>
          <span>Preview UI · subject to change</span>
        </footer>
      </section>
    </main>
  );
}
