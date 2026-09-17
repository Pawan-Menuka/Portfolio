import { useEffect } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { useProfile } from '../lib/profile-context.js';
const titles = { '/': 'Home', '/projects': 'Projects', '/about': 'About', '/cv': 'CV', '/contact': 'Contact' };
export default function Layout() {
  const location = useLocation();
  const { profile, status, error, retry } = useProfile();
  const name = profile?.name?.trim() || 'Pawan';
  const hasPageChrome = location.pathname === '/' || !['/projects', '/about', '/cv', '/contact'].some(path => location.pathname === path || location.pathname.startsWith(`${path}/`));
  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [location.pathname]);
  useEffect(() => { if (!location.pathname.startsWith('/projects/')) document.title = `${titles[location.pathname] || 'Page not found'} · ${name}`; }, [name, location.pathname]);
  useEffect(() => {
    const page = titles[location.pathname] || (location.pathname.startsWith('/projects/') ? 'Projects' : 'Page not found');
    const role = profile?.headline?.trim();
    document.querySelector('meta[name="description"]')?.setAttribute('content', `${page} · ${name}${role ? `, ${role}` : ''}. Explore software, systems, hardware, and creative work.`);
  }, [location.pathname, name, profile?.headline]);
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    {hasPageChrome && <header className="site-header">
      <Link className="wordmark" to="/" aria-label={`${name} — Home`}><span className="wordmark-logo-frame" aria-hidden="true"><img className="wordmark-logo" src="/pawan-menuka-logo.png" alt="" /></span></Link>
      <nav aria-label="Main navigation">{['Projects', 'About', 'CV', 'Contact'].map(label => <NavLink key={label} to={`/${label.toLowerCase()}`}>{label}</NavLink>)}</nav>
    </header>}
    {hasPageChrome && <div className="data-status" aria-live="polite">
      {status === 'loading' && <span>Loading profile…</span>}
      {status === 'error' && <div className="notice"><span>{error}</span><button onClick={retry}>Try again</button></div>}
    </div>}
    <main id="main-content" tabIndex={-1}><Outlet /></main>
    {location.pathname === '/' ? <footer className="site-footer ocean-footer">
      <div className="ocean-footer-bottom">
        <Link className="ocean-footer-brand" to="/" aria-label="Pawan Menuka — Home"><img src="/pawan-menuka-logo.png" alt="" /><span>Pawan Menuka<small>Portfolio</small></span></Link>
        <a className="ocean-footer-surface" href="#journey-intro">Back to the surface <span aria-hidden="true">↑</span></a>
      </div>
    </footer> : hasPageChrome ? <footer className="site-footer internal-footer pm-shell pm-footer">
      <Link className="ocean-footer-brand" to="/" aria-label="Pawan Menuka — Home"><img src="/pawan-menuka-logo.png" alt="" /><span>Pawan Menuka<small>{titles[location.pathname] || (location.pathname.startsWith('/projects/') ? 'Project' : 'Portfolio')}</small></span></Link>
      <Link className="pm-link" to={location.pathname === '/contact' ? '/' : '/contact'}>{location.pathname === '/contact' ? 'Back to the surface' : 'Get in touch'} <span aria-hidden="true">{location.pathname === '/contact' ? '↑' : '↗'}</span></Link>
    </footer> : null}
    <ScrollRestoration />
  </>;
}
