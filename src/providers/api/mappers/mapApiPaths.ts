import type { PagePath } from '@/core/pages';

import { ApiContractError } from '../errors';

import { describeBody } from './describeBody';

export function mapApiPaths(raw: unknown): PagePath[] {
  throw new ApiContractError(
    [
      'mapApiPaths() has no mapping yet, so the sitemap cannot be built.',
      `The API returned ${describeBody(raw)}.`,
      'Write the translation in src/providers/api/mappers/mapApiPaths.ts',
      '— see docs/reference/api.md.',
    ].join(' '),
  );
}
