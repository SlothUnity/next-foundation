import { describe, expect, it, vi } from 'vitest';

import { uniqueFlagField } from './uniqueFlagField';

const field = uniqueFlagField({
  name: 'is404',
  label: 'Not Found Page',
  description: 'Serve this page when no other page matches the URL.',
  taken: 'A not found page already exists.',
  collection: 'pages',
});

function createReq(docs: unknown[] = []) {
  const find = vi.fn().mockResolvedValue({ docs });

  return { req: { payload: { find } }, find };
}

function validate(req: ReturnType<typeof createReq>['req'], value: boolean, id?: number) {
  if (typeof field.validate !== 'function') {
    throw new Error('uniqueFlagField produced a field without validation');
  }

  return field.validate(value, { id, req } as never);
}

describe('uniqueFlagField', () => {
  it('accepts the flag when no other document has it', async () => {
    const { req } = createReq();

    await expect(validate(req, true)).resolves.toBe(true);
  });

  it('refuses the flag when another document already has it', async () => {
    const { req } = createReq([{ id: 7 }]);

    await expect(validate(req, true)).resolves.toBe('A not found page already exists.');
  });

  it('lets the document keep its own flag when it is saved again', async () => {
    const { req, find } = createReq();

    await validate(req, true, 7);

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { and: expect.arrayContaining([{ id: { not_equals: 7 } }]) },
      }),
    );
  });

  it('has no id to exclude while the document is being created', async () => {
    const { req, find } = createReq();

    await validate(req, true);

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { and: [{ is404: { equals: true } }] } }),
    );
  });

  it('never asks the database to turn the flag off', async () => {
    const { req, find } = createReq([{ id: 7 }]);

    await expect(validate(req, false)).resolves.toBe(true);
    expect(find).not.toHaveBeenCalled();
  });

  it('queries the collection it was told about, by its own name', async () => {
    const { req, find } = createReq();

    await validate(req, true);

    expect(find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'pages', limit: 1 }));
  });
});
