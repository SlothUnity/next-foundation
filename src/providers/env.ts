import type { ZodType } from 'zod';

export function readEnv<T>(schema: ZodType<T>, usedBy: string): T {
  const result = schema.safeParse(process.env);

  if (result.success) {
    return result.data;
  }

  const issues = result.error.issues
    .map((issue) => `  ${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n');

  throw new Error(`The environment is not usable by ${usedBy}:\n${issues}`);
}
