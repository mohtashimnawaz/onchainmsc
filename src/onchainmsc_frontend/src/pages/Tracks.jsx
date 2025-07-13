import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { onchainmsc_backend } from 'declarations/onchainmsc_backend';
import { 
  Search, 
  Filter, 
  Plus, 
  Play, 
  Pause, 
  Heart, 
  Share2, 
  Download, 
  Star,
  Users,
  Eye,
  EyeOff,
  UserPlus,
  MoreHorizontal
} from 'lucide-react';

const Tracks = () => {
  const { isAuthenticated, artist } = useAuth();
  const { success, error } = useToast();
  const [tracks, setTracks] = useState([]);
  const [filteredTracks, setFilteredTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedVisibility, setSelectedVisibility] = useState('');
  const [genres, setGenres] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  useEffect(() => {
    loadTracks();
  }, []);

  useEffect(() => {
    filterTracks();
  }, [tracks, searchTerm, selectedGenre, selectedVisibility]);

  const loadTracks = async () => {
    try {
      setLoading(true);
      const allTracks = await onchainmsc_backend.list_tracks();
      
      // Filter to show only public tracks for non-authenticated users
      const visibleTracks = isAuthenticated 
        ? allTracks 
        : allTracks.filter(track => track.visibility.Public !== undefined);
      
      setTracks(visibleTracks);
      
      // Extract unique genres
      const uniqueGenres = [...new Set(
        visibleTracks
          .map(track => track.genre)
          .filter(genre => genre && genre.length > 0)
          .map(genre => genre[0])
      )];
      setGenres(uniqueGenres);
    } catch (err) {
      console.error('Failed to load tracks:', err);
      error('Failed to load tracks');
    } finally {
      setLoading(false);
    }
  };

  const filterTracks = () => {
    let filtered = tracks;

    if (searchTerm) {
      filtered = filtered.filter(track =>
        track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        track.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        track.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedGenre) {
      filtered = filtered.filter(track => 
        track.genre && track.genre.length > 0 && track.genre[0] === selectedGenre
      );
    }

    if (selectedVisibility) {
      filtered = filtered.filter(track => {
        if (selectedVisibility === 'Public') return track.visibility.Public !== undefined;
        if (selectedVisibility === 'Private') return track.visibility.Private !== undefined;
        if (selectedVisibility === 'InviteOnly') return track.visibility.InviteOnly !== undefined;
        return true;
      });
    }

    setFilteredTracks(filtered);
  };

  const playTrack = async (track) => {
    try {
      if (currentlyPlaying === track.id) {
        setCurrentlyPlaying(null);
      } else {
        await onchainmsc_backend.record_play(track.id);
        await onchainmsc_backend.increment_play_count(track.id);
        setCurrentlyPlaying(track.id);
        success(`Now playing: ${track.title}`);
      }
    } catch (err) {
      console.error('Failed to play track:', err);
      error('Failed to play track');
    }
  };

  const likeTrack = async (trackId) => {
    if (!isAuthenticated || !artist) {
      error('Please log in to like tracks');
      return;
    }

    try {
      await onchainmsc_backend.follow_track(trackId);
      success('Track added to favorites');
    } catch (err) {
      console.error('Failed to like track:', err);
      error('Failed to like track');
    }
  };

  const downloadTrack = async (track) => {
    if (!track.downloadable) {
      error('This track is not available for download');
      return;
    }

    try {
      await onchainmsc_backend.record_download(track.id);
      success('Download started');
      // In a real app, you would handle the actual file download here
    } catch (err) {
      console.error('Failed to download track:', err);
      error('Failed to download track');
    }
  };

  const rateTrack = async (trackId, rating) => {
    if (!isAuthenticated || !artist) {
      error('Please log in to rate tracks');
      return;
    }

    try {
      await onchainmsc_backend.rate_track(trackId, artist.id, rating);
      success('Track rated successfully');
      loadTracks(); // Reload to update ratings
    } catch (err) {
      console.error('Failed to rate track:', err);
      error('Failed to rate track');
    }
  };

  const getVisibilityIcon = (visibility) => {
    if (visibility.Public !== undefined) return <Eye size={14} />;
    if (visibility.Private !== undefined) return <EyeOff size={14} />;
    if (visibility.InviteOnly !== undefined) return <UserPlus size={14} />;
    return <Eye size={14} />;
  };

  const getVisibilityText = (visibility) => {
    if (visibility.Public !== undefined) return 'Public';
    if (visibility.Private !== undefined) return 'Private';
    if (visibility.InviteOnly !== undefined) return 'Invite Only';
    return 'Unknown';
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const calculateAverageRating = (ratings) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, [, rating]) => acc + rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="tracks">
      <div className="tracks-header">
        <div className="header-content">
          <h1>Music Tracks</h1>
          <p>Discover and enjoy music from artists around the world</p>
        </div>
        {isAuthenticated && artist && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            Create Track
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="filters-section card">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search tracks, artists, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="input"
          >
            <option value="">All Genres</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>

          {isAuthenticated && (
            <select
              value={selectedVisibility}
              onChange={(e) => setSelectedVisibility(e.target.value)}
              className="input"
            >
              <option value="">All Visibility</option>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
              <option value="InviteOnly">Invite Only</option>
            </select>
          )}
        </div>
      </div>

      {/* Tracks Grid */}
      <div className="tracks-grid">
        {filteredTracks.length > 0 ? (
          filteredTracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              isPlaying={currentlyPlaying === track.id}
              onPlay={() => playTrack(track)}
              onLike={() => likeTrack(track.id)}
              onDownload={() => downloadTrack(track)}
              onRate={(rating) => rateTrack(track.id, rating)}
              canInteract={isAuthenticated && artist}
            />
          ))
        ) : (
          <div className="empty-state">
            <Music size={48} />
            <h3>No tracks found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateTrackModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadTracks}
        />
      )}

      <style jsx>{`
        .tracks {
          max-width: 1200px;
          margin: 0 auto;
        }

        .tracks-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .header-content h1 {
          font-size: 2rem;
          font-weight: bold;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .header-content p {
          color: var(--text-secondary);
        }

        .filters-section {
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .search-bar {
          position: relative;
          margin-bottom: 1rem;
        }

        .search-bar svg {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
        }

        .search-bar input {
          padding-left: 3rem;
        }

        .filter-controls {
          display: flex;
          gap: 1rem;
        }

        .filter-controls select {
          flex: 1;
        }

        .tracks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }

        .empty-state svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .tracks-header {
            flex-direction: column;
            gap: 1rem;
          }

          .filter-controls {
            flex-direction: column;
          }

          .tracks-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

const TrackCard = ({ 
  track, 
  isPlaying, 
  onPlay, 
  onLike, 
  onDownload, 
  onRate, 
  canInteract 
}) => {
  const [showRating, setShowRating] = useState(false);
  const averageRating = parseFloat(calculateAverageRating(track.ratings));

  return (
    <div className="track-card card">
      <div className="track-header">
        <div className="track-info">
          <h3>{track.title}</h3>
          <p>{track.description.substring(0, 100)}...</p>
        </div>
        <div className="track-actions">
          <button className="action-btn">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="track-meta">
        <div className="meta-item">
          <Play size={14} />
          <span>{formatNumber(Number(track.play_count))}</span>
        </div>
        <div className="meta-item">
          <Star size={14} />
          <span>{averageRating}</span>
        </div>
        <div className="meta-item">
          <Users size={14} />
          <span>{track.contributors.length}</span>
        </div>
        <div className="meta-item">
          {getVisibilityIcon(track.visibility)}
          <span>{getVisibilityText(track.visibility)}</span>
        </div>
      </div>

      {track.tags && track.tags.length > 0 && (
        <div className="track-tags">
          {track.tags.slice(0, 4).map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
      )}

      {track.genre && track.genre.length > 0 && (
        <div className="track-genre">
          <span className="genre-badge">{track.genre[0]}</span>
        </div>
      )}

      <div className="track-controls">
        <button 
          onClick={onPlay}
          className="btn btn-primary play-btn"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        {canInteract && (
          <>
            <button onClick={onLike} className="btn btn-secondary">
              <Heart size={16} />
            </button>
            <button 
              onClick={() => setShowRating(!showRating)}
              className="btn btn-secondary"
            >
              <Star size={16} />
            </button>
          </>
        )}
        
        {track.downloadable && (
          <button onClick={onDownload} className="btn btn-secondary">
            <Download size={16} />
          </button>
        )}
        
        <button className="btn btn-secondary">
          <Share2 size={16} />
        </button>
      </div>

      {showRating && canInteract && (
        <div className="rating-section">
          <p>Rate this track:</p>
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => {
                  onRate(rating);
                  setShowRating(false);
                }}
                className="star-btn"
              >
                <Star 
                  size={20} 
                  fill={rating <= averageRating ? '#fbbf24' : 'none'}
                  color={rating <= averageRating ? '#fbbf24' : '#6b7280'}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .track-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          padding: 1.5rem;
          transition: all 0.2s;
        }

        .track-card:hover {
          border-color: var(--primary-color);
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .track-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .track-info {
          flex: 1;
        }

        .track-info h3 {
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .track-info p {
          color: var(--text-secondary);
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .action-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.25rem;
          transition: all 0.2s;
        }

        .action-btn:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .track-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .track-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .tag {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 1rem;
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .track-genre {
          margin-bottom: 1rem;
        }

        .genre-badge {
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .track-controls {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .play-btn {
          flex: 1;
        }

        .rating-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .rating-section p {
          margin-bottom: 0.5rem;
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .rating-stars {
          display: flex;
          gap: 0.25rem;
        }

        .star-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: all 0.2s;
        }

        .star-btn:hover {
          background: var(--bg-tertiary);
        }
      `}</style>
    </div>
  );
};

const CreateTrackModal = ({ onClose, onSuccess }) => {
  const { artist } = useAuth();
  const { success, error } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    genre: '',
    visibility: 'Public'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!artist) return;

    try {
      setLoading(true);
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const newTrack = await onchainmsc_backend.create_track(
        formData.title,
        formData.description,
        [artist.id] // contributors
      );

      if (newTrack && newTrack.length > 0) {
        const trackId = newTrack[0].id;
        
        // Set genre if provided
        if (formData.genre) {
          await onchainmsc_backend.set_genre(trackId, formData.genre);
        }
        
        // Add tags if provided
        for (const tag of tags) {
          await onchainmsc_backend.add_tag(trackId, tag);
        }
        
        // Set visibility
        const visibility = formData.visibility === 'Public' 
          ? { Public: null }
          : formData.visibility === 'Private'
          ? { Private: null }
          : { InviteOnly: null };
        
        await onchainmsc_backend.set_track_visibility(trackId, visibility);
        
        success('Track created successfully!');
        onSuccess();
        onClose();
      } else {
        error('Failed to create track');
      }
    } catch (err) {
      console.error('Failed to create track:', err);
      error('Failed to create track');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Create New Track</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="input"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input"
              rows={3}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Genre</label>
            <input
              type="text"
              value={formData.genre}
              onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
              className="input"
              placeholder="e.g., Electronic, Rock, Jazz"
            />
          </div>
          
          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="input"
              placeholder="e.g., ambient, chill, instrumental"
            />
          </div>
          
          <div className="form-group">
            <label>Visibility</label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
              className="input"
            >
              <option value="Public">Public</option>
              <option value="Private">Private</option>
              <option value="InviteOnly">Invite Only</option>
            </select>
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Creating...' : 'Create Track'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const calculateAverageRating = (ratings) => {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, [, rating]) => acc + rating, 0);
  return (sum / ratings.length).toFixed(1);
};

const getVisibilityIcon = (visibility) => {
  if (visibility.Public !== undefined) return <Eye size={14} />;
  if (visibility.Private !== undefined) return <EyeOff size={14} />;
  if (visibility.InviteOnly !== undefined) return <UserPlus size={14} />;
  return <Eye size={14} />;
};

const getVisibilityText = (visibility) => {
  if (visibility.Public !== undefined) return 'Public';
  if (visibility.Private !== undefined) return 'Private';
  if (visibility.InviteOnly !== undefined) return 'Invite Only';
  return 'Unknown';
};

export default Tracks;
