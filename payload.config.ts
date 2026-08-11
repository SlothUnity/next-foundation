import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs';

import { createSlug } from './src/cms/payload/utils/createSlug';
import { payloadLocales } from './src/cms/payload/config/locales';

import { Site } from './src/cms/payload/globals/website/Site';
import { Users } from './src/cms/payload/collections/administration/Users';
import { Pages } from './src/cms/payload/collections/content/Pages';
import { Media } from './src/cms/payload/collections/content/Media';

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

  plugins: [
    nestedDocsPlugin({
      collections: ['pages'],

      generateLabel: (_, doc) => {
        return typeof doc.title === 'string' ? doc.title : '';
      },

      generateURL: (docs) => {
        const segments = docs
          .filter((doc) => !doc.isHome)
          .map((doc) => {
            if (typeof doc.title !== 'string') {
              return '';
            }

            return createSlug(doc.title);
          })
          .filter(Boolean);

        return `/${segments.join('/')}`;
      },
    }),
  ],
});
