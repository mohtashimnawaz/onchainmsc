import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { onchainmsc_backend } from '../../../declarations/onchainmsc_backend';

const Profile = () => {
  const { user, principal } = useAuth();
  const { showToast } = useToast();
  const [artist, setArtist] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    social: '',
    profile_image_url: '',
    links: []
  });
  const [newLink, setNewLink] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      fetchArtistData();
      fetchNotifications();
    }
  }, [user]);

  const fetchArtistData = async () => {
    try {
      const artistData = await onchainmsc_backend.get_artist(user.id);
      if (artistData.length > 0) {
        setArtist(artistData[0]);
        setFormData({
          name: artistData[0].name,
          bio: artistData[0].bio,
          social: artistData[0].social || '',
          profile_image_url: artistData[0].profile_image_url || '',
          links: artistData[0].links || []
        });
        
        // Fetch analytics
        const metrics = await onchainmsc_backend.get_user_engagement_metrics(user.id);
        if (metrics.length > 0) {
          setAnalytics(metrics[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching artist data:', error);
      showToast('Error loading profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const notifs = await onchainmsc_backend.list_notifications();
      setNotifications(notifs.filter(n => n.user_principal === principal));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddLink = () => {
    if (newLink.trim()) {
      setFormData(prev => ({
        ...prev,
        links: [...prev.links, newLink.trim()]
      }));
      setNewLink('');
    }
  };

  const handleRemoveLink = (index) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      const updated = await onchainmsc_backend.update_artist(
        user.id,
        formData.name,
        formData.bio,
        formData.social || null,
        formData.profile_image_url || null,
        formData.links.length > 0 ? formData.links : null
      );
      
      if (updated.length > 0) {
        setArtist(updated[0]);
        setIsEditing(false);
        showToast('Profile updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Error updating profile', 'error');
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await onchainmsc_backend.mark_notification_read(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const withdrawRoyalties = async () => {
    try {
      const success = await onchainmsc_backend.withdraw_royalties(user.id, artist.royalty_balance);
      if (success) {
        showToast('Royalties withdrawn successfully', 'success');
        fetchArtistData(); // Refresh data
      }
    } catch (error) {
      console.error('Error withdrawing royalties:', error);
      showToast('Error withdrawing royalties', 'error');
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!artist) {
    return <div className="error">Artist profile not found</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-image">
          {artist.profile_image_url ? (
            <img src={artist.profile_image_url} alt={artist.name} />
          ) : (
            <div className="default-avatar">{artist.name.charAt(0)}</div>
          )}
        </div>
        <div className="profile-info">
          <h1>{artist.name}</h1>
          <p>{artist.bio}</p>
          <div className="profile-stats">
            <div className="stat">
              <span className="value">{artist.royalty_balance}</span>
              <span className="label">Royalty Balance</span>
            </div>
            {analytics && (
              <>
                <div className="stat">
                  <span className="value">{analytics.total_tracks_created}</span>
                  <span className="label">Tracks Created</span>
                </div>
                <div className="stat">
                  <span className="value">{analytics.total_plays_received}</span>
                  <span className="label">Total Plays</span>
                </div>
                <div className="stat">
                  <span className="value">{analytics.followers_count}</span>
                  <span className="label">Followers</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="profile-actions">
          <button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
          {artist.royalty_balance > 0 && (
            <button onClick={withdrawRoyalties} className="withdraw-btn">
              Withdraw Royalties
            </button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="edit-profile">
          <h2>Edit Profile</h2>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Social Media</label>
            <input
              type="text"
              name="social"
              value={formData.social}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Profile Image URL</label>
            <input
              type="url"
              name="profile_image_url"
              value={formData.profile_image_url}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Links</label>
            <div className="links-input">
              <input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="Add a link"
              />
              <button onClick={handleAddLink}>Add</button>
            </div>
            <div className="links-list">
              {formData.links.map((link, index) => (
                <div key={index} className="link-item">
                  <span>{link}</span>
                  <button onClick={() => handleRemoveLink(index)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleSave} className="save-btn">Save Changes</button>
        </div>
      )}

      <div className="profile-content">
        <div className="notifications-section">
          <h2>Notifications</h2>
          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            <div className="notifications-list">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => !notification.read && markNotificationRead(notification.id)}
                >
                  <div className="notification-content">
                    <p>{notification.message}</p>
                    <span className="timestamp">
                      {new Date(Number(notification.timestamp) / 1000000).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {analytics && (
          <div className="analytics-section">
            <h2>Your Analytics</h2>
            <div className="analytics-grid">
              <div className="metric">
                <h3>Engagement Score</h3>
                <p>{analytics.engagement_score.toFixed(2)}</p>
              </div>
              <div className="metric">
                <h3>Average Track Rating</h3>
                <p>{analytics.avg_track_rating.toFixed(1)}/5</p>
              </div>
              <div className="metric">
                <h3>Total Revenue</h3>
                <p>{analytics.total_revenue_earned}</p>
              </div>
              <div className="metric">
                <h3>Active Days</h3>
                <p>{analytics.active_days}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
