import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { planRemoval } from './planRemoval';
import { setupProviders } from './Setup.types';
import type { SetupOperation, SetupProvider } from './Setup.types';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function read(relative: string): string {
  return readFileSync(path.join(repoRoot, relative), 'utf8');
}

function readJson(relative: string): Record<string, unknown> {
  return JSON.parse(read(relative)) as Record<string, unknown>;
}

function resolveJsonPath(file: string, at: string[]): Record<string, unknown> {
  let node = readJson(file);

  for (const segment of at) {
    const next = node[segment];

    if (!next || typeof next !== 'object') {
      throw new Error(`${file} has no object at ${at.join('.')}`);
    }

    node = next as Record<string, unknown>;
  }

  return node;
}

const providerDirectory: Record<SetupProvider, string> = {
  payload: 'src/providers/payload',
  api: 'src/providers/api',
  mock: 'src/providers/mocks',
};

function deletedPaths(operations: SetupOperation[]): string[] {
  return operations.filter((operation) => operation.kind === 'delete').map(({ path }) => path);
}

describe('planRemoval', () => {
  it.each(setupProviders)('keeps the %s provider and deletes the other two', (chosen) => {
    const deleted = deletedPaths(planRemoval(chosen).operations);

    expect(deleted).not.toContain(providerDirectory[chosen]);

    for (const other of setupProviders.filter((provider) => provider !== chosen)) {
      expect(deleted).toContain(providerDirectory[other]);
    }
  });

  it.each(setupProviders)('never patches a path it also deletes, for %s', (provider) => {
    const { operations } = planRemoval(provider);

    const deleted = deletedPaths(operations);

    const patched = operations
      .filter((operation) => operation.kind !== 'delete')
      .map(({ path }) => path);

    for (const path of patched) {
      const inside = deleted.filter((target) => path === target || path.startsWith(`${target}/`));

      expect(inside, `${path} is patched but also deleted`).toEqual([]);
    }
  });

  it.each(setupProviders)('deletes each path only once, for %s', (provider) => {
    const deleted = deletedPaths(planRemoval(provider).operations);

    expect(deleted).toEqual([...new Set(deleted)]);
  });

  it.each(setupProviders)('explains every operation, for %s', (provider) => {
    for (const operation of planRemoval(provider).operations) {
      expect(operation.why).not.toBe('');
      expect(operation.path).not.toBe('');
    }
  });

  it('leaves the Payload wiring alone when payload is chosen', () => {
    const paths = planRemoval('payload').operations.map(({ path }) => path);

    expect(paths).not.toContain('package.json');
    expect(paths).not.toContain('tsconfig.json');
    expect(paths).not.toContain('next.config.ts');
    expect(paths).not.toContain('.prettierignore');
    expect(paths).not.toContain('payload.config.ts');
  });

  it.each(['api', 'mock'] as const)(
    'removes every Payload package when %s is chosen',
    (provider) => {
      const { operations } = planRemoval(provider);

      const dependencies = operations.find(
        (operation) => operation.kind === 'removeJsonKeys' && operation.at[0] === 'dependencies',
      );

      expect(dependencies).toMatchObject({
        keys: expect.arrayContaining(['payload', '@payloadcms/next', '@payloadcms/ui']),
      });

      const scripts = operations.find(
        (operation) => operation.kind === 'removeJsonKeys' && operation.at[0] === 'scripts',
      );

      expect(scripts).toMatchObject({
        keys: expect.arrayContaining(['payload:generate', 'dev:payload']),
      });
    },
  );

  it.each(['api', 'mock'] as const)(
    'unwraps withPayload from next.config.ts for %s',
    (provider) => {
      const replacements = planRemoval(provider).operations.filter(
        (operation) => operation.kind === 'replace' && operation.path === 'next.config.ts',
      );

      expect(replacements).toHaveLength(2);
    },
  );

  it.each(setupProviders)('rewrites provider.ts to export the %s provider', (provider) => {
    const write = planRemoval(provider).operations.find(
      (operation) => operation.kind === 'write' && operation.path === 'src/providers/provider.ts',
    );

    expect(write).toMatchObject({
      contents: expect.stringContaining(`${provider === 'mock' ? 'mock' : provider}Provider`),
    });

    expect(write).toMatchObject({ contents: expect.stringContaining('as provider') });
  });

  it('writes an .env.example with only the variables that provider reads', () => {
    const contentsFor = (provider: SetupProvider) => {
      const write = planRemoval(provider).operations.find(
        (operation) => operation.kind === 'write' && operation.path === '.env.example',
      );

      if (!write || write.kind !== 'write') {
        throw new Error(`No .env.example write planned for ${provider}.`);
      }

      return write.contents;
    };

    expect(contentsFor('payload')).toContain('DATABASE_URL');
    expect(contentsFor('payload')).toContain('PREVIEW_SECRET');
    expect(contentsFor('payload')).not.toContain('API_URL');

    expect(contentsFor('api')).toContain('API_URL');
    expect(contentsFor('api')).not.toContain('DATABASE_URL');
    expect(contentsFor('api')).not.toContain('PAYLOAD_SECRET');

    expect(contentsFor('mock')).not.toContain('DATABASE_URL');
    expect(contentsFor('mock')).not.toContain('API_URL');

    for (const provider of setupProviders) {
      expect(contentsFor(provider)).not.toContain('PROVIDER=');
    }
  });

  it('always drops the PROVIDER switch', () => {
    for (const provider of setupProviders) {
      const deleted = deletedPaths(planRemoval(provider).operations);

      expect(deleted).toContain('src/providers/createProvider.ts');
      expect(deleted).toContain('src/providers/createProvider.test.ts');
    }
  });

  it.each(setupProviders)('reports the docs it deleted, for %s', (provider) => {
    const { operations, danglingReferencesTo } = planRemoval(provider);

    const deletedDocs = deletedPaths(operations)
      .filter((path) => path.startsWith('docs/'))
      .map((path) => path.slice('docs/'.length));

    expect([...danglingReferencesTo].sort()).toEqual([...deletedDocs].sort());
  });

  it('names the stale providers.md in its notes', () => {
    for (const provider of setupProviders) {
      expect(planRemoval(provider).notes.join('\n')).toContain('docs/providers.md');
    }
  });
});

describe('the anchors every plan relies on', () => {
  it.each(setupProviders)('all exist in the tree, for %s', (provider) => {
    for (const operation of planRemoval(provider).operations) {
      switch (operation.kind) {
        case 'delete':
          expect(
            existsSync(path.join(repoRoot, operation.path)),
            `${operation.path} is planned for deletion but does not exist`,
          ).toBe(true);
          break;

        case 'removeLines':
          for (const needle of operation.containing) {
            expect(read(operation.path), `${operation.path} has no line with ${needle}`).toContain(
              needle,
            );
          }
          break;

        case 'removeBlock':
          expect(read(operation.path)).toContain(operation.from);
          expect(read(operation.path)).toContain(operation.to);
          break;

        case 'replace':
          expect(
            read(operation.path),
            `${operation.path} does not contain the find text`,
          ).toContain(operation.find);
          break;

        case 'removeJsonKeys':
          for (const key of operation.keys) {
            expect(
              resolveJsonPath(operation.path, operation.at),
              `${operation.path} ${operation.at.join('.')} has no ${key}`,
            ).toHaveProperty([key]);
          }
          break;

        case 'write':
          break;
      }
    }
  });
});
