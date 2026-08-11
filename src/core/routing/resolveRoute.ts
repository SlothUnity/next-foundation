import { getLocaleSegment } from './getLocaleSegment';

interface ResolveRouteOptions {
  segments: string[];
  locales: string[];
}

export interface ResolvedRoute {
  locale: string;
  slug: string;
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
      slug: rest.join('/'),
    };
  }

  return {
    locale: defaultLocale,
    slug: segments.join('/'),
  };
}
