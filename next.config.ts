import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';

import {
  baselineSecurityHeaders,
  BLOB_IMAGE_HOSTNAME,
  contentSecurityPolicy,
  PUBLIC_PATHS,
} from '@/app/_lib/securityHeaders';

const nextConfig: NextConfig = {
  reactCompiler: true,

  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: BLOB_IMAGE_HOSTNAME,
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: baselineSecurityHeaders,
      },
      {
        source: PUBLIC_PATHS,
        headers: [{ key: 'Content-Security-Policy', value: contentSecurityPolicy }],
      },
    ];
  },
};

export default withPayload(nextConfig);
