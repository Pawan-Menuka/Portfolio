import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getSkills } from '../lib/api.js';
import { useResource } from '../lib/use-resource.js';
import { DEFAULT_AVATAR_URL, safeWebUrl, useProfile } from '../lib/profile-context.js';
import { DESCENT_LOG } from '../data/cv.js';
import { SKILL_CATEGORIES } from '../data/sections.js';
import Markdown from '../components/Markdown.jsx';
import SiteNav from '../components/SiteNav.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import DiveLamp from '../components/DiveLamp.jsx';
import WaterBackdrop from '../components/WaterBackdrop.jsx';
import PageState from '../components/PageState.jsx';
import './about.css';

const loadSkills = (_, signal) => getSkills({}, { signal }).then(result => result.data || []);
const publicCopy = value => typeof value === 'string' && !/placeholder|PATCH\s+\/api\//i.test(value) ? value.trim() : '';

export default function About() {
  const { profile, status, error, retry } = useProfile();
  const skills = useResource('about-skills', loadSkills);
  const panels = useMemo(() => SKILL_CATEGORIES.map(category => ({
    ...category,
    items: (skills.data || []).filter(skill => skill.category === category.key).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  })).filter(category => category.items.length > 0), [skills.data]);
  const portrait = safeWebUrl(profile?.avatar?.url) || DEFAULT_AVATAR_URL;
  const shortBio = publicCopy(profile?.shortBio);
  const bio = publicCopy(profile?.bio);

  return <div className="pm-page about-page">
    <WaterBackdrop lightX="38%" /><DiveLamp /><SiteNav />
    <header className="pm-shell about-head"><div className="pm-eyebrow"><span className="pm-eyebrow__dot" /><span className="pm-eyebrow__label">02 / About</span><span className="pm-eyebrow__rule" /></div><h1 className="pm-h1 about-head__title">{profile?.headline || 'The part below the line'}</h1></header>
    {status === 'loading' ? <div className="pm-shell"><PageState status="loading" body="Fetching profile…" /></div> : status === 'error' ? <div className="pm-shell"><PageState status="error" title="Profile did not load" body={error} onRetry={retry} /></div> : <>
      <section className="pm-shell about-intro">
        <figure className="pm-figure about-portrait">{portrait ? <img src={portrait} alt={`${profile?.name || 'Pawan Menuka'} portrait`} width="512" height="512" decoding="async" /> : <span className="pm-figure__empty">Portrait coming soon</span>}<span className="pm-figure__scrim" /><span className="pm-figure__edge" /></figure>
        <div className="about-copy">
          {shortBio ? <p className="about-copy__lead">{shortBio}</p> : <p className="about-copy__lead">A fuller introduction will be added soon.</p>}
          {bio && <div className="about-copy__body about-copy__markdown"><Markdown>{bio}</Markdown></div>}
          {profile?.location && <p className="about-copy__body">Based in {profile.location}.</p>}
          <div className="about-copy__actions"><Link to="/cv" className="pm-btn"><span className="pm-btn__icon">↓</span><span className="pm-btn__label">Read the CV</span></Link><Link to="/projects" className="pm-link-quiet">See the work ↗</Link></div>
        </div>
      </section>
      <section className="pm-shell about-block"><div className="pm-section-head"><h2>How I got here</h2><span className="pm-section-head__rule" /></div><ol className="about-timeline">{DESCENT_LOG.map(entry => <li key={`${entry.when}-${entry.depth}`} className="pm-slab pm-slab--slide about-timeline__row"><span className="about-timeline__when">{entry.when}<small>{entry.depth}</small></span><div><h3 className="about-timeline__title">{entry.title}</h3><p className="about-timeline__body">{entry.body}</p></div></li>)}</ol></section>
      <section className="pm-shell about-block about-block--last"><div className="pm-section-head"><h2>What I work with</h2><span className="pm-section-head__rule" /></div>{skills.loading ? <PageState status="loading" body="Fetching skills…" /> : skills.error ? <PageState status="error" title="Skills did not load" body={skills.error.message} onRetry={skills.retry} /> : panels.length ? <div className="about-panels">{panels.map(panel => <div key={panel.key} className="pm-slab pm-slab--lift about-panel"><div className="about-panel__label">{panel.label}</div><div className="pm-chips about-panel__chips">{panel.items.map(skill => <span key={skill._id || skill.name} className="pm-chip" title={skill.description || undefined}>{skill.name}</span>)}</div></div>)}</div> : <PageState status="empty" title="Skills are being prepared" body="This section will be updated soon." />}</section>
    </>}
    <SiteFooter label="About" />
  </div>;
}
