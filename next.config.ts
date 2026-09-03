import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';

import { remoteImageHosts } from '@/app/_lib/imageHosts';
import {
  baselineSecurityHeaders,
  contentSecurityPolicy,
  PUBLIC_PATHS,
} from '@/app/_lib/securityHeaders';

const nextConfig: NextConfig = {
  reactCompiler: true,

  poweredByHeader: false,

  images: {
    remotePatterns: remoteImageHosts.map((hostname) => ({
      protocol: 'https' as const,
      hostname,
    })),
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: baselineSecurityHeaders,
      },
      {
        source: PUBLIC_PATHS,
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy({ allowEval: process.env.NODE_ENV === 'development' }),
          },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig);
