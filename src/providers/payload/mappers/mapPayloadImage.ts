import type { ImageData } from '@/core/media';

interface PayloadUpload {
  url?: unknown;
  alt?: unknown;
  width?: unknown;
  height?: unknown;
  mimeType?: unknown;
  filename?: unknown;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

export function isPayloadUpload(value: unknown): value is PayloadUpload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const candidate = value as PayloadUpload;

  return typeof candidate.url === 'string' && typeof candidate.filename === 'string';
}

export function mapPayloadImage(upload: PayloadUpload): ImageData {
  return {
    url: String(upload.url),
    alt: typeof upload.alt === 'string' ? upload.alt : '',
    width: optionalNumber(upload.width),
    height: optionalNumber(upload.height),
  };
}
