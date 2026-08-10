import type { PageDefinition } from '@/types';

export abstract class PageSource {
  abstract getPage(slug: string, locale?: string): Promise<PageDefinition | undefined>;
}
