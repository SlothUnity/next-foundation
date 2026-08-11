import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';

import { Users } from '@/cms/payload/collections/Users';

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),

  collections: [Users],
});
