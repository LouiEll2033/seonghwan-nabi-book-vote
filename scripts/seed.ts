import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

// next dev/build는 .env.local을 자동으로 읽지만, 이 스크립트는 node로 직접 실행되므로 수동으로 로드한다.
try {
  process.loadEnvFile(path.join(process.cwd(), '.env.local'));
} catch {
  // .env.local이 없으면(예: 배포 환경에서 이미 환경변수가 주입된 경우) 무시한다.
}

type SeedBook = { title: string; author?: string; publisher?: string; date_label?: string; note?: string };
type SeedData = { designated: SeedBook[]; other: SeedBook[] };

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다. .env.local을 만들고 값을 채워주세요 (.env.example 참고).');
  }

  const seedPath = path.join(process.cwd(), 'data', 'seed-books.json');
  const seed: SeedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();

  try {
    console.log('테이블 생성 중 (이미 있으면 건너뜀)...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS designated_books (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        publisher TEXT,
        date_label TEXT,
        sort_order INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS other_books (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        publisher TEXT,
        sort_order INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS responses (
        id SERIAL PRIMARY KEY,
        member_name TEXT NOT NULL UNIQUE,
        designated_book_id INTEGER NOT NULL REFERENCES designated_books(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS response_other_books (
        response_id INTEGER NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
        other_book_id INTEGER NOT NULL REFERENCES other_books(id),
        PRIMARY KEY (response_id, other_book_id)
      );

      ALTER TABLE designated_books ADD COLUMN IF NOT EXISTS cover_url TEXT;
      ALTER TABLE other_books ADD COLUMN IF NOT EXISTS cover_url TEXT;
    `);

    // public/covers/d01.jpg.. / o01.jpg.. 는 sort_order 순서(1부터)에 대응한다. 이미 있는 값은 건드리지 않는다.
    const backfillCovers = async () => {
      await client.query(
        `UPDATE designated_books SET cover_url = '/covers/d' || lpad((sort_order + 1)::text, 2, '0') || '.jpg' WHERE cover_url IS NULL`
      );
      await client.query(
        `UPDATE other_books SET cover_url = '/covers/o' || lpad((sort_order + 1)::text, 2, '0') || '.jpg' WHERE cover_url IS NULL`
      );
    };
    await backfillCovers();

    const { rows: designatedCountRows } = await client.query('SELECT COUNT(*)::int AS count FROM designated_books');
    const { rows: otherCountRows } = await client.query('SELECT COUNT(*)::int AS count FROM other_books');

    if (designatedCountRows[0].count > 0 || otherCountRows[0].count > 0) {
      console.log('이미 도서 데이터가 있어 시드를 건너뜁니다. (표지 경로만 채웠습니다)');
      return;
    }

    console.log(`지정도서 ${seed.designated.length}권, 나머지도서 ${seed.other.length}권 시드 중...`);

    for (let i = 0; i < seed.designated.length; i++) {
      const b = seed.designated[i];
      await client.query(
        'INSERT INTO designated_books (title, author, publisher, date_label, sort_order) VALUES ($1, $2, $3, $4, $5)',
        [b.title, b.author ?? null, b.publisher ?? null, b.date_label ?? null, i]
      );
    }

    for (let i = 0; i < seed.other.length; i++) {
      const b = seed.other[i];
      await client.query('INSERT INTO other_books (title, author, publisher, sort_order) VALUES ($1, $2, $3, $4)', [
        b.title,
        b.author ?? null,
        b.publisher ?? null,
        i,
      ]);
    }

    await backfillCovers();
    console.log('시드 완료.');

    const flagged = [...seed.designated, ...seed.other].filter((b) => b.note);
    if (flagged.length > 0) {
      console.log('\n⚠️  아래 항목은 사진 OCR 확신도가 낮아 원본과 대조가 필요합니다:');
      for (const b of flagged) {
        console.log(`  - ${b.title}: ${b.note}`);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
