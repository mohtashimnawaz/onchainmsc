import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { onchainmsc_backend } from '../../../declarations/onchainmsc_backend';

const Playlists = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    track_ids: []
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch playlists
      const playlistsData = await onchainmsc_backend.list_playlists();
      setPlaylists(playlistsData);
      
      // Fetch all tracks for playlist creation
      const tracksData = await onchainmsc_backend.list_tracks();
      setTracks(tracksData);
      
    } catch (error) {
      console.error('Error fetching playlists:', error);
      showToast('Error loading playlists', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTrackToggle = (trackId) => {
    setFormData(prev => ({
      ...prev,
      track_ids: prev.track_ids.includes(trackId)
        ? prev.track_ids.filter(id => id !== trackId)
        : [...prev.track_ids, trackId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPlaylist) {
        // Update existing playlist
        const result = await onchainmsc_backend.update_playlist(
          editingPlaylist.id,
          formData.name,
          formData.description || null,
          formData.track_ids
        );
        
        if (result.length > 0) {
          showToast('Playlist updated successfully', 'success');
          setEditingPlaylist(null);
        }
      } else {
        // Create new playlist
        const result = await onchainmsc_backend.create_playlist(
          formData.name,
          formData.description || null,
          formData.track_ids
        );
        
        if (result.length > 0) {
          showToast('Playlist created successfully', 'success');
          setShowCreateForm(false);
        }
      }
      
      // Reset form and refresh data
      setFormData({ name: '', description: '', track_ids: [] });
      fetchData();
      
    } catch (error) {
      console.error('Error saving playlist:', error);
      showToast('Error saving playlist', 'error');
    }
  };

  const handleEdit = (playlist) => {
    setEditingPlaylist(playlist);
    setFormData({
      name: playlist.name,
      description: playlist.description || '',
      track_ids: playlist.track_ids
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) {
      return;
    }
    
    try {
      const success = await onchainmsc_backend.delete_playlist(playlistId);
      if (success) {
        showToast('Playlist deleted successfully', 'success');
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      showToast('Error deleting playlist', 'error');
    }
  };

  const handleViewPlaylist = async (playlistId) => {
    try {
      const playlist = await onchainmsc_backend.get_playlist(playlistId);
      if (playlist.length > 0) {
        setSelectedPlaylist(playlist[0]);
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
      showToast('Error loading playlist', 'error');
    }
  };

  const getTrackTitle = (trackId) => {
    const track = tracks.find(t => t.id === trackId);
    return track ? track.title : `Track ${trackId}`;
  };

  const getPlaylistDuration = (trackIds) => {
    // Mock duration calculation - in a real app, tracks would have duration
    return `${trackIds.length * 3}:${String(trackIds.length * 30 % 60).padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="loading">Loading playlists...</div>;
  }

  return (
    <div className="playlists-page">
      <div className="page-header">
        <h1>My Playlists</h1>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="create-btn"
        >
          Create Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="empty-state">
          <h2>No playlists found</h2>
          <p>Create your first playlist to get started</p>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="create-btn"
          >
            Create Playlist
          </button>
        </div>
      ) : (
        <div className="playlists-grid">
          {playlists.map(playlist => (
            <div key={playlist.id} className="playlist-card">
              <div className="playlist-cover">
                <div className="playlist-icon">🎵</div>
                <div className="playlist-overlay">
                  <button 
                    onClick={() => handleViewPlaylist(playlist.id)}
                    className="view-btn"
                  >
                    View
                  </button>
                </div>
              </div>
              
              <div className="playlist-info">
                <h3>{playlist.name}</h3>
                {playlist.description && (
                  <p className="description">{playlist.description}</p>
                )}
                <div className="playlist-stats">
                  <span>{playlist.track_ids.length} tracks</span>
                  <span>{getPlaylistDuration(playlist.track_ids)}</span>
                </div>
                <div className="playlist-meta">
                  <span className="owner">By {playlist.owner}</span>
                  <span className="created">
                    Created {new Date(Number(playlist.created_at) / 1000000).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              {playlist.owner === user?.principal && (
                <div className="playlist-actions">
                  <button 
                    onClick={() => handleEdit(playlist)}
                    className="edit-btn"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(playlist.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Playlist Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal playlist-modal">
            <h2>{editingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Select Tracks</label>
                <div className="tracks-selector">
                  {tracks.length === 0 ? (
                    <p>No tracks available</p>
                  ) : (
                    tracks.map(track => (
                      <div key={track.id} className="track-option">
                        <label>
                          <input
                            type="checkbox"
                            checked={formData.track_ids.includes(track.id)}
                            onChange={() => handleTrackToggle(track.id)}
                          />
                          <span className="track-info">
                            <span className="track-title">{track.title}</span>
                            <span className="track-description">{track.description}</span>
                          </span>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="form-actions">
                <button type="submit" disabled={!formData.name.trim()}>
                  {editingPlaylist ? 'Update Playlist' : 'Create Playlist'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingPlaylist(null);
                    setFormData({ name: '', description: '', track_ids: [] });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Playlist Modal */}
      {selectedPlaylist && (
        <div className="modal-overlay">
          <div className="modal playlist-view-modal">
            <div className="playlist-header">
              <h2>{selectedPlaylist.name}</h2>
              <button 
                onClick={() => setSelectedPlaylist(null)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            {selectedPlaylist.description && (
              <p className="playlist-description">{selectedPlaylist.description}</p>
            )}
            
            <div className="playlist-details">
              <div className="detail-item">
                <span className="label">Owner:</span>
                <span className="value">{selectedPlaylist.owner}</span>
              </div>
              <div className="detail-item">
                <span className="label">Created:</span>
                <span className="value">
                  {new Date(Number(selectedPlaylist.created_at) / 1000000).toLocaleDateString()}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Updated:</span>
                <span className="value">
                  {new Date(Number(selectedPlaylist.updated_at) / 1000000).toLocaleDateString()}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Tracks:</span>
                <span className="value">{selectedPlaylist.track_ids.length}</span>
              </div>
            </div>
            
            <div className="playlist-tracks">
              <h3>Tracks</h3>
              {selectedPlaylist.track_ids.length === 0 ? (
                <p>No tracks in this playlist</p>
              ) : (
                <div className="tracks-list">
                  {selectedPlaylist.track_ids.map((trackId, index) => (
                    <div key={trackId} className="track-item">
                      <span className="track-number">{index + 1}</span>
                      <span className="track-title">{getTrackTitle(trackId)}</span>
                      <span className="track-duration">3:30</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Playlists;
