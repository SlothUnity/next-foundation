import { Page } from '@payload-types';
import type { ModuleInstance } from '@/core/modules';
import type { PageDefinition } from '@/core/pages';

import { isPayloadUpload, mapPayloadImage } from './mapPayloadImage';

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

    main: (page.main ?? []).map(mapBlock),
  };
}
