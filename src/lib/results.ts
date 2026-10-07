import { getPool } from '@/lib/db';
import { toCsv } from '@/lib/csv';

export type BookCount = { id: number; title: string; date_label: string | null; votes: number };
export type ResponseRow = {
  member_name: string;
  designated_title: string;
  other_titles: string[];
  updated_at: string;
};

// Vercel 서버 시간대는 UTC라서, 화면/CSV에 찍는 시각은 항상 한국 시간으로 변환한다.
export function formatKst(value: string | Date): string {
  return new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
}

export function responsesToCsv(responses: ResponseRow[], withBom = true): string {
  return toCsv(
    ['이름', '지정도서', '나머지도서1', '나머지도서2', '나머지도서3', '나머지도서4', '나머지도서5', '제출/수정 시각'],
    responses.map((r) => [
      r.member_name,
      r.designated_title,
      r.other_titles[0] ?? '',
      r.other_titles[1] ?? '',
      r.other_titles[2] ?? '',
      r.other_titles[3] ?? '',
      r.other_titles[4] ?? '',
      formatKst(r.updated_at),
    ]),
    withBom
  );
}

export function countsToCsv(designated: BookCount[], other: BookCount[], withBom = true): string {
  return toCsv(
    ['구분', '도서', '득표'],
    [
      ...designated.map((b) => ['지정도서', b.title, String(b.votes)]),
      ...other.map((b) => ['나머지도서', b.title, String(b.votes)]),
    ],
    withBom
  );
}

export async function getDesignatedCounts(): Promise<BookCount[]> {
  const { rows } = await getPool().query(`
    SELECT db.id, db.title, db.date_label, COUNT(r.id)::int AS votes
    FROM designated_books db
    LEFT JOIN responses r ON r.designated_book_id = db.id
    GROUP BY db.id, db.title, db.date_label, db.sort_order
    ORDER BY votes DESC, db.sort_order
  `);
  return rows;
}

export async function getOtherCounts(): Promise<BookCount[]> {
  const { rows } = await getPool().query(`
    SELECT ob.id, ob.title, NULL::text AS date_label, COUNT(rob.response_id)::int AS votes
    FROM other_books ob
    LEFT JOIN response_other_books rob ON rob.other_book_id = ob.id
    GROUP BY ob.id, ob.title, ob.sort_order
    ORDER BY votes DESC, ob.sort_order
  `);
  return rows;
}

export async function getAllResponses(): Promise<ResponseRow[]> {
  const { rows } = await getPool().query(`
    SELECT
      r.member_name,
      db.title AS designated_title,
      r.updated_at,
      COALESCE(
        array_agg(ob.title ORDER BY ob.title) FILTER (WHERE ob.title IS NOT NULL),
        ARRAY[]::text[]
      ) AS other_titles
    FROM responses r
    JOIN designated_books db ON db.id = r.designated_book_id
    LEFT JOIN response_other_books rob ON rob.response_id = r.id
    LEFT JOIN other_books ob ON ob.id = rob.other_book_id
    GROUP BY r.id, db.title
    ORDER BY r.updated_at DESC
  `);
  return rows;
}
