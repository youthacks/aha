import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsService, Event } from '../services/events.service';
import { authService } from '../services/api';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resendMessage, setResendMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [archivedEvents, setArchivedEvents] = useState<Event[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventsService.getMyEvents();
      setEvents(data);
      const archivedData = await eventsService.getMyArchivedEvents();
      setArchivedEvents(archivedData);
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setResendLoading(true);
    setResendMessage('');

    try {
      const response = await authService.resendVerification(user.email);
      setResendMessage(response.message);
    } catch (err: any) {
      setResendMessage('Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const newEvent = await eventsService.createEvent(eventName, eventDescription);
      setSuccess(`Event created! Join Code: ${newEvent.joinCode}`);
      setEventName('');
      setEventDescription('');
      setShowCreateModal(false);
      loadEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event');
    }
  };

  const handleJoinEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await eventsService.joinEvent(joinCode.toUpperCase());
      setSuccess('Successfully joined event!');
      setJoinCode('');
      setShowJoinModal(false);
      loadEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join event');
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  // Group events by role
  const adminEvents = events.filter(e => e.myRole === 'admin');
  const managerEvents = events.filter(e => e.myRole === 'manager');
  const memberEvents = events.filter(e => e.myRole === 'member');

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/settings')} className="btn-secondary" style={{ padding: '10px 20px' }}>
              ⚙️ Settings
            </button>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>

        <div className="user-info">
          <h2>
            Welcome, {user.firstName} {user.lastName}! 👋
          </h2>
          <p>{user.email}</p>
          {user.isEmailVerified ? (
            <span className="badge badge-verified">✓ Email Verified</span>
          ) : (
            <span className="badge badge-unverified">⚠ Email Not Verified</span>
          )}
        </div>

        {!user.isEmailVerified && (
          <div className="alert alert-info">
            <p>
              <strong>Please verify your email address.</strong>
              <br />
              We've sent a verification link to {user.email}.
            </p>
            {resendMessage && <p style={{ marginTop: '10px' }}>{resendMessage}</p>}
            <button
              onClick={handleResendVerification}
              className="link-button"
              disabled={resendLoading}
              style={{ marginTop: '10px' }}
            >
              {resendLoading ? 'Sending...' : 'Resend verification email'}
            </button>
          </div>
        )}

        <div style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#333' }}>My Events</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px', width: '150px' }}>
                + New Event
              </button>
              <button onClick={() => setShowJoinModal(true)} className="btn-secondary" style={{ padding: '10px 20px', fontSize: '14px', width: '150px' }}>
                Join Event
              </button>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {loading ? (
            <div className="loading">Loading events...</div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '10px' }}>
              <p style={{ color: '#666', marginBottom: '20px' }}>You haven't joined any events yet.</p>
              <p style={{ color: '#999', fontSize: '14px' }}>Create a new event or join an existing one with a code!</p>
            </div>
          ) : (
            <>
              {/* Admin Events */}
              {adminEvents.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ color: '#ff6b6b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="role-badge role-admin">ADMIN</span>
                    <span style={{ color: '#666', fontSize: '14px', fontWeight: 'normal' }}>({adminEvents.length} event{adminEvents.length !== 1 ? 's' : ''})</span>
                  </h4>
                  <div className="events-grid">
                    {adminEvents.map(event => (
                      <div key={event.id} className="event-card" onClick={() => navigate(`/events/${event.slug}`)}>
                        <h4>{event.name}</h4>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                          Join Code: <strong style={{ fontFamily: 'monospace', fontSize: '14px', letterSpacing: '1px' }}>{event.joinCode}</strong>
                        </p>
                        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`role-badge role-${event.myRole}`}>{event.myRole}</span>
                          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>
                            {event.myTokens} 🪙
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manager Events */}
              {managerEvents.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ color: '#ffa726', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="role-badge role-manager">MANAGER</span>
                    <span style={{ color: '#666', fontSize: '14px', fontWeight: 'normal' }}>({managerEvents.length} event{managerEvents.length !== 1 ? 's' : ''})</span>
                  </h4>
                  <div className="events-grid">
                    {managerEvents.map(event => (
                      <div key={event.id} className="event-card" onClick={() => navigate(`/events/${event.slug}`)}>
                        <h4>{event.name}</h4>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                          Join Code: <strong style={{ fontFamily: 'monospace', fontSize: '14px', letterSpacing: '1px' }}>{event.joinCode}</strong>
                        </p>
                        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`role-badge role-${event.myRole}`}>{event.myRole}</span>
                          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>
                            {event.myTokens} 🪙
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Member Events */}
              {memberEvents.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ color: '#66bb6a', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="role-badge role-member">MEMBER</span>
                    <span style={{ color: '#666', fontSize: '14px', fontWeight: 'normal' }}>({memberEvents.length} event{memberEvents.length !== 1 ? 's' : ''})</span>
                  </h4>
                  <div className="events-grid">
                    {memberEvents.map(event => (
                      <div key={event.id} className="event-card" onClick={() => navigate(`/events/${event.slug}`)}>
                        <h4>{event.name}</h4>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                          Join Code: <strong style={{ fontFamily: 'monospace', fontSize: '14px', letterSpacing: '1px' }}>{event.joinCode}</strong>
                        </p>
                        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`role-badge role-${event.myRole}`}>{event.myRole}</span>
                          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>
                            {event.myTokens} 🪙
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#333' }}>Archived Events</h3>
              <button onClick={() => setShowArchived(!showArchived)} className="btn-toggle-archived">
                {showArchived ? 'Hide' : 'Show'} Archived Events
              </button>
            </div>

            {showArchived && (
              <div className="events-grid">
                {archivedEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', width: '100%', padding: '20px', background: '#f9f9f9', borderRadius: '10px' }}>
                    <p style={{ color: '#666' }}>No archived events found.</p>
                  </div>
                ) : (
                  archivedEvents.map(event => (
                    <div key={event.id} className="event-card archived-event-card" onClick={() => navigate(`/events/${event.slug}`)}>
                      <h4>{event.name}</h4>
                      <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                        Join Code: <strong style={{ fontFamily: 'monospace', fontSize: '14px', letterSpacing: '1px' }}>{event.joinCode}</strong>
                      </p>
                      <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={`role-badge role-${event.myRole}`}>{event.myRole}</span>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>
                          {event.myTokens} 🪙
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Event</h2>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Event Name</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Enter event name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="What's this event about?"
                  rows={3}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e0e0e0' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary">Create Event</button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Join Event</h2>
            <form onSubmit={handleJoinEvent}>
              <div className="form-group">
                <label>Event Join Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 5-character code (e.g., ABC12)"
                  maxLength={5}
                  required
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontSize: '18px', letterSpacing: '2px', textAlign: 'center' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary">Join Event</button>
                <button type="button" onClick={() => setShowJoinModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
