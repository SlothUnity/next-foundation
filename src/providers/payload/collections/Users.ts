import type { CollectionConfig } from 'payload';

import { isAdmin, isAdminField, isAdminOrSelf } from '@/providers/payload/access';
import { defaultUserRole, firstUserRole, userRoles } from '@/providers/payload/roles';

export const Users: CollectionConfig = {
  slug: 'users',

  labels: {
    singular: 'User',
    plural: 'Users',
  },

  auth: true,

  access: {
    read: isAdminOrSelf,
    create: isAdmin,
    update: isAdminOrSelf,
    delete: isAdmin,
    unlock: isAdmin,
  },

  admin: {
    group: 'Administration',
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles'],
  },

  fields: [
    {
      name: 'roles',
      type: 'select',
      label: 'Roles',
      hasMany: true,
      required: true,

      options: [...userRoles],

      defaultValue: async ({ req }) => {
        const { totalDocs } = await req.payload.count({ collection: 'users' });

        return totalDocs === 0 ? [firstUserRole] : [defaultUserRole];
      },

      access: {
        create: isAdminField,
        update: isAdminField,
      },

      admin: {
        description:
          'Administrators manage users and site settings. Editors manage content. The first user created is an administrator.',
      },
    },
  ],
};
