// lib/claimState.ts
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
  eligibleAmount: number;
  claimWindowStatus: string;
  snapshotBlock: string;
  frontEndStatus: string;
  contractStatus: string;
  firstPoolStatus: PoolStatus;
  claimHistory: ClaimHistoryEntry[];
};

// TODO: replace this with real API/wallet data
export function getClaimPortalState(): ClaimPortalState {
  const walletConnected = false; // later: check wallet adapter
  const walletShort = walletConnected ? '9uuq…kH5' : 'Wallet not connected';

  return {
    walletConnected,
    walletShort,
    networkLabel: 'Solana devnet',
    snapshotLabel: 'Snapshot – TBA',
    eligibleAmount: 0,
    claimWindowStatus: 'Not opened yet',
    snapshotBlock: 'To be announced',
    frontEndStatus: 'Online',
    contractStatus: 'In progress',
    firstPoolStatus: 'not-opened',
    claimHistory: [],
  };
}
