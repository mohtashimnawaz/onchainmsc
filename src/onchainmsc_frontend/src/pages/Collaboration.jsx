import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { onchainmsc_backend } from '../../../declarations/onchainmsc_backend';

const Collaboration = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('requests');
  const [collabRequests, setCollabRequests] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);

  // Form states
  const [newRequestForm, setNewRequestForm] = useState({
    to: '',
    track_id: '',
    message: ''
  });
  const [newTaskForm, setNewTaskForm] = useState({
    track_id: '',
    assigned_to: '',
    description: ''
  });
  const [newWorkflowForm, setNewWorkflowForm] = useState({
    track_id: '',
    step_name: '',
    assigned_to: [],
    due_date: '',
    notes: ''
  });
  const [newSessionForm, setNewSessionForm] = useState({
    track_id: '',
    session_name: '',
    participants: [],
    notes: ''
  });

  const [tracks, setTracks] = useState([]);
  const [artists, setArtists] = useState([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch collaboration requests
      const requests = await onchainmsc_backend.list_collab_requests_for_user(user.id);
      setCollabRequests(requests);

      // Fetch tasks
      const userTasks = await onchainmsc_backend.list_tasks_for_user(user.id);
      setTasks(userTasks);

      // Fetch tracks and artists for dropdowns
      const allTracks = await onchainmsc_backend.list_tracks();
      const allArtists = await onchainmsc_backend.list_artists();
      setTracks(allTracks);
      setArtists(allArtists);

      // Fetch workflow steps and sessions for tracks the user contributes to
      const userTracks = allTracks.filter(track => 
        track.contributors.includes(user.id)
      );
      
      const allWorkflows = [];
      const allSessions = [];
      
      for (const track of userTracks) {
        const trackWorkflows = await onchainmsc_backend.get_track_workflow_steps(track.id);
        const trackSessions = await onchainmsc_backend.get_track_collaboration_sessions(track.id);
        
        allWorkflows.push(...trackWorkflows);
        allSessions.push(...trackSessions);
      }
      
      setWorkflows(allWorkflows);
      setSessions(allSessions);
      
    } catch (error) {
      console.error('Error fetching collaboration data:', error);
      showToast('Error loading collaboration data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    try {
      const result = await onchainmsc_backend.send_collab_request(
        user.id,
        parseInt(newRequestForm.to),
        parseInt(newRequestForm.track_id),
        newRequestForm.message || null
      );
      
      if (result.length > 0) {
        showToast('Collaboration request sent successfully', 'success');
        setShowNewRequest(false);
        setNewRequestForm({ to: '', track_id: '', message: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error sending collaboration request:', error);
      showToast('Error sending collaboration request', 'error');
    }
  };

  const handleRespondToRequest = async (requestId, accept) => {
    try {
      const result = await onchainmsc_backend.respond_collab_request(requestId, accept);
      if (result.length > 0) {
        showToast(`Request ${accept ? 'accepted' : 'declined'} successfully`, 'success');
        fetchData();
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      showToast('Error responding to request', 'error');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const result = await onchainmsc_backend.create_task(
        parseInt(newTaskForm.track_id),
        parseInt(newTaskForm.assigned_to),
        newTaskForm.description
      );
      
      if (result.length > 0) {
        showToast('Task created successfully', 'success');
        setShowNewTask(false);
        setNewTaskForm({ track_id: '', assigned_to: '', description: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      showToast('Error creating task', 'error');
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      const result = await onchainmsc_backend.update_task_status(taskId, { [status]: null });
      if (result.length > 0) {
        showToast('Task status updated successfully', 'success');
        fetchData();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      showToast('Error updating task status', 'error');
    }
  };

  const handleCreateWorkflowStep = async (e) => {
    e.preventDefault();
    try {
      const result = await onchainmsc_backend.create_workflow_step(
        parseInt(newWorkflowForm.track_id),
        newWorkflowForm.step_name,
        newWorkflowForm.assigned_to.map(id => parseInt(id)),
        newWorkflowForm.due_date ? parseInt(new Date(newWorkflowForm.due_date).getTime()) * 1000000 : null,
        newWorkflowForm.notes || null
      );
      
      if (result.length > 0) {
        showToast('Workflow step created successfully', 'success');
        setShowNewWorkflow(false);
        setNewWorkflowForm({ track_id: '', step_name: '', assigned_to: [], due_date: '', notes: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating workflow step:', error);
      showToast('Error creating workflow step', 'error');
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const result = await onchainmsc_backend.create_collaboration_session(
        parseInt(newSessionForm.track_id),
        newSessionForm.session_name,
        newSessionForm.participants.map(id => parseInt(id)),
        newSessionForm.notes || null
      );
      
      if (result.length > 0) {
        showToast('Collaboration session created successfully', 'success');
        setShowNewSession(false);
        setNewSessionForm({ track_id: '', session_name: '', participants: [], notes: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating collaboration session:', error);
      showToast('Error creating collaboration session', 'error');
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Pending': '#ff9500',
      'Accepted': '#00c851',
      'Declined': '#ff4444',
      'Open': '#007cba',
      'InProgress': '#ff9500',
      'Completed': '#00c851',
      'Cancelled': '#ff4444'
    };
    return statusColors[status] || '#666';
  };

  const getArtistName = (artistId) => {
    const artist = artists.find(a => a.id === artistId);
    return artist ? artist.name : `Artist ${artistId}`;
  };

  const getTrackTitle = (trackId) => {
    const track = tracks.find(t => t.id === trackId);
    return track ? track.title : `Track ${trackId}`;
  };

  if (loading) {
    return <div className="loading">Loading collaboration data...</div>;
  }

  return (
    <div className="collaboration-page">
      <div className="page-header">
        <h1>Collaboration Hub</h1>
        <div className="header-actions">
          <button onClick={() => setShowNewRequest(true)}>Send Request</button>
          <button onClick={() => setShowNewTask(true)}>Create Task</button>
          <button onClick={() => setShowNewWorkflow(true)}>Add Workflow Step</button>
          <button onClick={() => setShowNewSession(true)}>Start Session</button>
        </div>
      </div>

      <div className="tab-navigation">
        <button 
          className={activeTab === 'requests' ? 'active' : ''}
          onClick={() => setActiveTab('requests')}
        >
          Requests ({collabRequests.length})
        </button>
        <button 
          className={activeTab === 'tasks' ? 'active' : ''}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks ({tasks.length})
        </button>
        <button 
          className={activeTab === 'workflows' ? 'active' : ''}
          onClick={() => setActiveTab('workflows')}
        >
          Workflows ({workflows.length})
        </button>
        <button 
          className={activeTab === 'sessions' ? 'active' : ''}
          onClick={() => setActiveTab('sessions')}
        >
          Sessions ({sessions.length})
        </button>
      </div>

      {activeTab === 'requests' && (
        <div className="requests-section">
          <h2>Collaboration Requests</h2>
          {collabRequests.length === 0 ? (
            <p>No collaboration requests found</p>
          ) : (
            <div className="requests-grid">
              {collabRequests.map(request => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <h3>{getTrackTitle(request.track_id)}</h3>
                    <span 
                      className="status"
                      style={{ backgroundColor: getStatusColor(Object.keys(request.status)[0]) }}
                    >
                      {Object.keys(request.status)[0]}
                    </span>
                  </div>
                  <div className="request-details">
                    <p><strong>From:</strong> {getArtistName(request.from)}</p>
                    <p><strong>To:</strong> {getArtistName(request.to)}</p>
                    {request.message && <p><strong>Message:</strong> {request.message}</p>}
                    <p><strong>Sent:</strong> {new Date(Number(request.timestamp) / 1000000).toLocaleString()}</p>
                  </div>
                  {request.to === user.id && Object.keys(request.status)[0] === 'Pending' && (
                    <div className="request-actions">
                      <button 
                        onClick={() => handleRespondToRequest(request.id, true)}
                        className="accept-btn"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleRespondToRequest(request.id, false)}
                        className="decline-btn"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="tasks-section">
          <h2>Tasks</h2>
          {tasks.length === 0 ? (
            <p>No tasks found</p>
          ) : (
            <div className="tasks-grid">
              {tasks.map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <h3>{task.description}</h3>
                    <span 
                      className="status"
                      style={{ backgroundColor: getStatusColor(Object.keys(task.status)[0]) }}
                    >
                      {Object.keys(task.status)[0]}
                    </span>
                  </div>
                  <div className="task-details">
                    <p><strong>Track:</strong> {getTrackTitle(task.track_id)}</p>
                    <p><strong>Assigned to:</strong> {getArtistName(task.assigned_to)}</p>
                    <p><strong>Created:</strong> {new Date(Number(task.created_at) / 1000000).toLocaleString()}</p>
                    <p><strong>Updated:</strong> {new Date(Number(task.updated_at) / 1000000).toLocaleString()}</p>
                  </div>
                  {task.assigned_to === user.id && Object.keys(task.status)[0] !== 'Completed' && (
                    <div className="task-actions">
                      <select 
                        onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                        value=""
                      >
                        <option value="">Change Status</option>
                        <option value="InProgress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'workflows' && (
        <div className="workflows-section">
          <h2>Workflow Steps</h2>
          {workflows.length === 0 ? (
            <p>No workflow steps found</p>
          ) : (
            <div className="workflows-grid">
              {workflows.map(workflow => (
                <div key={workflow.id} className="workflow-card">
                  <div className="workflow-header">
                    <h3>{workflow.step_name}</h3>
                    <span 
                      className="status"
                      style={{ backgroundColor: getStatusColor(Object.keys(workflow.status)[0]) }}
                    >
                      {Object.keys(workflow.status)[0]}
                    </span>
                  </div>
                  <div className="workflow-details">
                    <p><strong>Track:</strong> {getTrackTitle(workflow.track_id)}</p>
                    <p><strong>Assigned to:</strong> {workflow.assigned_to.map(id => getArtistName(id)).join(', ')}</p>
                    {workflow.due_date && (
                      <p><strong>Due:</strong> {new Date(Number(workflow.due_date) / 1000000).toLocaleString()}</p>
                    )}
                    {workflow.notes && <p><strong>Notes:</strong> {workflow.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="sessions-section">
          <h2>Collaboration Sessions</h2>
          {sessions.length === 0 ? (
            <p>No collaboration sessions found</p>
          ) : (
            <div className="sessions-grid">
              {sessions.map(session => (
                <div key={session.id} className="session-card">
                  <div className="session-header">
                    <h3>{session.session_name}</h3>
                    <span className={`status ${session.end_time ? 'ended' : 'active'}`}>
                      {session.end_time ? 'Ended' : 'Active'}
                    </span>
                  </div>
                  <div className="session-details">
                    <p><strong>Track:</strong> {getTrackTitle(session.track_id)}</p>
                    <p><strong>Participants:</strong> {session.participants.map(id => getArtistName(id)).join(', ')}</p>
                    <p><strong>Started:</strong> {new Date(Number(session.start_time) / 1000000).toLocaleString()}</p>
                    {session.end_time && (
                      <p><strong>Ended:</strong> {new Date(Number(session.end_time) / 1000000).toLocaleString()}</p>
                    )}
                    {session.notes && <p><strong>Notes:</strong> {session.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Forms */}
      {showNewRequest && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Send Collaboration Request</h2>
            <form onSubmit={handleSendRequest}>
              <div className="form-group">
                <label>To Artist</label>
                <select 
                  value={newRequestForm.to} 
                  onChange={(e) => setNewRequestForm({...newRequestForm, to: e.target.value})}
                  required
                >
                  <option value="">Select Artist</option>
                  {artists.filter(a => a.id !== user.id).map(artist => (
                    <option key={artist.id} value={artist.id}>{artist.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Track</label>
                <select 
                  value={newRequestForm.track_id} 
                  onChange={(e) => setNewRequestForm({...newRequestForm, track_id: e.target.value})}
                  required
                >
                  <option value="">Select Track</option>
                  {tracks.filter(t => t.contributors.includes(user.id)).map(track => (
                    <option key={track.id} value={track.id}>{track.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Message (Optional)</label>
                <textarea 
                  value={newRequestForm.message} 
                  onChange={(e) => setNewRequestForm({...newRequestForm, message: e.target.value})}
                  placeholder="Add a message to your request..."
                />
              </div>
              <div className="form-actions">
                <button type="submit">Send Request</button>
                <button type="button" onClick={() => setShowNewRequest(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewTask && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Track</label>
                <select 
                  value={newTaskForm.track_id} 
                  onChange={(e) => setNewTaskForm({...newTaskForm, track_id: e.target.value})}
                  required
                >
                  <option value="">Select Track</option>
                  {tracks.filter(t => t.contributors.includes(user.id)).map(track => (
                    <option key={track.id} value={track.id}>{track.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Assign To</label>
                <select 
                  value={newTaskForm.assigned_to} 
                  onChange={(e) => setNewTaskForm({...newTaskForm, assigned_to: e.target.value})}
                  required
                >
                  <option value="">Select Artist</option>
                  {artists.map(artist => (
                    <option key={artist.id} value={artist.id}>{artist.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={newTaskForm.description} 
                  onChange={(e) => setNewTaskForm({...newTaskForm, description: e.target.value})}
                  placeholder="Describe the task..."
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit">Create Task</button>
                <button type="button" onClick={() => setShowNewTask(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collaboration;
