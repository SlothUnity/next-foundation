import type { MockPage } from '../definePage';

import { home } from './home';
import { notFound } from './notFound';

export type { MockRedirect } from './redirects';
export { mockRedirects } from './redirects';

export const mockPages: MockPage[] = [...home];

export const mockNotFoundPages: MockPage[] = [...notFound];
