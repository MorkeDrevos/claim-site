export type WindowPhase =
  | 'scheduled'
  | 'snapshot'
  | 'open'
  | 'closed'
  | 'distribution'
  | 'done';

export type ClaimSchedule = {
  mode: 'auto' | 'manual';
  roundNumber: number;

  snapshotAt: string | null;
  windowOpensAt: string | null;
  windowClosesAt: string | null;
  distributionStartsAt: string | null;
  distributionDoneAt: string | null;
};

type PhaseResult = {
  phase: WindowPhase;
  countdownTarget: Date | null;
  claimWindowStatus: string;
  frontEndStatus: string;
  snapshotLabel: string;
};

function parseMaybeDate(v: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export function getPhaseForNow(
  schedule: ClaimSchedule,
  nowInput?: Date
): PhaseResult {
  const now = nowInput ?? new Date();

  const snapshotAt = parseMaybeDate(schedule.snapshotAt);
  const opensAt = parseMaybeDate(schedule.windowOpensAt);
  const closesAt = parseMaybeDate(schedule.windowClosesAt);
  const distStartsAt = parseMaybeDate(schedule.distributionStartsAt);
  const distDoneAt = parseMaybeDate(schedule.distributionDoneAt);

  let phase: WindowPhase = 'scheduled';
  let countdownTarget: Date | null = null;
  let claimWindowStatus = 'Not opened';
  let frontEndStatus = 'Window not opened yet';
  let snapshotLabel = 'Snapshot not taken yet';

  // Done
  if (distDoneAt && now >= distDoneAt) {
    phase = 'done';
    claimWindowStatus = 'Completed';
    frontEndStatus = 'Round completed. Next round will be scheduled.';
    countdownTarget = null;
    snapshotLabel = 'Snapshot locked for this round';
    return { phase, countdownTarget, claimWindowStatus, frontEndStatus, snapshotLabel };
  }

  // Distribution
  if (distStartsAt && now >= distStartsAt) {
    phase = 'distribution';
    claimWindowStatus = 'Closed';
    frontEndStatus = 'Distribution in progress';
    countdownTarget = distDoneAt ?? null;
    snapshotLabel = 'Snapshot locked for this round';
    return { phase, countdownTarget, claimWindowStatus, frontEndStatus, snapshotLabel };
  }

  // Closed window
  if (closesAt && now >= closesAt) {
    phase = 'closed';
    claimWindowStatus = 'Closed';
    frontEndStatus = 'Window closed. Preparing distribution.';
    countdownTarget = distStartsAt ?? null;
    snapshotLabel = 'Snapshot locked for this round';
    return { phase, countdownTarget, claimWindowStatus, frontEndStatus, snapshotLabel };
  }

  // Open window
  if (opensAt && now >= opensAt) {
    phase = 'open';
    claimWindowStatus = 'Open';
    frontEndStatus = 'Claim window live';
    countdownTarget = closesAt ?? null;
    snapshotLabel = 'Snapshot locked for this round';
    return { phase, countdownTarget, claimWindowStatus, frontEndStatus, snapshotLabel };
  }

  // Snapshot already taken, but before open
  if (snapshotAt && now >= snapshotAt) {
    phase = 'snapshot';
    claimWindowStatus = 'Scheduled';
    frontEndStatus = 'Snapshot taken. Next window coming up.';
    countdownTarget = opensAt ?? null;
    snapshotLabel = 'Snapshot locked for this round';
    return { phase, countdownTarget, claimWindowStatus, frontEndStatus, snapshotLabel };
  }

  // Before snapshot (pure scheduled)
  phase = 'scheduled';
  claimWindowStatus = 'Scheduled';
  frontEndStatus = 'Next round scheduled';
  countdownTarget = snapshotAt ?? opensAt ?? null;
  snapshotLabel = 'Snapshot not taken yet';

  return { phase, countdownTarget, claimWindowStatus, frontEndStatus, snapshotLabel };
}
