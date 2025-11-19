type ClaimPortalState = {
  // NEW unified round number
  roundNumber?: number;

  walletConnected: boolean;
  walletShort: string;
  networkLabel: string;

  snapshotLabel: string;       // stays
  snapshotBlock: string;

  // window status text the UI shows (unchanged)
  claimWindowStatus: string;

  // NEW: these now directly match claim-schedule.json
  snapshotAt?: string | null;
  claimWindowOpensAt?: string | null;
  claimWindowClosesAt?: string | null;
  distributionStartsAt?: string | null;
  distributionDoneAt?: string | null;

  // UI text (unchanged)
  frontEndStatus: string;
  contractStatus: string;
  firstPoolStatus: PoolStatus;

  // claim amounts (unchanged)
  eligibleAmount: number;
  claimHistory: ClaimHistoryEntry[];

  rewardPoolAmountClaim?: number | null;
  rewardPoolAmountUsd?: number | null;

  // NEW: portal phase + countdown targets
  windowPhase?: WindowPhase;
  numericCountdown?: string;

  // DEPRECATED (remove old names)
  // snapshotTakenAt?: string | null;
  // distributionCompletedAt?: string | null;
};
