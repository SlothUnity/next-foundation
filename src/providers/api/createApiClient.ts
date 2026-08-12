import { ApiClient } from './ApiClient';

const DEFAULT_REVALIDATE = 60;

function readRevalidate(): number {
  const raw = process.env.API_REVALIDATE;

  if (!raw) {
    return DEFAULT_REVALIDATE;
  }

  const revalidate = Number(raw);

  if (!Number.isInteger(revalidate) || revalidate < 0) {
    throw new Error(`Invalid API_REVALIDATE "${raw}". Expected a non-negative integer of seconds.`);
  }

  return revalidate;
}

export function createApiClient(): ApiClient {
  const url = process.env.API_URL;

  if (!url) {
    throw new Error('Missing API_URL. It is required by the "api" provider.');
  }

  return new ApiClient({
    url,
    token: process.env.API_TOKEN,
    revalidate: readRevalidate(),
  });
}
