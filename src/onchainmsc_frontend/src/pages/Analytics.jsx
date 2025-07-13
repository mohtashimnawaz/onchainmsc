import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { onchainmsc_backend } from '../../../declarations/onchainmsc_backend';

const Analytics = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [platformAnalytics, setPlatformAnalytics] = useState(null);
  const [userEngagement, setUserEngagement] = useState(null);
  const [revenueInsights, setRevenueInsights] = useState(null);
  const [trackPerformance, setTrackPerformance] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch platform analytics
      const platform = await onchainmsc_backend.get_platform_analytics();
      setPlatformAnalytics(platform);

      // Fetch user engagement metrics
      const engagement = await onchainmsc_backend.get_user_engagement_metrics(user.id);
      if (engagement.length > 0) {
        setUserEngagement(engagement[0]);
      }

      // Fetch revenue insights
      const revenue = await onchainmsc_backend.get_revenue_insights();
      setRevenueInsights(revenue);

      // Fetch user's tracks
      const userTracks = await onchainmsc_backend.search_tracks_by_contributor(user.id);
      setTracks(userTracks);

      // Fetch track performance for user's tracks
      const trackMetrics = [];
      for (const track of userTracks) {
        const metrics = await onchainmsc_backend.get_track_performance_metrics(track.id);
        if (metrics.length > 0) {
          trackMetrics.push({
            track,
            metrics: metrics[0]
          });
        }
      }
      setTrackPerformance(trackMetrics);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      showToast('Error loading analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getPerformanceColor = (value, max) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return '#00c851';
    if (percentage >= 60) return '#ff9500';
    if (percentage >= 40) return '#ffbb33';
    return '#ff4444';
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Analytics Dashboard</h1>
        <button onClick={fetchAnalyticsData} className="refresh-btn">
          Refresh Data
        </button>
      </div>

      <div className="tab-navigation">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'tracks' ? 'active' : ''}
          onClick={() => setActiveTab('tracks')}
        >
          Track Performance
        </button>
        <button 
          className={activeTab === 'revenue' ? 'active' : ''}
          onClick={() => setActiveTab('revenue')}
        >
          Revenue Insights
        </button>
        <button 
          className={activeTab === 'platform' ? 'active' : ''}
          onClick={() => setActiveTab('platform')}
        >
          Platform Stats
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="overview-section">
          <h2>Your Performance Overview</h2>
          
          {userEngagement && (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">🎵</div>
                <div className="metric-content">
                  <h3>Tracks Created</h3>
                  <p className="metric-value">{userEngagement.total_tracks_created}</p>
                  <span className="metric-label">Total tracks</span>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">▶️</div>
                <div className="metric-content">
                  <h3>Total Plays</h3>
                  <p className="metric-value">{formatNumber(userEngagement.total_plays_received)}</p>
                  <span className="metric-label">Across all tracks</span>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">💰</div>
                <div className="metric-content">
                  <h3>Revenue Earned</h3>
                  <p className="metric-value">{formatNumber(userEngagement.total_revenue_earned)}</p>
                  <span className="metric-label">Total earnings</span>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">⭐</div>
                <div className="metric-content">
                  <h3>Avg Rating</h3>
                  <p className="metric-value">{userEngagement.avg_track_rating.toFixed(1)}</p>
                  <span className="metric-label">Out of 5.0</span>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">👥</div>
                <div className="metric-content">
                  <h3>Followers</h3>
                  <p className="metric-value">{userEngagement.followers_count}</p>
                  <span className="metric-label">Total followers</span>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">📊</div>
                <div className="metric-content">
                  <h3>Engagement Score</h3>
                  <p className="metric-value">{userEngagement.engagement_score.toFixed(1)}</p>
                  <span className="metric-label">Overall engagement</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="recent-performance">
            <h3>Recent Track Performance</h3>
            {trackPerformance.length === 0 ? (
              <p>No track performance data available</p>
            ) : (
              <div className="performance-list">
                {trackPerformance.slice(0, 5).map(({ track, metrics }) => (
                  <div key={track.id} className="performance-item">
                    <div className="track-info">
                      <h4>{track.title}</h4>
                      <p>{track.description}</p>
                    </div>
                    <div className="performance-metrics">
                      <div className="metric">
                        <span className="value">{formatNumber(metrics.total_plays)}</span>
                        <span className="label">Plays</span>
                      </div>
                      <div className="metric">
                        <span className="value">{formatNumber(metrics.total_revenue)}</span>
                        <span className="label">Revenue</span>
                      </div>
                      <div className="metric">
                        <span className="value">{metrics.avg_rating.toFixed(1)}</span>
                        <span className="label">Rating</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tracks' && (
        <div className="tracks-section">
          <h2>Track Performance Details</h2>
          
          {trackPerformance.length === 0 ? (
            <p>No track performance data available</p>
          ) : (
            <div className="tracks-performance-grid">
              {trackPerformance.map(({ track, metrics }) => (
                <div key={track.id} className="track-performance-card">
                  <div className="track-header">
                    <h3>{track.title}</h3>
                    <span className="track-genre">{track.genre || 'No genre'}</span>
                  </div>
                  
                  <div className="performance-stats">
                    <div className="stat-row">
                      <span className="stat-label">Total Plays</span>
                      <span className="stat-value">{formatNumber(metrics.total_plays)}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Unique Listeners</span>
                      <span className="stat-value">{formatNumber(metrics.unique_listeners)}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Average Rating</span>
                      <span className="stat-value">{metrics.avg_rating.toFixed(1)}/5.0</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Total Revenue</span>
                      <span className="stat-value">{formatNumber(metrics.total_revenue)}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Comments</span>
                      <span className="stat-value">{metrics.comments_count}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Downloads</span>
                      <span className="stat-value">{metrics.download_count}</span>
                    </div>
                  </div>
                  
                  <div className="engagement-metrics">
                    <div className="engagement-bar">
                      <div className="bar-label">Engagement Rate</div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill"
                          style={{ 
                            width: `${Math.min(metrics.engagement_rate * 100, 100)}%`,
                            backgroundColor: getPerformanceColor(metrics.engagement_rate, 1)
                          }}
                        />
                      </div>
                      <span className="bar-value">{(metrics.engagement_rate * 100).toFixed(1)}%</span>
                    </div>
                    
                    <div className="engagement-bar">
                      <div className="bar-label">Growth Rate</div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill"
                          style={{ 
                            width: `${Math.min(Math.abs(metrics.growth_rate) * 100, 100)}%`,
                            backgroundColor: metrics.growth_rate >= 0 ? '#00c851' : '#ff4444'
                          }}
                        />
                      </div>
                      <span className="bar-value">{(metrics.growth_rate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="revenue-section">
          <h2>Revenue Insights</h2>
          
          {revenueInsights && (
            <div className="revenue-overview">
              <div className="revenue-metric">
                <h3>Total Platform Revenue</h3>
                <p className="revenue-value">{formatNumber(revenueInsights.total_platform_revenue)}</p>
              </div>
              
              <div className="revenue-breakdowns">
                <div className="breakdown-section">
                  <h4>Top Earning Tracks</h4>
                  {revenueInsights.top_earning_tracks.length === 0 ? (
                    <p>No data available</p>
                  ) : (
                    <div className="ranking-list">
                      {revenueInsights.top_earning_tracks.map(([trackId, revenue], index) => (
                        <div key={trackId} className="ranking-item">
                          <span className="rank">#{index + 1}</span>
                          <span className="item-name">Track {trackId}</span>
                          <span className="item-value">{formatNumber(revenue)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="breakdown-section">
                  <h4>Top Earning Artists</h4>
                  {revenueInsights.top_earning_artists.length === 0 ? (
                    <p>No data available</p>
                  ) : (
                    <div className="ranking-list">
                      {revenueInsights.top_earning_artists.map(([artistId, revenue], index) => (
                        <div key={artistId} className="ranking-item">
                          <span className="rank">#{index + 1}</span>
                          <span className="item-name">Artist {artistId}</span>
                          <span className="item-value">{formatNumber(revenue)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="breakdown-section">
                  <h4>Revenue by Genre</h4>
                  {revenueInsights.revenue_by_genre.length === 0 ? (
                    <p>No data available</p>
                  ) : (
                    <div className="genre-revenue-chart">
                      {revenueInsights.revenue_by_genre.map(([genre, revenue]) => (
                        <div key={genre} className="genre-bar">
                          <div className="genre-label">{genre}</div>
                          <div className="genre-bar-container">
                            <div 
                              className="genre-bar-fill"
                              style={{ 
                                width: `${(revenue / Math.max(...revenueInsights.revenue_by_genre.map(g => g[1]))) * 100}%`
                              }}
                            />
                          </div>
                          <span className="genre-value">{formatNumber(revenue)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'platform' && (
        <div className="platform-section">
          <h2>Platform Statistics</h2>
          
          {platformAnalytics && (
            <div className="platform-overview">
              <div className="platform-metrics-grid">
                <div className="platform-metric">
                  <div className="metric-icon">🎵</div>
                  <div className="metric-content">
                    <h3>Total Tracks</h3>
                    <p className="metric-value">{formatNumber(platformAnalytics.total_tracks)}</p>
                  </div>
                </div>
                
                <div className="platform-metric">
                  <div className="metric-icon">👥</div>
                  <div className="metric-content">
                    <h3>Total Users</h3>
                    <p className="metric-value">{formatNumber(platformAnalytics.total_users)}</p>
                  </div>
                </div>
                
                <div className="platform-metric">
                  <div className="metric-icon">🎤</div>
                  <div className="metric-content">
                    <h3>Total Artists</h3>
                    <p className="metric-value">{formatNumber(platformAnalytics.total_artists)}</p>
                  </div>
                </div>
                
                <div className="platform-metric">
                  <div className="metric-icon">▶️</div>
                  <div className="metric-content">
                    <h3>Total Plays</h3>
                    <p className="metric-value">{formatNumber(platformAnalytics.total_plays)}</p>
                  </div>
                </div>
                
                <div className="platform-metric">
                  <div className="metric-icon">💰</div>
                  <div className="metric-content">
                    <h3>Total Revenue</h3>
                    <p className="metric-value">{formatNumber(platformAnalytics.total_revenue)}</p>
                  </div>
                </div>
                
                <div className="platform-metric">
                  <div className="metric-icon">⭐</div>
                  <div className="metric-content">
                    <h3>Avg Track Rating</h3>
                    <p className="metric-value">{platformAnalytics.avg_track_rating.toFixed(1)}</p>
                  </div>
                </div>
              </div>
              
              <div className="platform-breakdowns">
                <div className="breakdown-section">
                  <h4>Most Popular Genres</h4>
                  {platformAnalytics.most_popular_genres.length === 0 ? (
                    <p>No data available</p>
                  ) : (
                    <div className="genre-popularity-chart">
                      {platformAnalytics.most_popular_genres.map(([genre, count]) => (
                        <div key={genre} className="genre-popularity-bar">
                          <div className="genre-label">{genre}</div>
                          <div className="genre-bar-container">
                            <div 
                              className="genre-bar-fill"
                              style={{ 
                                width: `${(count / Math.max(...platformAnalytics.most_popular_genres.map(g => g[1]))) * 100}%`
                              }}
                            />
                          </div>
                          <span className="genre-value">{formatNumber(count)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="breakdown-section">
                  <h4>Most Active Users</h4>
                  {platformAnalytics.most_active_users.length === 0 ? (
                    <p>No data available</p>
                  ) : (
                    <div className="ranking-list">
                      {platformAnalytics.most_active_users.map(([userId, activity], index) => (
                        <div key={userId} className="ranking-item">
                          <span className="rank">#{index + 1}</span>
                          <span className="item-name">User {userId}</span>
                          <span className="item-value">{formatNumber(activity)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
