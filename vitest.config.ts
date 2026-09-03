import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => ({
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
      '@payload-config': path.resolve(dirname, './payload.config.ts'),
      '@payload-types': path.resolve(dirname, './payload-types.ts'),
    },
  },

  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
}));
