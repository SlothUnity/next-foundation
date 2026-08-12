import type { Provider } from '@/providers/Provider.types';

import PayloadLivePreview from './components/PayloadLivePreview';
import { PayloadPageSource } from './sources/PayloadPageSource';
import { PayloadSiteSource } from './sources/PayloadSiteSource';

export const payloadProvider: Provider = {
  page: new PayloadPageSource(),
  site: new PayloadSiteSource(),
  preview: PayloadLivePreview,
};
