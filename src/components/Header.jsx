import { Link } from 'react-router-dom';

export default function Header({ isSubpage = false }) {
  const prefix = isSubpage ? '/' : '';

  return (
    <header className="site-header">
      <Link className="wordmark" to="/">Essential Layer</Link>
      <nav aria-label="Primary">
        {isSubpage ? (
          <>
            <Link to="/#story">Story</Link>
            <Link to="/#certifications">Certifications</Link>
            <Link to="/#contact">Contact</Link>
          </>
        ) : (
          <>
            <a href="#story">Story</a>
            <a href="#certifications">Certifications</a>
            <a href="#transparency">Transparency</a>
            <a href="#founders">Founders</a>
            <a href="#contact">Contact</a>
          </>
        )}
      </nav>
    </header>
  );
}
