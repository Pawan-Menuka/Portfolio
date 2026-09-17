import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { journeyLabels, labelOpacity } from '../src/features/iceberg/journey-labels.mjs';
import { progressForSection } from '../src/features/iceberg/camera-path.mjs';
import JourneyContent from '../src/features/iceberg/JourneyContent.jsx';

it('fades before and after each checkpoint without overlapping labels or the intro', () => {
  for (const label of journeyLabels) {
    expect(label.t).toBe(progressForSection(label.id));
    expect(labelOpacity(label.t, label.t)).toBe(1);
    expect(labelOpacity(label.t - .04, label.t)).toBeGreaterThan(0);
    expect(labelOpacity(label.t + .04, label.t)).toBeGreaterThan(0);
    expect(labelOpacity(label.t - .06, label.t)).toBe(0);
    expect(labelOpacity(label.t + .06, label.t)).toBe(0);
  }
  for (let i = 0; i <= 1000; i++) {
    const visible = journeyLabels.filter(label => labelOpacity(i / 1000, label.t) > 0);
    expect(visible.length).toBeLessThanOrEqual(1);
    if (i <= 70) expect(visible).toHaveLength(0);
  }
});

it('provides real headings, anchors, and destinations without a canvas or font', () => {
  render(<MemoryRouter><JourneyContent /></MemoryRouter>);
  for (const label of journeyLabels) {
    const heading = screen.getByRole('heading', { name: label.title });
    const section = heading.closest('section');
    expect(section.id).toBe(`journey-${label.id}`);
    expect(section.hasAttribute('inert')).toBe(false);
    expect(section.querySelector('a').getAttribute('href')).toBe(label.href);
  }
});
