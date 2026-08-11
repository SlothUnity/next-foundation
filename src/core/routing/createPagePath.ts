interface CreatePagePathOptions {
  path: string;
  locale: string;
  defaultLocale: string;
}

export function createPagePath({ path, locale, defaultLocale }: CreatePagePathOptions): string {
  const normalizedPath = path.split('/').filter(Boolean).join('/');

  const localeSegment = locale === defaultLocale ? '' : (locale.split('-')[0]?.toLowerCase() ?? '');

  return `/${[localeSegment, normalizedPath].filter(Boolean).join('/')}`;
}
