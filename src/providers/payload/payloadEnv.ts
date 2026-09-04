import { z } from 'zod';

import { readEnv } from '@/providers/env';

const MINIMUM_SECRET_LENGTH = 32;

export const payloadEnvSchema = z.object({
  DATABASE_URL: z
    .string({ error: 'is required by the Postgres adapter' })
    .min(1, 'is required by the Postgres adapter')
    .refine(
      (value) => /^postgres(ql)?:\/\//.test(value),
      'must be a postgres:// or postgresql:// connection string',
    ),

  PAYLOAD_SECRET: z
    .string({ error: 'is required by Payload to sign session tokens' })
    .min(
      MINIMUM_SECRET_LENGTH,
      `must be at least ${MINIMUM_SECRET_LENGTH} characters: it signs the admin session tokens`,
    ),

  NEXT_PUBLIC_SERVER_URL: z
    .string({ error: 'is required: Payload validates the admin origin against it' })
    .min(1, 'is required: Payload validates the admin origin against it')
    .refine((value) => URL.canParse(value), 'must be an absolute URL, like https://exemplo.pt')
    .refine(
      (value) => !value.endsWith('/'),
      'must not end in a slash: the Live Preview compares it against the browser origin as an exact string, so a trailing slash breaks it in silence',
    ),

  PREVIEW_SECRET: z
    .string()
    .min(
      MINIMUM_SECRET_LENGTH,
      `must be at least ${MINIMUM_SECRET_LENGTH} characters: it signs the preview tokens`,
    )
    .optional(),
});

export type PayloadEnv = z.infer<typeof payloadEnvSchema>;

export function payloadEnv(): PayloadEnv {
  return readEnv(payloadEnvSchema, 'the Payload configuration');
}
