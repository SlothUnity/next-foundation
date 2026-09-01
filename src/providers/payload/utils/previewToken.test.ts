import { afterEach, describe, expect, it, vi } from 'vitest';

import { createPreviewToken, verifyPreviewToken } from './previewToken';

const SECRET = 'chave-de-assinatura';
const PATH = '/sobre-nos';

afterEach(() => {
  vi.useRealTimers();
});

describe('createPreviewToken', () => {
  it('does not contain the secret', () => {
    // É o ponto todo: o que viaja no URL não é o PREVIEW_SECRET.
    expect(createPreviewToken(PATH, SECRET)).not.toContain(SECRET);
  });

  it('produces a different token for a different secret', () => {
    vi.useFakeTimers();

    expect(createPreviewToken(PATH, SECRET)).not.toBe(createPreviewToken(PATH, 'outra'));
  });

  it('produces a different token for a different path', () => {
    vi.useFakeTimers();

    expect(createPreviewToken(PATH, SECRET)).not.toBe(createPreviewToken('/outra', SECRET));
  });
});

describe('verifyPreviewToken', () => {
  it('accepts a token it just made', () => {
    expect(verifyPreviewToken(createPreviewToken(PATH, SECRET), PATH, SECRET)).toBe('valid');
  });

  it('rejects a token made for another path', () => {
    // Um token que escape para os logs pré-visualiza aquela página e mais nenhuma.
    const token = createPreviewToken('/privado', SECRET);

    expect(verifyPreviewToken(token, PATH, SECRET)).toBe('invalid');
  });

  it('rejects a token signed with another secret', () => {
    const token = createPreviewToken(PATH, 'chave-antiga');

    expect(verifyPreviewToken(token, PATH, SECRET)).toBe('invalid');
  });

  it('rejects a tampered expiry, because it is part of what is signed', () => {
    const [, signature] = createPreviewToken(PATH, SECRET).split('.');

    const forged = `${Math.floor(Date.now() / 1000) + 999999}.${signature}`;

    expect(verifyPreviewToken(forged, PATH, SECRET)).toBe('invalid');
  });

  it('reports an old token as expired, not as invalid', () => {
    vi.useFakeTimers();

    const token = createPreviewToken(PATH, SECRET);

    vi.advanceTimersByTime(61 * 60 * 1000);

    // A distinção existe para a rota poder dizer «recarrega o admin» em vez de
    // acusar quem está do outro lado de forjar um link.
    expect(verifyPreviewToken(token, PATH, SECRET)).toBe('expired');
  });

  it('still accepts a token within the hour', () => {
    vi.useFakeTimers();

    const token = createPreviewToken(PATH, SECRET);

    vi.advanceTimersByTime(59 * 60 * 1000);

    expect(verifyPreviewToken(token, PATH, SECRET)).toBe('valid');
  });

  it.each([null, '', 'lixo', '.', '123.', `${Date.now()}.`])(
    'rejects %o without throwing',
    (token) => {
      expect(verifyPreviewToken(token, PATH, SECRET)).toBe('invalid');
    },
  );
});
