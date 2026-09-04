import { describe, expect, it } from 'vitest';

import { isProjectFile, projectFiles } from './foundationFiles';

describe('what a generated project gets', () => {
  it.each([
    'package.json',
    'src/core/pages/PageSource.ts',
    'src/providers/api/provider.ts',
    'docs/reference/api.md',
    'scripts/links/run.ts',
    'scripts/links/parse.ts',
    'generator/plopfile.ts',
    'public/.gitkeep',
    'AGENTS.md',
  ])('keeps %s', (file) => {
    expect(isProjectFile(file)).toBe(true);
  });

  it.each([
    'scripts/setup/Setup.cli.ts',
    'scripts/setup/planRemoval.ts',
    'scripts/create/foundationFiles.ts',
  ])('leaves %s behind, because it is the foundation own tooling', (file) => {
    expect(isProjectFile(file)).toBe(false);
  });

  it('never carries an env file, which is the one that holds real secrets', () => {
    expect(isProjectFile('.env.local')).toBe(false);
    expect(isProjectFile('.env.example')).toBe(true);
  });

  it('keeps the link checker, because a project still has documents to keep honest', () => {
    const kept = projectFiles([
      'scripts/links/run.ts',
      'scripts/links/parse.ts',
      'scripts/links/parse.test.ts',
      'scripts/links/checkLinks.ts',
      'scripts/setup/applyPlan.ts',
    ]);

    expect(kept).toEqual([
      'scripts/links/run.ts',
      'scripts/links/parse.ts',
      'scripts/links/parse.test.ts',
      'scripts/links/checkLinks.ts',
    ]);
  });
});

describe('every foundation directory is excluded, not just the ones someone remembered', () => {
  it.each([
    'scripts/setup/Setup.cli.ts',
    'scripts/create/Create.cli.ts',
    'scripts/verify/shapes.ts',
  ])('leaves %s behind', (file) => {
    expect(isProjectFile(file)).toBe(false);
  });

  it('keeps scripts/links, because a project still has documents to keep honest', () => {
    expect(isProjectFile('scripts/links/run.ts')).toBe(true);
    expect(isProjectFile('scripts/docs/run.ts')).toBe(true);
  });

  it('does not exclude a directory that merely starts with the same letters', () => {
    expect(isProjectFile('scripts/setups-of-mine/x.ts')).toBe(true);
  });
});
