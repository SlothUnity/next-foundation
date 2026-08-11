import { getLocaleSegment } from './getLocaleSegment';

interface CreatePagePathOptions {
  slug: string;
  locale: string;
  defaultLocale: string;
}

export function createPagePath({ slug, locale, defaultLocale }: CreatePagePathOptions): string {
  const normalizedSlug = slug.replace(/^\/+/, '').replace(/\/+$/, '');

  if (locale === defaultLocale) {
    return normalizedSlug ? `/${normalizedSlug}` : '/';
  }

  const localeSegment = getLocaleSegment(locale);

  return normalizedSlug ? `/${localeSegment}/${normalizedSlug}` : `/${localeSegment}`;
}
