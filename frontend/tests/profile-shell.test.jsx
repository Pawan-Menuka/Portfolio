import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import ProfileProvider from '../src/components/ProfileProvider.jsx';
import Layout from '../src/components/Layout.jsx';
import { Home, NotFound } from '../src/pages/PortfolioPages.jsx';
import CV from '../src/pages/CV.jsx';
import { getProfile } from '../src/lib/api.js';

vi.mock('../src/lib/api.js', () => ({ getProfile: vi.fn(), getProjects: vi.fn(), getCertifications: vi.fn() }));
vi.mock('../src/features/iceberg/IcebergHero.jsx', () => ({ default: () => <div role="img" aria-label="Static iceberg" /> }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('scrollTo', vi.fn());
  document.head.innerHTML = '<meta name="description" content="">';
});
function show(path = '/') {
  const router = createMemoryRouter([{ element: <ProfileProvider><Layout /></ProfileProvider>, children: [
    { index: true, element: <Home /> }, { path: '/cv', element: <CV /> }, { path: '*', element: <NotFound /> },
  ] }], { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}
it('keeps the identity, navigation and all journey destinations available with empty profile data', async () => {
  getProfile.mockResolvedValue({ data: {} }); show();
  expect(await screen.findByRole('heading', { name: 'PAWAN MENUKA', level: 1 })).toBeTruthy();
  expect(document.querySelector('.credential-line').textContent).toContain('Software Engineering Undergraduate');
  expect(document.querySelector('.credential-line').textContent).toContain('FULL-STACK');
  expect(document.querySelector('.credential-line').textContent).toContain("SLIIT '27");
  expect(screen.getAllByRole('link', { name: /View projects/ })).toHaveLength(5);
  fireEvent.click(screen.getByRole('link', { name: 'CV', exact: true }));
  expect((await screen.findByRole('link', { name: 'Open CV (opens in a new tab)' })).getAttribute('href')).toBe('/Pawan-Menuka-CV.pdf');
  expect(document.title).toBe('CV · Pawan');
  expect(document.activeElement.id).toBe('main-content');
});
it('recovers the shell after a profile outage while keeping the authored hero copy', async () => {
  getProfile.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce({ data: { name: 'Supplied Name', headline: 'Supplied Role', shortBio: 'Supplied introduction.' } });
  show(); await screen.findByText('Offline');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByRole('link', { name: 'Supplied Name — Home' });
  expect(screen.getByRole('heading', { name: 'PAWAN MENUKA' })).toBeTruthy();
  expect(screen.getByText(/Above the line: full-stack products/)).toBeTruthy();
  await waitFor(() => expect(document.querySelector('meta[name="description"]').content).toContain('Supplied Role'));
});
it('restores the Home route through history and presents recovery for unknown routes', async () => {
  getProfile.mockResolvedValue({ data: {} }); const router = show();
  await screen.findByRole('heading', { name: 'PAWAN MENUKA' });
  await act(async () => { await router.navigate('/unknown'); });
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeTruthy();
  await act(async () => { await router.navigate(-1); });
  expect(screen.getByRole('heading', { name: 'PAWAN MENUKA' })).toBeTruthy();
});
