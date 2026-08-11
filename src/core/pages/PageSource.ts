import type { PageDefinition } from '@/types';

export abstract class PageSource {
  abstract getPage(path: string, locale?: string): Promise<PageDefinition | undefined>;
}
