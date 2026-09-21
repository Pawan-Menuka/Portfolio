import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProjects } from '../lib/api.js';
import { useResource } from '../lib/use-resource.js';
import { safeWebUrl } from '../lib/profile-context.js';
import { SECTIONS, sectionLabel } from '../data/sections.js';
import SiteNav from '../components/SiteNav.jsx';
import DiveLamp from '../components/DiveLamp.jsx';
import WaterBackdrop from '../components/WaterBackdrop.jsx';
import PageState from '../components/PageState.jsx';
import './projects.css';

const STEP_LOCK = 420;
const SECTION_RANK = new Map(SECTIONS.map((section, index) => [section.key, index]));
const loadProjects = (_, signal) => getProjects('page=1&limit=100', { signal }).then(result => {
  if (!Array.isArray(result?.data)) throw new Error('The project collection returned an unexpected response.');
  return result.data;
});

function coverOf(project) {
  const url = safeWebUrl(project.coverImage?.url);
  return url ? { url, alt: project.coverImage?.alt || `${project.title} cover` } : null;
}

function yearOf(project) {
  if (project.meta?.year) return String(project.meta.year);
  if (project.meta?.completed) return String(project.meta.completed).slice(0, 4);
  return project.publishedAt ? String(new Date(project.publishedAt).getFullYear()) : '';
}

function circularOffset(projectIndex, activeIndex, length) {
  if (length <= 1) return 0;
  let offset = projectIndex - activeIndex;
  const halfway = length / 2;
  if (offset > halfway) offset -= length;
  if (offset < -halfway) offset += length;
  return offset;
}

export default function Projects() {
  const { data, error, loading, retry } = useResource('project-deck', loadProjects);
  const [params, setParams] = useSearchParams();
  const requestedSection = params.get('section') || 'all';
  const sectionIsValid = requestedSection === 'all' || SECTIONS.some(section => section.key === requestedSection);
  const projects = useMemo(() => [...(data || [])].sort((a, b) => {
    const sectionDifference = (SECTION_RANK.get(a.section) ?? 999) - (SECTION_RANK.get(b.section) ?? 999);
    return sectionDifference || (a.order ?? 999) - (b.order ?? 999);
  }), [data]);
  const tab = sectionIsValid ? requestedSection : 'all';
  const list = useMemo(() => tab === 'all' ? projects : projects.filter(project => project.section === tab), [projects, tab]);
  const [index, setIndex] = useState(0);
  const i = Math.min(index, Math.max(0, list.length - 1));
  const active = list[i];
  const accumulatedWheel = useRef(0);
  const wheelLock = useRef(0);
  const dragX = useRef(null);
  const step = useCallback(delta => setIndex(previous => list.length ? (previous + delta + list.length) % list.length : 0), [list.length]);

  const chooseSection = value => {
    setParams(value === 'all' ? {} : { section: value }, { preventScrollReset: true });
    setIndex(0);
  };

  useEffect(() => {
    const onKey = event => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) return;
      if (['ArrowRight', 'ArrowDown'].includes(event.key)) { event.preventDefault(); step(1); }
      if (['ArrowLeft', 'ArrowUp'].includes(event.key)) { event.preventDefault(); step(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  const onWheel = event => {
    const now = Date.now();
    if (now < wheelLock.current) return;
    accumulatedWheel.current += Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(accumulatedWheel.current) < 34) return;
    const direction = accumulatedWheel.current > 0 ? 1 : -1;
    accumulatedWheel.current = 0;
    wheelLock.current = now + STEP_LOCK;
    step(direction);
  };

  const endDrag = event => {
    if (dragX.current == null) return;
    const distance = event.clientX - dragX.current;
    dragX.current = null;
    if (Math.abs(distance) > 46) step(distance < 0 ? 1 : -1);
  };

  return <div className="pm-page projects-page">
    <WaterBackdrop lightX="50%" motes={4} /><DiveLamp /><SiteNav />
    <header className="projects-head">
      <div className="pm-eyebrow projects-head__eyebrow"><span className="pm-eyebrow__dot" /><span className="pm-eyebrow__label">01 / Projects</span></div>
      <h1 className="projects-head__title">Slabs of ice</h1>
      {!loading && !error && projects.length > 0 && <div className="projects-tabs" role="group" aria-label="Filter projects by area">
        <button type="button" aria-pressed={tab === 'all'} className={`projects-tab${tab === 'all' ? ' is-on' : ''}`} onClick={() => chooseSection('all')}>All</button>
        {SECTIONS.map(section => <button key={section.key} type="button" aria-pressed={tab === section.key} className={`projects-tab${tab === section.key ? ' is-on' : ''}`} onClick={() => chooseSection(section.key)}>{section.label}</button>)}
      </div>}
    </header>

    {!sectionIsValid ? <PageState status="empty" title="This project filter isn’t available" body="Choose one of the portfolio areas above." /> : loading ? <PageState status="loading" body="Fetching projects…" /> : error ? <PageState status="error" title="The deck did not load" body={error.message} onRetry={retry} /> : !projects.length ? <PageState status="empty" title="No published projects here yet" body="Published work will appear here." /> : !list.length ? <PageState status="empty" title={`No published ${sectionLabel(tab)} projects yet`} body="This layer is ready for its first case study." /> : <>
      <div className="deck" onWheel={onWheel} onPointerDown={event => { dragX.current = event.clientX; }} onPointerUp={endDrag} onPointerCancel={() => { dragX.current = null; }}>
        <span className="deck__pool" aria-hidden="true" />
        {list.map((project, projectIndex) => {
          const offset = circularOffset(projectIndex, i, list.length);
          const distance = Math.abs(offset);
          if (distance > 2) return null;
          const cover = coverOf(project);
          return <div key={project.slug} className={`slab${distance === 0 ? ' is-centre' : ''}`} style={{ '--o': offset, '--dist': distance, zIndex: 10 - distance }} role="button" tabIndex={distance === 0 ? 0 : -1} aria-current={distance === 0 ? 'true' : undefined} onClick={() => setIndex(projectIndex)} onKeyDown={event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); setIndex(projectIndex); } }}>
            <div className="slab__face"><div className="slab__media">{cover ? <img src={cover.url} alt={cover.alt} loading={distance === 0 ? 'eager' : 'lazy'} decoding="async" /> : <span className="pm-figure__empty">Case study</span>}<span className="slab__scrim" aria-hidden="true" /></div><span className="pm-figure__edge" aria-hidden="true" /><div className="slab__meta"><div className="slab__row"><span className="slab__n">{String(projectIndex + 1).padStart(2, '0')}</span><span className="slab__tick" /><span className="slab__section">{sectionLabel(project.section)}</span><span className="slab__year">{yearOf(project)}</span></div><h2 className="slab__title">{project.title}</h2></div><span className="slab__frost" aria-hidden="true" /></div>
          </div>;
        })}
      </div>
      <div className="deck-controls"><button type="button" className="deck-arrow" onClick={() => step(-1)} aria-label="Previous project">←</button><div className="deck-dots">{list.map((project, projectIndex) => <button key={project.slug} type="button" className={`deck-dot${projectIndex === i ? ' is-on' : ''}`} aria-label={project.title} aria-current={projectIndex === i ? 'true' : undefined} onClick={() => setIndex(projectIndex)} />)}</div><button type="button" className="deck-arrow" onClick={() => step(1)} aria-label="Next project">→</button></div>
      <section className="deck-detail" aria-live="polite">{active && <div key={active.slug} className="deck-detail__inner"><p className="deck-detail__summary">{active.summary}</p><div className="deck-detail__actions">{(active.tags || []).slice(0, 4).map(tag => <span key={tag} className="pm-chip">{tag}</span>)}<Link className="pm-btn" to={`/projects/${encodeURIComponent(active.slug)}`}><span className="pm-btn__icon">↗</span><span className="pm-btn__label">View case</span></Link>{safeWebUrl(active.links?.github) && <a className="pm-link-quiet" href={safeWebUrl(active.links.github)} target="_blank" rel="noopener noreferrer" aria-label="Source code (opens in a new tab)">Source ↗</a>}</div></div>}</section>
      <div className="deck-bar"><span className="deck-bar__name">Pawan Menuka / Portfolio</span><span className="deck-bar__counter">{String(i + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')} · scroll, drag or arrow keys</span><Link to="/contact" className="deck-bar__cta">Get in touch ↗</Link></div>
    </>}
  </div>;
}
