import type { SetupOperation, SetupPlan, SetupProvider } from './Setup.types';

const ENV_HEADER = '# Copy to .env.local. Every variable is explained in README.md.';

const envExample: Record<SetupProvider, string> = {
  payload: [
    ENV_HEADER,
    '',
    '# ---- required ----',
    'DATABASE_URL=postgres://user:password@host:5432/database',
    'PAYLOAD_SECRET=',
    'NEXT_PUBLIC_SERVER_URL=http://localhost:3000',
    '',
    '# ---- required on Vercel ----',
    'BLOB_READ_WRITE_TOKEN=',
    '',
    '# ---- optional ----',
    'PREVIEW_SECRET=',
    '',
  ].join('\n'),

  api: [
    ENV_HEADER,
    '',
    '# ---- required ----',
    'API_URL=https://cms.exemplo.pt/api',
    '',
    '# ---- optional ----',
    'API_TOKEN=',
    'API_REVALIDATE=60',
    '',
  ].join('\n'),

  mock: [
    '# The mock provider reads no environment at all.',
    '# Its pages live in src/providers/mocks/pages.',
    '',
  ].join('\n'),
};

function imageHostsFile(hosts: string[]): string {
  const declared = hosts.length
    ? ['[', ...hosts.map((host) => `  '${host}',`), ']'].join('\n')
    : '[]';

  return [
    `export const remoteImageHosts: string[] = ${declared};`,
    '',
    'export const imageSourceDirective = [',
    `  "img-src 'self'",`,
    "  'data:',",
    "  'blob:',",
    '  ...remoteImageHosts.map((host) => `https://${host}`),',
    "].join(' ');",
    '',
  ].join('\n');
}

const imageHosts: Record<SetupProvider, string> = {
  payload: imageHostsFile(['*.public.blob.vercel-storage.com']),
  api: imageHostsFile([]),
  mock: imageHostsFile([]),
};

function sitemapLocationFile(value: string): string {
  return [
    'export type SitemapLocation =',
    "  | { kind: 'app' }",
    "  | { kind: 'source' }",
    "  | { kind: 'external'; url: string }",
    "  | { kind: 'none' };",
    '',
    `export const sitemapLocation: SitemapLocation = ${value};`,
    '',
  ].join('\n');
}

const sitemapLocations: Record<SetupProvider, string> = {
  payload: sitemapLocationFile("{ kind: 'app' }"),
  api: sitemapLocationFile("{ kind: 'none' }"),
  mock: sitemapLocationFile("{ kind: 'app' }"),
};

const providerExport: Record<SetupProvider, string> = {
  payload: "export { payloadProvider as provider } from './payload/provider';\n",
  api: "export { apiProvider as provider } from './api/provider';\n",
  mock: "export { mockProvider as provider } from './mocks/provider';\n",
};

const PAYLOAD_DEPENDENCIES = [
  '@payloadcms/db-postgres',
  '@payloadcms/live-preview-react',
  '@payloadcms/next',
  '@payloadcms/plugin-nested-docs',
  '@payloadcms/plugin-seo',
  '@payloadcms/storage-vercel-blob',
  '@payloadcms/ui',
  'payload',
];

const PAYLOAD_SCRIPTS = ['dev:payload', 'payload:types', 'payload:importMap', 'payload:generate'];

const PROVIDER_SCRIPTS = ['dev:mock'];

function removePayload(): SetupOperation[] {
  const why = 'the payload provider was not chosen';

  return [
    { kind: 'delete', path: 'src/providers/payload', why },
    { kind: 'delete', path: 'src/app/(payload)', why },
    { kind: 'delete', path: 'src/app/(frontend)/next', why },
    { kind: 'delete', path: 'payload.config.ts', why },
    { kind: 'delete', path: 'payload-types.ts', why },
    { kind: 'delete', path: 'generator/templates/module/block.hbs', why },
    { kind: 'delete', path: 'docs/reference/payload.md', why },

    {
      kind: 'removeJsonKeys',
      path: 'package.json',
      at: ['dependencies'],
      keys: PAYLOAD_DEPENDENCIES,
      why,
    },
    {
      kind: 'removeJsonKeys',
      path: 'package.json',
      at: ['scripts'],
      keys: PAYLOAD_SCRIPTS,
      why,
    },
    {
      kind: 'removeJsonKeys',
      path: 'tsconfig.json',
      at: ['compilerOptions', 'paths'],
      keys: ['@payload-config', '@payload-types'],
      why,
    },

    {
      kind: 'removeLines',
      path: 'vitest.config.ts',
      containing: ["'@payload-config': path.resolve", "'@payload-types': path.resolve"],
      why,
    },
    {
      kind: 'removeLines',
      path: 'pnpm-workspace.yaml',
      containing: ['- sharp'],
      why: 'sharp only arrived through Payload',
    },

    {
      kind: 'removeBlock',
      path: '.prettierignore',
      from: '# Gerados pelo Payload',
      to: 'src/app/(payload)/admin/importMap.js',
      why,
    },

    {
      kind: 'replace',
      path: 'next.config.ts',
      find: "import { withPayload } from '@payloadcms/next/withPayload';\n",
      replace: '',
      why,
    },
    {
      kind: 'replace',
      path: 'next.config.ts',
      find: 'export default withPayload(nextConfig);',
      replace: 'export default nextConfig;',
      why,
    },

    {
      kind: 'removeLines',
      path: 'README.md',
      containing: ['[payload.md](docs/reference/payload.md)'],
      why: 'docs/reference/payload.md was deleted',
    },
    {
      kind: 'removeLines',
      path: 'docs/start/overview.md',
      containing: [
        '[payload.md](../reference/payload.md#ishome-e-is404)',
        '[payload.md](../reference/payload.md#redirects)',
        '| [payload.md](../reference/payload.md)',
      ],
      why: 'docs/reference/payload.md was deleted',
    },
    {
      kind: 'removeLines',
      path: 'docs/README.md',
      containing: ['| [payload.md](reference/payload.md)'],
      why: 'the docs index must not name a document that is gone',
    },
  ];
}

function removeApi(): SetupOperation[] {
  const why = 'the api provider was not chosen';

  return [
    { kind: 'delete', path: 'src/providers/api', why },
    { kind: 'delete', path: 'docs/reference/api.md', why },

    {
      kind: 'removeLines',
      path: 'README.md',
      containing: ['[api.md](docs/reference/api.md)'],
      why: 'docs/reference/api.md was deleted',
    },
    {
      kind: 'removeLines',
      path: 'docs/start/overview.md',
      containing: ['→ [api.md](../reference/api.md)', '| [api.md](../reference/api.md)'],
      why: 'docs/reference/api.md was deleted',
    },
    {
      kind: 'removeLines',
      path: 'docs/README.md',
      containing: ['| [api.md](reference/api.md)'],
      why: 'the docs index must not name a document that is gone',
    },
  ];
}

function removeMocks(): SetupOperation[] {
  return [
    {
      kind: 'delete',
      path: 'src/providers/mocks',
      why: 'the mock provider was not chosen',
    },
  ];
}

const removals: Record<SetupProvider, () => SetupOperation[]> = {
  payload: () => [...removeApi(), ...removeMocks()],
  api: () => [...removePayload(), ...removeMocks()],
  mock: () => [...removePayload(), ...removeApi()],
};

const deletedDocs: Record<SetupProvider, string[]> = {
  payload: ['reference/api.md'],
  api: ['reference/payload.md'],
  mock: ['reference/payload.md', 'reference/api.md'],
};

function notesFor(provider: SetupProvider): string[] {
  const notes = [
    'docs/reference/providers.md documents PROVIDER and createProvider, which no longer exist. It still explains the Provider contract, so read it as design background rather than as instructions.',
    'Run pnpm check:links for the exact list of prose that now points at deleted files, and prune it. It runs in the pre-commit hook, so it will stop your first commit until you do. It is deliberately not in pnpm build: a stale sentence must never fail a deploy.',
  ];

  if (provider !== 'payload') {
    notes.push(
      'Run pnpm install to drop the removed Payload packages from node_modules and the lockfile.',
    );
  }

  if (provider === 'api') {
    notes.push(
      'Images: declare the host your API serves them from in src/app/_lib/imageHosts.ts. Until you do, next/image refuses remote images and the CSP blocks them — both on purpose, because a wildcard there is a hole.',
    );
  }

  if (provider === 'api') {
    notes.push(
      "Sitemap: /sitemap.xml answers 404 and robots.txt says nothing about it, until you pick one of three in src/app/_lib/sitemapLocation.ts. Your API serves it at a fixed URL: { kind: 'external', url: ... }. At a URL that varies: { kind: 'source' }, and report it as sitemapUrl from ApiSiteSource. Your API can enumerate published paths: write mapApiPaths (and adjust createPathsRequest to your endpoint), then { kind: 'app' }.",
    );
  }

  if (provider === 'mock') {
    notes.push(
      'The mock provider serves hand-written pages and has no draft mode. It is a prototyping target, not a production one.',
    );
  }

  return notes;
}

export function planRemoval(provider: SetupProvider): SetupPlan {
  const shared: SetupOperation[] = [
    {
      kind: 'delete',
      path: 'src/providers/createProvider.ts',
      why: 'with a single provider the PROVIDER switch is dead code',
    },
    {
      kind: 'delete',
      path: 'src/providers/createProvider.test.ts',
      why: 'it tests the switch that was removed',
    },
    {
      kind: 'removeJsonKeys',
      path: 'package.json',
      at: ['scripts'],
      keys: PROVIDER_SCRIPTS,
      why: 'dev:mock exists to try a provider before choosing one',
    },
    {
      kind: 'write',
      path: 'src/providers/provider.ts',
      contents: providerExport[provider],
      why: `the ${provider} provider is now the only one`,
    },
    {
      kind: 'write',
      path: '.env.example',
      contents: envExample[provider],
      why: `only the ${provider} provider reads configuration now`,
    },
    {
      kind: 'write',
      path: 'src/app/_lib/imageHosts.ts',
      contents: imageHosts[provider],
      why: 'where images come from follows the provider',
    },
    {
      kind: 'write',
      path: 'src/app/_lib/sitemapLocation.ts',
      contents: sitemapLocations[provider],
      why: 'who serves the sitemap follows the provider',
    },
  ];

  return {
    provider,
    operations: [...removals[provider](), ...shared],
    danglingReferencesTo: deletedDocs[provider],
    notes: notesFor(provider),
  };
}
