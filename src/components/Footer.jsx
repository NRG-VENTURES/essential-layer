import { Link } from 'react-router-dom';

export default function Footer({ minimal = false }) {
  const year = new Date().getFullYear();

  if (minimal) {
    return (
      <footer className="site-footer">
        <div className="footer-bottom" style={{ width: '100%', textAlign: 'center' }}>
          <p>
            &copy; {year} Essential Layer Inc. All rights reserved.
            &nbsp;|&nbsp; <Link to="/">Home</Link>
            &nbsp;|&nbsp; <Link to="/privacy">Privacy Policy</Link>
            &nbsp;|&nbsp; <Link to="/terms">Terms of Service</Link>
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-about">
          <p className="footer-brand">Essential Layer</p>
          <p>
            Purpose-built garments through Cottonique.<br />
            B Corp Certified. GOTS Certified. Benefit Corporation.
          </p>
        </div>
        <div className="footer-links">
          <p className="footer-heading">Company</p>
          <a href="#story">Our Story</a>
          <a href="#founders">Founders</a>
          <a href="#operations">Operations</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="footer-links">
          <p className="footer-heading">Trust</p>
          <a href="#certifications">Certifications</a>
          <a href="#transparency">Supply Chain</a>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
        <div className="footer-links">
          <p className="footer-heading">Connect</p>
          <a href="https://www.cottonique.com" target="_blank" rel="noopener noreferrer">Cottonique Shop</a>
          <a href="https://www.bcorporation.net/en-us/find-a-b-corp/company/essential-layer/" target="_blank" rel="noopener noreferrer">B Corp Profile</a>
          <a href="mailto:info@essentiallayer.com">Email Us</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {year} Essential Layer Inc. All rights reserved.</p>
      </div>
    </footer>
  );
}
