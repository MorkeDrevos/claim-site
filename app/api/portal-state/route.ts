import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Read the active state from data/portalState.json
    const filePath = path.join(process.cwd(), 'data', 'portalState.json');
    const raw = await fs.readFile(filePath, 'utf8');
    const json = JSON.parse(raw);

    // Make sure we never cache this in the browser / edge
    return NextResponse.json(json, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('Error reading portalState.json:', err);
    return NextResponse.json(
      {
        error: 'Failed to read portalState.json',
      },
      { status: 500 }
    );
  }
}
