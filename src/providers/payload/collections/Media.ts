import { CollectionConfig } from 'payload';

import { isEditor, isPublic } from '@/providers/payload/access';

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
  },

  upload: true,

  fields: [],
};
