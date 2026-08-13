const PROBE_ORIGIN = 'https://safe-redirect.invalid';

/**
 * Aceita apenas caminhos relativos à própria origem.
 *
 * Sem isto, `?path=https://sitemau.com` transformava a rota de preview num open
 * redirect. Não basta rejeitar `//`: para esquemas especiais o WHATWG URL trata
 * `\` como `/`, portanto `/\sitemau.com` resolve para `//sitemau.com`.
 */
export function isSafeRedirectPath(path: string | null | undefined): path is string {
  if (!path || !path.startsWith('/')) {
    return false;
  }

  // "//host" e "/\host" — ambos saem da origem.
  if (/^\/[\\/]/.test(path)) {
    return false;
  }

  try {
    return new URL(path, PROBE_ORIGIN).origin === PROBE_ORIGIN;
  } catch {
    return false;
  }
}
