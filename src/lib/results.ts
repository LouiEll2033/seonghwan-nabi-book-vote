import { getPool } from '@/lib/db';

export type BookCount = { id: number; title: string; date_label: string | null; votes: number };
export type ResponseRow = {
  member_name: string;
  designated_title: string;
  other_titles: string[];
  updated_at: string;
};

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
