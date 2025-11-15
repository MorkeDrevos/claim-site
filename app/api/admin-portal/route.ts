import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read the same JSON file the portal uses
    const filePath = path.join(process.cwd(), 'data', 'portalState.json');
    const raw = await fs.readFile(filePath, 'utf8');
    const json = JSON.parse(raw);

    return NextResponse.json(json, { status: 200 });
  } catch (err: any) {
    console.error('Admin portal API error:', err);
    return NextResponse.json(
      { error: 'Unable to read portal state' },
      { status: 500 },
    );
  }
}
