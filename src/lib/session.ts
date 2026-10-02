// 미들웨어(Edge 런타임)와 API 라우트(Node 런타임) 양쪽에서 쓰이므로,
// node:crypto 대신 두 런타임 모두 지원하는 Web Crypto(globalThis.crypto.subtle)로 HMAC 서명한다.
export const ADMIN_COOKIE_NAME = 'admin_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 6; // 6시간

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET 환경변수가 설정되지 않았습니다. .env.local을 확인하세요.');
  }
  return secret;
}

// TS 5.7의 dom lib이 Uint8Array<ArrayBufferLike>를 BufferSource로 바로 받아주지 않아 명시적으로 감싼다.
function toBufferSource(bytes: Uint8Array): BufferSource {
  return bytes as unknown as BufferSource;
}

async function getKey(): Promise<CryptoKey> {
  const keyData = toBufferSource(new TextEncoder().encode(getSessionSecret()));
  return crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) return new Uint8Array(0);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export async function createAdminSessionToken(): Promise<string> {
  const expiry = String(Date.now() + SESSION_DURATION_MS);
  const key = await getKey();
  const signature = await crypto.subtle.sign('HMAC', key, toBufferSource(new TextEncoder().encode(expiry)));
  return `${expiry}.${toHex(signature)}`;
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [expiry, signatureHex] = token.split('.');
  if (!expiry || !signatureHex) return false;
  if (!Number.isFinite(Number(expiry)) || Number(expiry) <= Date.now()) return false;

  const key = await getKey();
  return crypto.subtle.verify(
    'HMAC',
    key,
    toBufferSource(fromHex(signatureHex)),
    toBufferSource(new TextEncoder().encode(expiry))
  );
}
