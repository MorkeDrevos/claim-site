// app/api/build-info/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const buildId =
    process.env.NEXT_PUBLIC_BUILD_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    'dev';

  return NextResponse.json({ buildId });
}
