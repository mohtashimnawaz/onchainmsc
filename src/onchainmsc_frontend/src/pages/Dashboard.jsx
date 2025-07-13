import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { onchainmsc_backend } from 'declarations/onchainmsc_backend';
import { 
  Music, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Play,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const { artist, isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const [stats, setStats] = useState({
    totalTracks: 0,
    totalPlays: 0,
    totalRevenue: 0,
    collaborations: 0
  });
  const [recentTracks, setRecentTracks] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [collabRequests, setCollabRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && artist) {
      loadDashboardData();
    }
  }, [isAuthenticated, artist]);

  const loadDashboardData = async () => {
    if (!artist) return;

    try {
      setLoading(true);
      
      // Load artist's tracks
      const tracks = await onchainmsc_backend.search_tracks_by_contributor(artist.id);
      setRecentTracks(tracks.slice(0, 5));

      // Calculate stats
      const totalPlays = tracks.reduce((sum, track) => sum + Number(track.play_count), 0);
      const totalRevenue = Number(artist.royalty_balance);
      
      setStats({
        totalTracks: tracks.length,
        totalPlays,
        totalRevenue,
        collaborations: tracks.filter(track => track.contributors.length > 1).length
      });

      // Load recent activity
      const activity = await onchainmsc_backend.get_user_activity(artist.id);
      setRecentActivity(activity.slice(0, 10));

      // Load pending tasks
      const tasks = await onchainmsc_backend.list_tasks_for_user(artist.id);
      const pending = tasks.filter(task => 
        task.status.Open !== undefined || task.status.InProgress !== undefined
      );
      setPendingTasks(pending.slice(0, 5));

      // Load collaboration requests
      const requests = await onchainmsc_backend.list_collab_requests_for_user(artist.id);
      const pendingRequests = requests.filter(req => req.status.Pending !== undefined);
      setCollabRequests(pendingRequests.slice(0, 5));

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const respondToCollabRequest = async (requestId, accept) => {
    try {
      await onchainmsc_backend.respond_collab_request(requestId, accept);
      success(accept ? 'Collaboration request accepted' : 'Collaboration request declined');
      loadDashboardData();
    } catch (err) {
      console.error('Failed to respond to collaboration request:', err);
      error('Failed to respond to request');
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await onchainmsc_backend.update_task_status(taskId, status);
      success('Task status updated');
      loadDashboardData();
    } catch (err) {
      console.error('Failed to update task status:', err);
      error('Failed to update task');
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

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="dashboard-empty">
        <h2>Please log in to view your dashboard</h2>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="dashboard-empty">
        <h2>Complete your artist profile to access the dashboard</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {artist.name}!</h1>
        <p>Here's what's happening with your music</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-4 mb-4">
        <div className="stat-card card">
          <div className="stat-icon">
            <Music />
          </div>
          <div className="stat-value">{stats.totalTracks}</div>
          <div className="stat-label">Your Tracks</div>
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
            <DollarSign />
          </div>
          <div className="stat-value">{formatNumber(stats.totalRevenue)}</div>
          <div className="stat-label">Tokens Earned</div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon">
            <Users />
          </div>
          <div className="stat-value">{stats.collaborations}</div>
          <div className="stat-label">Collaborations</div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Recent Tracks */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Tracks</h3>
            <button className="btn btn-primary">
              <Plus size={16} />
              Create Track
            </button>
          </div>
          <div className="track-list">
            {recentTracks.length > 0 ? (
              recentTracks.map((track) => (
                <div key={track.id} className="track-item-simple">
                  <div className="track-info">
                    <h4>{track.title}</h4>
                    <p>{formatNumber(Number(track.play_count))} plays</p>
                  </div>
                  <div className="track-status">
                    <span className="status-badge status-active">Active</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Music size={24} />
                <p>No tracks yet. Create your first track!</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="card">
          <div className="card-header">
            <h3>Pending Tasks</h3>
            <span className="badge">{pendingTasks.length}</span>
          </div>
          <div className="task-list">
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => (
                <div key={task.id} className="task-item">
                  <div className="task-info">
                    <h4>{task.description}</h4>
                    <p>Created {formatDate(task.created_at)}</p>
                  </div>
                  <div className="task-actions">
                    <button 
                      onClick={() => updateTaskStatus(task.id, { InProgress: null })}
                      className="btn btn-secondary"
                    >
                      Start
                    </button>
                    <button 
                      onClick={() => updateTaskStatus(task.id, { Completed: null })}
                      className="btn btn-success"
                    >
                      <CheckCircle size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <CheckCircle size={24} />
                <p>All caught up! No pending tasks.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Collaboration Requests */}
        <div className="card">
          <div className="card-header">
            <h3>Collaboration Requests</h3>
            <span className="badge">{collabRequests.length}</span>
          </div>
          <div className="request-list">
            {collabRequests.length > 0 ? (
              collabRequests.map((request) => (
                <div key={request.id} className="request-item">
                  <div className="request-info">
                    <h4>Collaboration Request</h4>
                    <p>From Artist ID: {request.from}</p>
                    {request.message && request.message.length > 0 && (
                      <p className="request-message">"{request.message[0]}"</p>
                    )}
                  </div>
                  <div className="request-actions">
                    <button 
                      onClick={() => respondToCollabRequest(request.id, true)}
                      className="btn btn-success"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => respondToCollabRequest(request.id, false)}
                      className="btn btn-secondary"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Users size={24} />
                <p>No collaboration requests.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    <Clock size={16} />
                  </div>
                  <div className="activity-info">
                    <p>{activity.action}</p>
                    <span className="activity-time">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <TrendingUp size={24} />
                <p>No recent activity.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          font-size: 2rem;
          font-weight: bold;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .dashboard-header p {
          color: var(--text-secondary);
        }

        .dashboard-empty {
          text-align: center;
          padding: 4rem 2rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .card-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .badge {
          background: var(--primary-color);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .track-list,
        .task-list,
        .request-list,
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .track-item-simple {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: var(--bg-tertiary);
          border-radius: 0.5rem;
        }

        .track-item-simple h4 {
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .track-item-simple p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .task-item,
        .request-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: var(--bg-tertiary);
          border-radius: 0.5rem;
        }

        .task-info h4,
        .request-info h4 {
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .task-info p,
        .request-info p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .request-message {
          font-style: italic;
          color: var(--text-secondary);
        }

        .task-actions,
        .request-actions {
          display: flex;
          gap: 0.5rem;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: 0.5rem;
        }

        .activity-icon {
          color: var(--primary-color);
        }

        .activity-info p {
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .activity-time {
          color: var(--text-secondary);
          font-size: 0.75rem;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: var(--text-secondary);
        }

        .empty-state svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
