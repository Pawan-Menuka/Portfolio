import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import axe from 'axe-core';
import Layout from '../src/components/Layout.jsx';
import { ProfileContext } from '../src/lib/profile-context.js';
import { Home, NotFound } from '../src/pages/PortfolioPages.jsx';
import Projects from '../src/pages/Projects.jsx';
import ProjectDetail from '../src/pages/ProjectDetail.jsx';
import About from '../src/pages/About.jsx';
import CV from '../src/pages/CV.jsx';
import Contact from '../src/pages/Contact.jsx';
import { getCertifications, getProject, getProjects, getSkills } from '../src/lib/api.js';

vi.mock('../src/lib/api.js', () => ({
  getCertifications: vi.fn(),
  getProject: vi.fn(),
  getProjects: vi.fn(),
  getSkills: vi.fn(),
  sendMessage: vi.fn(),
}));
vi.mock('../src/features/iceberg/IcebergHero.jsx', () => ({
  default: () => <div role="img" aria-label="Static iceberg preview" />,
}));

const profile = {
  name: 'Pawan Menuka',
  headline: 'Software Engineer',
  shortBio: 'Software engineering undergraduate focused on full-stack systems.',
  bio: '## Background\n\nI build reliable software.',
  location: 'Sri Lanka',
  socials: {
    email: 'pawanmenuka02@gmail.com',
    github: 'https://github.com/Pawan-Menuka',
    linkedin: 'https://www.linkedin.com/in/pawan-menuka',
  },
  availability: { available: true, text: 'Available for work' },
};
const project = {
  _id: 'project-1',
  title: 'Accessible portfolio project',
  slug: 'accessible-portfolio-project',
  section: 'full-stack',
  summary: 'A representative public project used by the accessibility audit.',
  description: '## Overview\n\nA complete project description.',
  tags: ['React', 'Node.js'],
  order: 1,
  links: { github: 'https://github.com/Pawan-Menuka/Portfolio' },
  coverImage: { url: 'https://images.example.com/project.webp', alt: 'Portfolio project interface' },
  gallery: [],
  models3d: [],
  meta: { year: 2026, role: 'Full-stack developer', status: 'Complete' },
};
const list = { success: true, data: [project], meta: { page: 1, limit: 100, total: 1, pages: 1 } };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('scrollTo', vi.fn());
  getProjects.mockResolvedValue(list);
  getProject.mockResolvedValue({ success: true, data: project });
  getSkills.mockResolvedValue({ success: true, data: [] });
  getCertifications.mockResolvedValue({ success: true, data: [] });
});

function show(path, element) {
  const routePath = path.startsWith('/projects/') ? '/projects/:slug' : path;
  const router = createMemoryRouter([{
    element: <ProfileContext.Provider value={{ profile, status: 'ready', error: null, retry: vi.fn() }}><Layout /></ProfileContext.Provider>,
    children: [{ path: routePath, element }, { path: '*', element: <NotFound /> }],
  }], { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

async function expectNoAutomatedViolations(container) {
  const results = await axe.run(container, {
    rules: {
      // jsdom has no layout engine, so contrast is measured separately in a real browser.
      'color-contrast': { enabled: false },
    },
  });
  expect(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
}

describe('automated accessibility smoke audit', () => {
  it('passes the authored home journey', async () => {
    const view = show('/', <Home />);
    await screen.findByRole('heading', { name: 'PAWAN MENUKA' });
    await expectNoAutomatedViolations(view.container);
  });

  it.each([
    ['/projects', <Projects key="projects" />, 'Slabs of ice'],
    ['/projects/accessible-portfolio-project', <ProjectDetail key="project-detail" />, 'Accessible portfolio project'],
    ['/about', <About key="about" />, 'Software Engineer'],
    ['/cv', <CV key="cv" />, 'Pawan Menuka'],
    ['/contact', <Contact key="contact" />, 'Let’s talk'],
  ])('passes %s', async (path, element, heading) => {
    const view = show(path, element);
    await screen.findByRole('heading', { name: heading, level: 1 });
    await expectNoAutomatedViolations(view.container);
  });
});
