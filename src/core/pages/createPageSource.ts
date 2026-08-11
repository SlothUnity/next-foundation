import { PayloadPageSource } from '@/cms/payload/PayloadPageSource';

import { MockPageSource } from './MockPageSource';
import type { PageSource } from './PageSource';

export function createPageSource(): PageSource {
  switch (process.env.PAGE_SOURCE) {
    case 'payload':
      return new PayloadPageSource();

    case 'mock':
      return new MockPageSource();

    default:
      throw new Error(`Unsupported PAGE_SOURCE "${process.env.PAGE_SOURCE}".`);
  }
}
