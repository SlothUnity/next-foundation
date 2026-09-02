import type { Block } from 'payload';

export const HeroBlock: Block = {
  slug: 'hero',

  interfaceName: 'HeroBlock',

  labels: {
    singular: 'Hero',
    plural: 'Heroes',
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },

    {
      name: 'subtitle',
      type: 'textarea',
      localized: true,
    },

    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
  ],
};
