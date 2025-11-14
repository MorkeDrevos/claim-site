#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');

const ROUND = process.env.CLAIM_ROUND || '1';

const configPath = path.join(DATA, `portalRound${ROUND}.config.json`);
const activePath = path.join(DATA, 'portalState.json');

const templates = {
  scheduled: path.join(DATA, `portalState.scheduled.round${ROUND}.json`),
  live: path.join(DATA, `portalState.live.round${ROUND}.json`),
  closed: path.join(DATA, `portalState.closed.round${ROUND}.json`),
  snapshot: path.join(DATA, `portalState.snapshot.round${ROUND}.json`),
  distribution: path.join(DATA, `portalState.distribution.round${ROUND}.json`)
};

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function toDate(s) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid ISO date: ${s}`);
  }
  return d;
}

function main() {
  const config = loadJSON(configPath);
  const { opensAt, closesAt, snapshotAt, distributionAt } = config.window;

  const now = new Date();
  const openTime = toDate(opensAt);
  const closeTime = toDate(closesAt);
  const snapshotTime = toDate(snapshotAt);
  const distributionTime = toDate(distributionAt);

  let phase;
  let templatePath;

  if (now < openTime) {
    phase = 'scheduled';
    templatePath = templates.scheduled;
  } else if (now >= openTime && now < closeTime) {
    phase = 'open';
    templatePath = templates.live;
  } else if (now >= closeTime && now < snapshotTime) {
    phase = 'closed';
    templatePath = templates.closed;
  } else if (now >= snapshotTime && now < distributionTime) {
    phase = 'snapshot';
    templatePath = templates.snapshot;
  } else {
    phase = 'distribution';
    templatePath = templates.distribution;
  }

  const template = loadJSON(templatePath);
  template.roundNumber = config.roundNumber;
  template.windowPhase = phase;

  fs.writeFileSync(activePath, JSON.stringify(template, null, 2));
  console.log(
    `[updatePortalState] Round ${config.roundNumber} set to phase "${phase}" using ${path.basename(
      templatePath
    )}`
  );
}

main();
