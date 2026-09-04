import { describe, expect, it } from 'vitest';

import { isValidProjectName, projectManifest } from './projectManifest';

const foundation = {
  name: 'next-foundation',
  version: '9.9.9',
  private: true,
  scripts: {
    dev: 'next dev',
    'setup:provider': 'tsx scripts/setup/Setup.cli.ts',
    'create:foundation': 'tsx scripts/create/Create.cli.ts',
    'check:links': 'tsx scripts/links/run.ts',
  },
  dependencies: { next: '16.3.0' },
};

describe('projectManifest', () => {
  it('takes the name of the project, not the name of the foundation', () => {
    expect(projectManifest({ manifest: foundation, name: 'site-cliente' }).name).toBe(
      'site-cliente',
    );
  });

  it('starts the version at 0.1.0, because a new project has no history', () => {
    expect(projectManifest({ manifest: foundation, name: 'site' }).version).toBe('0.1.0');
  });

  it('drops the commands that only make sense in the foundation', () => {
    const { scripts } = projectManifest({ manifest: foundation, name: 'site' }) as {
      scripts: Record<string, string>;
    };

    expect(scripts['setup:provider']).toBeUndefined();
    expect(scripts['create:foundation']).toBeUndefined();
  });

  it('keeps every other script, including the link checker', () => {
    const { scripts } = projectManifest({ manifest: foundation, name: 'site' }) as {
      scripts: Record<string, string>;
    };

    expect(scripts).toEqual({ dev: 'next dev', 'check:links': 'tsx scripts/links/run.ts' });
  });

  it('leaves the rest of the manifest untouched', () => {
    const result = projectManifest({ manifest: foundation, name: 'site' });

    expect(result.private).toBe(true);
    expect(result.dependencies).toEqual({ next: '16.3.0' });
  });

  it('does not mutate the manifest it was given', () => {
    projectManifest({ manifest: foundation, name: 'site' });

    expect(foundation.name).toBe('next-foundation');
    expect(foundation.scripts['setup:provider']).toBeDefined();
  });
});

describe('isValidProjectName', () => {
  it.each(['site', 'site-cliente', 'a1', 'site.pt', 'my_site'])('accepts %s', (name) => {
    expect(isValidProjectName(name)).toBe(true);
  });

  it.each(['Site', 'site cliente', '-site', 'site-', '', '.site'])('refuses %s', (name) => {
    expect(isValidProjectName(name)).toBe(false);
  });

  it('refuses a name npm would refuse for length', () => {
    expect(isValidProjectName('a'.repeat(215))).toBe(false);
  });
});
