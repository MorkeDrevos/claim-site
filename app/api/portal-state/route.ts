import { NextResponse } from 'next/server';

type PoolStatus = 'not-opened' | 'open' | 'closed';

type ClaimHistoryEntry = {
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

// For now this is still mock data.
// Later this will read from your indexer / program.
const mockState: ClaimPortalState = {
  walletConnected: false,
  walletShort: 'Wallet not connected',
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

export async function GET() {
  return NextResponse.json(mockState);
}
