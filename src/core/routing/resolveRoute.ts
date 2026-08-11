import { getLocaleSegment } from './getLocaleSegment';

interface ResolveRouteOptions {
  segments: string[];
  locales: string[];
}

export interface ResolvedRoute {
  locale: string;
  path: string;
}

export function resolveRoute({
  segments,
  locales,
}: ResolveRouteOptions): ResolvedRoute | undefined {
  const defaultLocale = locales[0];

  if (!defaultLocale) {
    return undefined;
  }

  const [firstSegment, ...rest] = segments;

  const requestedLocale = locales.find(
    (locale) => getLocaleSegment(locale) === firstSegment?.toLowerCase(),
  );

  if (requestedLocale) {
    return {
      locale: requestedLocale,
      path: rest.join('/'),
    };
  }

  return {
    locale: defaultLocale,
    path: segments.join('/'),
  };
}
