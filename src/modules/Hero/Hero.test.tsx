import { describe, expect, it } from 'vitest';

import { render, screen } from '@testing-library/react';

import { Hero } from './Hero';
import { heroSchema } from './Hero.schema';

const IMAGE = {
  url: 'https://cdn.exemplo.pt/hero.jpg',
  alt: 'Uma vista da fábrica',
  width: 1600,
  height: 900,
};

describe('Hero', () => {
  it('renders the title as the page heading', () => {
    render(<Hero title="Sobre nós" />);

    expect(screen.getByRole('heading', { name: 'Sobre nós' })).toBeInTheDocument();
  });

  it('leaves out the subtitle rather than rendering an empty paragraph', () => {
    const { container } = render(<Hero title="Sobre nós" />);

    expect(container.querySelector('p')).toBeNull();
  });

  it('renders the subtitle when there is one', () => {
    render(<Hero title="Sobre nós" subtitle="Desde 1998" />);

    expect(screen.getByText('Desde 1998')).toBeInTheDocument();
  });

  it('renders the image with its alt text, which the CMS makes mandatory', () => {
    render(<Hero title="Sobre nós" image={IMAGE} />);

    expect(screen.getByRole('img', { name: 'Uma vista da fábrica' })).toBeInTheDocument();
  });

  it('skips the image when the dimensions are missing, because next/image needs both', () => {
    render(<Hero title="Sobre nós" image={{ url: IMAGE.url, alt: IMAGE.alt }} />);

    expect(screen.queryByRole('img')).toBeNull();
  });

  it('scopes its class names, so two modules cannot collide', () => {
    const { container } = render(<Hero title="Sobre nós" />);

    const section = container.querySelector('section');

    expect(section?.className).toBeTruthy();
    expect(section?.className).not.toBe('hero');
  });
});

describe('heroSchema', () => {
  it('requires a title, because a hero without one has nothing to say', () => {
    expect(heroSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a title alone', () => {
    expect(heroSchema.safeParse({ title: 'Sobre nós' }).success).toBe(true);
  });

  it('refuses an image without alt text, matching what the CMS requires', () => {
    const result = heroSchema.safeParse({
      title: 'Sobre nós',
      image: { url: IMAGE.url, width: 10, height: 10 },
    });

    expect(result.success).toBe(false);
  });

  it('produces props with no unknown keys, so nothing extra crosses the RSC boundary', () => {
    const result = heroSchema.parse({ title: 'Sobre nós', inesperado: true });

    expect(Object.keys(result)).toEqual(['title']);
  });
});
