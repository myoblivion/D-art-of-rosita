import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import './Artworks.scss';

// Pulling keys from environment variables rather than hardcoding them
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Artworks() {
  const [artworks, setArtworks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 9;

  useEffect(() => {
    fetchArtworks();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filter]);

  const fetchArtworks = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('artworks')
      .select('id, title, category, image, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) setArtworks(data);
    setLoading(false);
  };

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(artworks.map((art) => art.category).filter(Boolean))
    );
    return ['All', ...unique];
  }, [artworks]);

  const filteredArtworks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return artworks.filter((art) => {
      const title = (art.title || '').toLowerCase();
      const category = (art.category || '').toLowerCase();
      const matchesSearch = !term || title.includes(term) || category.includes(term);
      const matchesFilter = filter === 'All' || art.category === filter;
      return matchesSearch && matchesFilter;
    });
  }, [artworks, searchTerm, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredArtworks.length / itemsPerPage));

  const currentPage = Math.min(page, totalPages);

  const paginatedArtworks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredArtworks.slice(start, start + itemsPerPage);
  }, [filteredArtworks, currentPage]);

  const firstItemIndex = filteredArtworks.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const lastItemIndex = Math.min(currentPage * itemsPerPage, filteredArtworks.length);

  return (
    <main className="artworks-page animate-fade-in">
      <section className="artworks-hero">
        <div className="section-shell artworks-hero__inner">
          <div className="artworks-hero__copy">
            <p className="eyebrow">Archive</p>
            <h1>Artworks</h1>
            <p className="artworks-hero__lead">
              A curated collection of featured pieces, presented in a clean gallery layout with
              search, filtering, and page navigation.
            </p>
          </div>

          <div className="artworks-hero__stats">
            <div className="stat-card">
              <span className="stat-card__value">{artworks.length.toString().padStart(2, '0')}</span>
              <span className="stat-card__label">Total works</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__value">{filteredArtworks.length.toString().padStart(2, '0')}</span>
              <span className="stat-card__label">Visible results</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__value">{categories.length - 1}</span>
              <span className="stat-card__label">Categories</span>
            </div>
          </div>
        </div>
      </section>

      <section className="artworks-toolbar">
        <div className="section-shell artworks-toolbar__inner">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search title or category"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-box">
            <Filter size={18} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'All' ? 'All categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="artworks-grid-wrap">
        <div className="section-shell">
          <div className="results-bar">
            <p>
              {loading
                ? 'Loading artworks...'
                : filteredArtworks.length > 0
                  ? `Showing ${firstItemIndex}-${lastItemIndex} of ${filteredArtworks.length}`
                  : 'No artworks found'}
            </p>
          </div>

          <div className="art-grid">
            {paginatedArtworks.map((art) => (
              <Link to={`/artworks/${art.id}`} key={art.id} className="art-card">
                <div className="image-wrapper">
                  <img src={art.image} alt={art.title} loading="lazy" />
                </div>
                <div className="card-info">
                  <div>
                    <h3>{art.title}</h3>
                    <span>{art.category || 'Artwork'}</span>
                  </div>
                  <div className="card-info__arrow">→</div>
                </div>
              </Link>
            ))}
          </div>

          {!loading && filteredArtworks.length === 0 && (
            <div className="empty-state">
              <h3>No matches found</h3>
              <p>Try a different search term or category filter.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Prev
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}