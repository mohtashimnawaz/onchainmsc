import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { onchainmsc_backend } from 'declarations/onchainmsc_backend';
import { 
  Music, 
  Users, 
  TrendingUp, 
  Play, 
  Heart, 
  MoreHorizontal,
  Star,
  Download
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated, artist } = useAuth();
  const [stats, setStats] = useState({
    totalTracks: 0,
    totalArtists: 0,
    totalPlays: 0,
    totalRevenue: 0
  });
  const [featuredTracks, setFeaturedTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load platform analytics
      const analytics = await onchainmsc_backend.get_platform_analytics();
      setStats({
        totalTracks: Number(analytics.total_tracks),
        totalArtists: Number(analytics.total_artists),
        totalPlays: Number(analytics.total_plays),
        totalRevenue: Number(analytics.total_revenue)
      });

      // Load featured tracks (recent public tracks)
      const tracks = await onchainmsc_backend.list_tracks();
      const publicTracks = tracks
        .filter(track => track.visibility.Public !== undefined)
        .sort((a, b) => Number(b.play_count) - Number(a.play_count))
        .slice(0, 6);
      setFeaturedTracks(publicTracks);

      // Load top artists
      const artists = await onchainmsc_backend.list_artists();
      const sortedArtists = artists
        .sort((a, b) => Number(b.royalty_balance) - Number(a.royalty_balance))
        .slice(0, 8);
      setTopArtists(sortedArtists);

    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const playTrack = async (trackId) => {
    try {
      await onchainmsc_backend.record_play(trackId);
      await onchainmsc_backend.increment_play_count(trackId);
      // In a real app, you would also start audio playback here
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to OnChain Music
          </h1>
          <p className="hero-subtitle">
            The decentralized platform for music collaboration, creation, and monetization
          </p>
          {!isAuthenticated && (
            <div className="hero-actions">
              <Link to="/tracks" className="btn btn-primary">
                Explore Music
              </Link>
              <Link to="/artists" className="btn btn-secondary">
                Discover Artists
              </Link>
            </div>
          )}
          {isAuthenticated && !artist && (
            <div className="hero-actions">
              <Link to="/profile" className="btn btn-primary">
                Complete Your Profile
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Platform Stats */}
      <section className="stats-section">
        <div className="grid grid-4">
          <div className="stat-card card">
            <div className="stat-icon">
              <Music />
            </div>
            <div className="stat-value">{formatNumber(stats.totalTracks)}</div>
            <div className="stat-label">Total Tracks</div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon">
              <Users />
            </div>
            <div className="stat-value">{formatNumber(stats.totalArtists)}</div>
            <div className="stat-label">Active Artists</div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon">
              <Play />
            </div>
            <div className="stat-value">{formatNumber(stats.totalPlays)}</div>
            <div className="stat-label">Total Plays</div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon">
              <TrendingUp />
            </div>
            <div className="stat-value">{formatNumber(stats.totalRevenue)}</div>
            <div className="stat-label">Revenue Generated</div>
          </div>
        </div>
      </section>

      {/* Featured Tracks */}
      <section className="featured-section">
        <div className="section-header">
          <h2>Featured Tracks</h2>
          <Link to="/tracks" className="view-all-link">
            View All
          </Link>
        </div>
        <div className="grid grid-3">
          {featuredTracks.map((track) => (
            <TrackCard 
              key={track.id} 
              track={track} 
              onPlay={() => playTrack(track.id)}
            />
          ))}
        </div>
      </section>

      {/* Top Artists */}
      <section className="artists-section">
        <div className="section-header">
          <h2>Top Artists</h2>
          <Link to="/artists" className="view-all-link">
            View All
          </Link>
        </div>
        <div className="grid grid-4">
          {topArtists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      </section>

      <style jsx>{`
        .home {
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero {
          text-align: center;
          padding: 4rem 0;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
          border-radius: 1rem;
          margin-bottom: 3rem;
        }

        .hero-title {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .stats-section {
          margin-bottom: 3rem;
        }

        .featured-section,
        .artists-section {
          margin-bottom: 3rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-header h2 {
          font-size: 1.75rem;
          font-weight: bold;
          color: var(--text-primary);
        }

        .view-all-link {
          color: var(--primary-color);
          text-decoration: none;
          font-weight: 500;
        }

        .view-all-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2rem;
          }

          .hero-subtitle {
            font-size: 1rem;
          }

          .hero-actions {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};

const TrackCard = ({ track, onPlay }) => {
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (track.ratings && track.ratings.length > 0) {
      const avgRating = track.ratings.reduce((sum, [, rating]) => sum + rating, 0) / track.ratings.length;
      setRating(avgRating);
    }
  }, [track.ratings]);

  return (
    <div className="track-card card">
      <div className="track-header">
        <div className="track-info">
          <h3>{track.title}</h3>
          <p>{track.description.substring(0, 100)}...</p>
        </div>
        <button className="more-btn">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="track-meta">
        <div className="meta-item">
          <Play size={14} />
          <span>{formatNumber(Number(track.play_count))}</span>
        </div>
        <div className="meta-item">
          <Star size={14} />
          <span>{rating.toFixed(1)}</span>
        </div>
        <div className="meta-item">
          <Users size={14} />
          <span>{track.contributors.length}</span>
        </div>
      </div>

      {track.tags && track.tags.length > 0 && (
        <div className="track-tags">
          {track.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="track-actions">
        <button onClick={onPlay} className="btn btn-primary">
          <Play size={16} />
          Play
        </button>
        <button className="btn btn-secondary">
          <Heart size={16} />
        </button>
        {track.downloadable && (
          <button className="btn btn-secondary">
            <Download size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

const ArtistCard = ({ artist }) => {
  return (
    <div className="artist-card card">
      <div className="artist-avatar">
        {artist.name.charAt(0)}
      </div>
      <h3>{artist.name}</h3>
      <p>{artist.bio.substring(0, 80)}...</p>
      <div className="artist-stats">
        <div className="stat">
          <div className="stat-value">{formatNumber(Number(artist.royalty_balance))}</div>
          <div className="stat-label">Tokens</div>
        </div>
      </div>
      <Link to={`/artists/${artist.id}`} className="btn btn-secondary">
        View Profile
      </Link>
    </div>
  );
};

const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export default Home;
