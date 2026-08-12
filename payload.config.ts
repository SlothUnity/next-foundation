import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';

import { nestedDocs, seo } from '@/providers/payload/plugins';

import { payloadLocales } from '@/providers/payload/locales';

import { Site } from '@/providers/payload/globals/Site';
import { Users } from '@/providers/payload/collections/Users';
import { Pages } from '@/providers/payload/collections/Pages';
import { Media } from '@/providers/payload/collections/Media';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',

  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',

  localization: {
    locales: payloadLocales,
    defaultLocale: 'pt-PT',
    fallback: false,

    filterAvailableLocales: async ({ locales, req }) => {
      const site = await req.payload.findGlobal({
        slug: 'site',
        req,
      });

      const enabledLocales = (site.enabledLocales ?? []) as string[];

      if (!enabledLocales.length) {
        return locales;
      }

      return locales.filter((locale) => enabledLocales.includes(locale.code));
    },
  },

  admin: {
    user: Users.slug,

    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },

    importMap: {
      baseDir: path.resolve(dirname, 'src'),
    },
  },

  collections: [Users, Pages, Media],
  globals: [Site],

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),

  plugins: [nestedDocs, seo],
});
