import type { SiteDefinition } from '@/types';

export abstract class SiteSource {
  abstract getSite(): Promise<SiteDefinition>;
}
