import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const { rows } = await getPool().query('SELECT member_name FROM responses ORDER BY member_name');
  return NextResponse.json({ names: rows.map((r) => r.member_name) });
}
