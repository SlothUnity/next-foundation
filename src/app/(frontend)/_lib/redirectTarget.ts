import { isSafeRedirectPath } from '@/core/routing';

export function redirectTarget(to: string | null | undefined): string | undefined {
  if (isSafeRedirectPath(to)) {
    return to;
  }

  console.warn(
    `The content source answered "redirect" to ${JSON.stringify(to)}, which is not a path on this site. Refusing it and serving the not-found page instead.`,
  );

  return undefined;
}
