import { Link, NavLink } from 'react-router-dom';
import { useProfile } from '../lib/profile-context.js';

const LINKS = [
  { to: '/projects', label: 'Projects' },
  { to: '/about', label: 'About' },
  { to: '/cv', label: 'CV' },
  { to: '/contact', label: 'Contact' },
];

export default function SiteNav() {
  const { profile } = useProfile();
  const name = profile?.name?.trim() || 'Pawan Menuka';
  return <nav className="pm-nav" aria-label="Primary">
    <Link to="/" className="pm-nav__mark" aria-label={`${name} — Home`}>
      <img src="/pawan-menuka-logo.png" alt="" width="56" height="56" />
    </Link>
    <div className="pm-nav__links">
      {LINKS.map(link => <NavLink key={link.to} to={link.to} className={({ isActive }) => isActive ? 'is-active' : undefined}>{link.label}</NavLink>)}
    </div>
  </nav>;
}
