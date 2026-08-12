export function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const text = value.trim();

  return text || undefined;
}

export function optionalFlag(value: unknown): boolean {
  return value === true || value === 'true' || value === 1;
}

export function optionalList(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  return value === null || value === undefined ? [] : [value];
}
