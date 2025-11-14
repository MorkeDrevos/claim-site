// lib/claimState.ts

export type RawPortalState = {
  walletConnected?: boolean;
  walletShort?: string;

  networkLabel?: string;
  snapshotLabel?: string;
  snapshotBlock?: string;

  claimWindowStatus?: string;
  claimWindowOpensAt?: string | null;
  claimWindowClosesAt?: string | null;
  windowPhase?: 'scheduled' | 'open' | 'closed';

  frontEndStatus?: string;
  contractStatus?: string;
  firstPoolStatus?: 'not-opened' | 'open' | 'closed';

  eligibleAmount?: number;
  claimHistory?: any[];

  rewardPoolAmountClaim?: number | null;
  rewardPoolAmountUsd?: number | null;
};

export function mapRawPortalState(raw: RawPortalState) {
  const phase: 'scheduled' | 'open' | 'closed' =
    raw.windowPhase ?? 'scheduled';

  return {
    walletConnected: !!raw.walletConnected,
    walletShort: raw.walletShort ?? '',

    networkLabel: raw.networkLabel ?? 'Solana mainnet',
    snapshotLabel: raw.snapshotLabel ?? 'Snapshot — Round 1',
    snapshotBlock: raw.snapshotBlock ?? '',

    claimWindowStatus:
      raw.claimWindowStatus ??
      (phase === 'open'
        ? 'Claim window open now'
        : phase === 'closed'
        ? 'Claim window closed'
        : 'Next window scheduled'),

    claimWindowOpensAt:
      raw.claimWindowOpensAt ?? null,
    claimWindowClosesAt:
      raw.claimWindowClosesAt ?? null,
    windowPhase: phase,

    frontEndStatus: raw.frontEndStatus ?? 'Online',
    contractStatus: raw.contractStatus ?? 'Deployed',
    firstPoolStatus: raw.firstPoolStatus ?? 'not-opened',

    eligibleAmount: raw.eligibleAmount ?? 0,
    claimHistory: raw.claimHistory ?? [],

    rewardPoolAmountClaim:
      typeof raw.rewardPoolAmountClaim === 'number'
        ? raw.rewardPoolAmountClaim
        : null,
    rewardPoolAmountUsd:
      typeof raw.rewardPoolAmountUsd === 'number'
        ? raw.rewardPoolAmountUsd
        : null
  };
}
