import { NextResponse } from 'next/server';
import { getAllResponses } from '@/lib/results';
import { toCsv } from '@/lib/csv';

export const runtime = 'nodejs';

export async function GET() {
  const responses = await getAllResponses();
  const csv = toCsv(
    ['이름', '지정도서', '나머지도서1', '나머지도서2', '나머지도서3', '나머지도서4', '나머지도서5', '제출/수정 시각'],
    responses.map((r) => [
      r.member_name,
      r.designated_title,
      r.other_titles[0] ?? '',
      r.other_titles[1] ?? '',
      r.other_titles[2] ?? '',
      r.other_titles[3] ?? '',
      r.other_titles[4] ?? '',
      new Date(r.updated_at).toLocaleString('ko-KR'),
    ])
  );

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="seonghwan-nabi-book-vote.csv"',
    },
  });
}
