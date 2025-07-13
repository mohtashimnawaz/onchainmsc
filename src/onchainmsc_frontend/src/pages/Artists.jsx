import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { onchainmsc_backend } from 'declarations/onchainmsc_backend';
import { 
  Search, 
  Users, 
  Music, 
  DollarSign, 
  UserPlus, 
  MessageCircle,
  Star,
  TrendingUp,
  Award,
  Play
} from 'lucide-react';

const Artists = () => {
  const { isAuthenticated, artist: currentArtist } = useAuth();
  const { success, error } = useToast();
  const [artists, setArtists] = useState([]);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [followedArtists, setFollowedArtists] = useState([]);

  useEffect(() => {
    loadArtists();
    if (isAuthenticated) {
      loadFollowedArtists();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    filterAndSortArtists();
  }, [artists, searchTerm, sortBy]);

  const loadArtists = async () => {
    try {
      setLoading(true);
      const allArtists = await onchainmsc_backend.list_artists();
      setArtists(allArtists);
    } catch (err) {
      console.error('Failed to load artists:', err);
      error('Failed to load artists');
    } finally {
      setLoading(false);
    }
  };

  const loadFollowedArtists = async () => {
    try {
      const followed = await onchainmsc_backend.list_followed_artists();
      setFollowedArtists(followed.map(principal => principal.toString()));
    } catch (err) {
      console.error('Failed to load followed artists:', err);
    }
  };

  const filterAndSortArtists = () => {
    let filtered = artists;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(artist =>
        artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artist.bio.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort artists
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'balance':
          return Number(b.royalty_balance) - Number(a.royalty_balance);
        case 'newest':
          return Number(b.id) - Number(a.id);
        default:
          return 0;
      }
    });

    setFilteredArtists(filtered);
  };

  const followArtist = async (artistPrincipal) => {
    if (!isAuthenticated) {
      error('Please log in to follow artists');
      return;
    }

    try {
      await onchainmsc_backend.follow_artist(artistPrincipal);
      success('Artist followed successfully');
      loadFollowedArtists();
    } catch (err) {
      console.error('Failed to follow artist:', err);
      error('Failed to follow artist');
    }
  };

  const unfollowArtist = async (artistPrincipal) => {
    try {
      await onchainmsc_backend.unfollow_artist(artistPrincipal);
      success('Artist unfollowed');
      loadFollowedArtists();
    } catch (err) {
      console.error('Failed to unfollow artist:', err);
      error('Failed to unfollow artist');
    }
  };

  const sendCollabRequest = async (toArtistId) => {
    if (!isAuthenticated || !currentArtist) {
      error('Please log in to send collaboration requests');
      return;
    }

    try {
      // For this demo, we'll send a request without a specific track
      // In a real app, you might want to select a track or create a new one
      const message = `Hi! I'd like to collaborate with you on a music project.`;
      await onchainmsc_backend.send_collab_request(
        currentArtist.id,
        toArtistId,
        0, // placeholder track ID
        [message]
      );
      success('Collaboration request sent!');
    } catch (err) {
      console.error('Failed to send collaboration request:', err);
      error('Failed to send collaboration request');
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const isFollowing = (artistPrincipal) => {
    return followedArtists.includes(artistPrincipal.toString());
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="artists">
      <div className="artists-header">
        <div className="header-content">
          <h1>Artists</h1>
          <p>Discover talented musicians and collaborate with them</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section card">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search artists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input"
          >
            <option value="name">Sort by Name</option>
            <option value="balance">Sort by Earnings</option>
            <option value="newest">Sort by Newest</option>
          </select>
        </div>
      </div>

      {/* Artists Grid */}
      <div className="artists-grid">
        {filteredArtists.length > 0 ? (
          filteredArtists.map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              isCurrentUser={currentArtist?.id === artist.id}
              isFollowing={isFollowing(artist.user_principal)}
              onFollow={() => followArtist(artist.user_principal)}
              onUnfollow={() => unfollowArtist(artist.user_principal)}
              onCollaborate={() => sendCollabRequest(artist.id)}
              canInteract={isAuthenticated && currentArtist && currentArtist.id !== artist.id}
            />
          ))
        ) : (
          <div className="empty-state">
            <Users size={48} />
            <h3>No artists found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .artists {
          max-width: 1200px;
          margin: 0 auto;
        }

        .artists-header {
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
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .search-bar {
          position: relative;
          flex: 1;
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

        .artists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
          .filters-section {
            flex-direction: column;
          }

          .artists-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

const ArtistCard = ({ 
  artist, 
  isCurrentUser, 
  isFollowing, 
  onFollow, 
  onUnfollow, 
  onCollaborate,
  canInteract 
}) => {
  const [artistTracks, setArtistTracks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadArtistTracks();
  }, [artist.id]);

  const loadArtistTracks = async () => {
    try {
      setLoading(true);
      const tracks = await onchainmsc_backend.search_tracks_by_contributor(artist.id);
      setArtistTracks(tracks);
    } catch (err) {
      console.error('Failed to load artist tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalPlays = () => {
    return artistTracks.reduce((total, track) => total + Number(track.play_count), 0);
  };

  const getAverageRating = () => {
    const allRatings = artistTracks.flatMap(track => track.ratings || []);
    if (allRatings.length === 0) return 0;
    const sum = allRatings.reduce((acc, [, rating]) => acc + rating, 0);
    return (sum / allRatings.length).toFixed(1);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="artist-card card">
      <div className="artist-header">
        <div className="artist-avatar">
          {artist.profile_image_url && artist.profile_image_url.length > 0 ? (
            <img src={artist.profile_image_url[0]} alt={artist.name} />
          ) : (
            <span>{artist.name.charAt(0)}</span>
          )}
        </div>
        
        {isCurrentUser && (
          <div className="current-user-badge">
            <Award size={16} />
            <span>You</span>
          </div>
        )}
      </div>

      <div className="artist-info">
        <h3>{artist.name}</h3>
        <p className="artist-bio">{artist.bio.substring(0, 120)}...</p>
      </div>

      <div className="artist-stats">
        <div className="stat">
          <div className="stat-icon">
            <Music size={16} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{artistTracks.length}</div>
            <div className="stat-label">Tracks</div>
          </div>
        </div>
        
        <div className="stat">
          <div className="stat-icon">
            <Play size={16} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(getTotalPlays())}</div>
            <div className="stat-label">Plays</div>
          </div>
        </div>
        
        <div className="stat">
          <div className="stat-icon">
            <DollarSign size={16} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatNumber(Number(artist.royalty_balance))}</div>
            <div className="stat-label">Tokens</div>
          </div>
        </div>
        
        <div className="stat">
          <div className="stat-icon">
            <Star size={16} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{getAverageRating()}</div>
            <div className="stat-label">Rating</div>
          </div>
        </div>
      </div>

      {artist.social && artist.social.length > 0 && (
        <div className="artist-social">
          <a 
            href={artist.social[0]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-link"
          >
            View Social Profile
          </a>
        </div>
      )}

      {artist.links && artist.links.length > 0 && (
        <div className="artist-links">
          {artist.links[0].slice(0, 2).map((link, index) => (
            <a
              key={index}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="artist-link"
            >
              Link {index + 1}
            </a>
          ))}
        </div>
      )}

      {canInteract && (
        <div className="artist-actions">
          <button
            onClick={isFollowing ? onUnfollow : onFollow}
            className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
          >
            <UserPlus size={16} />
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
          
          <button onClick={onCollaborate} className="btn btn-secondary">
            <MessageCircle size={16} />
            Collaborate
          </button>
        </div>
      )}

      {/* Recent Tracks Preview */}
      {artistTracks.length > 0 && (
        <div className="artist-tracks-preview">
          <h4>Recent Tracks</h4>
          <div className="tracks-list">
            {artistTracks.slice(0, 3).map((track) => (
              <div key={track.id} className="track-preview">
                <div className="track-info">
                  <span className="track-title">{track.title}</span>
                  <span className="track-plays">{formatNumber(Number(track.play_count))} plays</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .artist-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          padding: 1.5rem;
          transition: all 0.2s;
          position: relative;
        }

        .artist-card:hover {
          border-color: var(--primary-color);
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .artist-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .artist-avatar {
          width: 4rem;
          height: 4rem;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
          color: white;
          overflow: hidden;
        }

        .artist-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .current-user-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: var(--success-color);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .artist-info {
          margin-bottom: 1.5rem;
        }

        .artist-info h3 {
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .artist-bio {
          color: var(--text-secondary);
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .artist-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .stat-icon {
          color: var(--primary-color);
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .artist-social {
          margin-bottom: 1rem;
        }

        .social-link {
          color: var(--primary-color);
          text-decoration: none;
          font-size: 0.875rem;
        }

        .social-link:hover {
          text-decoration: underline;
        }

        .artist-links {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .artist-link {
          color: var(--primary-color);
          text-decoration: none;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border: 1px solid var(--primary-color);
          border-radius: 0.25rem;
        }

        .artist-link:hover {
          background: var(--primary-color);
          color: white;
        }

        .artist-actions {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .artist-actions .btn {
          flex: 1;
        }

        .artist-tracks-preview {
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
        }

        .artist-tracks-preview h4 {
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .tracks-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .track-preview {
          padding: 0.5rem;
          background: var(--bg-tertiary);
          border-radius: 0.25rem;
        }

        .track-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .track-title {
          color: var(--text-primary);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .track-plays {
          color: var(--text-secondary);
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
};

export default Artists;
