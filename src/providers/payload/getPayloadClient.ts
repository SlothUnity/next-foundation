import { getPayload, type Payload } from 'payload';

export async function getPayloadClient(): Promise<Payload> {
  const { default: config } = await import('@payload-config');

  return getPayload({ config });
}
