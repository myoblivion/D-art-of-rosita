import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import rositaPortrait from '../../assets/rosita-portrait.jpg';
import './Home.scss';

// Pulling keys from environment variables rather than hardcoding them
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [featuredArtworks, setFeaturedArtworks] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentArchiveIndex, setCurrentArchiveIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);

      const [{ data: artData, error: artError }, { data: exData, error: exError }] =
        await Promise.all([
          supabase
            .from('artworks')
            .select('*')
            .eq('is_featured', true)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('exhibitions')
            .select('*')
            .order('year', { ascending: false })
            .limit(5),
        ]);

      if (!mounted) return;

      if (!artError && artData) setFeaturedArtworks(artData);
      if (!exError && exData) setExhibitions(exData);

      setLoading(false);
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const archiveItems = useMemo(() => featuredArtworks.slice(0, 8), [featuredArtworks]);

  useEffect(() => {
    setCurrentArchiveIndex(0);
  }, [archiveItems.length]);

  const statItems = useMemo(
    () => [
      { label: 'Artworks', value: String(featuredArtworks.length).padStart(2, '0') },
      { label: 'Events', value: String(exhibitions.length).padStart(2, '0') },
    ],
    [featuredArtworks.length, exhibitions.length]
  );

  const currentArchiveItem = archiveItems[currentArchiveIndex] || null;

  const handlePrevArchive = () => {
    if (!archiveItems.length) return;
    setCurrentArchiveIndex((prev) => (prev - 1 + archiveItems.length) % archiveItems.length);
  };

  const handleNextArchive = () => {
    if (!archiveItems.length) return;
    setCurrentArchiveIndex((prev) => (prev + 1) % archiveItems.length);
  };

  return (
    <main className="home-page animate-fade-in">
      <section className="hero">
        <div className="hero__backdrop" />
        <div className="section-shell hero__inner">
          <div className="hero__feature">
            <div className="hero__copy">
              <p className="eyebrow">Artist portfolio</p>
              <h1>ROSITA SIMMONS</h1>
              <p className="lead">
                A simple portfolio for Rosita’s paintings, portraits, and events.
              </p>

              <div className="hero__actions">
                <Link to="/artworks" className="btn btn--primary">
                  View artworks
                </Link>
                <a href="#archive" className="btn btn--ghost">
                  View events
                </a>
              </div>

              <div className="hero__stats">
                {statItems.map((stat) => (
                  <div key={stat.label} className="stat-card">
                    <span className="stat-card__value">{stat.value}</span>
                    <span className="stat-card__label">{stat.label}</span>
                  </div>
                ))}
              </div>

              <div className="hero__notes">
                <div className="note-card">
                  <span className="note-card__label">Paintings</span>
                  <p>Portraits, figures, and expressive color.</p>
                </div>
                <div className="note-card">
                  <span className="note-card__label">Style</span>
                  <p>Simple, human, and easy to follow.</p>
                </div>
                <div className="note-card">
                  <span className="note-card__label">Events</span>
                  <p>Shows and listings from the archive.</p>
                </div>
              </div>
            </div>

            <aside className="hero__portrait">
              <div className="portrait-panel">
                <div className="portrait-panel__imageWrap">
                  <img src={rositaPortrait} alt="Rosita Simmons portrait" />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="section about">
        <div className="section-shell about__grid">
          <div className="about__text">
            <p className="eyebrow">About Rosita</p>
            <h2>Paintings, portraits, and figure studies.</h2>
            <p>
              Rosita Simmons works with portraits and figurative paintings. Her pieces focus on
              people, expression, color, and mood.
            </p>
            <p>
              This site keeps the wording simple and lets the artwork speak for itself.
            </p>
          </div>

          <div className="about__cards">
            <div className="info-card">
              <span className="info-card__kicker">Artworks</span>
              <h3>Painting / mixed media</h3>
              <p>Portraits and figure-based work.</p>
            </div>

            <div className="info-card">
              <span className="info-card__kicker">Style</span>
              <h3>Expressive and figurative</h3>
              <p>Color, gesture, and simple form.</p>
            </div>

            <div className="info-card">
              <span className="info-card__kicker">Events</span>
              <h3>Shows and listings</h3>
              <p>Public events and past presentations.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="archive" className="section archive">
        <div className="section-shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">Featured artworks</p>
              <h2>Artworks</h2>
            </div>
          </div>

          <div className="archive-carousel-container">
            <button
              type="button"
              className="carousel-nav prev"
              onClick={handlePrevArchive}
              aria-label="Previous artwork"
              disabled={!archiveItems.length}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div className="archive-carousel">
              {currentArchiveItem ? (
                <Link
                  to={`/artworks/${currentArchiveItem.id}`}
                  className="archive-card"
                  aria-label={currentArchiveItem.title}
                >
                  <div className="archive-card__image">
                    <img src={currentArchiveItem.image} alt={currentArchiveItem.title} />
                  </div>

                  <div className="archive-card__meta">
                    <div>
                      <span className="archive-card__index">
                        {String(currentArchiveIndex + 1).padStart(2, '0')} /{' '}
                        {String(archiveItems.length).padStart(2, '0')}
                      </span>
                      <h3>{currentArchiveItem.title}</h3>
                    </div>
                    <p>{currentArchiveItem.category || 'Artwork'}</p>
                  </div>
                </Link>
              ) : (
                <div className="empty-state empty-state--carousel">
                  <p>{loading ? 'Loading artworks…' : 'No featured artworks yet.'}</p>
                </div>
              )}
            </div>

            <button
              type="button"
              className="carousel-nav next"
              onClick={handleNextArchive}
              aria-label="Next artwork"
              disabled={!archiveItems.length}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </section>

      <section id="exhibitions" className="section exhibitions">
        <div className="section-shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">Events</p>
              <h2>Events</h2>
            </div>
            <Link to="/exhibitions" className="section-head__link">
              View all
            </Link>
          </div>

          <div className="exhibition-list">
            {exhibitions.length > 0 ? (
              exhibitions.map((ex, index) => (
                <Link key={ex.id} to="/exhibitions" className="exhibition-row">
                  <span className="exhibition-row__index">0{index + 1}</span>
                  <div className="exhibition-row__body">
                    <h3>{ex.title}</h3>
                    <p>
                      {ex.year}
                      {ex.location ? ` • ${ex.location}` : ''}
                    </p>
                  </div>
                  <span className="exhibition-row__cta">View</span>
                </Link>
              ))
            ) : (
              <div className="empty-state">
                <p>No events yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}