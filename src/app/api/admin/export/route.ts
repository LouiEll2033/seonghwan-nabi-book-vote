import { NextResponse } from 'next/server';
import { getAllResponses, responsesToCsv } from '@/lib/results';

export const runtime = 'nodejs';

export async function GET() {
  const csv = responsesToCsv(await getAllResponses());

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="seonghwan-nabi-book-vote.csv"',
    },
  });
}
