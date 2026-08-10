import { describe, expect, it } from 'vitest';

import { ModuleRegistry } from './ModuleRegistry';

describe('ModuleRegistry', () => {
  it('registers and retrieves a module by alias', () => {
    const registry = new ModuleRegistry();

    const mod = {
      alias: 'hero',
      name: 'Hero',
      component: () => null,
    };

    registry.register(mod);

    expect(registry.getByAlias('hero')).toBe(mod);
  });

  it('returns undefined for an unknown alias', () => {
    const registry = new ModuleRegistry();

    expect(registry.getByAlias('unknown')).toBeUndefined();
  });

  it('throws when registering a duplicate alias', () => {
    const registry = new ModuleRegistry();

    const mod = {
      alias: 'hero',
      name: 'Hero',
      component: () => null,
    };

    registry.register(mod);

    expect(() => registry.register(mod)).toThrow('Registry already contains key "hero".');
  });
});
