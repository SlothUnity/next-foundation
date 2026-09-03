import { apiEnv } from './apiEnv';
import { ApiClient } from './ApiClient';

export function createApiClient(): ApiClient {
  const { API_URL, API_TOKEN, API_REVALIDATE } = apiEnv();

  return new ApiClient({
    url: API_URL,
    token: API_TOKEN,
    revalidate: API_REVALIDATE,
  });
}
