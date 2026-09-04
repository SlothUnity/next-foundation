import type { SiteDefinition } from '@/core/site';
import { SiteSource } from '@/core/site';

const FALLBACK: SiteDefinition = {
  name: 'Site',
  locales: ['pt-PT'],
  defaultLocale: 'pt-PT',
};

export class ApiSiteSource extends SiteSource {
  async getSite(): Promise<SiteDefinition> {
    console.warn(
      'ApiSiteSource has no mapping yet, so the site name and languages are placeholders. The name reaches the browser as the title suffix and og:site_name, and the single locale makes resolveRoute stop stripping language prefixes. Write it in src/providers/api/sources/ApiSiteSource.ts — see docs/reference/api.md.',
    );

    return FALLBACK;
  }
}
