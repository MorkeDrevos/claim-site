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
  eligibilityMinHold: number;
  eligibilityMinLP: number;
}

export interface RawWalletClaim {
  alreadyClaimed: boolean;
  claimedAmount: number;
  claimTx: string | null;
}

export interface RawWallet {
  connected: boolean;
  addressShort: string; // e.g. "9uuq…kH5" or "Wallet not connected"
  inSnapshot: boolean;
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

// ========= UI types (what page.tsx uses) =========

export type PoolStatus = 'not-opened' | 'open' | 'closed';

export type ClaimHistoryEntry = {
  round: number;
  amount: number;
  tx?: string;
  date?: string;
};

export type ClaimPortalState = {
  walletConnected: boolean;
  walletShort: string;
  networkLabel: string;
  snapshotLabel: string;
  snapshotBlock: string;

  claimWindowStatus: string; // pretty text for the card

  frontEndStatus: string;
  contractStatus: string;
  firstPoolStatus: PoolStatus;

  eligibleAmount: number;
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
  // Claim window status text for the UI
  let claimWindowStatus = 'TBA';

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

  return {
    walletConnected: raw.wallet.connected,
    walletShort: raw.wallet.addressShort,

    networkLabel: raw.networkLabel,
    snapshotLabel: raw.snapshotLabel,
    snapshotBlock: raw.snapshotBlock,

    claimWindowStatus,

    frontEndStatus: 'Online',        // you can wire this later if needed
    contractStatus: raw.contract.status,
    firstPoolStatus,

    eligibleAmount: raw.wallet.eligibleAmount,

    claimHistory: raw.claimHistory.map((entry) => ({
      round: entry.round,
      amount: entry.amount,
      tx: entry.tx || undefined,
      date: entry.date || undefined,
    })),
  };
}
