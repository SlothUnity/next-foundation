export type SitemapLocation =
  { kind: 'app' } | { kind: 'source' } | { kind: 'external'; url: string } | { kind: 'none' };

export const sitemapLocation: SitemapLocation = { kind: 'app' };
