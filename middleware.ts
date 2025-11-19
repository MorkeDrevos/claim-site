import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  return NextResponse.rewrite(new URL('/dead.html', req.url));
}
