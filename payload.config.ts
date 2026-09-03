import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import sharp from 'sharp';

import { payloadEnv } from '@/providers/payload/payloadEnv';

import { nestedDocs, seo, storage } from '@/providers/payload/plugins';

import { payloadDefaultLocale, payloadLocales } from '@/providers/payload/locales';

import { Site } from '@/providers/payload/globals/Site';
import { Navigation } from '@/providers/payload/globals/Navigation';
import { Footer } from '@/providers/payload/globals/Footer';
import { Users } from '@/providers/payload/collections/Users';
import { Pages } from '@/providers/payload/collections/Pages';
import { Redirects } from '@/providers/payload/collections/Redirects';
import { Media } from '@/providers/payload/collections/Media';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const env = payloadEnv();

export default buildConfig({
  secret: env.PAYLOAD_SECRET,

  sharp,

  upload: {
    limits: {
      fileSize: MAX_UPLOAD_BYTES,
    },
  },

  serverURL: env.NEXT_PUBLIC_SERVER_URL,

  localization: {
    locales: payloadLocales,
    defaultLocale: payloadDefaultLocale,
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

  collections: [Users, Pages, Redirects, Media],
  globals: [Site, Navigation, Footer],

  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
  }),

  plugins: [nestedDocs, seo, storage],
});
