import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';

import { nestedDocs, seo } from '@/provider/payload/plugins';

import { payloadLocales } from '@/provider/payload/config/locales';

import { Site } from '@/provider/payload/globals/website/Site';
import { Users } from '@/provider/payload/collections/administration/Users';
import { Pages } from '@/provider/payload/collections/content/Pages';
import { Media } from '@/provider/payload/collections/content/Media';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',

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
