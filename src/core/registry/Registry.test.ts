import { describe, expect, it } from 'vitest';

import { Registry } from './Registry';

class TestRegistry extends Registry<string, number> {
  register(key: string, value: number): void {
    this.add(key, value);
  }
}

describe('Registry', () => {
  it('stores and retrieves values', () => {
    const registry = new TestRegistry();

    registry.register('one', 1);

    expect(registry.get('one')).toBe(1);
  });

  it('answers undefined for a key nobody registered, instead of throwing', () => {
    expect(new TestRegistry().get('missing')).toBeUndefined();
  });

  it('throws when registering a duplicate key', () => {
    const registry = new TestRegistry();

    registry.register('one', 1);

    expect(() => registry.register('one', 2)).toThrow('Registry already contains key "one".');
  });
});
