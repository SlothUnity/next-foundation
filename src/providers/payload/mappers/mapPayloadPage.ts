import { Page } from '@payload-types';
import type { ModuleInstance } from '@/core/modules';
import type { PageDefinition } from '@/core/pages';

import { isPayloadUpload, mapPayloadImage } from './mapPayloadImage';

export type PayloadBlock = NonNullable<Page['main']>[number];

function mapBlock(block: PayloadBlock): ModuleInstance | undefined {
  if (!block.id) {
    console.warn(
      `Payload block "${block.blockType}" has no id, so it cannot be rendered. Dropping it and keeping the rest of the page.`,
    );

    return undefined;
  }

  const { id, blockType, blockName, ...data } = block;

  return {
    id,
    name: blockName || blockType,
    alias: blockType,
    data: removeNullValues(data),
  };
}

export function mapPayloadBlocks(blocks: PayloadBlock[] | null | undefined): ModuleInstance[] {
  return (blocks ?? []).map(mapBlock).filter((module): module is ModuleInstance => Boolean(module));
}

function cleanValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== null).map(cleanValue);
  }

  if (isPayloadUpload(value)) {
    return mapPayloadImage(value);
  }

  if (value && typeof value === 'object') {
    return removeNullValues(value as Record<string, unknown>);
  }

  return value;
}

function removeNullValues(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => [key, cleanValue(value)]),
  );
}

export function mapPayloadPage(
  page: Page,
  locale: string,
  alternates?: Record<string, string>,
): PageDefinition {
  const image = page.meta?.image;

  return {
    meta: {
      locale,
      title: page.meta?.title ?? undefined,
      description: page.meta?.description ?? undefined,
      ogTitle: page.meta?.ogTitle ?? undefined,
      ogDescription: page.meta?.ogDescription ?? undefined,
      image: isPayloadUpload(image) ? mapPayloadImage(image) : undefined,
      alternates,
      noIndex: page.meta?.noIndex ?? false,
      noFollow: page.meta?.noFollow ?? false,
    },

    main: mapPayloadBlocks(page.main),
  };
}
