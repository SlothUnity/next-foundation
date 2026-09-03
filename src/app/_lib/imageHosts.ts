export const remoteImageHosts: string[] = ['*.public.blob.vercel-storage.com'];

export const imageSourceDirective = [
  "img-src 'self'",
  'data:',
  'blob:',
  ...remoteImageHosts.map((host) => `https://${host}`),
].join(' ');
