import { PayloadPageSource } from '@/cms/payload/PayloadPageSource';

import { MockPageSource } from './MockPageSource';
import type { PageSource } from './PageSource';

export function createPageSource(): PageSource {
  switch (process.env.CMS_SOURCE) {
    case 'payload':
      return new PayloadPageSource();

    case 'mock':
      return new MockPageSource();

    default:
      throw new Error(`Unsupported CMS_SOURCE "${process.env.CMS_SOURCE}".`);
  }
}
