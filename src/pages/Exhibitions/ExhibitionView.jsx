import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Star,
  CheckCircle2,
  Download,
} from 'lucide-react';
import './ExhibitionView.scss';

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

function formatICSDate(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
    date.getUTCHours()
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function parseEventDate(value) {
  if (!value) return null;

  const text = String(value).trim();
  if (/^\d{4}$/.test(text)) {
    return new Date(Date.UTC(Number(text), 0, 1, 10, 0, 0));
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

function buildCalendarUrls(event) {
  const title = encodeURIComponent(event.title || 'Event');
  const details = encodeURIComponent(event.description || '');
  const location = encodeURIComponent(event.location || '');
  const start = parseEventDate(event.year || event.date);

  if (!start) {
    return { google: null, ics: null };
  }

  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatICSDate(
    start
  )}/${formatICSDate(end)}&details=${details}&location=${location}`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//D\' Art of Rosita//Events//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@dartorosita`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${event.title || 'Event'}`,
    `DESCRIPTION:${event.description || ''}`,
    `LOCATION:${event.location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return { google, ics };
}

export default function ExhibitionView() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interestedIds, setInterestedIds] = useState(() => readInterestedIds());
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchEvent = async () => {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('exhibitions')
        .select('*')
        .eq('id', id)
        .single();

      if (!mounted) return;

      if (fetchError || !data) {
        setError('Event not found.');
        setEvent(null);
      } else {
        setEvent(data);
      }

      setLoading(false);
    };

    fetchEvent();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(interestedIds));
  }, [interestedIds]);

  const isInterested = useMemo(
    () => interestedIds.includes(String(id)),
    [interestedIds, id]
  );

  const toggleInterested = () => {
    const key = String(id);
    setInterestedIds((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const handleAddToCalendar = () => {
    if (!event) return;

    const { google, ics } = buildCalendarUrls(event);

    if (google) {
      window.open(google, '_blank', 'noopener,noreferrer');
    }

    if (ics) {
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${String(event.title || 'event').replace(/\s+/g, '-').toLowerCase()}.ics`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <main className="exhibition-view-page animate-fade-in">
        <div className="section-shell view-loading">
          <div className="loading-card">
            <CalendarDays size={22} />
            <p>Loading event…</p>
          </div>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="exhibition-view-page animate-fade-in">
        <div className="section-shell view-empty">
          <div className="empty-card">
            <h1>Event not found</h1>
            <p>{error || 'This event could not be loaded.'}</p>
            <Link to="/exhibitions" className="back-link">
              <ArrowLeft size={18} />
              Back to events
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="exhibition-view-page animate-fade-in">
      <div className="section-shell">
        <Link to="/exhibitions" className="back-link">
          <ArrowLeft size={18} />
          Back to events
        </Link>

        <section className="view-hero">
          <div className="view-hero__copy">
            <p className="eyebrow">Event</p>
            <h1>{event.title}</h1>

            <div className="view-meta">
              <span className="view-meta__item">
                <CalendarDays size={16} />
                {event.year || 'Date soon'}
              </span>
              {event.location && (
                <span className="view-meta__item">
                  <MapPin size={16} />
                  {event.location}
                </span>
              )}
            </div>

            <p className="view-lead">
              {event.description || 'No details added yet.'}
            </p>

            <div className="view-actions">
              <button
                type="button"
                className={`action-btn ${isInterested ? 'action-btn--active' : ''}`}
                onClick={toggleInterested}
              >
                {isInterested ? <CheckCircle2 size={18} /> : <Star size={18} />}
                {isInterested ? 'Saved' : 'Interested'}
              </button>

              <button
                type="button"
                className="action-btn action-btn--secondary"
                onClick={handleAddToCalendar}
              >
                <Download size={18} />
                Add to calendar
              </button>
            </div>
          </div>

          <div className="view-card">
            <div className="view-card__section">
              <span className="view-card__label">When</span>
              <strong>{event.year || 'Soon'}</strong>
            </div>

            <div className="view-card__section">
              <span className="view-card__label">Where</span>
              <strong>{event.location || 'Location soon'}</strong>
            </div>

            <div className="view-card__section">
              <span className="view-card__label">Saved</span>
              <strong>{isInterested ? 'Yes' : 'No'}</strong>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}