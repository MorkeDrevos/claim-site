#!/usr/bin/env node

/**
 * auto-claim-schedule.js
 *
 * Reward pool schedule automation for $CLAIM:
 * - Claim window opens 1-3 hours from now (random)
 * - Snapshot 45-10 minutes before window opens (random)
 * - Window open 3-5 minutes (random)
 * - Window closed for 60 seconds
 * - Distribution phase
 * - When distributionDoneAt is in the past (and mode is auto) the next round is generated
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'claim-schedule.json');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function loadState() {
  if (!fs.existsSync(FILE)) {
    return {
      mode: 'auto',
      roundNumber: 0,
      snapshotAt: null,
      windowOpensAt: null,
      windowClosesAt: null,
      distributionStartsAt: null,
      distributionDoneAt: null
    };
  }

  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[CLAIM] Failed to read claim-schedule.json. Recreating default.', err);
    return {
      mode: 'auto',
      roundNumber: 0,
      snapshotAt: null,
      windowOpensAt: null,
      windowClosesAt: null,
      distributionStartsAt: null,
      distributionDoneAt: null
    };
  }
}

function needsNewRound(state, now) {
  if (state.mode !== 'auto') {
    console.log('[CLAIM] Mode is manual, not touching schedule.');
    return false;
  }

  if (!state.distributionDoneAt) {
    // No previous round or incomplete schedule
    return true;
  }

  const done = new Date(state.distributionDoneAt);
  if (isNaN(done.getTime())) return true;

  // Only create a new round once distribution is fully done
  return now >= done;
}

function createNextRound(prevState, now) {
  const roundNumber = (prevState.roundNumber || 0) + 1;

  // 1) Claim window opens 1-3 hours from now (random)
  const openDelayMinutes = randomInt(60, 180); // 60-180 minutes
  const windowOpensAt = new Date(now.getTime() + openDelayMinutes * 60 * 1000);

  // 2) Snapshot 45-10 minutes before window opens (random)
  const snapshotLeadMinutes = randomInt(10, 45);
  const snapshotAt = new Date(windowOpensAt.getTime() - snapshotLeadMinutes * 60 * 1000);

  // 3) Window open 3-5 minutes (random)
  const windowDurationMinutes = randomInt(3, 5);
  const windowClosesAt = new Date(windowOpensAt.getTime() + windowDurationMinutes * 60 * 1000);

  // 4) Closed window for 60 seconds
  const distributionStartsAt = new Date(windowClosesAt.getTime() + 60 * 1000);

  // 5) Distribution done shortly after (you can tweak)
  const distributionDoneAt = new Date(distributionStartsAt.getTime() + 30 * 1000);

  const state = {
    mode: prevState.mode || 'auto',
    roundNumber,
    snapshotAt: snapshotAt.toISOString(),
    windowOpensAt: windowOpensAt.toISOString(),
    windowClosesAt: windowClosesAt.toISOString(),
    distributionStartsAt: distributionStartsAt.toISOString(),
    distributionDoneAt: distributionDoneAt.toISOString()
  };

  console.log('[CLAIM] New round scheduled:');
  console.table({
    roundNumber: state.roundNumber,
    snapshotAt: state.snapshotAt,
    windowOpensAt: state.windowOpensAt,
    windowClosesAt: state.windowClosesAt,
    distributionStartsAt: state.distributionStartsAt,
    distributionDoneAt: state.distributionDoneAt
  });

  return state;
}

function main() {
  const now = new Date();
  let state = loadState();

  if (needsNewRound(state, now)) {
    state = createNextRound(state, now);
    fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
  } else {
    console.log('[CLAIM] Current round still active. No changes.');
  }
}

main();
