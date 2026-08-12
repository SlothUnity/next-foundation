import type { GlobalConfig } from 'payload';

import { availableLocales } from '@/providers/payload/locales';

export const Site: GlobalConfig = {
  slug: 'site',

  label: 'Site Settings',

  admin: {
    group: 'Website',
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
