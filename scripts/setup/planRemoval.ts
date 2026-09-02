import type { SetupOperation, SetupPlan, SetupProvider } from './Setup.types';

const ENV_HEADER = '# Copia para .env.local e preenche. O .env.local nunca é versionado.';

const ENV_PUBLIC_URL = [
  '# URL público. Sem barra final.',
  '# Vai para o browser (prefixo NEXT_PUBLIC_) — nunca lá ponhas segredos.',
  'NEXT_PUBLIC_SERVER_URL=http://localhost:3000',
].join('\n');

const envExample: Record<SetupProvider, string> = {
  payload: [
    ENV_HEADER,
    '',
    '# --- Obrigatórias ---',
    '',
    '# Ligação ao Postgres. Sem ela a aplicação não arranca.',
    'DATABASE_URL=postgres://user:password@host:5432/database',
    '',
    '# Assina os tokens de sessão do admin. Gera um valor longo e aleatório,',
    '# distinto por ambiente. Sem ela a aplicação não arranca.',
    'PAYLOAD_SECRET=',
    '',
    '# Onde vivem os ficheiros carregados no CMS. O Vercel injecta-a sozinho.',
    '# Em produção a sua falta derruba o arranque; em desenvolvimento podes',
    '# deixá-la vazia e os ficheiros ficam em ./media, com um aviso no log.',
    'BLOB_READ_WRITE_TOKEN=',
    '',
    '# --- Opcionais ---',
    '',
    '# URL público. Sem barra final: é usado como targetOrigin de postMessage',
    '# no Live Preview e a comparação é de string exacta.',
    '# Vai para o browser (prefixo NEXT_PUBLIC_) — nunca lá ponhas segredos.',
    'NEXT_PUBLIC_SERVER_URL=http://localhost:3000',
    '',
    '# Chave que assina os links de pré-visualização. Não viaja no URL: o que',
    '# viaja é um token com validade de uma hora, preso ao caminho da página.',
    '# Sem ela o Live Preview fica desligado, com um erro no log do servidor.',
    '# Gera um valor longo e aleatório, distinto por ambiente.',
    'PREVIEW_SECRET=',
    '',
  ].join('\n'),

  api: [
    ENV_HEADER,
    '',
    '# --- Obrigatórias ---',
    '',
    '# Base da API externa. Sem ela o provider atira no primeiro pedido.',
    'API_URL=https://cms.exemplo.pt/api',
    '',
    '# --- Opcionais ---',
    '',
    '# Enviado como "Authorization: Bearer ..." quando definido.',
    'API_TOKEN=',
    '',
    '# Segundos de revalidação do cache. 60 por omissão.',
    '# Tem de ser um inteiro não negativo, senão o arranque falha.',
    'API_REVALIDATE=60',
    '',
    ENV_PUBLIC_URL,
    '',
  ].join('\n'),

  mock: [
    ENV_HEADER,
    '#',
    '# O provider `mocks` não precisa de configuração: as páginas estão em',
    '# src/providers/mocks/pages/.',
    '',
    ENV_PUBLIC_URL,
    '',
  ].join('\n'),
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

function removePayload(): SetupOperation[] {
  const why = 'the payload provider was not chosen';

  return [
    { kind: 'delete', path: 'src/providers/payload', why },
    { kind: 'delete', path: 'src/app/(payload)', why },
    { kind: 'delete', path: 'src/app/(frontend)/next', why },
    { kind: 'delete', path: 'payload.config.ts', why },
    { kind: 'delete', path: 'payload-types.ts', why },
    { kind: 'delete', path: 'generator/templates/module/block.hbs', why },
    { kind: 'delete', path: 'docs/payload.md', why },

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
      containing: ['[payload.md](docs/payload.md)'],
      why: 'docs/payload.md was deleted',
    },
    {
      kind: 'removeLines',
      path: 'docs/resumo.md',
      containing: [
        '[payload.md](payload.md#ishome-e-is404)',
        '[payload.md](payload.md#redirects)',
        '| [payload.md](payload.md)',
      ],
      why: 'docs/payload.md was deleted',
    },
  ];
}

function removeApi(): SetupOperation[] {
  const why = 'the api provider was not chosen';

  return [
    { kind: 'delete', path: 'src/providers/api', why },
    { kind: 'delete', path: 'docs/api.md', why },

    {
      kind: 'removeLines',
      path: 'README.md',
      containing: ['[api.md](docs/api.md)'],
      why: 'docs/api.md was deleted',
    },
    {
      kind: 'removeLines',
      path: 'docs/resumo.md',
      containing: ['→ [api.md](api.md)', '| [api.md](api.md)'],
      why: 'docs/api.md was deleted',
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
  payload: ['api.md'],
  api: ['payload.md'],
  mock: ['payload.md', 'api.md'],
};

function notesFor(provider: SetupProvider): string[] {
  const notes = [
    'docs/providers.md documents PROVIDER and createProvider, which no longer exist. It still explains the Provider contract, so read it as design background rather than as instructions.',
  ];

  if (provider !== 'payload') {
    notes.push(
      'Run pnpm install to drop the removed Payload packages from node_modules and the lockfile.',
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
  ];

  return {
    provider,
    operations: [...removals[provider](), ...shared],
    danglingReferencesTo: deletedDocs[provider],
    notes: notesFor(provider),
  };
}
