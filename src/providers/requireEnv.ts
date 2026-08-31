export function requireEnv(name: string, usedBy?: string): string {
  const value = process.env[name];

  if (!value) {
    const context = usedBy ? ` It is required by ${usedBy}.` : '';

    throw new Error(`Missing ${name}.${context}`);
  }

  return value;
}
