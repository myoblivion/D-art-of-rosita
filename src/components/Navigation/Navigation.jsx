import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.scss';

export default function Navigation() {
  const location = useLocation();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('theme');
    const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';

    document.documentElement.dataset.theme = initialTheme;
    window.localStorage.setItem('theme', initialTheme);
    setIsDarkMode(initialTheme === 'dark');
  }, []);

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('theme', theme);
  }, [isDarkMode]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const logoSrc = isDarkMode ? '/dlogo.png' : '/rlogo.png';

  return (
    <header className="navbar">
      <div className="container nav-content">
        <Link to="/" className="brand" aria-label="Go to home">
          <img src={logoSrc} alt="D' Art of Rosita" className="brand__logo" />
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          <Link to="/" className={isActive('/') ? 'active' : ''}>
            Home
          </Link>
          <Link to="/about" className={isActive('/about') ? 'active' : ''}>
            About
          </Link>
          <Link to="/artworks" className={isActive('/artworks') ? 'active' : ''}>
            Artworks
          </Link>
          <Link to="/contact" className={isActive('/contact') ? 'active' : ''}>
            Contact
          </Link>
        </nav>

        <button
          type="button"
          className="theme-toggle"
          onClick={() => setIsDarkMode((prev) => !prev)}
          aria-pressed={isDarkMode}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="theme-toggle__icon">{isDarkMode ? '☀' : '☾'}</span>
          <span className="theme-toggle__text">{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </header>
  );
}