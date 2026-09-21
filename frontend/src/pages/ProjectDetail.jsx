import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProject, getProjects } from '../lib/api.js';
import { useResource } from '../lib/use-resource.js';
import { safeWebUrl, useProfile } from '../lib/profile-context.js';
import { sectionLabel } from '../data/sections.js';
import Markdown from '../components/Markdown.jsx';
import SiteNav from '../components/SiteNav.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import DiveLamp from '../components/DiveLamp.jsx';
import WaterBackdrop from '../components/WaterBackdrop.jsx';
import PageState from '../components/PageState.jsx';
import './project-detail.css';

const loadProject = (slug, signal) => getProject(slug, { signal }).then(result => result.data);
const loadProjects = (_, signal) => getProjects('page=1&limit=100', { signal }).then(result => result.data || []);

function image(entry, fallbackAlt) {
  const url = safeWebUrl(entry?.url);
  return url ? { url, alt: entry.alt || fallbackAlt } : null;
}

function projectYear(project) {
  if (project.meta?.year) return String(project.meta.year);
  if (project.meta?.completed) return String(project.meta.completed).slice(0, 4);
  return project.publishedAt ? String(new Date(project.publishedAt).getFullYear()) : '';
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const { profile } = useProfile();
  const { data: project, error, loading, retry } = useResource(slug, loadProject);
  const { data: all } = useResource('case-study-deck', loadProjects);
  const next = useMemo(() => {
    if (!project || !all?.length) return [];
    const rows = [...all].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    const at = rows.findIndex(item => item.slug === project.slug);
    return [1, 2].map(offset => rows[((at < 0 ? 0 : at) + offset) % rows.length]).filter(item => item?.slug !== project.slug);
  }, [all, project]);
  useEffect(() => {
    if (!project) return;
    const name = profile?.name || 'Pawan Menuka';
    document.title = `${project.title} · ${name}`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', project.summary);
  }, [profile?.name, project]);

  if (loading || error || !project) return <div className="pm-page case-page">
    <WaterBackdrop lightX="62%" /><DiveLamp /><SiteNav />
    <div className="pm-shell"><PageState status={loading ? 'loading' : error ? 'error' : 'empty'} title={error?.status === 404 ? 'Project not found' : error ? 'That project did not load' : 'Project not found'} body={loading ? 'Fetching the case study…' : error?.status === 404 ? 'The project may no longer be published.' : error?.message || 'The link may be out of date.'} onRetry={error && error.status !== 404 ? retry : undefined} /><div className="case-back case-back--state"><Link to="/projects" className="pm-link-quiet">← All projects</Link></div></div>
    <SiteFooter label="Projects" />
  </div>;

  const cover = image(project.coverImage, `${project.title} cover`);
  const gallery = (project.gallery || []).map((entry, index) => image(entry, `${project.title} screen ${index + 1}`)).filter(Boolean);
  const year = projectYear(project);
  const meta = project.meta || {};
  const facts = [
    meta.role && { k: 'Role', v: meta.role },
    meta.timeline && { k: 'Timeline', v: meta.timeline },
    year && { k: 'Year', v: year },
    meta.status && { k: 'Status', v: meta.status },
    meta.network && { k: 'Network', v: meta.network },
    { k: 'Area', v: sectionLabel(project.section) },
  ].filter(Boolean);
  const github = safeWebUrl(project.links?.github);
  const live = safeWebUrl(project.links?.live);
  const demo = safeWebUrl(project.links?.demo);

  return <div className="pm-page case-page">
    <WaterBackdrop lightX="62%" /><DiveLamp /><SiteNav />
    <div className="pm-shell case-back"><Link to="/projects" className="pm-link-quiet">← All projects</Link></div>
    <header className="pm-shell case-head">
      <div className="case-head__row"><span className="case-head__section">{sectionLabel(project.section)}</span>{year && <><span className="slab__tick" /><span className="case-head__year">{year}</span></>}</div>
      <h1 className="pm-h1 case-head__title">{project.title}</h1>
      <p className="case-head__summary">{project.summary}</p>
      <div className="case-head__actions">{live && <a className="pm-btn" href={live} target="_blank" rel="noopener noreferrer" aria-label="Live site (opens in a new tab)"><span className="pm-btn__icon" aria-hidden="true">↗</span><span className="pm-btn__label">Live site</span></a>}{demo && <a className="pm-btn" href={demo} target="_blank" rel="noopener noreferrer" aria-label="View demo (opens in a new tab)"><span className="pm-btn__icon" aria-hidden="true">▶</span><span className="pm-btn__label">View demo</span></a>}{github && <a className="pm-link-quiet" href={github} target="_blank" rel="noopener noreferrer" aria-label="Source code (opens in a new tab)">Source ↗</a>}</div>
    </header>
    {cover && <div className="pm-shell case-hero"><figure className="pm-figure case-hero__figure"><img src={cover.url} alt={cover.alt} decoding="async" fetchPriority="high" /><span className="pm-figure__scrim" /><span className="pm-figure__edge" /></figure></div>}
    <div className="pm-shell case-body">
      <aside className="case-aside"><dl className="case-facts">{facts.map(fact => <div key={fact.k} className="case-facts__row"><dt>{fact.k}</dt><dd>{fact.v}</dd></div>)}</dl>{project.tags?.length > 0 && <><span className="case-aside__rule" /><div><div className="case-aside__label">Stack</div><div className="pm-chips">{project.tags.map(tag => <span key={tag} className="pm-chip">{tag}</span>)}</div></div></>}</aside>
      <div className="case-main">
        {project.description && <section><div className="pm-section-head"><h2>Overview</h2><span className="pm-section-head__rule" /></div><div className="case-prose"><Markdown>{project.description}</Markdown></div></section>}
        {gallery.length > 0 && <section><div className="pm-section-head"><h2>Screens</h2><span className="pm-section-head__rule" /></div><div className="case-gallery">{gallery.map(item => <figure key={item.url} className="case-gallery__item"><img src={item.url} alt={item.alt} loading="lazy" decoding="async" /></figure>)}</div></section>}
        {project.models3d?.length > 0 && <section><div className="pm-section-head"><h2>3D assets</h2><span className="pm-section-head__rule" /></div><p className="case-note">This project includes {project.models3d.length} downloadable 3D {project.models3d.length === 1 ? 'asset' : 'assets'}.</p></section>}
      </div>
    </div>
    {next.length > 0 && <section className="pm-shell case-next"><div className="pm-section-head"><span className="pm-section-head__label">Next in the deck</span><span className="pm-section-head__rule" /></div><div className="case-next__grid">{next.map(item => <Link key={item.slug} to={`/projects/${encodeURIComponent(item.slug)}`} className="pm-slab pm-slab--lift case-next__card"><span className="case-next__row"><span className="case-head__section">{sectionLabel(item.section)}</span><span className="case-next__year">{projectYear(item)}</span></span><span className="case-next__title">{item.title}<span>→</span></span></Link>)}</div></section>}
    <SiteFooter label="Projects" />
  </div>;
}
