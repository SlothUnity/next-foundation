import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MAIN_LANDMARK_ID } from '@/core/renderer';

import { SkipToContent } from './SkipToContent';

describe('SkipToContent', () => {
  it('points at the landmark the renderer emits, which is the whole point', () => {
    render(<SkipToContent />);

    expect(screen.getByRole('link')).toHaveAttribute('href', `#${MAIN_LANDMARK_ID}`);
  });

  it('takes a label, so a project can translate it without editing the component', () => {
    render(<SkipToContent label="Skip to content" />);

    expect(screen.getByRole('link', { name: 'Skip to content' })).toBeInTheDocument();
  });
});
