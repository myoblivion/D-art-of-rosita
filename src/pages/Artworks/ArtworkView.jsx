import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { 
  ArrowLeft, 
  MessageCircle, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X 
} from 'lucide-react';
import './ArtworkView.scss';

// Pulling keys from environment variables rather than hardcoding them
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ArtworkView() {
  const { id } = useParams();
  const [artwork, setArtwork] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({ name: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Carousel & Modal State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError('');

      const [{ data: artworkData, error: artworkError }, { data: commentsData, error: commentsError }] =
        await Promise.all([
          supabase
            .from('artworks')
            .select('*')
            .eq('id', id)
            .single(),
          supabase
            .from('comments')
            .select('*')
            .eq('artwork_id', id)
            .order('created_at', { ascending: true }),
        ]);

      if (!mounted) return;

      if (artworkError || !artworkData) {
        setError('Artwork not found.');
        setArtwork(null);
      } else {
        setArtwork(artworkData);
      }

      if (!commentsError && commentsData) setComments(commentsData);
      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [id]);

  // Normalize images to always be an array (supports future database scaling if you use 'images' array instead of single 'image')
  const images = useMemo(() => {
    if (!artwork) return [];
    if (artwork.images && Array.isArray(artwork.images) && artwork.images.length > 0) {
      return artwork.images;
    }
    return artwork.image ? [artwork.image] : [];
  }, [artwork]);

  const commentCountLabel = useMemo(() => {
    const count = comments.length;
    return `${count} ${count === 1 ? 'comment' : 'comments'}`;
  }, [comments.length]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const name = newComment.name.trim();
    const content = newComment.content.trim();

    if (!name || !content || submitting) return;

    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase.from('comments').insert([
      { artwork_id: id, name, content },
    ]);

    setSubmitting(false);

    if (insertError) {
      setError('Could not post comment. Please try again.');
      return;
    }

    setNewComment({ name: '', content: '' });
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('artwork_id', id)
      .order('created_at', { ascending: true });

    if (data) setComments(data);
  };

  // Carousel Handlers
  const handleNextImage = (e) => {
    e.stopPropagation(); // Prevents opening modal when clicking next
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  if (loading) {
    return (
      <main className="artwork-view-page animate-fade-in">
        <div className="section-shell artwork-view-page__loading">
          <div className="loading-card">
            <Sparkles size={22} />
            <p>Loading artwork…</p>
          </div>
        </div>
      </main>
    );
  }

  if (!artwork || images.length === 0) {
    return (
      <main className="artwork-view-page animate-fade-in">
        <div className="section-shell artwork-view-page__empty">
          <div className="empty-card">
            <h1>Artwork unavailable</h1>
            <p>{error || 'This artwork could not be loaded or has no images.'}</p>
            <Link to="/artworks" className="back-link">
              <ArrowLeft size={18} />
              Back to Gallery
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="artwork-view-page animate-fade-in">
        <div className="section-shell">
          <Link to="/artworks" className="back-link">
            <ArrowLeft size={18} />
            Back to Gallery
          </Link>

          <div className="artwork-layout">
            <section className="artwork-media">
              <div 
                className="artwork-media__frame" 
                onClick={() => setIsLightboxOpen(true)}
              >
                <img 
                  src={images[currentImageIndex]} 
                  alt={`${artwork.title} - view ${currentImageIndex + 1}`} 
                />
                
                <button 
                  className="expand-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  title="View Fullscreen"
                >
                  <Maximize2 size={20} />
                </button>

                {images.length > 1 && (
                  <>
                    <button className="carousel-btn prev" onClick={handlePrevImage}>
                      <ChevronLeft size={24} />
                    </button>
                    <button className="carousel-btn next" onClick={handleNextImage}>
                      <ChevronRight size={24} />
                    </button>
                    <div className="carousel-indicators">
                      {images.map((_, idx) => (
                        <span 
                          key={idx} 
                          className={`dot ${idx === currentImageIndex ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>

            <aside className="artwork-panel">
              <div className="artwork-panel__header">
                <p className="eyebrow">Artwork detail</p>
                <h1>{artwork.title}</h1>

                <div className="meta-chips">
                  {artwork.year && <span className="chip">{artwork.year}</span>}
                  {artwork.category && <span className="chip chip--alt">{artwork.category}</span>}
                </div>
              </div>

              <p className="description">
                {artwork.description || 'No description available for this piece yet.'}
              </p>

              <div className="spec-card">
                <div className="spec-row">
                  <span className="spec-label">Medium</span>
                  <span className="spec-value">{artwork.medium || '—'}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Tools used</span>
                  <span className="spec-value">{artwork.tools || '—'}</span>
                </div>
              </div>

              <div className="comment-card">
                <div className="comment-card__header">
                  <div>
                    <p className="eyebrow">Conversation</p>
                    <h2>{commentCountLabel}</h2>
                  </div>
                  <MessageCircle size={20} />
                </div>

                <div className="comments-list">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <article key={comment.id} className="comment-item">
                        <div className="comment-item__top">
                          <strong>{comment.name}</strong>
                          {comment.created_at && (
                            <span>
                              {new Date(comment.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                        <p>{comment.content}</p>
                      </article>
                    ))
                  ) : (
                    <div className="empty-comments">
                      <p>No comments yet. Be the first to leave a thought.</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleCommentSubmit} className="comment-form">
                  <div className="field-row">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={newComment.name}
                      onChange={(e) => setNewComment({ ...newComment, name: e.target.value })}
                    />
                  </div>

                  <div className="field-row">
                    <textarea
                      placeholder="Leave a thoughtful comment..."
                      value={newComment.content}
                      onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                    />
                  </div>

                  {error && <p className="form-error">{error}</p>}

                  <button type="submit" disabled={submitting}>
                    {submitting ? 'Posting…' : 'Post Comment'}
                  </button>
                </form>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="lightbox-modal" onClick={() => setIsLightboxOpen(false)}>
          <button className="lightbox-close" onClick={() => setIsLightboxOpen(false)}>
            <X size={32} />
          </button>
          
          <img 
            src={images[currentImageIndex]} 
            alt={artwork.title} 
            className="lightbox-img" 
            onClick={(e) => e.stopPropagation()} 
          />

          {images.length > 1 && (
            <>
              <button 
                className="carousel-btn prev lightbox-nav" 
                onClick={handlePrevImage}
              >
                <ChevronLeft size={32} />
              </button>
              <button 
                className="carousel-btn next lightbox-nav" 
                onClick={handleNextImage}
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}