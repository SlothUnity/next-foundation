export function describeBody(raw: unknown): string {
  if (raw === null) {
    return 'null';
  }

  if (Array.isArray(raw)) {
    return `an array of ${raw.length} item(s)`;
  }

  if (typeof raw !== 'object') {
    return typeof raw;
  }

  const keys = Object.keys(raw);

  if (!keys.length) {
    return 'an object with no keys';
  }

  return `an object with keys: ${keys.join(', ')}`;
}
