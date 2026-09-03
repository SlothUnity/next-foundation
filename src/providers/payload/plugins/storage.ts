import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob';

const token = process.env.BLOB_READ_WRITE_TOKEN;

if (!token && process.env.VERCEL === '1') {
  throw new Error(
    'Missing BLOB_READ_WRITE_TOKEN. It is required by the Media collection on Vercel, where the filesystem does not survive a deploy: every uploaded file would be lost.',
  );
}

if (!token) {
  console.warn(
    'BLOB_READ_WRITE_TOKEN is not set, so uploads go to the local ./media folder. That is fine in development, and loses every file on any host with an ephemeral filesystem.',
  );
}

export const storage = vercelBlobStorage({
  collections: {
    media: true,
  },

  token,

  alwaysInsertFields: true,
});
