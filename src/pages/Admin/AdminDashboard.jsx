import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus,
  Search,
  Trash2,
  Star,
  StarOff,
  CalendarDays,
  Image as ImageIcon,
  Layers3,
  Filter,
  X,
  Pencil,
  Square,
  CheckSquare,
} from 'lucide-react';
import './AdminDashboard.scss';

// Pulling keys from environment variables rather than hardcoding them
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ARTWORK_IMAGES_BUCKET = 'artwork-images';

const emptyArtworkForm = {
  title: '',
  category: '',
  medium: '',
  year: '',
  image: '',
  images: [], // Added images array
  description: '',
  tools: '',
  is_featured: false,
};

const emptyExhibitionForm = {
  year: '',
  title: '',
  location: '',
  description: '',
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const dateObj = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
  return Number.isNaN(dateObj.getTime()) ? dateString : dateObj.toLocaleDateString(undefined, options);
};

const makeSafeFileName = (fileName) => {
  const cleanBase = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${cleanBase || 'image'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
};

async function uploadImagesToStorage(files) {
  const urls = [];

  for (const file of files) {
    const safeName = makeSafeFileName(file.name);
    const path = `artworks/${safeName}`;

    const { error: uploadError } = await supabase.storage.from(ARTWORK_IMAGES_BUCKET).upload(path, file, {
      contentType: file.type || 'image/*',
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadError) {
      throw new Error(uploadError.message || 'Image upload failed.');
    }

    const { data } = supabase.storage.from(ARTWORK_IMAGES_BUCKET).getPublicUrl(path);
    const publicUrl = data?.publicUrl;

    if (!publicUrl) {
      throw new Error('Could not get public image URL.');
    }

    urls.push(publicUrl);
  }

  return urls;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('artworks');

  const [artworks, setArtworks] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);

  const [artworkSearch, setArtworkSearch] = useState('');
  const [artworkCategory, setArtworkCategory] = useState('All');
  const [exhibitionSearch, setExhibitionSearch] = useState('');

  const [showArtworkForm, setShowArtworkForm] = useState(false);
  const [showExhibitionForm, setShowExhibitionForm] = useState(false);

  const [loadingArtworks, setLoadingArtworks] = useState(true);
  const [loadingExhibitions, setLoadingExhibitions] = useState(true);

  const [artForm, setArtForm] = useState(emptyArtworkForm);
  const [exhibitionForm, setExhibitionForm] = useState(emptyExhibitionForm);

  const [editingArtworkId, setEditingArtworkId] = useState(null);
  const [editingExhibitionId, setEditingExhibitionId] = useState(null);

  const [savingArtwork, setSavingArtwork] = useState(false);
  const [savingExhibition, setSavingExhibition] = useState(false);

  const [error, setError] = useState('');

  const [selectedArtworkIds, setSelectedArtworkIds] = useState([]);
  const [selectedExhibitionIds, setSelectedExhibitionIds] = useState([]);

  const [artworkFiles, setArtworkFiles] = useState([]);
  const [artworkPreviewUrls, setArtworkPreviewUrls] = useState([]);
  const [artworkFileInputKey, setArtworkFileInputKey] = useState(0);

  useEffect(() => {
    fetchArtworks();
    fetchExhibitions();
  }, []);

  useEffect(() => {
    setSelectedArtworkIds([]);
  }, [artworkSearch, artworkCategory]);

  useEffect(() => {
    setSelectedExhibitionIds([]);
  }, [exhibitionSearch]);

  useEffect(() => {
    if (!artworkFiles.length) {
      setArtworkPreviewUrls([]);
      return undefined;
    }

    const urls = artworkFiles.map((file) => URL.createObjectURL(file));
    setArtworkPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [artworkFiles]);

  const fetchArtworks = async () => {
    setLoadingArtworks(true);

    // Added 'images' to the select query
    const { data, error: fetchError } = await supabase
      .from('artworks')
      .select('id, title, category, medium, year, image, images, description, tools, is_featured, created_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(`Failed to load artworks: ${fetchError.message}`);
    } else if (data) {
      setArtworks(data);
    }

    setLoadingArtworks(false);
  };

  const fetchExhibitions = async () => {
    setLoadingExhibitions(true);

    const { data, error: fetchError } = await supabase
      .from('exhibitions')
      .select('id, year, title, location, description, created_at')
      .order('year', { ascending: false });

    if (fetchError) {
      setError(`Failed to load exhibitions: ${fetchError.message}`);
    } else if (data) {
      setExhibitions(data);
    }

    setLoadingExhibitions(false);
  };

  const artworkCategories = useMemo(() => {
    const unique = Array.from(new Set(artworks.map((art) => art.category).filter(Boolean)));
    return ['All', ...unique];
  }, [artworks]);

  const filteredArtworks = useMemo(() => {
    const term = artworkSearch.trim().toLowerCase();

    return artworks.filter((art) => {
      const title = (art.title || '').toLowerCase();
      const category = (art.category || '').toLowerCase();
      const medium = (art.medium || '').toLowerCase();
      const dateStr = art.year ? formatDate(art.year).toLowerCase() : '';

      const matchesSearch =
        !term ||
        title.includes(term) ||
        category.includes(term) ||
        medium.includes(term) ||
        dateStr.includes(term);

      const matchesCategory = artworkCategory === 'All' || art.category === artworkCategory;
      return matchesSearch && matchesCategory;
    });
  }, [artworks, artworkSearch, artworkCategory]);

  const filteredExhibitions = useMemo(() => {
    const term = exhibitionSearch.trim().toLowerCase();

    return exhibitions.filter((ex) => {
      const title = (ex.title || '').toLowerCase();
      const location = (ex.location || '').toLowerCase();
      const dateStr = ex.year ? formatDate(ex.year).toLowerCase() : '';
      return !term || title.includes(term) || location.includes(term) || dateStr.includes(term);
    });
  }, [exhibitions, exhibitionSearch]);

  const featuredCount = useMemo(
    () => artworks.filter((art) => art.is_featured).length,
    [artworks]
  );

  const allFilteredArtworkIds = filteredArtworks.map((art) => art.id);
  const allFilteredExhibitionIds = filteredExhibitions.map((ex) => ex.id);

  const artworkBulkAllSelected =
    allFilteredArtworkIds.length > 0 &&
    allFilteredArtworkIds.every((id) => selectedArtworkIds.includes(id));

  const exhibitionBulkAllSelected =
    allFilteredExhibitionIds.length > 0 &&
    allFilteredExhibitionIds.every((id) => selectedExhibitionIds.includes(id));

  const resetArtworkForm = () => {
    setArtForm(emptyArtworkForm);
    setEditingArtworkId(null);
    setArtworkFiles([]);
    setArtworkFileInputKey((prev) => prev + 1);
  };

  const resetExhibitionForm = () => {
    setExhibitionForm(emptyExhibitionForm);
    setEditingExhibitionId(null);
  };

  const openArtworkForm = (art = null) => {
    setError('');

    if (art) {
      setEditingArtworkId(art.id);
      setArtForm({
        title: art.title || '',
        category: art.category || '',
        medium: art.medium || '',
        year: art.year ? String(art.year).split('T')[0] : '',
        image: art.image || '',
        images: art.images || [], // Load existing images array
        description: art.description || '',
        tools: art.tools || '',
        is_featured: Boolean(art.is_featured),
      });
    } else {
      resetArtworkForm();
    }

    setShowArtworkForm(true);
  };

  const openExhibitionForm = (ex = null) => {
    setError('');

    if (ex) {
      setEditingExhibitionId(ex.id);
      setExhibitionForm({
        year: ex.year ? String(ex.year).split('T')[0] : '',
        title: ex.title || '',
        location: ex.location || '',
        description: ex.description || '',
      });
    } else {
      resetExhibitionForm();
    }

    setShowExhibitionForm(true);
  };

  const handleArtworkFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setArtworkFiles(files);
  };

  const removeArtworkFile = (index) => {
    setArtworkFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleArtworkSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSavingArtwork(true);

    try {
      if (!artForm.title.trim()) {
        setError('Artwork title is required.');
        setSavingArtwork(false);
        return;
      }

      let finalImages = artForm.images || [];

      // If new files are uploaded, they replace the existing ones for simplicity
      if (artworkFiles.length > 0) {
        finalImages = await uploadImagesToStorage(artworkFiles);
      } else if (finalImages.length === 0 && artForm.image) {
        // Fallback for older entries that only had a single image string
        finalImages = [artForm.image];
      }

      const coverImage = finalImages.length > 0 ? finalImages[0] : '';

      if (!coverImage) {
        setError('Please upload at least one image.');
        setSavingArtwork(false);
        return;
      }

      const payload = {
        title: artForm.title.trim(),
        category: artForm.category.trim(),
        medium: artForm.medium.trim(),
        year: artForm.year ? artForm.year : null,
        image: coverImage, 
        images: finalImages, // Save the full array to the new column
        description: artForm.description.trim(),
        tools: artForm.tools.trim(),
        is_featured: Boolean(artForm.is_featured),
      };

      const result = editingArtworkId
        ? await supabase.from('artworks').update(payload).eq('id', editingArtworkId).select()
        : await supabase.from('artworks').insert([payload]).select();

      const { data: writeData, error: writeError } = result;

      if (writeError) {
        setError(`Error ${editingArtworkId ? 'updating' : 'adding'} artwork: ${writeError.message}`);
        return;
      }

      if (!writeData || writeData.length === 0) {
        setError('The database did not return a saved row. Check RLS policies.');
        return;
      }

      resetArtworkForm();
      setShowArtworkForm(false);
      await fetchArtworks();
    } catch (err) {
      setError(err?.message || 'Artwork upload failed.');
    } finally {
      setSavingArtwork(false);
    }
  };

  const handleExhibitionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSavingExhibition(true);

    try {
      if (!exhibitionForm.title.trim()) {
        setError('Event title is required.');
        return;
      }

      if (!exhibitionForm.year || exhibitionForm.year.trim() === '') {
        setError('Event date is required.');
        return;
      }

      const payload = {
        year: exhibitionForm.year,
        title: exhibitionForm.title.trim(),
        location: exhibitionForm.location.trim(),
        description: exhibitionForm.description.trim(),
      };

      const result = editingExhibitionId
        ? await supabase.from('exhibitions').update(payload).eq('id', editingExhibitionId).select()
        : await supabase.from('exhibitions').insert([payload]).select();

      const { data: writeData, error: writeError } = result;

      if (writeError) {
        setError(`Error ${editingExhibitionId ? 'updating' : 'adding'} exhibition: ${writeError.message}`);
        return;
      }

      if (!writeData || writeData.length === 0) {
        setError('The database did not return a saved row. Check RLS policies.');
        return;
      }

      resetExhibitionForm();
      setShowExhibitionForm(false);
      await fetchExhibitions();
    } catch (err) {
      setError(err?.message || 'Event save failed.');
    } finally {
      setSavingExhibition(false);
    }
  };

  const handleDeleteArtwork = async (e, artworkId) => {
    e.stopPropagation();
    setError('');

    const confirmDelete = window.confirm('Delete this artwork permanently?');
    if (!confirmDelete) return;

    const { data, error: deleteError } = await supabase
      .from('artworks')
      .delete()
      .eq('id', artworkId)
      .select();

    if (deleteError) {
      setError(`Failed to delete artwork: ${deleteError.message}`);
      return;
    }

    if (!data || data.length === 0) {
      setError('Delete did not return a row. Check your Row Level Security (RLS) policies.');
      return;
    }

    await fetchArtworks();
    setSelectedArtworkIds((prev) => prev.filter((id) => id !== artworkId));
  };

  const handleDeleteExhibition = async (e, exhibitionId) => {
    e.stopPropagation();
    setError('');

    const confirmDelete = window.confirm('Delete this event permanently?');
    if (!confirmDelete) return;

    const { data, error: deleteError } = await supabase
      .from('exhibitions')
      .delete()
      .eq('id', exhibitionId)
      .select();

    if (deleteError) {
      setError(`Failed to delete event: ${deleteError.message}`);
      return;
    }

    if (!data || data.length === 0) {
      setError('Delete did not return a row. Check your Row Level Security (RLS) policies.');
      return;
    }

    await fetchExhibitions();
    setSelectedExhibitionIds((prev) => prev.filter((id) => id !== exhibitionId));
  };

  const toggleFeatureArtwork = async (e, artwork) => {
    e.stopPropagation();
    setError('');

    const nextValue = !artwork.is_featured;

    const { data, error: updateError } = await supabase
      .from('artworks')
      .update({ is_featured: nextValue })
      .eq('id', artwork.id)
      .select();

    if (updateError) {
      setError(`Failed to update featured status: ${updateError.message}`);
      return;
    }

    if (!data || data.length === 0) {
      setError('Update did not return a row. Check your Row Level Security (RLS) policies.');
      return;
    }

    setArtworks((prev) =>
      prev.map((item) =>
        item.id === artwork.id ? { ...item, is_featured: nextValue } : item
      )
    );
  };

  const toggleSelectArtwork = (id) => {
    setSelectedArtworkIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectExhibition = (id) => {
    setSelectedExhibitionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisibleArtworks = () => {
    if (artworkBulkAllSelected) {
      setSelectedArtworkIds((prev) => prev.filter((id) => !allFilteredArtworkIds.includes(id)));
    } else {
      setSelectedArtworkIds((prev) => Array.from(new Set([...prev, ...allFilteredArtworkIds])));
    }
  };

  const toggleSelectAllVisibleExhibitions = () => {
    if (exhibitionBulkAllSelected) {
      setSelectedExhibitionIds((prev) =>
        prev.filter((id) => !allFilteredExhibitionIds.includes(id))
      );
    } else {
      setSelectedExhibitionIds((prev) => Array.from(new Set([...prev, ...allFilteredExhibitionIds])));
    }
  };

  const bulkDeleteArtworks = async () => {
    if (!selectedArtworkIds.length) return;
    setError('');

    const confirmDelete = window.confirm(`Delete ${selectedArtworkIds.length} selected artwork(s)?`);
    if (!confirmDelete) return;

    const { data, error: deleteError } = await supabase
      .from('artworks')
      .delete()
      .in('id', selectedArtworkIds)
      .select();

    if (deleteError) {
      setError(`Failed to delete selected artworks: ${deleteError.message}`);
      return;
    }

    if (!data || data.length === 0) {
      setError('Bulk delete did not return rows. Check your Row Level Security (RLS) policies.');
      return;
    }

    setSelectedArtworkIds([]);
    await fetchArtworks();
  };

  const bulkFeatureArtworks = async (isFeatured) => {
    if (!selectedArtworkIds.length) return;
    setError('');

    const { data, error: updateError } = await supabase
      .from('artworks')
      .update({ is_featured: isFeatured })
      .in('id', selectedArtworkIds)
      .select();

    if (updateError) {
      setError(`Failed to update selected artworks: ${updateError.message}`);
      return;
    }

    if (!data || data.length === 0) {
      setError('Bulk update did not return rows. Check your Row Level Security (RLS) policies.');
      return;
    }

    setSelectedArtworkIds([]);
    await fetchArtworks();
  };

  const bulkDeleteExhibitions = async () => {
    if (!selectedExhibitionIds.length) return;
    setError('');

    const confirmDelete = window.confirm(`Delete ${selectedExhibitionIds.length} selected event(s)?`);
    if (!confirmDelete) return;

    const { data, error: deleteError } = await supabase
      .from('exhibitions')
      .delete()
      .in('id', selectedExhibitionIds)
      .select();

    if (deleteError) {
      setError(`Failed to delete selected events: ${deleteError.message}`);
      return;
    }

    if (!data || data.length === 0) {
      setError('Bulk delete did not return rows. Check your Row Level Security (RLS) policies.');
      return;
    }

    setSelectedExhibitionIds([]);
    await fetchExhibitions();
  };

  // Determine which images to show in the preview area
  const existingImages = artForm.images?.length > 0 ? artForm.images : (artForm.image ? [artForm.image] : []);

  return (
    <main className="admin-dashboard animate-fade-in">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <p className="admin-brand__eyebrow">Control center</p>
          <h2>Auntie’s Gallery</h2>
        </div>

        <nav className="admin-nav" aria-label="Admin sections">
          <button
            className={activeTab === 'artworks' ? 'active' : ''}
            onClick={() => setActiveTab('artworks')}
            type="button"
          >
            <ImageIcon size={18} />
            Artworks
          </button>
          <button
            className={activeTab === 'exhibitions' ? 'active' : ''}
            onClick={() => setActiveTab('exhibitions')}
            type="button"
          >
            <CalendarDays size={18} />
            Events
          </button>
        </nav>

        <div className="admin-sidebar__stats">
          <div className="mini-stat">
            <span className="mini-stat__value">{artworks.length}</span>
            <span className="mini-stat__label">Artworks</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat__value">{featuredCount}</span>
            <span className="mini-stat__label">Featured</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat__value">{exhibitions.length}</span>
            <span className="mini-stat__label">Events</span>
          </div>
        </div>
      </aside>

      <section className="admin-content">
        {error && (
          <div className="admin-alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {activeTab === 'artworks' && (
          <div className="admin-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Artwork management</p>
                <h1>Posted artworks</h1>
                <p className="panel-subtitle">
                  Search, filter, edit, feature on the home page, or remove items from the archive.
                </p>
              </div>

              <button
                type="button"
                className="action-btn action-btn--primary"
                onClick={() => openArtworkForm()}
              >
                <Plus size={18} />
                Create new
              </button>
            </div>

            <div className="toolbar">
              <div className="toolbar__search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search artworks by title, category, medium, or date"
                  value={artworkSearch}
                  onChange={(e) => setArtworkSearch(e.target.value)}
                />
              </div>

              <div className="toolbar__filter">
                <Filter size={18} />
                <select
                  value={artworkCategory}
                  onChange={(e) => setArtworkCategory(e.target.value)}
                >
                  {artworkCategories.map((category) => (
                    <option key={category} value={category}>
                      {category === 'All' ? 'All categories' : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {showArtworkForm && (
              <div className="form-card">
                <div className="form-card__header">
                  <h2>{editingArtworkId ? 'Edit artwork' : 'Add new artwork'}</h2>
                  <p>Upload one or more images. The first image becomes the main cover image.</p>
                </div>

                <form onSubmit={handleArtworkSubmit} className="admin-form">
                  <div className="form-grid">
                    <input
                      type="text"
                      placeholder="Title *"
                      required
                      value={artForm.title}
                      onChange={(e) => setArtForm({ ...artForm, title: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={artForm.category}
                      onChange={(e) => setArtForm({ ...artForm, category: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Medium / material"
                      value={artForm.medium}
                      onChange={(e) => setArtForm({ ...artForm, medium: e.target.value })}
                    />
                    <input
                      type="date"
                      title="Date"
                      value={artForm.year}
                      onChange={(e) => setArtForm({ ...artForm, year: e.target.value })}
                    />
                  </div>

                  <div className="upload-card">
                    <div className="upload-card__header">
                      <div>
                        <h3>Artwork images</h3>
                        <p>Pick one or more image files. The first one becomes the cover image.</p>
                      </div>
                      <span className="upload-chip">
                        {artworkFiles.length > 0
                          ? `${artworkFiles.length} new files chosen`
                          : existingImages.length > 0
                            ? `${existingImages.length} current images`
                            : 'No image chosen'}
                      </span>
                    </div>

                    <input
                      key={artworkFileInputKey}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleArtworkFilesChange}
                    />

                    <p className="upload-note">
                      Note: Uploading new files here will replace the existing image set entirely.
                    </p>

                    {/* Previews for NEW files being uploaded */}
                    {artworkFiles.length > 0 && (
                      <div className="upload-preview-grid">
                        {artworkPreviewUrls.map((url, index) => (
                          <div key={url} className="upload-preview">
                            <img src={url} alt={`Selected upload ${index + 1}`} />
                            <span className="upload-preview__tag">
                              {index === 0 ? 'Cover' : `Image ${index + 1}`}
                            </span>
                            <button
                              type="button"
                              className="upload-preview__remove"
                              onClick={() => removeArtworkFile(index)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Previews for EXISTING files (if no new ones selected) */}
                    {artworkFiles.length === 0 && existingImages.length > 0 && (
                      <div className="upload-preview-grid">
                        {existingImages.map((imgUrl, index) => (
                          <div key={imgUrl} className="upload-preview upload-preview--current">
                            <img src={imgUrl} alt={`Current view ${index + 1}`} />
                            <span className="upload-preview__tag">
                              {index === 0 ? 'Current cover' : `Current image ${index + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <textarea
                    placeholder="Description"
                    rows="4"
                    value={artForm.description}
                    onChange={(e) => setArtForm({ ...artForm, description: e.target.value })}
                  />

                  <input
                    type="text"
                    placeholder="Tools used"
                    value={artForm.tools}
                    onChange={(e) => setArtForm({ ...artForm, tools: e.target.value })}
                  />

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={artForm.is_featured}
                      onChange={(e) => setArtForm({ ...artForm, is_featured: e.target.checked })}
                    />
                    Feature on home page
                  </label>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="action-btn action-btn--primary"
                      disabled={savingArtwork}
                    >
                      {savingArtwork
                        ? 'Saving…'
                        : editingArtworkId
                          ? 'Update artwork'
                          : 'Publish artwork'}
                    </button>
                    <button
                      type="button"
                      className="action-btn action-btn--ghost"
                      onClick={() => {
                        resetArtworkForm();
                        setShowArtworkForm(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bulk-bar">
              <label className="bulk-check">
                {artworkBulkAllSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                <input
                  type="checkbox"
                  checked={artworkBulkAllSelected}
                  onChange={toggleSelectAllVisibleArtworks}
                />
                Select all visible
              </label>

              <div className="bulk-bar__actions">
                <button
                  type="button"
                  className="action-btn action-btn--ghost"
                  onClick={() => bulkFeatureArtworks(true)}
                  disabled={!selectedArtworkIds.length}
                >
                  <Star size={18} />
                  Feature selected
                </button>
                <button
                  type="button"
                  className="action-btn action-btn--ghost"
                  onClick={() => bulkFeatureArtworks(false)}
                  disabled={!selectedArtworkIds.length}
                >
                  <StarOff size={18} />
                  Unfeature selected
                </button>
                <button
                  type="button"
                  className="action-btn action-btn--danger"
                  onClick={bulkDeleteArtworks}
                  disabled={!selectedArtworkIds.length}
                >
                  <Trash2 size={18} />
                  Delete selected
                </button>
              </div>
            </div>

            <div className="list-meta">
              <p>
                {loadingArtworks
                  ? 'Loading artworks…'
                  : `${filteredArtworks.length} artwork${filteredArtworks.length === 1 ? '' : 's'} shown`}
              </p>
              <p>{selectedArtworkIds.length} selected</p>
            </div>

            <div className="list-grid">
              {filteredArtworks.map((art) => (
                <article
                  key={art.id}
                  className={`list-card ${selectedArtworkIds.includes(art.id) ? 'list-card--selected' : ''}`}
                >
                  <div className="list-card__select">
                    <input
                      type="checkbox"
                      checked={selectedArtworkIds.includes(art.id)}
                      onChange={() => toggleSelectArtwork(art.id)}
                      aria-label={`Select artwork ${art.title}`}
                    />
                  </div>

                  <div className="list-card__image">
                    <img src={art.image} alt={art.title} />
                  </div>

                  <div className="list-card__body">
                    <div className="list-card__top">
                      <div>
                        <h3>{art.title}</h3>
                        <p>
                          {art.category || 'Uncategorized'}
                          {art.year ? ` • ${formatDate(art.year)}` : ''}
                        </p>
                      </div>

                      {art.is_featured ? (
                        <span className="badge badge--featured">Featured</span>
                      ) : (
                        <span className="badge">Archive</span>
                      )}
                    </div>

                    <p className="list-card__description">
                      {art.description || 'No description provided.'}
                    </p>

                    <div className="list-card__footer">
                      <div className="pill-row">
                        {art.medium && <span className="pill">{art.medium}</span>}
                        {art.tools && <span className="pill">{art.tools}</span>}
                      </div>

                      <div className="card-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openArtworkForm(art);
                          }}
                          title="Edit artwork"
                        >
                          <Pencil size={18} />
                          Edit
                        </button>

                        <button
                          type="button"
                          className="icon-btn icon-btn--feature"
                          onClick={(e) => toggleFeatureArtwork(e, art)}
                          title={art.is_featured ? 'Remove from home page' : 'Feature on home page'}
                        >
                          {art.is_featured ? <StarOff size={18} /> : <Star size={18} />}
                          {art.is_featured ? 'Unfeature' : 'Feature'}
                        </button>

                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          onClick={(e) => handleDeleteArtwork(e, art.id)}
                          title="Delete artwork"
                        >
                          <Trash2 size={18} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {!loadingArtworks && filteredArtworks.length === 0 && (
              <div className="empty-state">
                <Layers3 size={24} />
                <h3>No artworks found</h3>
                <p>Try a different search term or category.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'exhibitions' && (
          <div className="admin-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Event management</p>
                <h1>Events</h1>
                <p className="panel-subtitle">
                  Create, review, edit, and remove event entries from the archive.
                </p>
              </div>

              <button
                type="button"
                className="action-btn action-btn--primary"
                onClick={() => openExhibitionForm()}
              >
                <Plus size={18} />
                Create new
              </button>
            </div>

            <div className="toolbar">
              <div className="toolbar__search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search events by title, location, or date"
                  value={exhibitionSearch}
                  onChange={(e) => setExhibitionSearch(e.target.value)}
                />
              </div>
            </div>

            {showExhibitionForm && (
              <div className="form-card">
                <div className="form-card__header">
                  <h2>{editingExhibitionId ? 'Edit event' : 'Add new event'}</h2>
                </div>

                <form onSubmit={handleExhibitionSubmit} className="admin-form">
                  <div className="form-grid">
                    <input
                      type="date"
                      title="Event date"
                      required
                      value={exhibitionForm.year}
                      onChange={(e) => setExhibitionForm({ ...exhibitionForm, year: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Event title *"
                      required
                      value={exhibitionForm.title}
                      onChange={(e) => setExhibitionForm({ ...exhibitionForm, title: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={exhibitionForm.location}
                      onChange={(e) =>
                        setExhibitionForm({ ...exhibitionForm, location: e.target.value })
                      }
                    />
                  </div>

                  <textarea
                    placeholder="Description"
                    rows="4"
                    value={exhibitionForm.description}
                    onChange={(e) =>
                      setExhibitionForm({ ...exhibitionForm, description: e.target.value })
                    }
                  />

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="action-btn action-btn--primary"
                      disabled={savingExhibition}
                    >
                      {savingExhibition
                        ? 'Saving…'
                        : editingExhibitionId
                          ? 'Update event'
                          : 'Add event'}
                    </button>
                    <button
                      type="button"
                      className="action-btn action-btn--ghost"
                      onClick={() => {
                        resetExhibitionForm();
                        setShowExhibitionForm(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bulk-bar">
              <label className="bulk-check">
                {exhibitionBulkAllSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                <input
                  type="checkbox"
                  checked={exhibitionBulkAllSelected}
                  onChange={toggleSelectAllVisibleExhibitions}
                />
                Select all visible
              </label>

              <div className="bulk-bar__actions">
                <button
                  type="button"
                  className="action-btn action-btn--danger"
                  onClick={bulkDeleteExhibitions}
                  disabled={!selectedExhibitionIds.length}
                >
                  <Trash2 size={18} />
                  Delete selected
                </button>
              </div>
            </div>

            <div className="list-meta">
              <p>
                {loadingExhibitions
                  ? 'Loading events…'
                  : `${filteredExhibitions.length} event${filteredExhibitions.length === 1 ? '' : 's'} shown`}
              </p>
              <p>{selectedExhibitionIds.length} selected</p>
            </div>

            <div className="timeline-list">
              {filteredExhibitions.map((ex) => (
                <article
                  key={ex.id}
                  className={`timeline-card ${selectedExhibitionIds.includes(ex.id) ? 'timeline-card--selected' : ''}`}
                >
                  <div className="timeline-card__select">
                    <input
                      type="checkbox"
                      checked={selectedExhibitionIds.includes(ex.id)}
                      onChange={() => toggleSelectExhibition(ex.id)}
                      aria-label={`Select event ${ex.title}`}
                    />
                  </div>

                  <div className="timeline-card__year">{formatDate(ex.year) || '—'}</div>
                  <div className="timeline-card__body">
                    <div className="timeline-card__top">
                      <div>
                        <h3>{ex.title}</h3>
                        <p>{ex.location || 'No location provided'}</p>
                      </div>

                      <div className="card-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openExhibitionForm(ex);
                          }}
                        >
                          <Pencil size={18} />
                          Edit
                        </button>

                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          onClick={(e) => handleDeleteExhibition(e, ex.id)}
                        >
                          <Trash2 size={18} />
                          Delete
                        </button>
                      </div>
                    </div>

                    {ex.description && <p className="timeline-card__description">{ex.description}</p>}
                  </div>
                </article>
              ))}
            </div>

            {!loadingExhibitions && filteredExhibitions.length === 0 && (
              <div className="empty-state">
                <Layers3 size={24} />
                <h3>No events found</h3>
                <p>Try a different search term.</p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}