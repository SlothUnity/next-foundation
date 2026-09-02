import { headers } from 'next/headers';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

export async function requestOrigin(): Promise<string> {
  const headerList = await headers();

  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');

  if (!host) {
    throw new Error('The request carries no host, so an absolute URL cannot be built.');
  }

  const [forwarded] = (headerList.get('x-forwarded-proto') ?? '').split(',');

  const isLocal = LOCAL_HOSTS.some((local) => host.startsWith(local));

  const protocol = forwarded?.trim() || (isLocal ? 'http' : 'https');

  return `${protocol}://${host}`;
}
