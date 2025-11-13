import { NextResponse } from 'next/server';
import { ClaimPortalState } from '../../../lib/claimState';

// For now this is still mock data.
// Later this will read from your indexer / database.
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
