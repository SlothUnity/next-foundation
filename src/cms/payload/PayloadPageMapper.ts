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
    data,
  };
  return returnModule;
}

export function mapPayloadPage(page: Page, locale: string): PageDefinition {
  return {
    meta: {
      locale,
    },
    main: page.main ? page.main.map(mapBlock) : [],
  };
}
