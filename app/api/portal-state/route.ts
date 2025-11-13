// app/api/portal-state/route.ts
import { NextResponse } from 'next/server';
import portalDoc from '../../../data/portalState.json';
import { mapPortalDocToState, PortalStateDoc } from '../../../lib/claimState';

export async function GET() {
  const state = mapPortalDocToState(portalDoc as PortalStateDoc);
  return NextResponse.json(state);
}
