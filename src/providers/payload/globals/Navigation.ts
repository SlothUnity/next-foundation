import type { GlobalConfig } from 'payload';

import { isEditor } from '@/providers/payload/access';
import { pageBlocks } from '@/providers/payload/blocks';
import { revalidateLayoutOnChange } from '@/providers/payload/cache';

export const Navigation: GlobalConfig = {
  slug: 'navigation',

  label: 'Navigation',

  access: {
    read: isEditor,
    update: isEditor,
  },

  admin: {
    group: 'Website',
  },

  hooks: {
    afterChange: [revalidateLayoutOnChange],
  },

  fields: [
    {
      name: 'modules',
      type: 'blocks',
      label: 'Modules',
      blocks: pageBlocks,

      admin: {
        description: 'Rendered above every page, inside the nav landmark.',
      },
    },
  ],
};
