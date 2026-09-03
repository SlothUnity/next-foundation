import { imageSourceDirective } from './imageHosts';

export interface PolicyOptions {
  allowEval?: boolean;
}

export function contentSecurityPolicy({ allowEval = false }: PolicyOptions = {}): string {
  const scriptSrc = ["script-src 'self' 'unsafe-inline'", allowEval ? "'unsafe-eval'" : '']
    .filter(Boolean)
    .join(' ');

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    imageSourceDirective,
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    scriptSrc,
    "connect-src 'self'",
  ].join('; ');
}

export const baselineSecurityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

export const PUBLIC_PATHS = '/:path((?!admin(?:/|$)|api(?:/|$)).*)';
