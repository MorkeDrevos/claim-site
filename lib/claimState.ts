// lib/claimState.ts

// -----------------------------
// UI types (what the React page uses)
// -----------------------------

export type PoolStatus = 'not-opened' | 'open' | 'closed';

export type ClaimHistoryEntry = {
  round: number;
  amount: number;
  tx?: string | null;
  date?: string | null;
};

export type ClaimPortalState = {
  walletConnected: boolean;
  walletShort: string;
  networkLabel: string;
  snapshotLabel: string;
  eligibleAmount: number;
  claimWindowStatus: string;
  snapshotBlock: string;
  frontEndStatus: string;
  contractStatus: string;
  firstPoolStatus: PoolStatus;
  claimHistory: ClaimHistoryEntry[];
};

// -----------------------------
// JSON document types
// (matches data/portalState.json exactly)
// -----------------------------

export type ClaimWindowPhase = 'scheduled' | 'open' | 'closed';

export type PortalClaimWindow = {
  status: ClaimWindowPhase;
  opensAt: string | null;  // ISO string or null
  closesAt: string | null; // ISO string or null
};

export type PortalContractInfo = {
  status: string;           // e.g. 'Deployed', 'In progress'
  address: string | null;   // program address when live
  auditUrl: string | null;  // link to audit, if any
};

export type PortalPoolInfo = {
  status: PoolStatus;       // 'open' | 'closed' | 'not-opened'
  rewardTotal: number;      // total rewards for this round
  eligibilityMinHold: number;
  eligibilityMinLP: number;
};

export type PortalWalletClaimInfo = {
  alreadyClaimed: boolean;
  claimedAmount: number;
  claimTx: string | null;
};

export type PortalWalletInfo = {
  connected: boolean;
  addressShort: string; // e.g. '9uuq…kH5' or 'Wallet not connected'
  inSnapshot: boolean;
  eligibleAmount: number;
  claim: PortalWalletClaimInfo;
};

export type PortalStateDoc = {
  round: number;
  networkLabel: string;   // 'Solana mainnet', 'Solana devnet', ...
  snapshotLabel: string;  // 'Snapshot — ROUND 1', etc.
  snapshotBlock: string;  // '219038421'
  claimWindow: PortalClaimWindow;
  contract: PortalContractInfo;
  pool: PortalPoolInfo;
  wallet: PortalWalletInfo;
  claimHistory: ClaimHistoryEntry[];
};

// -----------------------------
// Helpers
// -----------------------------

function formatUtc(dt: string | null): string {
  if (!dt) return 'TBA';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt; // fall back to raw string
  // Example: "Sun, 05 Jan 2025 18:00:00 UTC"
  return d.toUTCString().replace(' GMT', ' UTC');
}

function buildClaimWindowStatus(win: PortalClaimWindow): string {
  switch (win.status) {
    case 'scheduled':
      return win.opensAt ? `Opens on ${formatUtc(win.opensAt)}` : 'Scheduled';
    case 'open':
      return win.closesAt
        ? `Open · closes ${formatUtc(win.closesAt)}`
        : 'Open';
    case 'closed':
      return 'Closed';
    default:
      return 'Unknown';
  }
}

function normalizeSnapshotBlock(block: string): string {
  if (!block) return 'TBA';
  return block.startsWith('#') ? block : `#${block}`;
}

// -----------------------------
// Mapper: JSON -> UI state
// -----------------------------

export function mapPortalDocToState(doc: PortalStateDoc): ClaimPortalState {
  return {
    walletConnected: doc.wallet.connected,
    walletShort: doc.wallet.addressShort,
    networkLabel: doc.networkLabel,
    snapshotLabel: doc.snapshotLabel,
    eligibleAmount: doc.wallet.eligibleAmount,
    claimWindowStatus: buildClaimWindowStatus(doc.claimWindow),
    snapshotBlock: normalizeSnapshotBlock(doc.snapshotBlock),

    // You can tweak these if you ever want more precise states
    frontEndStatus: 'Online',
    contractStatus: doc.contract.status,
    firstPoolStatus: doc.pool.status,

    claimHistory: doc.claimHistory,
  };
}
