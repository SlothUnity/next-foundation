import { describe, expect, it } from 'vitest';

import { heroModule } from '@/modules';

import { block, definePage } from './definePage';

describe('definePage', () => {
  it('returns one entry per translation', () => {
    const pages = definePage({
      'pt-PT': { path: 'sobre-nos', main: [block(heroModule, { title: 'Sobre nós' })] },
      'en-GB': { path: 'about-us', main: [block(heroModule, { title: 'About us' })] },
    });

    expect(pages.map(({ path, locale }) => ({ path, locale }))).toEqual([
      { path: 'sobre-nos', locale: 'pt-PT' },
      { path: 'about-us', locale: 'en-GB' },
    ]);
  });

  it('numbers ids by alias and position', () => {
    const [page] = definePage({
      'pt-PT': {
        path: '',
        main: [block(heroModule, { title: 'Um' }), block(heroModule, { title: 'Dois' })],
      },
    });

    expect(page?.page.main.map((module) => module.id)).toEqual(['hero-1', 'hero-2']);
  });

  it('puts the locale in the meta so it is written in one place only', () => {
    const [page] = definePage({
      'en-GB': { path: '', meta: { title: 'Home' }, main: [block(heroModule, { title: 'Hi' })] },
    });

    expect(page?.page.meta).toEqual({ title: 'Home', locale: 'en-GB' });
  });

  it('takes the alias and the name from the module definition', () => {
    const [page] = definePage({
      'pt-PT': { path: '', main: [block(heroModule, { title: 'Olá' })] },
    });

    expect(page?.page.main[0]).toMatchObject({ alias: 'hero', name: 'Hero' });
  });

  it('leaves navigation and footer out when they are not given', () => {
    const [page] = definePage({
      'pt-PT': { path: '', main: [block(heroModule, { title: 'Olá' })] },
    });

    expect(page?.page.navigation).toBeUndefined();
    expect(page?.page.footer).toBeUndefined();
  });

  it('gives navigation and footer ids that cannot collide with main', () => {
    const [page] = definePage({
      'pt-PT': {
        path: '',
        navigation: block(heroModule, { title: 'Nav' }),
        main: [block(heroModule, { title: 'Olá' })],
        footer: block(heroModule, { title: 'Footer' }),
      },
    });

    expect(page?.page.navigation?.id).toBe('hero-navigation');
    expect(page?.page.footer?.id).toBe('hero-footer');
    expect(page?.page.main[0]?.id).toBe('hero-1');
  });
});
