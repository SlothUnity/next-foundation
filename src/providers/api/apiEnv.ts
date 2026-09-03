import { z } from 'zod';

import { readEnv } from '@/providers/env';

const blankIsAbsent = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const absoluteUrl = (name: string) =>
  z
    .string({ error: `is required by the "api" provider` })
    .min(1, `is required by the "api" provider`)
    .refine(
      (value) => URL.canParse(value),
      `must be an absolute URL, like https://cms.exemplo.pt/api`,
    )
    .refine(
      (value) => !value.endsWith('/'),
      `must not end in a slash — ${name} is joined with paths`,
    );

export const apiEnvSchema = z.object({
  API_URL: absoluteUrl('API_URL'),

  API_TOKEN: z.preprocess(blankIsAbsent, z.string().min(1).optional()),

  API_REVALIDATE: z.preprocess(
    blankIsAbsent,
    z.coerce
      .number({ error: 'must be a whole number of seconds' })
      .int('must be a whole number of seconds')
      .nonnegative('cannot be negative')
      .default(60),
  ),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function apiEnv(): ApiEnv {
  return readEnv(apiEnvSchema, 'the "api" provider');
}
