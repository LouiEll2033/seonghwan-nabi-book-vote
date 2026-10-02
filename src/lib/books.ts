import { getPool } from '@/lib/db';

export type Book = {
  id: number;
  title: string;
  author: string | null;
  publisher: string | null;
};

export type DesignatedBook = Book & { date_label: string | null };

export async function getDesignatedBooks(): Promise<DesignatedBook[]> {
  const { rows } = await getPool().query(
    'SELECT id, title, author, publisher, date_label FROM designated_books ORDER BY sort_order'
  );
  return rows;
}

export async function getOtherBooks(): Promise<Book[]> {
  const { rows } = await getPool().query('SELECT id, title, author, publisher FROM other_books ORDER BY sort_order');
  return rows;
}
