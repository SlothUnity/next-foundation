import type { SiteDefinition } from './Site.types';

export abstract class SiteSource {
  abstract getSite(): Promise<SiteDefinition>;
}
