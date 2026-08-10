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

  it('throws when registering a duplicate key', () => {
    const registry = new TestRegistry();

    registry.register('one', 1);

    expect(() => registry.register('one', 2)).toThrow('Registry already contains key "one".');
  });

  it('checks whether a key exists', () => {
    const registry = new TestRegistry();

    registry.register('one', 1);

    expect(registry.has('one')).toBe(true);
    expect(registry.has('two')).toBe(false);
  });

  it('removes a value', () => {
    const registry = new TestRegistry();

    registry.register('one', 1);
    registry.remove('one');

    expect(registry.has('one')).toBe(false);
  });

  it('throws when removing an unknown key', () => {
    const registry = new TestRegistry();

    expect(() => registry.remove('one')).toThrow('Key "one" is not defined in the registry.');
  });

  it('clears all values', () => {
    const registry = new TestRegistry();

    registry.register('one', 1);
    registry.register('two', 2);

    registry.clear();

    expect(registry.getAll()).toEqual([]);
  });
});
