import type { PageDefinition } from '@/core/pages';

import { ApiContractError } from '../errors';

import { describeBody } from './describeBody';

export function mapApiPage(raw: unknown): PageDefinition {
  throw new ApiContractError(
    [
      'mapApiPage() has no mapping yet, so the page cannot be built.',
      `The API returned ${describeBody(raw)}.`,
      'Write the translation in src/providers/api/mappers/mapApiPage.ts',
      '— see docs/reference/api.md.',
    ].join(' '),
  );
}
