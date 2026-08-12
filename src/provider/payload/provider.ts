import type { Provider } from '@/provider/types';

import PayloadLivePreview from './components/PayloadLivePreview';
import { PayloadPageSource } from './src/PayloadPageSource';
import { PayloadSiteSource } from './src/PayloadSiteSource';

export const payloadProvider: Provider = {
  page: new PayloadPageSource(),
  site: new PayloadSiteSource(),
  preview: PayloadLivePreview,
};
