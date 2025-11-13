// lib/claimState.ts

// ========= Raw JSON types (exactly your portalState.json) =========

export type ClaimWindowStatusRaw = 'scheduled' | 'open' | 'closed';

export interface RawClaimWindow {
  status: ClaimWindowStatusRaw;
  opensAt: string;  // ISO 8601
  closesAt: string; // ISO 8601
}

export interface RawContract {
  status: string;          // e.g. "Deployed"
  address: string;         // program address
  auditUrl: string | null; // optional link
}

export interface RawPool {
  status: string;          // e.g. "open" | "closed" | "not-opened"
  rewardTotal: number;     // total rewards in $CLAIM
  rewardTotalUsd?: number; // derived USD value (optional)
  eligibilityMinHold: number;
  eligibilityMinLP?: number;
}

export interface RawWalletClaim {
  alreadyClaimed: boolean;
  claimedAmount: number;
  claimTx: string | null;
}

export interface RawWallet {
  connected: boolean;
  addressShort: string; // e.g. "9uuq…kH5" or "Wallet not connected"
  inSnapshot: boolean;  // used here as "eligible preview"
  eligibleAmount: number;
  claim: RawWalletClaim;
}

export interface RawClaimHistoryEntry {
  round: number;
  amount: number;
  tx: string;
  date: string; // ISO 8601
}

export interface RawPortalState {
  round: number;
  networkLabel: string;
  snapshotLabel: string;
  snapshotBlock: string;
  claimWindow: RawClaimWindow;
  contract: RawContract;
  pool: RawPool;
  wallet: RawWallet;
  claimHistory: RawClaimHistoryEntry[];
}

// ========= UI types (what /api/portal-state returns, what page.tsx uses) =========

export type PoolStatus = 'not-opened' | 'open' | 'closed';

export type ClaimHistoryEntry = {
  round: number;
  amount: number;
  tx?: string;
  date?: string;
};

export type ClaimPortalState = {
  // Wallet + eligibility
  walletConnected: boolean;
  walletShort: string;
  walletEligible: boolean; // derived from wallet.inSnapshot

  // Labels
  networkLabel: string;
  snapshotLabel: string;
  snapshotBlock: string;

  // Claim window (pretty text + raw opensAt for countdown)
  claimWindowStatus: string;        // pretty text for the card
  claimWindowOpensAt?: string | null;

  // Status badges
  frontEndStatus: string;
  contractStatus: string;
  firstPoolStatus: PoolStatus;

  // Numbers
  eligibleAmount: number;
  rewardPoolTotal: number;          // CLAIM
  rewardPoolTotalUsd: number | null; // USD (derived)

  // History preview
  claimHistory: ClaimHistoryEntry[];
};

// ========= Helper: date formatting for the UI =========

function formatUtcShort(iso: string): string {
  // Example: "2025-01-05T18:00:00Z" -> "2025-01-05 · 18:00 UTC"
  try {
    const s = iso.trim();
    const [datePart, timePartWithZ] = s.split('T');
    if (!datePart || !timePartWithZ) return iso;

    const timePart = timePartWithZ.replace('Z', '').slice(0, 5); // HH:MM
    return `${datePart} · ${timePart} UTC`;
  } catch {
    return iso;
  }
}

// ========= Mapping: RawPortalState -> ClaimPortalState =========

export function mapRawPortalState(raw: RawPortalState): ClaimPortalState {
  // Claim window text + opensAt for countdown
  let claimWindowStatus = 'TBA';
  let claimWindowOpensAt: string | null = raw.claimWindow?.opensAt ?? null;

  if (raw.claimWindow) {
    const { status, opensAt, closesAt } = raw.claimWindow;

    if (status === 'scheduled') {
      claimWindowStatus = `Opens on ${formatUtcShort(opensAt)}`;
    } else if (status === 'open') {
      claimWindowStatus = `Closes on ${formatUtcShort(closesAt)}`;
    } else if (status === 'closed') {
      claimWindowStatus = 'Closed';
    }
  }

  // Normalize pool status into our UI union type
  const poolStatusLower = raw.pool.status.toLowerCase();
  const firstPoolStatus: PoolStatus =
    poolStatusLower === 'open'
      ? 'open'
      : poolStatusLower === 'closed'
      ? 'closed'
      : 'not-opened';

  const rewardPoolTotal = typeof raw.pool.rewardTotal === 'number'
    ? raw.pool.rewardTotal
    : 0;

  const rewardPoolTotalUsd =
    typeof raw.pool.rewardTotalUsd === 'number'
      ? raw.pool.rewardTotalUsd
      : null;

  return {
    // Wallet + eligibility
    walletConnected: raw.wallet.connected,
    walletShort: raw.wallet.addressShort,
    walletEligible: !!raw.wallet.inSnapshot,

    // Labels
    networkLabel: raw.networkLabel,
    snapshotLabel: raw.snapshotLabel,
    snapshotBlock: raw.snapshotBlock,

    // Claim window
    claimWindowStatus,
    claimWindowOpensAt,

    // Status badges
    frontEndStatus: 'Online', // can be wired later
    contractStatus: raw.contract.status,
    firstPoolStatus,

    // Numbers
    eligibleAmount: raw.wallet.eligibleAmount,
    rewardPoolTotal,
    rewardPoolTotalUsd,

    // History
    claimHistory: raw.claimHistory.map((entry) => ({
      round: entry.round,
      amount: entry.amount,
      tx: entry.tx || undefined,
      date: entry.date || undefined,
    })),
  };
}
