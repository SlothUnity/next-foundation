import { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',

  labels: {
    singular: 'User',
    plural: 'Users',
  },

  auth: true,

  admin: {
    group: 'Administration',
    useAsTitle: 'email',
  },

  fields: [],
};
