import { NextResponse } from 'next/server';
import rawAnalytics from '../../../data/analyticsState.json';

/* TYPES (match analytics page) */
type PoolStatus = 'not-opened' | 'open' | 'closed';

type SnapshotMetric = {
  round: number;
  snapshotBlock: string;
  eligibleWallets: number;
  totalClaim: number;
};

type AnalyticsState = {
  totalSnapshotWallets: number;
  totalAllocatedClaim: number;
  totalRounds: number;
  nextEventLabel: string;
  firstPoolStatus: PoolStatus;
  snapshotMetrics: SnapshotMetric[];
};

/* MAP RAW JSON → UI SHAPE */
function mapRawAnalytics(raw: any): AnalyticsState {
  return {
    totalSnapshotWallets: raw.totalSnapshotWallets,
    totalAllocatedClaim: raw.totalAllocatedClaim,
    totalRounds: raw.rounds.length,
    nextEventLabel: raw.nextEvent.label,
    firstPoolStatus: raw.firstPoolStatus,
    snapshotMetrics: raw.rounds.map((r: any) => ({
      round: r.round,
      snapshotBlock: r.snapshotBlock,
      eligibleWallets: r.eligibleWallets,
      totalClaim: r.totalClaim,
    })),
  };
}

export async function GET() {
  const uiState = mapRawAnalytics(rawAnalytics);
  return NextResponse.json(uiState);
}
