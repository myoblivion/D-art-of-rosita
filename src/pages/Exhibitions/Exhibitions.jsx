import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { CalendarDays, Search, MapPin, ArrowRight, Star } from 'lucide-react';
import './Exhibitions.scss';

const STORAGE_KEY = 'interested-exhibitions';

function readInterestedIds() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export default function Exhibitions() {
  const [exhibitions, setExhibitions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [interestedIds, setInterestedIds] = useState(() => readInterestedIds());

  useEffect(() => {
    let mounted = true;

    const fetchExhibitions = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('exhibitions')
        .select('id, year, title, location, description, created_at')
        .order('year', { ascending: false });

      if (!mounted) return;

      if (!error && data) setExhibitions(data);
      setLoading(false);
    };

    fetchExhibitions();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(interestedIds));
  }, [interestedIds]);

  const filteredExhibitions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return exhibitions.filter((event) => {
      const title = String(event.title || '').toLowerCase();
      const location = String(event.location || '').toLowerCase();
      const year = String(event.year || '').toLowerCase();
      const description = String(event.description || '').toLowerCase();

      return (
        !term ||
        title.includes(term) ||
        location.includes(term) ||
        year.includes(term) ||
        description.includes(term)
      );
    });
  }, [exhibitions, searchTerm]);

  const interestedCount = interestedIds.length;

  const toggleInterested = (id) => {
    const key = String(id);
    setInterestedIds((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  return (
    <main className="exhibitions-page animate-fade-in">
      <section className="exhibitions-hero">
        <div className="section-shell exhibitions-hero__inner">
          <div className="exhibitions-hero__copy">
            <p className="eyebrow">Events</p>
            <h1>Events</h1>
            <p className="exhibitions-hero__lead">
              A simple list of Rosita’s shows, listings, and event posts.
            </p>
          </div>

          <div className="exhibitions-hero__stats">
            <div className="stat-card">
              <span className="stat-card__value">{String(exhibitions.length).padStart(2, '0')}</span>
              <span className="stat-card__label">Total events</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__value">{String(interestedCount).padStart(2, '0')}</span>
              <span className="stat-card__label">Saved</span>
            </div>
          </div>
        </div>
      </section>

      <section className="exhibitions-toolbar">
        <div className="section-shell exhibitions-toolbar__inner">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search events"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="exhibitions-list-wrap">
        <div className="section-shell">
          <div className="results-bar">
            <p>
              {loading
                ? 'Loading events…'
                : filteredExhibitions.length > 0
                  ? `Showing ${filteredExhibitions.length} event${filteredExhibitions.length === 1 ? '' : 's'}`
                  : 'No events found'}
            </p>
          </div>

          <div className="event-grid">
            {filteredExhibitions.map((event, index) => {
              const isSaved = interestedIds.includes(String(event.id));

              return (
                <article key={event.id} className="event-card">
                  <div className="event-card__top">
                    <span className="event-card__index">0{index + 1}</span>
                    <button
                      type="button"
                      className={`save-btn ${isSaved ? 'save-btn--active' : ''}`}
                      onClick={() => toggleInterested(event.id)}
                    >
                      <Star size={16} />
                      {isSaved ? 'Saved' : 'Save'}
                    </button>
                  </div>

                  <div className="event-card__body">
                    <h2>{event.title}</h2>
                    <div className="event-card__meta">
                      <span>{event.year || 'Date soon'}</span>
                      {event.location && (
                        <span className="event-card__location">
                          <MapPin size={14} />
                          {event.location}
                        </span>
                      )}
                    </div>
                    <p>{event.description || 'No details added yet.'}</p>
                  </div>

                  <div className="event-card__actions">
                    <Link to={`/exhibitions/${event.id}`} className="event-link">
                      View event
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {!loading && filteredExhibitions.length === 0 && (
            <div className="empty-state">
              <CalendarDays size={24} />
              <h3>No events found</h3>
              <p>Try a different search word.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}