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
const MAX_HOLDERS = parseInt(process.env.CLAIM_SNAPSHOT_MAX_HOLDERS || '500', 10);

/* ───────────────────────────
   Load schedule
──────────────────────────── */

const schedulePath = path.join(process.cwd(), 'data', 'claim-schedule.json');
const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));

function getNextScheduledWindow() {
  return schedule.find((r) => r.phase === 'scheduled');
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
    console.error('❌ No scheduled round found.');
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

  // update schedule
  round.phase = 'snapshot';
  round.snapshotAt = now;
  round.snapshotFile = filename;

  fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2));
  console.log('🔄 Updated claim-schedule.json');

  console.log('✅ Snapshot complete');
}

run().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
