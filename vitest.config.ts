import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => ({
  resolve: {
    // Espelha os paths do tsconfig.json — o Vitest não os lê.
    alias: {
      '@': path.resolve(dirname, './src'),
      // Só precisa de resolver, não de ser avaliado: o getPayloadClient importa-o
      // dinamicamente, e nenhum teste chega a pedir dados ao Payload.
      '@payload-config': path.resolve(dirname, './payload.config.ts'),
      '@payload-types': path.resolve(dirname, './payload-types.ts'),
    },
  },

  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
}));
