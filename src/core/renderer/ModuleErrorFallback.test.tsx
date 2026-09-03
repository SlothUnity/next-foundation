import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen } from '@testing-library/react';

import { ModuleErrorFallback } from './ModuleErrorFallback';

describe('ModuleErrorFallback, in development', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('names the module that failed, which is the only thing worth showing', () => {
    render(<ModuleErrorFallback alias="hero" />);

    expect(screen.getByText(/hero/)).toBeInTheDocument();
  });

  it('renders something, so a hole in the page is visible while building it', () => {
    const { container } = render(<ModuleErrorFallback alias="hero" />);

    expect(container).not.toBeEmptyDOMElement();
  });
});

describe('ModuleErrorFallback, in production', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders nothing at all, so a visitor sees no hole and no internal name', () => {
    const { container } = render(<ModuleErrorFallback alias="hero" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('never leaks the alias, which is a name from the codebase', () => {
    const { container } = render(<ModuleErrorFallback alias="hero" />);

    expect(container.innerHTML).not.toContain('hero');
  });
});
