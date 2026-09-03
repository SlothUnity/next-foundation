import { describe, expect, it, vi } from 'vitest';

import { render, screen } from '@testing-library/react';

import { createModuleComponent } from './createModuleComponent';

interface HeadingProps {
  title: string;
  subtitle?: string;
}

function Heading({ title, subtitle }: HeadingProps) {
  return (
    <>
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </>
  );
}

describe('createModuleComponent', () => {
  it('renders the component it was given', () => {
    const Adapted = createModuleComponent(Heading);

    render(<Adapted {...{ title: 'Sobre nós' }} />);

    expect(screen.getByRole('heading', { name: 'Sobre nós' })).toBeInTheDocument();
  });

  it('passes the props bag through untouched, which is the whole job', () => {
    const spy = vi.fn((props: HeadingProps) => <h2>{props.title}</h2>);

    const Adapted = createModuleComponent(spy);

    render(<Adapted {...{ title: 'Sobre nós', subtitle: 'Desde 1998' }} />);

    expect(spy.mock.calls[0]?.[0]).toEqual({ title: 'Sobre nós', subtitle: 'Desde 1998' });
  });

  it('adds no wrapper element, so a module owns its own markup', () => {
    const Adapted = createModuleComponent(Heading);

    const { container } = render(<Adapted {...{ title: 'Sobre nós' }} />);

    expect(container.firstElementChild?.tagName).toBe('H2');
  });

  it('gives the adapter a name, so a React stack is readable', () => {
    expect(createModuleComponent(Heading).name).toBe('ModuleComponentAdapter');
  });

  it('erases the props type on purpose: the registry has no type to hand it', () => {
    const Adapted = createModuleComponent(Heading);

    const asRuntime: (props: object) => unknown = Adapted;

    expect(asRuntime).toBe(Adapted);
  });
});
