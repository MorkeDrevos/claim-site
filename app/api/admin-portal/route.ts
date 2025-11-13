import { NextResponse } from 'next/server';
// Adjust the path if your JSON file lives somewhere else:
import portalState from '@/data/portalState.json';

export async function GET() {
  // Just return the raw JSON used by the portal
  return NextResponse.json(portalState);
}
