import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다. .env.local을 확인하세요.');
  }
  return new Pool({ connectionString, max: 5 });
}

// Pool은 요청 처리 시점에 필요할 때만 생성한다 (지연 초기화).
// 모듈 로드 시점에 바로 생성하면 next build의 페이지 데이터 수집 단계에서
// DATABASE_URL이 없어도 이 모듈을 import하는 것만으로 빌드가 실패한다.
// Vercel 서버리스 함수는 warm invocation 사이에 모듈 스코프가 재사용되므로,
// 전역 싱글턴으로 커넥션 풀을 재사용해 매 요청마다 새 풀을 만들지 않는다.
export function getPool(): Pool {
  if (!global.__pgPool) {
    global.__pgPool = createPool();
  }
  return global.__pgPool;
}

export async function withTransaction<T>(fn: (client: import('pg').PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
