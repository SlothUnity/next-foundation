import { describe, expect, it } from 'vitest';

import { ModuleRenderError } from './ModuleRenderError';
import { ModuleValidationError } from './ModuleValidationError';

describe.each([
  ['ModuleRenderError', ModuleRenderError],
  ['ModuleValidationError', ModuleValidationError],
])('%s', (name, Subclass) => {
  it('carries its own name, so a log says which failure it was', () => {
    expect(new Subclass('falhou').name).toBe(name);
  });

  it('is still an Error, for anything that checks instanceof', () => {
    expect(new Subclass('falhou')).toBeInstanceOf(Error);
  });

  it('keeps the message it was given', () => {
    expect(new Subclass('falhou').message).toBe('falhou');
  });

  it('preserves the cause, which is where the original detail lives', () => {
    const cause = new Error('zod: expected string, received number');

    expect(new Subclass('falhou', { cause }).cause).toBe(cause);
  });
});
