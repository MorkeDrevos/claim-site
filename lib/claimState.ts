// lib/claimState.ts

// This matches the JSON you pasted
export type RawPortalState = {
  round?: number;

  networkLabel?: string;
  snapshotLabel?: string;
  snapshotBlock?: string;

  claimWindow?: {
    status?: 'scheduled' | 'open' | 'closed';
    opensAt?: string | null;
    closesAt?: string | null;
  };

  contract?: {
    status?: string;
    address?: string;
    auditUrl?: string | null;
  };

  pool?: {
    status?: 'not-opened' | 'open' | 'closed';
    rewardTotal?: number;
    eligibilityMinHold?: number;
    eligibilityMinLP?: number;
    rewardTotalUsd?: number;
  };

  wallet?: {
    connected?: boolean;
    addressShort?: string;
    inSnapshot?: boolean;
    eligibleAmount?: number;
    claim?: {
      alreadyClaimed?: boolean;
      claimedAmount?: number;
      claimTx?: string | null;
    };
  };

  claimHistory?: Array<{
    round: number;
    amount: number;
    tx?: string;
    date?: string;
  }>;
};

// Small helper for the grey status line
function formatUtcLabel(iso?: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  return (
    t
      .toISOString()
      .slice(0, 16)
      .replace('T', ' · ') + ' UTC'
  );
}

/**
 * Map raw JSON (your portalState.json) into the UI state
 * that page.tsx expects.
 */
export function mapRawPortalState(raw: RawPortalState) {
  const claimWindow = raw.claimWindow ?? {};
  const pool = raw.pool ?? {};
  const wallet = raw.wallet ?? {};
  const history = raw.claimHistory ?? [];

  const phase: 'scheduled' | 'open' | 'closed' =
    claimWindow.status === 'open'
      ? 'open'
      : claimWindow.status === 'closed'
      ? 'closed'
      : 'scheduled';

  const opensAt = claimWindow.opensAt ?? null;
  const closesAt = claimWindow.closesAt ?? null;

  // This is only used as the small grey line under the block
  let claimWindowStatus: string;
  if (phase === 'open') {
    const label = formatUtcLabel(closesAt);
    claimWindowStatus = label
      ? `Closes on ${label}`
      : 'Claim window open now';
  } else if (phase === 'closed') {
    claimWindowStatus = 'Claim window closed';
  } else {
    const label = formatUtcLabel(opensAt);
    claimWindowStatus = label
      ? `Opens on ${label}`
      : 'Next window scheduled';
  }

  return {
    // ── Wallet / header info ─────────────────────────────
    walletConnected: !!wallet.connected,
    walletShort: wallet.addressShort ?? '',

    networkLabel: raw.networkLabel ?? 'Solana mainnet',
    snapshotLabel: raw.snapshotLabel ?? 'Snapshot — Round 1',
    snapshotBlock: raw.snapshotBlock ?? '',

    // ── Claim window timing ──────────────────────────────
    claimWindowStatus,
    claimWindowOpensAt: opensAt,
    claimWindowClosesAt: closesAt,
    windowPhase: phase,

    // ── System status ────────────────────────────────────
    frontEndStatus: 'Online', // you can change this if you want
    contractStatus: raw.contract?.status ?? 'Deployed',
    firstPoolStatus: pool.status ?? 'not-opened',

    // ── Wallet eligibility / history ─────────────────────
    eligibleAmount: wallet.eligibleAmount ?? 0,
    claimHistory: history,

    // ── Reward pool numbers ──────────────────────────────
    rewardPoolAmountClaim:
      typeof pool.rewardTotal === 'number' ? pool.rewardTotal : null,
    rewardPoolAmountUsd:
      typeof pool.rewardTotalUsd === 'number' ? pool.rewardTotalUsd : null,
  };
}
