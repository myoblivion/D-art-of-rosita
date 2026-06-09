import { Link } from 'react-router-dom';
import './Footer.scss';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="section-shell footer-inner">
        <div className="footer-brand">
          <p className="footer-brand__eyebrow">D' Art of Rosita</p>
          <h2>Paintings, portraits, and events.</h2>
          <p>
            A simple home for Rosita Simmons’ artworks, shows, and contact details.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <h3>Pages</h3>
            <Link to="/">Home</Link>
            <Link to="/artworks">Artworks</Link>
            <Link to="/exhibitions">Events</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </div>


        </div>
      </div>

      <div className="section-shell footer-bottom">
        <p>© {new Date().getFullYear()} D' Art of Rosita. All rights reserved.</p>
        <p>Built for a clean portfolio look.</p>
      </div>
    </footer>
  );
}