import { Link } from 'react-router-dom';

export default function SiteFooter({ label = 'Portfolio', cta = 'contact' }) {
  return (
    <footer className="pm-foot">
      <span className="pm-foot__name">Pawan Menuka / {label}</span>
      {cta === 'home' ? (
        <Link to="/" className="pm-link-quiet">
          Back to the surface <span aria-hidden="true">&#8593;</span>
        </Link>
      ) : (
        <Link to="/contact" className="pm-link-quiet">
          Get in touch <span aria-hidden="true">&#8599;</span>
        </Link>
      )}
    </footer>
  );
}
