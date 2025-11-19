#!/usr/bin/env node
// Rotates claim-schedule.json to the next round using randomised timings.

const fs = require('fs');
const path = require('path');

/* ---- Small helpers ---------------------------------------------------- */

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addMinutes(base, minutes) {
  return new Date(base.getTime() + minutes * 60_000);
}

function addSeconds(base, seconds) {
  return new Date(base.getTime() + seconds * 1_000);
}

/* ---- Load current schedule -------------------------------------------- */

const schedulePath = path.join(__dirname, '..', 'data', 'claim-schedule.json');

if (!fs.existsSync(schedulePath)) {
  console.error('claim-schedule.json not found at', schedulePath);
  process.exit(1);
}

const raw = fs.readFileSync(schedulePath, 'utf8');

let schedule;
try {
  schedule = JSON.parse(raw);
} catch (err) {
  console.error('Unable to parse claim-schedule.json', err);
  process.exit(1);
}

const now = new Date();
const nowMs = now.getTime();

// If current round has a future distributionDoneAt, leave it alone
let currentDoneMs = null;
if (schedule.distributionDoneAt) {
  const t = new Date(schedule.distributionDoneAt).getTime();
  if (!Number.isNaN(t)) currentDoneMs = t;
}

if (currentDoneMs && currentDoneMs > nowMs) {
  console.log('[CLAIM schedule] Current round still in progress. No changes.');
  process.exit(0);
}

/* ---- Timing ranges (TEST MODE: very short) ---------------------------- */

// For testing, everything happens fast:
//
// - Next window opens in 1–2 minutes
// - Snapshot is 1 minute before open
// - Window lasts 1 minute
// - Distribution a short time after

// When should the next window open, relative to *now* (minutes)?
const OPEN_DELAY_MIN = 1;
const OPEN_DELAY_MAX = 2;

// Snapshot offset *before* open (minutes) — fixed 1 minute for test.
const SNAPSHOT_OFFSET_MIN = 1;
const SNAPSHOT_OFFSET_MAX = 1;

// Claim window duration (minutes) — fixed 1 minute for test.
const WINDOW_DURATION_MIN = 1;
const WINDOW_DURATION_MAX = 1;

// Distribution lag after close (seconds).
const DIST_LAG_MIN = 30;
const DIST_LAG_MAX = 60;

// Distribution duration (seconds).
const DIST_DURATION_MIN = 30;
const DIST_DURATION_MAX = 60;

/* ---- Generate next round ---------------------------------------------- */

const nextRoundNumber =
  typeof schedule.roundNumber === 'number' ? schedule.roundNumber + 1 : 0;

// Randomised timings
const openDelayMinutes = randInt(OPEN_DELAY_MIN, OPEN_DELAY_MAX);
const windowDurationMinutes = randInt(WINDOW_DURATION_MIN, WINDOW_DURATION_MAX);
const snapshotOffsetMinutes = randInt(SNAPSHOT_OFFSET_MIN, SNAPSHOT_OFFSET_MAX);
const distributionLagSeconds = randInt(DIST_LAG_MIN, DIST_LAG_MAX);
const distributionDurationSeconds = randInt(
  DIST_DURATION_MIN,
  DIST_DURATION_MAX
);

// Core timestamps
const windowOpensAt = addMinutes(now, openDelayMinutes);
const windowClosesAt = addMinutes(windowOpensAt, windowDurationMinutes);
const snapshotAt = addMinutes(windowOpensAt, -snapshotOffsetMinutes);
const distributionStartsAt = addSeconds(windowClosesAt, distributionLagSeconds);
const distributionDoneAt = addSeconds(
  distributionStartsAt,
  distributionDurationSeconds
);

// This structure is what your frontend expects via SCHEDULE
const nextSchedule = {
  roundNumber: nextRoundNumber,
  snapshotAt: snapshotAt.toISOString(),
  windowOpensAt: windowOpensAt.toISOString(),
  windowClosesAt: windowClosesAt.toISOString(),
  distributionStartsAt: distributionStartsAt.toISOString(),
  distributionDoneAt: distributionDoneAt.toISOString(),
};

fs.writeFileSync(schedulePath, JSON.stringify(nextSchedule, null, 2) + '\n');

console.log('[CLAIM schedule] Updated schedule:');
console.log(JSON.stringify(nextSchedule, null, 2));
