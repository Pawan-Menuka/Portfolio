import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ProfileContext } from '../src/lib/profile-context.js';
import Contact from '../src/pages/Contact.jsx';
import Projects from '../src/pages/Projects.jsx';
import ProjectDetail from '../src/pages/ProjectDetail.jsx';
import About from '../src/pages/About.jsx';
import CV from '../src/pages/CV.jsx';
import Markdown from '../src/components/Markdown.jsx';
import { getProjects, getProject, getSkills, getCertifications, sendMessage } from '../src/lib/api.js';

vi.mock('../src/lib/api.js', () => ({ getProjects: vi.fn(), getProject: vi.fn(), getSkills: vi.fn(), getCertifications: vi.fn(), sendMessage: vi.fn() }));
const profile = { name: 'Pawan', headline: 'Software Engineer', shortBio: '', bio: '', socials: {}, resume: null };
function Position() { const location = useLocation(); return <output aria-label="Current route">{location.pathname}{location.search}</output>; }
function show(ui, path = '/', state = {}) {
  return render(<ProfileContext.Provider value={{ profile, status: 'ready', retry: vi.fn(), ...state }}><MemoryRouter initialEntries={[path]}>{ui}<Position /></MemoryRouter></ProfileContext.Provider>);
}
const project = (title = 'A real project', slug = 'a-real-project') => ({ title, slug, _id: slug, section: 'hardware', summary: 'Made from supplied data', tags: [] });
const list = (items = [project()], total = items.length, page = 1) => ({ success: true, data: items, meta: { page, limit: 12, total, pages: Math.ceil(total / 12) } });
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
async function fillMessage(user) {
  await user.type(screen.getByLabelText('Name', { exact: true }), 'Test Person');
  await user.type(screen.getByLabelText('Email', { exact: true }), 'test@example.com');
  await user.type(screen.getByLabelText('Message', { exact: true }), 'This is a local mocked test message.');
}
beforeEach(() => {
  vi.resetAllMocks();
  getSkills.mockResolvedValue({ data: [] });
  getCertifications.mockResolvedValue({ data: [] });
});

describe('Contact (all submissions mocked; no network writes)', () => {
  it('validates fields and focuses the first invalid field without sending', async () => {
    const user = userEvent.setup(); show(<Contact />);
    await user.click(screen.getByRole('button', { name: /Send message/ }));
    expect(sendMessage).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Name', { exact: true }).getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(screen.getByLabelText('Name', { exact: true }));
    expect(screen.getByText('Write a message between 10 and 3,000 characters.')).toBeTruthy();
  });
  it('locks pending submissions, sends the expected body, and confirms only after acceptance', async () => {
    const request = deferred(); sendMessage.mockReturnValue(request.promise);
    const user = userEvent.setup(); show(<Contact />); await fillMessage(user);
    await user.dblClick(screen.getByRole('button', { name: /Send message/ }));
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Message received/)).toBeNull();
    expect(screen.getByRole('button', { name: /Sending/ }).closest('fieldset').disabled).toBe(true);
    expect(sendMessage.mock.calls[0][0]).toEqual({ name: 'Test Person', email: 'test@example.com', body: 'This is a local mocked test message.', website: '' });
    request.resolve({ success: true });
    await screen.findByRole('heading', { name: 'Message received.' });
    expect(screen.getByText(/Thank you for getting in touch/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Send another' }));
    expect(screen.getByLabelText('Message', { exact: true }).value).toBe('');
  });
  it.each([400, 429, 500])('preserves form input after a %s response', async (status) => {
    sendMessage.mockRejectedValue(Object.assign(new Error('Please check the message.'), { status }));
    const user = userEvent.setup(); show(<Contact />); await fillMessage(user);
    await user.click(screen.getByRole('button', { name: /Send message/ }));
    expect((await screen.findByRole('alert')).textContent).toMatch(status === 429 ? /Too many messages/ : status === 400 ? /Please check/ : /couldn’t confirm/);
    expect(screen.getByLabelText('Message', { exact: true }).value).toContain('local mocked test');
  });
  it('aborts on unmount', async () => {
    sendMessage.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup(); const view = show(<Contact />); await fillMessage(user);
    await user.click(screen.getByRole('button', { name: /Send message/ }));
    const signal = sendMessage.mock.calls[0][1].signal;
    view.unmount(); expect(signal.aborted).toBe(true);
  });
  it('times out without claiming a failed delivery or erasing the message', async () => {
    vi.useFakeTimers();
    try {
      sendMessage.mockImplementation((body, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason))));
      show(<Contact />);
      for (const [label, value] of [['Name', 'Test'], ['Email', 'test@example.com'], ['Message', 'A long enough test message.']]) fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
      fireEvent.submit(screen.getByRole('form', { name: 'Contact form' }));
      await act(async () => { await vi.advanceTimersByTimeAsync(15001); });
      expect(screen.getByRole('alert').textContent).toMatch(/couldn’t confirm whether/);
      expect(screen.getByLabelText('Message', { exact: true }).value).toContain('test message');
    } finally { vi.useRealTimers(); }
  });
});

describe('Projects', () => {
  it('loads the complete deck once and preserves section filters in the URL', async () => {
    getProjects.mockResolvedValue(list([project('Hardware project'), { ...project('Systems project', 'systems-project'), section: 'systems' }]));
    const user = userEvent.setup(); show(<Projects />, '/projects?section=hardware');
    await screen.findByRole('heading', { name: 'Hardware project' });
    expect(getProjects.mock.calls[0][0]).toBe('page=1&limit=100');
    await user.click(screen.getByRole('button', { name: 'Distributed Systems' }));
    await screen.findByRole('heading', { name: 'Systems project' });
    expect(screen.getByLabelText('Current route').textContent).toBe('/projects?section=systems');
  });
  it('shows an empty collection without fabricated cards', async () => {
    getProjects.mockResolvedValue(list([])); show(<Projects />);
    await screen.findByText('No published projects here yet'); expect(screen.queryAllByRole('article')).toHaveLength(0);
  });
  it('rejects invalid URL filters without sending them to the API', async () => {
    getProjects.mockResolvedValue(list());
    show(<Projects />, '/projects?section=unknown');
    expect(screen.getByText('This project filter isn’t available')).toBeTruthy();
    await waitFor(() => expect(getProjects).toHaveBeenCalledWith('page=1&limit=100', expect.anything()));
  });
  it('allows retry after an API failure', async () => {
    getProjects.mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce(list());
    const user = userEvent.setup(); show(<Projects />, '/projects');
    await screen.findByText('Unavailable'); await user.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByRole('heading', { name: 'A real project' });
  });
  it('switches filtered decks without another API request', async () => {
    getProjects.mockResolvedValue(list([project('Hardware result'), { ...project('Systems result', 'systems-result'), section: 'systems' }]));
    const user = userEvent.setup(); show(<Projects />);
    await screen.findByRole('heading', { name: 'Hardware result' });
    await user.click(screen.getByRole('button', { name: 'Distributed Systems' }));
    await screen.findByRole('heading', { name: 'Systems result' });
    expect(getProjects).toHaveBeenCalledTimes(1);
  });
  it('starts the complete deck with Full-stack projects followed by Blockchain', async () => {
    getProjects.mockResolvedValue(list([
      project('Hardware first by seed order'),
      { ...project('Blockchain project', 'blockchain-project'), section: 'blockchain', order: 3 },
      { ...project('Full-stack project', 'full-stack-project'), section: 'full-stack', order: 5 },
    ]));
    const view = show(<Projects />, '/projects');
    await screen.findByRole('heading', { name: 'Full-stack project' });
    expect(view.container.querySelector('.slab.is-centre .slab__title').textContent).toBe('Full-stack project');
    const blockchain = [...view.container.querySelectorAll('.slab')].find(card => card.querySelector('.slab__title')?.textContent === 'Blockchain project');
    expect(blockchain.style.getPropertyValue('--o')).toBe('1');
  });
  it('keeps Music visible and gives an empty Music layer a useful state', async () => {
    getProjects.mockResolvedValue(list([project('Hardware result')]));
    const user = userEvent.setup(); show(<Projects />, '/projects');
    const musicTab = await screen.findByRole('button', { name: 'Music' });
    await user.click(musicTab);
    expect(screen.getByText('No published Music projects yet')).toBeTruthy();
    expect(screen.getByLabelText('Current route').textContent).toBe('/projects?section=creative');
  });
  it('keeps the first and last cards adjacent while wrapping the deck', async () => {
    const items = Array.from({ length: 6 }, (_, index) => project(`Project ${index + 1}`, `project-${index + 1}`));
    getProjects.mockResolvedValue(list(items));
    const user = userEvent.setup(); const view = show(<Projects />, '/projects');
    await screen.findByRole('heading', { name: 'Project 1' });
    await user.click(screen.getByRole('button', { name: 'Previous project' }));
    expect(view.container.querySelector('.slab.is-centre .slab__title').textContent).toBe('Project 6');
    const first = [...view.container.querySelectorAll('.slab')].find(card => card.querySelector('.slab__title')?.textContent === 'Project 1');
    expect(first.style.getPropertyValue('--o')).toBe('1');
  });
  it('handles a missing project detail', async () => {
    getProject.mockRejectedValue(Object.assign(new Error('Project not found'), { status: 404 }));
    show(<Routes><Route path="/projects/:slug" element={<ProjectDetail />} /></Routes>, '/projects/missing');
    await screen.findByRole('heading', { name: 'Project not found' });
  });
});

describe('Profile and Markdown', () => {
  it('keeps seeded API-edit instructions out of the public About page', () => {
    show(<About />, '/about', { profile: { ...profile, shortBio: 'Placeholder bio — edit via PATCH /api/v1/profile.' } });
    expect(screen.queryByText(/PATCH/)).toBeNull();
    expect(screen.getByText('A fuller introduction will be added soon.')).toBeTruthy();
  });
  it('renders Markdown without executable HTML or unsafe links', () => {
    const view = render(<Markdown>{'# Background\n\n**Builder**\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert%281%29)\n\n<img src=x onerror=alert(1) />'}</Markdown>);
    expect(screen.getByRole('heading', { name: 'Background' }).tagName).toBe('H2');
    expect(view.container.querySelector('strong').textContent).toBe('Builder');
    expect(view.container.querySelector('script, img, [onerror]')).toBeNull();
    expect(view.container.querySelector('a[href^="javascript:"]')).toBeNull();
  });
  it('renders a full bio and tolerates empty optional profile fields', () => {
    show(<About />, '/about', { profile: { ...profile, bio: '## My background\n\nBuilding **systems**.' } });
    expect(screen.getByRole('heading', { name: 'My background' })).toBeTruthy();
    expect(screen.getByText('systems')).toBeTruthy();
  });
  it('offers only a real safe CV URL', () => {
    show(<CV />, '/cv', { profile: { ...profile, resume: { url: 'https://example.com/cv.pdf', fileName: 'CV.pdf' } } });
    expect(screen.getByRole('link', { name: /Open CV/ }).getAttribute('href')).toBe('https://example.com/cv.pdf');
  });
  it('distinguishes profile failure from an absent CV', () => {
    show(<CV />, '/cv', { status: 'error', error: 'Network unavailable', profile: null });
    expect(screen.getByRole('alert').textContent).toContain('Network unavailable');
    expect(screen.queryByText('CV not available yet')).toBeNull();
  });
  it('falls back to the approved local CV for an empty or unsafe remote resume', () => {
    show(<CV />, '/cv', { profile: { ...profile, resume: { url: 'javascript:alert(1)' } } });
    expect(screen.getByRole('link', { name: /Open CV/ }).getAttribute('href')).toBe('/Pawan-Menuka-CV.pdf');
  });
});
