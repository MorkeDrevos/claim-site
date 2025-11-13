import { NextResponse } from 'next/server';
import portalState from '../../../data/portalState.json';

export async function GET() {
  return NextResponse.json(portalState);
}
