const PROBE_ORIGIN = 'https://safe-redirect.invalid';

export function isSafeRedirectPath(path: string | null | undefined): path is string {
  if (!path || !path.startsWith('/')) {
    return false;
  }

  if (/^\/[\\/]/.test(path)) {
    return false;
  }

  try {
    return new URL(path, PROBE_ORIGIN).origin === PROBE_ORIGIN;
  } catch {
    return false;
  }
}
