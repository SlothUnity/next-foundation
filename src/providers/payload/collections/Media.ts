import { CollectionConfig } from 'payload';

import { isEditor, isPublic } from '@/providers/payload/access';

export const allowedMediaMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'application/pdf',
];

export const Media: CollectionConfig = {
  slug: 'media',

  access: {
    read: isPublic,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },

  labels: {
    singular: 'Asset',
    plural: 'Media',
  },

  admin: {
    group: 'Content',
    useAsTitle: 'alt',
  },

  upload: {
    mimeTypes: allowedMediaMimeTypes,

    imageSizes: [
      { name: 'thumbnail', width: 400, withoutEnlargement: true },
      { name: 'medium', width: 900, withoutEnlargement: true },
      { name: 'large', width: 1600, withoutEnlargement: true },
    ],
  },

  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alternative text',
      required: true,
      localized: true,

      admin: {
        description:
          'What the image shows, for someone who cannot see it. Leave a decorative image described as decorative.',
      },
    },
  ],
};
