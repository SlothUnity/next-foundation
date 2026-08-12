import type { Provider } from './Provider.types';

import { mockProvider } from './mocks/provider';
import { payloadProvider } from './payload/provider';

export function createProvider(): Provider {
  const name = process.env.PROVIDER ?? 'payload';

  switch (name) {
    case 'mock':
      return mockProvider;

    case 'payload':
      return payloadProvider;

    default:
      throw new Error(`Unsupported PROVIDER "${name}".`);
  }
}
