import { NextResponse } from 'next/server';
import rawPortalState from '../../../data/portalState.json';
import { mapRawPortalState } from '../../../lib/claimState';

export async function GET() {
  const uiState = mapRawPortalState(rawPortalState as any);
  return NextResponse.json(uiState);
}
