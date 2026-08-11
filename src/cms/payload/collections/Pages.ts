import type { CollectionConfig } from 'payload';

export const Pages: CollectionConfig = {
  slug: 'pages',

  admin: {
    useAsTitle: 'slug',
  },

  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'meta',
      type: 'group',
      fields: [
        {
          name: 'locale',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
};
