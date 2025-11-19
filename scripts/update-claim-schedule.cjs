#!/usr/bin/env node
// Rotates claim-schedule.json to the next round using timed offsets.
// CURRENT SETUP: 1-minute steps between each stage (good for live testing).

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

// In case we ever store it as an array, just take the first entry.
if (Array.isArray(schedule)) {
  schedule = schedule[0] || {};
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

/* ---- Timing ranges (TEST MODE: 1-minute steps) ------------------------ */
/*
  Defaults below give you:

    now  + 1 min  -> snapshotAt
    now  + 2 min  -> windowOpensAt
    now  + 3 min  -> windowClosesAt
    now  + 4 min  -> distributionStartsAt
    now  + 5 min  -> distributionDoneAt

  You can still override via env vars on the workflow if you want.
*/

// When should the next window open, relative to *now* (minutes)?
// TEST: fixed 2 minutes from now.
const OPEN_DELAY_MIN = Number(process.env.CLAIM_OPEN_DELAY_MIN || 2);
const OPEN_DELAY_MAX = Number(process.env.CLAIM_OPEN_DELAY_MAX || 2);

// Snapshot offset *before* open (minutes).
// TEST: fixed 1 minute before open.
const SNAPSHOT_OFFSET_MIN = Number(process.env.CLAIM_SNAPSHOT_OFFSET_MIN || 1);
const SNAPSHOT_OFFSET_MAX = Number(process.env.CLAIM_SNAPSHOT_OFFSET_MAX || 1);

// Claim window duration (minutes).
// TEST: fixed 1-minute live window.
const WINDOW_DURATION_MIN = Number(process.env.CLAIM_WINDOW_DURATION_MIN || 1);
const WINDOW_DURATION_MAX = Number(process.env.CLAIM_WINDOW_DURATION_MAX || 1);

// Distribution lag after close (seconds).
// TEST: fixed 60 seconds after window closes.
const DIST_LAG_MIN = Number(process.env.CLAIM_DIST_LAG_MIN || 60);
const DIST_LAG_MAX = Number(process.env.CLAIM_DIST_LAG_MAX || 60);

// Distribution duration (seconds).
// TEST: fixed 60 seconds to finish distribution.
const DIST_DURATION_MIN = Number(process.env.CLAIM_DIST_DURATION_MIN || 60);
const DIST_DURATION_MAX = Number(process.env.CLAIM_DIST_DURATION_MAX || 60);

/* ---- Generate next round ---------------------------------------------- */

const nextRoundNumber =
  typeof schedule.roundNumber === 'number' ? schedule.roundNumber + 1 : 1;

// Randomised (but with very tight ranges for test)
const openDelayMinutes = randInt(OPEN_DELAY_MIN, OPEN_DELAY_MAX);
const windowDurationMinutes = randInt(
  WINDOW_DURATION_MIN,
  WINDOW_DURATION_MAX
);
const snapshotOffsetMinutes = randInt(
  SNAPSHOT_OFFSET_MIN,
  SNAPSHOT_OFFSET_MAX
);
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
