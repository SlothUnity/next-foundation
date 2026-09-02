import type { GlobalConfig } from 'payload';

import { isAdmin, isEditor } from '@/providers/payload/access';
import { revalidateSiteOnChange } from '@/providers/payload/cache';
import { availableLocales } from '@/providers/payload/locales';

export const Site: GlobalConfig = {
  slug: 'site',

  label: 'Site Settings',

  access: {
    read: isEditor,
    update: isAdmin,
  },

  admin: {
    group: 'Website',
  },

  hooks: {
    afterChange: [revalidateSiteOnChange],
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Site Name',
      required: true,
    },

    {
      name: 'enabledLocales',
      type: 'select',
      label: 'Languages',
      hasMany: true,
      required: true,

      options: [...availableLocales],

      admin: {
        description:
          'Select the languages available on the site. The first language is the default.',
        isSortable: true,
      },
    },
  ],
};
