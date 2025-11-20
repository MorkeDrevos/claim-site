import { NextResponse } from 'next/server';

export async function GET() {
  const buildId = process.env.VERCEL_GIT_COMMIT_SHA || 'dev';
  return NextResponse.json({ buildId });
}
