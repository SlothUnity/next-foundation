import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@payload-config': path.resolve(__dirname, './payload.config.ts'),
    },
  },

  test: {
    environment: 'jsdom',
    setupFiles: ['./vite.setup.ts'],
  },
}));
