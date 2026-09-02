import { createHmac, timingSafeEqual } from 'node:crypto';

const TTL_SECONDS = 60 * 60;

const SEPARATOR = '.';

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createPreviewToken(path: string, secret: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECONDS;

  return `${expiresAt}${SEPARATOR}${sign(`${path}|${expiresAt}`, secret)}`;
}

export type PreviewTokenResult = 'valid' | 'expired' | 'invalid';

export function verifyPreviewToken(
  token: string | null,
  path: string,
  secret: string,
): PreviewTokenResult {
  const [rawExpiresAt, signature] = token?.split(SEPARATOR) ?? [];

  if (!rawExpiresAt || !signature) {
    return 'invalid';
  }

  const expected = Buffer.from(sign(`${path}|${rawExpiresAt}`, secret));
  const received = Buffer.from(signature);

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return 'invalid';
  }

  return Number(rawExpiresAt) * 1000 > Date.now() ? 'valid' : 'expired';
}
