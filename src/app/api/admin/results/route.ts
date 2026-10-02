import { NextResponse } from 'next/server';
import { getAllResponses, getDesignatedCounts, getOtherCounts } from '@/lib/results';

export const runtime = 'nodejs';

export async function GET() {
  const [designated, other, responses] = await Promise.all([getDesignatedCounts(), getOtherCounts(), getAllResponses()]);
  return NextResponse.json({ designated, other, responses, totalResponses: responses.length });
}
