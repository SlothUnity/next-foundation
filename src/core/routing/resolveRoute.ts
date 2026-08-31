import { getLocaleSegment } from './getLocaleSegment';

interface ResolveRouteOptions {
  segments: string[];
  locales: string[];
  defaultLocale: string;
}

export interface ResolvedRoute {
  locale: string;
  path: string;
}

export function resolveRoute({
  segments,
  locales,
  defaultLocale,
}: ResolveRouteOptions): ResolvedRoute {
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
