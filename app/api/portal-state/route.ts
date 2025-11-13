import { NextResponse } from 'next/server';
import rawPortalState from '../../../data/portalState.json';
import { mapRawPortalState, RawPortalState } from '../../../lib/claimState';

export async function GET() {
  // Cast the imported JSON to the raw type, then map into UI shape
  const uiState = mapRawPortalState(rawPortalState as RawPortalState);
  return NextResponse.json(uiState);
}
