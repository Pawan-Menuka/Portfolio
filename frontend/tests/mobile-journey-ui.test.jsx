import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DepthGauge, { depthCheckpoints } from '../src/features/iceberg/DepthGauge.jsx';
import JourneyContent, { activateJourneyLabel, resetJourneyLabels } from '../src/features/iceberg/JourneyContent.jsx';
import { journeyLabels } from '../src/features/iceberg/journey-labels.mjs';
import '../src/features/iceberg/mobile-journey.css';

afterEach(cleanup);

it('uses the compact six-checkpoint depth instrument for mobile tiers', () => {
  const { container } = render(<DepthGauge tier="mobile-light" currentDepth={34} activeCheckpointId="systems" />);
  const gauge = screen.getByRole('complementary', { name: /journey checkpoints and depth/i });

  expect(gauge.dataset.gaugeMode).toBe('compact');
  expect(screen.getByText('34 m', { selector: 'output' })).toBeTruthy();
  expect(within(gauge).getAllByRole('link')).toHaveLength(6);
  expect(container.querySelector('[data-checkpoint="systems"]').getAttribute('aria-current')).toBe('step');
  expect(depthCheckpoints.map(checkpoint => checkpoint.depth)).toEqual([0, 18, 34, 50, 66, 84]);
});

it('allows an explicit quality setting to keep the full gauge', () => {
  render(<DepthGauge quality={{ id: 'mobile-enhanced', depthGaugeMode: 'full' }} />);
  expect(screen.getByRole('complementary').dataset.gaugeMode).toBe('full');
});

it('keeps every heading and destination in normal flow for the static fallback', () => {
  render(<MemoryRouter><JourneyContent tier="static" /></MemoryRouter>);
  expect(screen.getAllByRole('heading')).toHaveLength(journeyLabels.length);
  expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(journeyLabels.length);
  expect(document.querySelectorAll('.journey-card[inert]')).toHaveLength(0);
});

it('exposes exactly one controlled checkpoint and supports a transition gap', () => {
  const { container } = render(<MemoryRouter><JourneyContent tier="mobile-light" activeLabelId="blockchain" /></MemoryRouter>);
  expect(screen.getAllByRole('heading')).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Blockchain' })).toBeTruthy();
  expect(container.querySelectorAll('[data-label-state="active"]')).toHaveLength(1);
  expect(container.querySelectorAll('.journey-card[inert]')).toHaveLength(journeyLabels.length - 1);

  const journey = container.querySelector('.journey-content');
  activateJourneyLabel(journey, null);
  expect(container.querySelectorAll('[data-label-state="active"]')).toHaveLength(0);
  expect(screen.queryAllByRole('heading')).toHaveLength(0);

  activateJourneyLabel(journey, 'hardware');
  expect(screen.getAllByRole('heading')).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Hardware / CNC' })).toBeTruthy();

  resetJourneyLabels(journey);
  expect(screen.getAllByRole('heading')).toHaveLength(journeyLabels.length);
  expect(container.querySelectorAll('.journey-card[inert]')).toHaveLength(0);
});
