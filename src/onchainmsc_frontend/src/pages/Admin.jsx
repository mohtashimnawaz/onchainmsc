import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { onchainmsc_backend } from '../../../declarations/onchainmsc_backend';

const Admin = () => {
  const { user, principal, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('reports');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [reports, setReports] = useState([]);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [suspensions, setSuspensions] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [bannedKeywords, setBannedKeywords] = useState([]);
  
  // Form states
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState('');
  
  const [artists, setArtists] = useState([]);
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAdminData();
    }
  }, [user, isAdmin]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch reports
      const reportsData = await onchainmsc_backend.list_reports();
      setReports(reportsData);
      
      // Fetch moderation queue
      const moderationData = await onchainmsc_backend.list_moderation_queue();
      setModerationQueue(moderationData);
      
      // Fetch suspensions
      const suspensionsData = await onchainmsc_backend.list_suspensions();
      setSuspensions(suspensionsData);
      
      // Fetch appeals
      const appealsData = await onchainmsc_backend.list_suspension_appeals();
      setAppeals(appealsData);
      
      // Fetch audit log
      const auditData = await onchainmsc_backend.list_audit_log();
      setAuditLog(auditData);
      
      // Fetch banned keywords
      const keywordsData = await onchainmsc_backend.list_banned_keywords();
      setBannedKeywords(keywordsData);
      
      // Fetch artists and tracks for reference
      const artistsData = await onchainmsc_backend.list_artists();
      const tracksData = await onchainmsc_backend.list_tracks();
      setArtists(artistsData);
      setTracks(tracksData);
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
      showToast('Error loading admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewReport = async (reportId, status, notes) => {
    try {
      const statusEnum = { [status]: null };
      const success = await onchainmsc_backend.review_report(reportId, statusEnum, notes || null);
      if (success) {
        showToast('Report reviewed successfully', 'success');
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error reviewing report:', error);
      showToast('Error reviewing report', 'error');
    }
  };

  const handleModerationReview = async (itemId, status, notes) => {
    try {
      const statusEnum = { [status]: null };
      const success = await onchainmsc_backend.review_moderation_item(itemId, statusEnum, notes || null);
      if (success) {
        showToast('Moderation item reviewed successfully', 'success');
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error reviewing moderation item:', error);
      showToast('Error reviewing moderation item', 'error');
    }
  };

  const handleSuspendUser = async (targetType, targetId, reason, duration) => {
    try {
      const targetTypeEnum = { [targetType]: null };
      const durationSecs = duration ? parseInt(duration) * 24 * 60 * 60 : null;
      
      const result = await onchainmsc_backend.suspend_target(
        targetTypeEnum,
        targetId,
        reason,
        durationSecs
      );
      
      if (result.length > 0) {
        showToast('Suspension applied successfully', 'success');
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error applying suspension:', error);
      showToast('Error applying suspension', 'error');
    }
  };

  const handleLiftSuspension = async (suspensionId, notes) => {
    try {
      const success = await onchainmsc_backend.lift_suspension(suspensionId, notes || null);
      if (success) {
        showToast('Suspension lifted successfully', 'success');
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error lifting suspension:', error);
      showToast('Error lifting suspension', 'error');
    }
  };

  const handleReviewAppeal = async (appealId, status, notes) => {
    try {
      const statusEnum = { [status]: null };
      const success = await onchainmsc_backend.review_suspension_appeal(appealId, statusEnum, notes || null);
      if (success) {
        showToast('Appeal reviewed successfully', 'success');
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error reviewing appeal:', error);
      showToast('Error reviewing appeal', 'error');
    }
  };

  const handleAddBannedKeyword = async () => {
    if (!newKeyword.trim()) return;
    
    try {
      const success = await onchainmsc_backend.add_banned_keyword(newKeyword.trim());
      if (success) {
        showToast('Keyword banned successfully', 'success');
        setNewKeyword('');
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error adding banned keyword:', error);
      showToast('Error adding banned keyword', 'error');
    }
  };

  const handleRemoveBannedKeyword = async (keyword) => {
    try {
      const success = await onchainmsc_backend.remove_banned_keyword(keyword);
      if (success) {
        showToast('Keyword removed successfully', 'success');
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error removing banned keyword:', error);
      showToast('Error removing banned keyword', 'error');
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Pending': '#ff9500',
      'Reviewed': '#007cba',
      'Dismissed': '#666',
      'Resolved': '#00c851',
      'Approved': '#00c851',
      'Removed': '#ff4444',
      'Active': '#ff4444',
      'Lifted': '#00c851',
      'Expired': '#666',
      'Denied': '#ff4444'
    };
    return statusColors[status] || '#666';
  };

  const getArtistName = (artistId) => {
    const artist = artists.find(a => a.id === parseInt(artistId));
    return artist ? artist.name : `Artist ${artistId}`;
  };

  const getTrackTitle = (trackId) => {
    const track = tracks.find(t => t.id === parseInt(trackId));
    return track ? track.title : `Track ${trackId}`;
  };

  if (!isAdmin) {
    return (
      <div className="access-denied">
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading admin data...</div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <button onClick={fetchAdminData} className="refresh-btn">
          Refresh Data
        </button>
      </div>

      <div className="tab-navigation">
        <button 
          className={activeTab === 'reports' ? 'active' : ''}
          onClick={() => setActiveTab('reports')}
        >
          Reports ({reports.length})
        </button>
        <button 
          className={activeTab === 'moderation' ? 'active' : ''}
          onClick={() => setActiveTab('moderation')}
        >
          Moderation ({moderationQueue.length})
        </button>
        <button 
          className={activeTab === 'suspensions' ? 'active' : ''}
          onClick={() => setActiveTab('suspensions')}
        >
          Suspensions ({suspensions.length})
        </button>
        <button 
          className={activeTab === 'appeals' ? 'active' : ''}
          onClick={() => setActiveTab('appeals')}
        >
          Appeals ({appeals.length})
        </button>
        <button 
          className={activeTab === 'keywords' ? 'active' : ''}
          onClick={() => setActiveTab('keywords')}
        >
          Keywords ({bannedKeywords.length})
        </button>
        <button 
          className={activeTab === 'audit' ? 'active' : ''}
          onClick={() => setActiveTab('audit')}
        >
          Audit Log ({auditLog.length})
        </button>
      </div>

      {activeTab === 'reports' && (
        <div className="reports-section">
          <h2>Content Reports</h2>
          {reports.length === 0 ? (
            <p>No reports found</p>
          ) : (
            <div className="reports-grid">
              {reports.map(report => (
                <div key={report.id} className="report-card">
                  <div className="report-header">
                    <h3>{Object.keys(report.target_type)[0]} Report</h3>
                    <span 
                      className="status"
                      style={{ backgroundColor: getStatusColor(Object.keys(report.status)[0]) }}
                    >
                      {Object.keys(report.status)[0]}
                    </span>
                  </div>
                  <div className="report-details">
                    <p><strong>Target:</strong> {report.target_id}</p>
                    <p><strong>Reporter:</strong> {report.reporter}</p>
                    <p><strong>Reason:</strong> {report.reason}</p>
                    {report.details && <p><strong>Details:</strong> {report.details}</p>}
                    <p><strong>Created:</strong> {new Date(Number(report.created_at) / 1000000).toLocaleString()}</p>
                    {report.reviewed_by && (
                      <>
                        <p><strong>Reviewed by:</strong> {report.reviewed_by}</p>
                        <p><strong>Reviewed at:</strong> {new Date(Number(report.reviewed_at) / 1000000).toLocaleString()}</p>
                      </>
                    )}
                    {report.resolution_notes && (
                      <p><strong>Resolution:</strong> {report.resolution_notes}</p>
                    )}
                  </div>
                  {Object.keys(report.status)[0] === 'Pending' && (
                    <div className="report-actions">
                      <button 
                        onClick={() => handleReviewReport(report.id, 'Resolved', 'Report resolved by admin')}
                        className="resolve-btn"
                      >
                        Resolve
                      </button>
                      <button 
                        onClick={() => handleReviewReport(report.id, 'Dismissed', 'Report dismissed by admin')}
                        className="dismiss-btn"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'moderation' && (
        <div className="moderation-section">
          <h2>Moderation Queue</h2>
          {moderationQueue.length === 0 ? (
            <p>No items in moderation queue</p>
          ) : (
            <div className="moderation-grid">
              {moderationQueue.map(item => (
                <div key={item.id} className="moderation-card">
                  <div className="moderation-header">
                    <h3>{Object.keys(item.target_type)[0]} Moderation</h3>
                    <span 
                      className="status"
                      style={{ backgroundColor: getStatusColor(Object.keys(item.status)[0]) }}
                    >
                      {Object.keys(item.status)[0]}
                    </span>
                  </div>
                  <div className="moderation-details">
                    <p><strong>Target:</strong> {item.target_id}</p>
                    <p><strong>Reason:</strong> {item.reason}</p>
                    {item.flagged_by && <p><strong>Flagged by:</strong> {item.flagged_by}</p>}
                    <p><strong>Created:</strong> {new Date(Number(item.created_at) / 1000000).toLocaleString()}</p>
                    {item.reviewed_by && (
                      <>
                        <p><strong>Reviewed by:</strong> {item.reviewed_by}</p>
                        <p><strong>Reviewed at:</strong> {new Date(Number(item.reviewed_at) / 1000000).toLocaleString()}</p>
                      </>
                    )}
                    {item.notes && <p><strong>Notes:</strong> {item.notes}</p>}
                  </div>
                  {Object.keys(item.status)[0] === 'Pending' && (
                    <div className="moderation-actions">
                      <button 
                        onClick={() => handleModerationReview(item.id, 'Approved', 'Content approved by admin')}
                        className="approve-btn"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleModerationReview(item.id, 'Removed', 'Content removed by admin')}
                        className="remove-btn"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'suspensions' && (
        <div className="suspensions-section">
          <h2>Suspensions Management</h2>
          
          <div className="suspension-form">
            <h3>Create New Suspension</h3>
            <div className="form-row">
              <select 
                value={selectedUser} 
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select User/Artist</option>
                {artists.map(artist => (
                  <option key={artist.id} value={artist.id}>{artist.name}</option>
                ))}
              </select>
              <input 
                type="text" 
                placeholder="Reason for suspension"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
              />
              <input 
                type="number" 
                placeholder="Duration (days)"
                value={suspensionDuration}
                onChange={(e) => setSuspensionDuration(e.target.value)}
              />
              <button 
                onClick={() => handleSuspendUser('User', selectedUser, suspensionReason, suspensionDuration)}
                disabled={!selectedUser || !suspensionReason}
              >
                Suspend
              </button>
            </div>
          </div>
          
          {suspensions.length === 0 ? (
            <p>No suspensions found</p>
          ) : (
            <div className="suspensions-grid">
              {suspensions.map(suspension => (
                <div key={suspension.id} className="suspension-card">
                  <div className="suspension-header">
                    <h3>{Object.keys(suspension.target_type)[0]} Suspension</h3>
                    <span 
                      className="status"
                      style={{ backgroundColor: getStatusColor(Object.keys(suspension.status)[0]) }}
                    >
                      {Object.keys(suspension.status)[0]}
                    </span>
                  </div>
                  <div className="suspension-details">
                    <p><strong>Target:</strong> {suspension.target_id}</p>
                    <p><strong>Reason:</strong> {suspension.reason}</p>
                    <p><strong>Imposed by:</strong> {suspension.imposed_by}</p>
                    <p><strong>Imposed at:</strong> {new Date(Number(suspension.imposed_at) / 1000000).toLocaleString()}</p>
                    {suspension.duration_secs && (
                      <p><strong>Duration:</strong> {suspension.duration_secs / (24 * 60 * 60)} days</p>
                    )}
                    {suspension.lifted_by && (
                      <>
                        <p><strong>Lifted by:</strong> {suspension.lifted_by}</p>
                        <p><strong>Lifted at:</strong> {new Date(Number(suspension.lifted_at) / 1000000).toLocaleString()}</p>
                      </>
                    )}
                    {suspension.notes && <p><strong>Notes:</strong> {suspension.notes}</p>}
                  </div>
                  {Object.keys(suspension.status)[0] === 'Active' && (
                    <div className="suspension-actions">
                      <button 
                        onClick={() => handleLiftSuspension(suspension.id, 'Suspension lifted by admin')}
                        className="lift-btn"
                      >
                        Lift Suspension
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'appeals' && (
        <div className="appeals-section">
          <h2>Suspension Appeals</h2>
          {appeals.length === 0 ? (
            <p>No appeals found</p>
          ) : (
            <div className="appeals-grid">
              {appeals.map(appeal => (
                <div key={appeal.id} className="appeal-card">
                  <div className="appeal-header">
                    <h3>Appeal #{appeal.id}</h3>
                    <span 
                      className="status"
                      style={{ backgroundColor: getStatusColor(Object.keys(appeal.status)[0]) }}
                    >
                      {Object.keys(appeal.status)[0]}
                    </span>
                  </div>
                  <div className="appeal-details">
                    <p><strong>Suspension ID:</strong> {appeal.suspension_id}</p>
                    <p><strong>Submitted by:</strong> {appeal.submitted_by}</p>
                    <p><strong>Submitted at:</strong> {new Date(Number(appeal.submitted_at) / 1000000).toLocaleString()}</p>
                    <p><strong>Content:</strong> {appeal.content}</p>
                    {appeal.reviewed_by && (
                      <>
                        <p><strong>Reviewed by:</strong> {appeal.reviewed_by}</p>
                        <p><strong>Reviewed at:</strong> {new Date(Number(appeal.reviewed_at) / 1000000).toLocaleString()}</p>
                      </>
                    )}
                    {appeal.notes && <p><strong>Notes:</strong> {appeal.notes}</p>}
                  </div>
                  {Object.keys(appeal.status)[0] === 'Pending' && (
                    <div className="appeal-actions">
                      <button 
                        onClick={() => handleReviewAppeal(appeal.id, 'Approved', 'Appeal approved by admin')}
                        className="approve-btn"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReviewAppeal(appeal.id, 'Denied', 'Appeal denied by admin')}
                        className="deny-btn"
                      >
                        Deny
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'keywords' && (
        <div className="keywords-section">
          <h2>Banned Keywords Management</h2>
          
          <div className="keyword-form">
            <h3>Add Banned Keyword</h3>
            <div className="form-row">
              <input 
                type="text" 
                placeholder="Enter keyword to ban"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
              />
              <button onClick={handleAddBannedKeyword} disabled={!newKeyword.trim()}>
                Add Keyword
              </button>
            </div>
          </div>
          
          {bannedKeywords.length === 0 ? (
            <p>No banned keywords found</p>
          ) : (
            <div className="keywords-list">
              {bannedKeywords.map(keyword => (
                <div key={keyword} className="keyword-item">
                  <span className="keyword-text">{keyword}</span>
                  <button 
                    onClick={() => handleRemoveBannedKeyword(keyword)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="audit-section">
          <h2>Audit Log</h2>
          {auditLog.length === 0 ? (
            <p>No audit log entries found</p>
          ) : (
            <div className="audit-list">
              {auditLog.map(entry => (
                <div key={entry.id} className="audit-entry">
                  <div className="audit-header">
                    <h3>{entry.action}</h3>
                    <span className="timestamp">
                      {new Date(Number(entry.timestamp) / 1000000).toLocaleString()}
                    </span>
                  </div>
                  <div className="audit-details">
                    <p><strong>Admin:</strong> {entry.admin}</p>
                    <p><strong>Target:</strong> {entry.target_type} #{entry.target_id}</p>
                    {entry.details && <p><strong>Details:</strong> {entry.details}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
