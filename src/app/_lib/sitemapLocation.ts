export type SitemapLocation =
  { kind: 'app' } | { kind: 'external'; url: string } | { kind: 'none' };

export const sitemapLocation: SitemapLocation = { kind: 'app' };
