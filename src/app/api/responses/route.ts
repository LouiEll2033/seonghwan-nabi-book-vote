import { NextRequest, NextResponse } from 'next/server';
import { getPool, withTransaction } from '@/lib/db';
import { isVotingOpen } from '@/lib/deadline';
import { responseSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!isVotingOpen()) {
    return NextResponse.json({ error: '투표가 마감되었습니다.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.' }, { status: 400 });
  }
  const { member_name, designated_book_id, other_book_ids } = parsed.data;

  // 매 요청마다 실제 DB에 존재하는 id인지 확인 (클라이언트가 보낸 값을 신뢰하지 않음)
  const pool = getPool();
  const [{ rows: designatedRows }, { rows: otherRows }] = await Promise.all([
    pool.query('SELECT id FROM designated_books WHERE id = $1', [designated_book_id]),
    pool.query('SELECT id FROM other_books WHERE id = ANY($1)', [other_book_ids]),
  ]);
  if (designatedRows.length === 0) {
    return NextResponse.json({ error: '유효하지 않은 지정도서입니다.' }, { status: 400 });
  }
  if (otherRows.length !== other_book_ids.length) {
    return NextResponse.json({ error: '유효하지 않은 나머지도서가 포함되어 있습니다.' }, { status: 400 });
  }

  try {
    await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO responses (member_name, designated_book_id, updated_at)
         VALUES ($1, $2, now())
         ON CONFLICT (member_name)
         DO UPDATE SET designated_book_id = EXCLUDED.designated_book_id, updated_at = now()
         RETURNING id`,
        [member_name, designated_book_id]
      );
      const responseId = rows[0].id;

      await client.query('DELETE FROM response_other_books WHERE response_id = $1', [responseId]);
      for (const otherBookId of other_book_ids) {
        await client.query('INSERT INTO response_other_books (response_id, other_book_id) VALUES ($1, $2)', [
          responseId,
          otherBookId,
        ]);
      }
    });
  } catch (err) {
    console.error('제출 처리 실패:', err);
    return NextResponse.json({ error: '제출 처리 중 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
