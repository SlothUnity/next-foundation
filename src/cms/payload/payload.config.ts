import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';

import { Users } from './collections/Users';
import { Pages } from './collections/Pages';

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',

  admin: {
    user: Users.slug,
  },

  collections: [Users, Pages],

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
});
