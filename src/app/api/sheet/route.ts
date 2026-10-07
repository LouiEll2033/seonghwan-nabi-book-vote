import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  countsToCsv,
  getAllResponses,
  getDesignatedCounts,
  getOtherCounts,
  responsesToCsv,
} from '@/lib/results';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isValidToken(input: string | null): boolean {
  const expected = process.env.SHEET_TOKEN;
  if (!expected || !input) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// 구글 시트의 =IMPORTDATA("주소") 용. 로그인 대신 SHEET_TOKEN이 맞아야 CSV를 내려준다.
// view=responses(기본): 응답 전체, view=counts: 도서별 득표
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  if (!isValidToken(searchParams.get('key'))) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 });
  }

  const csv =
    searchParams.get('view') === 'counts'
      ? countsToCsv(await getDesignatedCounts(), await getOtherCounts(), false)
      : responsesToCsv(await getAllResponses(), false);

  return new NextResponse(csv, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
