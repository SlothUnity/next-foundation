import { describe, expect, it } from 'vitest';

import type { Access, Field, FieldAccess, SelectField } from 'payload';

import { Media } from '@/providers/payload/collections/Media';
import { Pages } from '@/providers/payload/collections/Pages';
import { Redirects } from '@/providers/payload/collections/Redirects';
import { Users } from '@/providers/payload/collections/Users';
import { Site } from '@/providers/payload/globals/Site';

const ADMIN = { user: { id: 1, roles: ['admin'] } };
const EDITOR = { user: { id: 2, roles: ['editor'] } };
const ANONYMOUS = { user: null };

type Actor = typeof ADMIN | typeof EDITOR | typeof ANONYMOUS;

async function can(rule: Access | FieldAccess | undefined, actor: Actor) {
  if (typeof rule !== 'function') {
    throw new Error('The rule is not a function, so the Payload default is in force.');
  }

  return (rule as Access)({ req: actor } as never);
}

function rolesField(): SelectField {
  const match = Users.fields.find(
    (field: Field): field is SelectField => 'name' in field && field.name === 'roles',
  );

  if (!match) {
    throw new Error('Users has no roles field');
  }

  return match;
}

describe('Users — the collection that can grant everything else', () => {
  it('lets an administrator read every account', async () => {
    await expect(can(Users.access?.read, ADMIN)).resolves.toBe(true);
  });

  it('narrows an editor to their own account instead of refusing outright', async () => {
    await expect(can(Users.access?.read, EDITOR)).resolves.toEqual({ id: { equals: 2 } });
    await expect(can(Users.access?.update, EDITOR)).resolves.toEqual({ id: { equals: 2 } });
  });

  it('refuses anonymous', async () => {
    await expect(can(Users.access?.read, ANONYMOUS)).resolves.toBe(false);
    await expect(can(Users.access?.update, ANONYMOUS)).resolves.toBe(false);
  });

  it('lets only an administrator create, delete and unlock accounts', async () => {
    for (const rule of [Users.access?.create, Users.access?.delete, Users.access?.unlock]) {
      await expect(can(rule, ADMIN)).resolves.toBe(true);
      await expect(can(rule, EDITOR)).resolves.toBe(false);
      await expect(can(rule, ANONYMOUS)).resolves.toBe(false);
    }
  });

  it('does not let an editor grant themselves a role', async () => {
    const { access } = rolesField();

    await expect(can(access?.update, EDITOR)).resolves.toBe(false);
    await expect(can(access?.create, EDITOR)).resolves.toBe(false);

    await expect(can(access?.update, ADMIN)).resolves.toBe(true);
  });
});

describe('Content — what an editor is for', () => {
  it.each([
    ['Pages', Pages],
    ['Redirects', Redirects],
  ])('lets an editor manage %s and refuses anonymous', async (_name, collection) => {
    for (const rule of [
      collection.access?.read,
      collection.access?.create,
      collection.access?.update,
      collection.access?.delete,
    ]) {
      await expect(can(rule, EDITOR)).resolves.toBe(true);
      await expect(can(rule, ADMIN)).resolves.toBe(true);
      await expect(can(rule, ANONYMOUS)).resolves.toBe(false);
    }
  });

  it('serves Media to anyone, and lets only an editor change it', async () => {
    await expect(can(Media.access?.read, ANONYMOUS)).resolves.toBe(true);

    for (const rule of [Media.access?.create, Media.access?.update, Media.access?.delete]) {
      await expect(can(rule, EDITOR)).resolves.toBe(true);
      await expect(can(rule, ANONYMOUS)).resolves.toBe(false);
    }
  });
});

describe('Site — settings that change every URL on the site', () => {
  it('is readable by an editor, because filterAvailableLocales asks for it', async () => {
    await expect(can(Site.access?.read, EDITOR)).resolves.toBe(true);
    await expect(can(Site.access?.read, ANONYMOUS)).resolves.toBe(false);
  });

  it('is writable only by an administrator', async () => {
    await expect(can(Site.access?.update, ADMIN)).resolves.toBe(true);
    await expect(can(Site.access?.update, EDITOR)).resolves.toBe(false);
  });
});
