import { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',

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
