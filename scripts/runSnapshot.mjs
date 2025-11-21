// scripts/runSnapshot.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ───────────────────────────
   CONFIG
──────────────────────────── */

const RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const TOKEN_MINT_STR = process.env.CLAIM_TOKEN_MINT;

if (!TOKEN_MINT_STR) {
  console.error('❌ Missing CLAIM_TOKEN_MINT env variable.');
  process.exit(1);
}

const TOKEN_MINT = new PublicKey(TOKEN_MINT_STR);
const MAX_HOLDERS = parseInt(
  process.env.CLAIM_SNAPSHOT_MAX_HOLDERS || '500',
  10
);

/* ───────────────────────────
   Load schedule
──────────────────────────── */

const schedulePath = path.join(process.cwd(), 'data', 'claim-schedule.json');
const raw = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));

let scheduleArray;
let scheduleMode;

/**
 * We support either:
 *  - [ { round, phase, ... }, ... ]
 *  - { rounds: [ { round, phase, ... }, ... ] }
 */
if (Array.isArray(raw)) {
  scheduleArray = raw;
  scheduleMode = 'array';
} else if (Array.isArray(raw.rounds)) {
  scheduleArray = raw.rounds;
  scheduleMode = 'wrapped';
} else {
  console.error(
    '❌ claim-schedule.json has unexpected shape. Expected an array or { rounds: [...] }.'
  );
  console.error('Got:', JSON.stringify(raw, null, 2).slice(0, 300));
  process.exit(1);
}

function getNextScheduledWindow() {
  return scheduleArray.find((r) => r.phase === 'scheduled');
}

/* ───────────────────────────
   Snapshot logic
──────────────────────────── */

async function fetchTokenHolders(connection) {
  console.log('🔍 Fetching holders for mint:', TOKEN_MINT.toBase58());

  const accounts = await connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, {
    filters: [
      { dataSize: 165 },
      { memcmp: { offset: 0, bytes: TOKEN_MINT.toBase58() } },
    ],
  });

  console.log(`📦 Raw token accounts: ${accounts.length}`);

  const holders = new Map();

  for (const { account } of accounts) {
    const parsed = account.data?.parsed?.info;
    if (!parsed) continue;

    const owner = parsed.owner;
    const amount = Number(parsed.tokenAmount?.uiAmount || 0);

    if (!owner || amount <= 0) continue;

    holders.set(owner, (holders.get(owner) || 0) + amount);
  }

  let list = Array.from(holders, ([wallet, amount]) => ({ wallet, amount }));
  list.sort((a, b) => b.amount - a.amount);

  if (list.length > MAX_HOLDERS) {
    console.log(`⚠️ Truncating from ${list.length} to top ${MAX_HOLDERS}`);
    list = list.slice(0, MAX_HOLDERS);
  }

  return list;
}

/* ───────────────────────────
   Main
──────────────────────────── */

async function run() {
  console.log('🚀 CLAIM snapshot script running');

  const round = getNextScheduledWindow();
  if (!round) {
    console.error('❌ No scheduled round found in claim-schedule.json');
    process.exit(1);
  }

  const roundNo = round.round;
  console.log(`📡 Taking snapshot for round ${roundNo}`);

  const connection = new Connection(RPC, 'confirmed');
  const holders = await fetchTokenHolders(connection);

  const snapshotDir = path.join(process.cwd(), 'data', 'snapshots');
  if (!fs.existsSync(snapshotDir)) fs.mkdirSync(snapshotDir, { recursive: true });

  const filename = `round-${roundNo}.json`;
  const filePath = path.join(snapshotDir, filename);

  const now = new Date().toISOString();

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        takenAt: now,
        round: roundNo,
        mint: TOKEN_MINT.toBase58(),
        network: RPC,
        holders,
      },
      null,
      2
    )
  );

  console.log(`💾 Snapshot saved at data/snapshots/${filename}`);

  // update scheduleArray entry
  round.phase = 'snapshot';
  round.snapshotAt = now;
  round.snapshotFile = filename;

  // write back in the same shape we loaded
  let toWrite;
  if (scheduleMode === 'array') {
    toWrite = scheduleArray;
  } else if (scheduleMode === 'wrapped') {
    raw.rounds = scheduleArray;
    toWrite = raw;
  }

  fs.writeFileSync(schedulePath, JSON.stringify(toWrite, null, 2));
  console.log('🔄 Updated claim-schedule.json');

  console.log('✅ Snapshot complete');
}

run().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
