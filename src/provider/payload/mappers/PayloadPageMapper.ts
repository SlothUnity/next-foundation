import { Page } from '@payload-types';
import { ModuleInstance, PageDefinition } from '@/types';

type PayloadPageBlock = NonNullable<Page['main']>[number];

function mapBlock(block: PayloadPageBlock): ModuleInstance {
  if (!block.id) {
    throw new Error(`Payload block "${block.blockType}" is missing an id.`);
  }

  const { id, blockType, blockName, ...data } = block;

  const returnModule: ModuleInstance = {
    id,
    name: blockName || blockType,
    alias: blockType,
    data: removeNullValues(data),
  };
  return returnModule;
}

function removeNullValues(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => [
        key,
        value && typeof value === 'object' && !Array.isArray(value)
          ? removeNullValues(value as Record<string, unknown>)
          : value,
      ]),
  );
}

export function mapPayloadPage(page: Page, locale: string): PageDefinition {
  return {
    meta: {
      locale,
      title: page.meta?.title ?? undefined,
      description: page.meta?.description ?? undefined,
      ogTitle: page.meta?.ogTitle ?? undefined,
      ogDescription: page.meta?.ogDescription ?? undefined,
      noIndex: page.meta?.noIndex ?? false,
      noFollow: page.meta?.noFollow ?? false,
    },

    main: (page.main ?? []).map(mapBlock),
  };
}
