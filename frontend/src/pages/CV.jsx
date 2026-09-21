import { useMemo, useState } from 'react';
import { getCertifications, getProjects } from '../lib/api.js';
import { useResource } from '../lib/use-resource.js';
import { DEFAULT_RESUME_URL, safeWebUrl, useProfile } from '../lib/profile-context.js';
import { CV_GROUPS, CV_STATS } from '../data/cv.js';
import { sectionLabel } from '../data/sections.js';
import SiteNav from '../components/SiteNav.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import DiveLamp from '../components/DiveLamp.jsx';
import WaterBackdrop from '../components/WaterBackdrop.jsx';
import PageState from '../components/PageState.jsx';
import './cv.css';

const loadCvData = (_, signal) => Promise.all([
  getCertifications({ signal }).then(result => result.data || []).catch(() => []),
  getProjects('page=1&limit=100', { signal }).then(result => result.data || []).catch(() => []),
]);
const year = value => value ? String(new Date(value).getFullYear()) : '';
const EMPTY_PROJECTS = [];

export default function CV() {
  const { profile, status, error, retry } = useProfile();
  const { data } = useResource('cv-supporting-data', loadCvData);
  const [open, setOpen] = useState(CV_GROUPS[0]?.rows[0]?.id || null);
  const certifications = data?.[0];
  const projects = data?.[1] || EMPTY_PROJECTS;
  const groups = useMemo(() => {
    const projectGroup = projects.length ? [{
      label: 'Selected work',
      rows: projects.map(project => ({
        id: `project-${project.slug}`,
        role: project.title,
        org: sectionLabel(project.section),
        when: project.meta?.timeline || String(project.meta?.year || project.meta?.completed || '').slice(0, 4),
        points: [project.summary, project.meta?.role && `Role: ${project.meta.role}`, project.meta?.status && `Status: ${project.meta.status}`].filter(Boolean),
      })),
    }] : [];
    const certificationGroups = certifications?.length ? [{
    label: 'Certifications',
    rows: certifications.map((certification, index) => ({
      id: `cert-${certification._id || index}`,
      role: certification.name,
      org: certification.issuer,
      when: [year(certification.issueDate), year(certification.expiryDate)].filter(Boolean).join(' — '),
      points: [certification.description, certification.credentialId && `Credential ID ${certification.credentialId}`, certification.verifyUrl && `Verification: ${certification.verifyUrl}`].filter(Boolean),
    })),
    }] : [];
    return [...projectGroup, ...CV_GROUPS, ...certificationGroups];
  }, [certifications, projects]);
  const stats = projects.length ? [CV_STATS[0], { value: String(projects.length), label: 'Published projects' }, ...CV_STATS.slice(1)] : CV_STATS;
  const facts = [
    { k: 'Based', v: profile?.location },
    { k: 'Status', v: profile?.availability?.text },
    { k: 'Email', v: profile?.socials?.email },
    { k: 'GitHub', v: profile?.socials?.github?.replace(/^https?:\/\/(www\.)?github\.com\//, '@') },
  ].filter(fact => fact.v);
  const resume = safeWebUrl(profile?.resume?.url) || DEFAULT_RESUME_URL;

  return <div className="pm-page cv-page">
    <WaterBackdrop lightX="72%" motes={2} /><DiveLamp /><SiteNav />
    <header className="pm-shell cv-head"><div className="pm-eyebrow"><span className="pm-eyebrow__dot" /><span className="pm-eyebrow__label">03 / CV</span><span className="pm-eyebrow__rule" /><span className="pm-eyebrow__meta">Updated {new Date().getFullYear()}</span></div><div className="cv-head__row"><h1 className="pm-h1">{profile?.name || 'Pawan Menuka'}</h1>{resume && <a aria-label="Open CV (opens in a new tab)" className="pm-btn cv-head__download" href={resume} target="_blank" rel="noopener noreferrer"><span className="pm-btn__icon" aria-hidden="true">↓</span><span className="pm-btn__label">Download PDF</span></a>}</div></header>
    {status === 'loading' ? <div className="pm-shell"><PageState status="loading" body="Fetching CV…" /></div> : status === 'error' ? <div className="pm-shell"><PageState status="error" title="CV details did not load" body={error} onRetry={retry} /></div> : <>
      <div className="pm-shell cv-stats-wrap"><div className="cv-stats">{stats.map(stat => <div key={stat.label} className="pm-slab pm-slab--lift pm-stat"><div className="pm-stat__value">{stat.value}</div><div className="pm-stat__label">{stat.label}</div></div>)}</div></div>
      <div className="pm-shell cv-body"><aside className="cv-aside"><div><div className="cv-aside__label">Summary</div><p className="cv-aside__summary">{profile?.shortBio || 'Software engineering undergraduate focused on full-stack and backend systems.'}</p></div><span className="cv-aside__rule" />{facts.length > 0 && <dl className="cv-facts">{facts.map(fact => <div key={fact.k} className="cv-facts__row"><dt>{fact.k}</dt><dd>{fact.v}</dd></div>)}</dl>}</aside>
        <div className="cv-main">{groups.map(group => <section key={group.label}><div className="pm-section-head"><h2>{group.label}</h2><span className="pm-section-head__rule" /></div><div className="cv-rows">{group.rows.map(row => { const isOpen = open === row.id; return <div key={row.id} className={`cv-row${isOpen ? ' is-open' : ''}`}><button type="button" className="cv-row__head" aria-expanded={isOpen} aria-controls={`cv-panel-${row.id}`} onClick={() => setOpen(isOpen ? null : row.id)}><span className="cv-row__ident"><span className="cv-row__role">{row.role}</span>{row.org && <span className="cv-row__org">{row.org}</span>}</span><span className="cv-row__right"><span className="cv-row__when">{row.when}</span><span className="cv-row__icon">↓</span></span></button><div className="cv-row__panel" id={`cv-panel-${row.id}`} hidden={!isOpen}><div className="cv-row__panel-inner"><span className="cv-row__rule" /><ul className="cv-points">{row.points.map((point, index) => <li key={`${index}-${point}`}>{point}</li>)}</ul></div></div></div>; })}</div></section>)}</div>
      </div>
    </>}
    <SiteFooter label="CV" />
  </div>;
}
