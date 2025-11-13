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

export type PoolStatus = 'not-open
