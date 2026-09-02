import { describe, expect, it } from 'vitest';

import { hasRole } from './hasRole';

describe('hasRole', () => {
  it('recognises a role the user has', () => {
    expect(hasRole({ roles: ['admin'] }, 'admin')).toBe(true);
    expect(hasRole({ roles: ['editor', 'admin'] }, 'editor')).toBe(true);
  });

  it('refuses a role the user does not have', () => {
    expect(hasRole({ roles: ['editor'] }, 'admin')).toBe(false);
  });

  it('refuses a request with no user, which is how anonymous arrives', () => {
    expect(hasRole(null, 'admin')).toBe(false);
    expect(hasRole(undefined, 'admin')).toBe(false);
  });

  it('refuses a user whose roles are missing or not a list', () => {
    expect(hasRole({}, 'admin')).toBe(false);
    expect(hasRole({ roles: null }, 'admin')).toBe(false);
    expect(hasRole({ roles: 'admin' }, 'admin')).toBe(false);
  });
});
