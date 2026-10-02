// node:crypto를 사용하므로 Node.js 런타임(API 라우트)에서만 import한다. (미들웨어에서는 import 금지 - session.ts를 대신 사용)
import crypto from 'crypto';

export function checkAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error('ADMIN_PASSWORD 환경변수가 설정되지 않았습니다. .env.local을 확인하세요.');
  }
  const inputBuf = Buffer.from(input);
  const expectedBuf = Buffer.from(expected);
  if (inputBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(inputBuf, expectedBuf);
}
