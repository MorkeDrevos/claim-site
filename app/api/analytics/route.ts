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
    totalRounds: raw.totalRounds,
    nextEventLabel: raw.nextEventLabel,
    firstPoolStatus: raw.firstPoolStatus,
    snapshotMetrics: raw.snapshotMetrics,
  };
}

export async function GET() {
  const uiState = mapRawAnalytics(rawAnalytics);
  return NextResponse.json(uiState);
}
