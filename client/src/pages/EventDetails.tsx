import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsService, EventMember, Purchasable, Transaction } from '../services/events.service';

const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [members, setMembers] = useState<EventMember[]>([]);
  const [purchasables, setPurchasables] = useState<Purchasable[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [myRole, setMyRole] = useState('');
  const [myTokens, setMyTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<EventMember | null>(null);
  const [tokenAmount, setTokenAmount] = useState(0);

  const [showStationModal, setShowStationModal] = useState(false);
  const [stationName, setStationName] = useState('');
  const [stationPrice, setStationPrice] = useState(0);
  const [stationDescription, setStationDescription] = useState('');

  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('member');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  const loadEventData = async () => {
    try {
      const data = await eventsService.getEventDetails(eventId!);
      setEvent(data.event);
      setMembers(data.members);
      setPurchasables(data.stations);
      setMyRole(data.myRole);
      setMyTokens(data.myTokens);

      const txns = await eventsService.getTransactions(eventId!);
      setTransactions(txns);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      await eventsService.updateTokens(eventId!, selectedMember.userId, tokenAmount);
      setSuccess(`Updated tokens for ${selectedMember.name}`);
      setShowTokenModal(false);
      setTokenAmount(0);
      setSelectedMember(null);
      loadEventData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update tokens');
    }
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      await eventsService.promoteMember(eventId!, selectedMember.userId, selectedRole);
      setSuccess(`Promoted ${selectedMember.name} to ${selectedRole}`);
      setShowPromoteModal(false);
      setSelectedMember(null);
      loadEventData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to promote member');
    }
  };

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await eventsService.createStation(eventId!, stationName, stationPrice, stationDescription);
      setSuccess('Purchasable created!');
      setShowStationModal(false);
      setStationName('');
      setStationPrice(0);
      setStationDescription('');
      loadEventData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create purchasable');
    }
  };

  const handlePurchase = async (stationId: string, stationName: string) => {
    if (!window.confirm(`Purchase ${stationName}?`)) return;

    try {
      await eventsService.purchase(eventId!, stationId);
      setSuccess(`Successfully purchased ${stationName}!`);
      loadEventData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Purchase failed');
    }
  };

  const handleDeleteEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (deleteConfirmText !== event.name) {
      setError('Event name does not match. Please type the exact event name.');
      return;
    }

    try {
      await eventsService.deleteEvent(eventId!);
      setSuccess('Event deleted successfully. Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const openTokenModal = (member: EventMember) => {
    setSelectedMember(member);
    setTokenAmount(0);
    setShowTokenModal(true);
  };

  const openPromoteModal = (member: EventMember) => {
    setSelectedMember(member);
    setSelectedRole(member.role);
    setShowPromoteModal(true);
  };

  if (loading) {
    return <div className="dashboard-container"><div className="loading">Loading event...</div></div>;
  }

  if (!event) {
    return <div className="dashboard-container"><div className="alert alert-error">Event not found</div></div>;
  }

  const canManage = myRole === 'admin' || myRole === 'manager';
  const isAdmin = myRole === 'admin';

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <button onClick={() => navigate('/dashboard')} className="back-button">← Back</button>
            <h1 style={{ marginTop: '10px' }}>{event.name}</h1>
            <p style={{ color: '#666', fontSize: '14px' }}>Code: <strong>{event.code}</strong></p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: '#666' }}>My Tokens</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>{myTokens} 🪙</div>
            <span className={`role-badge role-${myRole}`}>{myRole}</span>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="tabs">
          <button className={activeTab === 'overview' ? 'tab active' : 'tab'} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={activeTab === 'members' ? 'tab active' : 'tab'} onClick={() => setActiveTab('members')}>
            Members ({members.length})
          </button>
          <button className={activeTab === 'stations' ? 'tab active' : 'tab'} onClick={() => setActiveTab('stations')}>
            Purchasables ({purchasables.length})
          </button>
          <button className={activeTab === 'history' ? 'tab active' : 'tab'} onClick={() => setActiveTab('history')}>
            My History
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{members.length}</div>
                  <div className="stat-label">Members</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{purchasables.length}</div>
                  <div className="stat-label">Purchasables</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{myTokens}</div>
                  <div className="stat-label">My Tokens</div>
                </div>
              </div>

              <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Leaderboard</h3>
              <div className="leaderboard">
                {members.slice(0, 10).map((member, index) => (
                  <div key={member.id} className="leaderboard-item">
                    <div className="leaderboard-rank">#{index + 1}</div>
                    <div className="leaderboard-info">
                      <div className="leaderboard-name">{member.name}</div>
                      <span className={`role-badge role-${member.role}`}>{member.role}</span>
                    </div>
                    <div className="leaderboard-tokens">{member.tokens} 🪙</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3>Event Members</h3>
                {canManage && <p style={{ fontSize: '14px', color: '#666' }}>You can manage tokens and roles</p>}
              </div>
              <div className="members-list">
                {members.map(member => (
                  <div key={member.id} className="member-card">
                    <div>
                      <div className="member-name">{member.name}</div>
                      <div className="member-email">{member.email}</div>
                      <span className={`role-badge role-${member.role}`}>{member.role}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div className="member-tokens">{member.tokens} 🪙</div>
                      {canManage && (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => openTokenModal(member)} className="btn-small">
                            Tokens
                          </button>
                          {isAdmin && member.role !== 'admin' && (
                            <button onClick={() => openPromoteModal(member)} className="btn-small btn-secondary-small">
                              Role
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'stations' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Purchasables</h3>
                {canManage && (
                  <button onClick={() => setShowStationModal(true)} className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
                    + New Purchasable
                  </button>
                )}
              </div>

              {purchasables.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '10px' }}>
                  <p style={{ color: '#666' }}>No purchasables yet.</p>
                  {canManage && <p style={{ color: '#999', fontSize: '14px', marginTop: '10px' }}>Create one to let members spend their tokens!</p>}
                </div>
              ) : (
                <div className="stations-grid">
                  {purchasables.map(station => (
                    <div key={station.id} className="station-card">
                      <h4>{station.name}</h4>
                      {station.description && <p className="station-description">{station.description}</p>}
                      <div className="station-footer">
                        <div className="station-price">{station.price} 🪙</div>
                        {station.isAvailable && (
                          <button
                            onClick={() => handlePurchase(station.id, station.name)}
                            className="btn-purchase"
                            disabled={myTokens < station.price}
                          >
                            {myTokens < station.price ? 'Insufficient Tokens' : 'Purchase'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 style={{ marginBottom: '15px' }}>Transaction History</h3>
              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '10px' }}>
                  <p style={{ color: '#666' }}>No transactions yet.</p>
                </div>
              ) : (
                <div className="transactions-list">
                  {transactions.map(txn => (
                    <div key={txn.id} className="transaction-item">
                      <div>
                        <div className="transaction-description">{txn.description}</div>
                        <div className="transaction-date">{new Date(txn.createdAt).toLocaleString()}</div>
                      </div>
                      <div className={`transaction-amount ${txn.amount > 0 ? 'positive' : 'negative'}`}>
                        {txn.amount > 0 ? '+' : ''}{txn.amount} 🪙
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {isAdmin && (
          <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #e0e0e0' }}>
            <h3 style={{ color: '#dc2626', marginBottom: '10px' }}>⚠️ Danger Zone</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Once you delete this event, all members, tokens, purchasables, and transaction history will be permanently removed. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                background: '#dc2626',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
            >
              🗑️ Delete Event Permanently
            </button>
          </div>
        )}
      </div>

      {showTokenModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowTokenModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Update Tokens - {selectedMember.name}</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>Current: {selectedMember.tokens} 🪙</p>
            <form onSubmit={handleUpdateTokens}>
              <div className="form-group">
                <label>Token Amount (+ to add, - to remove)</label>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(parseInt(e.target.value))}
                  placeholder="Enter amount (e.g., 10 or -5)"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary">Update</button>
                <button type="button" onClick={() => setShowTokenModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPromoteModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowPromoteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Change Role - {selectedMember.name}</h2>
            <form onSubmit={handlePromote}>
              <div className="form-group">
                <label>Role</label>
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="form-select">
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary">Update Role</button>
                <button type="button" onClick={() => setShowPromoteModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStationModal && (
        <div className="modal-overlay" onClick={() => setShowStationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create Purchasable</h2>
            <form onSubmit={handleCreateStation}>
              <div className="form-group">
                <label>Purchasable Name</label>
                <input
                  type="text"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  placeholder="e.g., Premium Snack Box"
                  required
                />
              </div>
              <div className="form-group">
                <label>Price (Tokens)</label>
                <input
                  type="number"
                  value={stationPrice}
                  onChange={(e) => setStationPrice(parseInt(e.target.value))}
                  placeholder="How many tokens?"
                  min={1}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={stationDescription}
                  onChange={(e) => setStationDescription(e.target.value)}
                  placeholder="What can they buy?"
                  rows={2}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e0e0e0' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary">Create Purchasable</button>
                <button type="button" onClick={() => setShowStationModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>⚠️ Delete Event</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
              This will permanently delete <strong>"{event.name}"</strong> and all associated data including:
            </p>
            <ul style={{ fontSize: '14px', color: '#666', marginBottom: '20px', marginLeft: '20px', lineHeight: '1.8' }}>
              <li>All {members.length} member(s) and their tokens</li>
              <li>All {purchasables.length} purchasable(s)</li>
              <li>Complete transaction history</li>
            </ul>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>
                <strong>Warning:</strong> This action cannot be undone!
              </p>
            </div>
            <form onSubmit={handleDeleteEvent}>
              <div className="form-group">
                <label style={{ fontWeight: '600' }}>Type the event name to confirm: <strong>{event.name}</strong></label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Enter event name exactly"
                  required
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={deleteConfirmText !== event.name}
                  style={{
                    background: deleteConfirmText === event.name ? '#dc2626' : '#9ca3af',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: deleteConfirmText === event.name ? 'pointer' : 'not-allowed',
                    flex: 1
                  }}
                >
                  Delete Event Permanently
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;

