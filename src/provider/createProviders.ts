import type { Provider } from './types';

import { mockProvider } from './mocks/provider';
import { payloadProvider } from './payload/provider';

export function createProviders(): Provider {
  const provider = process.env.PROVIDER ?? 'payload';

  switch (provider) {
    case 'mock':
      return mockProvider;

    case 'payload':
      return payloadProvider;

    default:
      throw new Error(`Unsupported PROVIDER "${provider}".`);
  }
}
