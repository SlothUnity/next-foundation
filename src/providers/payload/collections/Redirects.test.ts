import { describe, expect, it } from 'vitest';

import type { Field, RelationshipField, TextField } from 'payload';

import { Redirects } from './Redirects';

type NamedField = Exclude<Extract<Field, { name: string }>, { type: 'ui' }>;

function fieldNamed(name: string): NamedField {
  const match = Redirects.fields.find(
    (field): field is NamedField => 'name' in field && field.name === name,
  );

  if (!match) {
    throw new Error(`Redirects has no field named "${name}"`);
  }

  return match;
}

function validate(name: string, value: unknown, siblingData: object = {}) {
  const field = fieldNamed(name) as TextField | RelationshipField;

  if (typeof field.validate !== 'function') {
    throw new Error(`The field "${name}" has no validation`);
  }

  return field.validate(value as never, { siblingData } as never);
}

const REFERENCE = { type: 'reference' };
const CUSTOM = { type: 'custom' };

describe('Redirects — the from path', () => {
  it('accepts a path on this site', () => {
    expect(validate('from', '/pagina-antiga')).toBe(true);
  });

  it('refuses a path without a leading slash, which would never match', () => {
    expect(validate('from', 'pagina-antiga')).toContain('path on this site');
  });

  it('is required, because a redirect from nowhere answers for nothing', () => {
    expect(validate('from', '')).toContain('Enter the old path');
  });
});

describe('Redirects — the target', () => {
  it('wants a page by default', () => {
    expect(validate('reference', null, REFERENCE)).toBe('Choose the page to redirect to.');
    expect(validate('reference', 7, REFERENCE)).toBe(true);
  });

  it('stops asking for a page once the target is a custom path', () => {
    // A condição do admin esconde o campo, mas esconder não é dispensar: é a
    // validação que decide pelo type, não a UI.
    expect(validate('reference', null, CUSTOM)).toBe(true);
  });

  it('wants a custom path only in custom mode', () => {
    expect(validate('custom', '', CUSTOM)).toContain('Enter the path');
    expect(validate('custom', '', REFERENCE)).toBe(true);
  });

  it('accepts a custom path in another language, prefix and all', () => {
    expect(validate('custom', '/en/about-us', CUSTOM)).toBe(true);
  });

  it('refuses a custom path outside this site', () => {
    // Um redirect para fora é decisão de projecto. O que não pode é acontecer por
    // distração num campo de texto, assinado pelo nosso domínio.
    expect(validate('custom', 'https://sitemau.com', CUSTOM)).toContain('path on this site');
    expect(validate('custom', '//sitemau.com', CUSTOM)).toContain('path on this site');
    expect(validate('custom', '/\\sitemau.com', CUSTOM)).toContain('path on this site');
  });

  it('refuses a redirect that points at itself', () => {
    expect(validate('custom', '/a', { type: 'custom', from: '/a' })).toBe(
      'A redirect cannot point at itself.',
    );
  });
});

describe('Redirects — the shape', () => {
  it('localizes the from path, because a slug is translated', () => {
    expect(fieldNamed('from').localized).toBe(true);
  });

  it('does not localize the page reference, because a document is one document', () => {
    // O que muda por idioma é o URL da página, e esse é derivado dos breadcrumbs na
    // leitura. Localizar a referência era abrir a porta a apontar o redirect
    // português para a página errada.
    expect(fieldNamed('reference').localized).toBeUndefined();
  });

  it('localizes the custom path, where the URL is written by hand', () => {
    expect(fieldNamed('custom').localized).toBe(true);
  });

  it('has no drafts, so every save is a publish', () => {
    // É o que dispensa a guarda de _status que os hooks da Pages precisam.
    expect(Redirects.versions).toBeUndefined();
  });
});
