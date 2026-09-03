import { describe, expect, it } from 'vitest';

import { remoteImageHosts } from './imageHosts';
import { baselineSecurityHeaders, contentSecurityPolicy, PUBLIC_PATHS } from './securityHeaders';

function directive(name: string): string | undefined {
  return contentSecurityPolicy.split('; ').find((part) => part.startsWith(`${name} `));
}

describe('the content security policy', () => {
  it('allows framing by this origin only, because Live Preview iframes the site from the admin', () => {
    expect(directive('frame-ancestors')).toBe("frame-ancestors 'self'");
  });

  it('forbids plugins and object embeds outright', () => {
    expect(contentSecurityPolicy).toContain("object-src 'none'");
  });

  it('pins the base URI and form targets, which is what stops injected redirects', () => {
    expect(directive('base-uri')).toBe("base-uri 'self'");
    expect(directive('form-action')).toBe("form-action 'self'");
  });

  it('allows exactly the remote image hosts this project declared, and no others', () => {
    const imgSrc = directive('img-src') ?? '';

    for (const host of remoteImageHosts) {
      expect(imgSrc).toContain(host);
    }

    expect(imgSrc.split(' ').filter((part) => part.startsWith('https://'))).toHaveLength(
      remoteImageHosts.length,
    );
  });

  it('always allows same-origin images, which is where a bundled image lives', () => {
    expect(directive('img-src')).toContain("'self'");
  });

  it('starts from default-src self, so anything unlisted is refused', () => {
    expect(contentSecurityPolicy.startsWith("default-src 'self'")).toBe(true);
  });
});

describe('the path pattern the policy applies to', () => {
  const pattern = new RegExp(`^${PUBLIC_PATHS.replace('/:path(', '/(').replace(/\)$/, ')$')}`);

  it.each(['/', '/sobre-nos', '/en/about-us', '/administracao', '/apiario'])(
    'covers %s',
    (path) => {
      expect(pattern.test(path)).toBe(true);
    },
  );

  it.each(['/admin', '/admin/collections/pages', '/api/media/file/logo.png'])(
    'leaves %s to the CMS, which this policy was not verified against',
    (path) => {
      expect(pattern.test(path)).toBe(false);
    },
  );
});

describe('the baseline headers', () => {
  it.each([
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Strict-Transport-Security',
    'Permissions-Policy',
  ])('include %s', (key) => {
    expect(baselineSecurityHeaders.map((header) => header.key)).toContain(key);
  });
});
