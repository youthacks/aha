import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsService, EventMember, Shop, Transaction, GlobalTransaction } from '../services/events.service';

const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [members, setMembers] = useState<EventMember[]>([]);
  const [shopItems, setShopItems] = useState<Shop[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [globalTransactions, setGlobalTransactions] = useState<GlobalTransaction[]>([]);
  const [myRole, setMyRole] = useState('');
  const [myTokens, setMyTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<EventMember | null>(null);
  const [tokenAmount, setTokenAmount] = useState(0);
  const [tokenOperation, setTokenOperation] = useState<'add' | 'remove'>('add');

  const [showStationModal, setShowStationModal] = useState(false);
  const [stationName, setStationName] = useState('');
  const [stationPrice, setStationPrice] = useState(0);
  const [stationDescription, setStationDescription] = useState('');
  const [stationStock, setStationStock] = useState(0);
  const [stationPurchaseLimit, setStationPurchaseLimit] = useState(0);
  const [stationImageUrl, setStationImageUrl] = useState('');

  const [showEditStationModal, setShowEditStationModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Shop | null>(null);
  const [editStationName, setEditStationName] = useState('');
  const [editStationPrice, setEditStationPrice] = useState(0);
  const [editStationDescription, setEditStationDescription] = useState('');
  const [editStationStock, setEditStationStock] = useState(0);
  const [editStationPurchaseLimit, setEditStationPurchaseLimit] = useState(0);
  const [editStationAvailable, setEditStationAvailable] = useState(true);
  const [editStationImageUrl, setEditStationImageUrl] = useState('');

  const [showDeleteStationModal, setShowDeleteStationModal] = useState(false);
  const [deleteStationConfirmText, setDeleteStationConfirmText] = useState('');

  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('member');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);

  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerInput, setScannerInput] = useState('');

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsEventName, setSettingsEventName] = useState('');
  const [settingsJoinCode, setSettingsJoinCode] = useState('');
  const [settingsDescription, setSettingsDescription] = useState('');

  const loadEventData = useCallback(async (silent = false) => {
    try {
      const data = await eventsService.getEventDetails(eventId!);
      setEvent(data.event);
      setMembers(data.members);
      setShopItems(data.stations);
      setMyRole(data.myRole);
      setMyTokens(data.myTokens);

      const txns = await eventsService.getTransactions(eventId!);
      setTransactions(txns);

      // Load global transactions if user is admin or manager
      if (data.myRole === 'admin' || data.myRole === 'manager') {
        try {
          const allTxns = await eventsService.getAllTransactions(eventId!);
          setGlobalTransactions(allTxns);
        } catch (err) {
          // Silently fail if user doesn't have permission
        }
      }
    } catch (err: any) {
      if (!silent) {
        setError(err.response?.data?.message || 'Failed to load event');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      loadEventData();

      // Set up polling to refresh data every 3 seconds
      const interval = setInterval(() => {
        loadEventData(true); // silent refresh
      }, 3000);

      // Cleanup interval on unmount
      return () => clearInterval(interval);
    }
  }, [eventId, loadEventData]);

  const handleUpdateTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      const finalAmount = tokenOperation === 'remove' ? -tokenAmount : tokenAmount;
      await eventsService.updateTokens(eventId!, selectedMember.userId, finalAmount);
      setSuccess(`Updated tokens for ${selectedMember.name}`);
      setShowTokenModal(false);
      setTokenAmount(0);
      setTokenOperation('add');
      setSelectedMember(null);
      await loadEventData(true); // Immediate refresh after action
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
      await loadEventData(true); // Immediate refresh after action
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to promote member');
    }
  };

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await eventsService.createStation(eventId!, stationName, stationPrice, stationDescription, stationStock, stationImageUrl, stationPurchaseLimit || undefined);
      setSuccess('Shop item created!');
      setShowStationModal(false);
      setStationName('');
      setStationPrice(0);
      setStationDescription('');
      setStationStock(0);
      setStationPurchaseLimit(0);
      setStationImageUrl('');
      await loadEventData(true); // Immediate refresh after action
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create shop item');
    }
  };

  const handleEditStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStation) return;

    try {
      await eventsService.updateStation(eventId!, selectedStation.id, {
        name: editStationName,
        price: editStationPrice,
        description: editStationDescription,
        stock: editStationStock,
        purchaseLimit: editStationPurchaseLimit || undefined,
        isAvailable: editStationAvailable,
        imageUrl: editStationImageUrl,
      });
      setSuccess('Shop item updated!');
      setShowEditStationModal(false);
      setSelectedStation(null);
      await loadEventData(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update shop item');
    }
  };

  const handlePurchase = async (stationId: string, stationName: string) => {
    if (!window.confirm(`Purchase ${stationName}?`)) return;

    try {
      const receipt = await eventsService.purchase(eventId!, stationId);
      setSuccess(`Successfully purchased ${stationName}!`);
      setSelectedReceipt(receipt);
      setShowReceiptModal(true);
      await loadEventData(true); // Immediate refresh after action
    } catch (err: any) {
      setError(err.response?.data?.message || 'Purchase failed');
    }
  };

  const handleRedeemReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerInput.trim()) return;

    try {
      const result = await eventsService.redeemReceipt(eventId!, scannerInput.trim());
      setSuccess(`Receipt redeemed successfully! Item: ${result.transaction.itemName}, Buyer: ${result.transaction.buyerName}`);
      setShowScannerModal(false);
      setScannerInput('');
      await loadEventData(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to redeem receipt');
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

  const handleDeleteStation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (deleteStationConfirmText !== selectedStation?.name) {
      setError('Shop item name does not match. Please type the exact shop item name.');
      return;
    }

    try {
      await eventsService.deleteStation(eventId!, selectedStation!.id);
      setSuccess('Shop item deleted successfully.');
      setShowDeleteStationModal(false);
      setDeleteStationConfirmText('');
      setSelectedStation(null);
      await loadEventData(true); // Immediate refresh after action
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete shop item');
    }
  };

  const handleArchiveEvent = async () => {
    if (!window.confirm(`Archive "${event.name}"? It will be moved to your archived events.`)) return;

    try {
      await eventsService.archiveEvent(eventId!);
      setSuccess('Event archived successfully. Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to archive event');
    }
  };

  const handleUnarchiveEvent = async () => {
    if (!window.confirm(`Unarchive "${event.name}"? It will be moved back to your active events.`)) return;

    try {
      await eventsService.unarchiveEvent(eventId!);
      setSuccess('Event unarchived successfully. Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unarchive event');
    }
  };

  const handleUpdateEventSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await eventsService.updateEventSettings(eventId!, {
        name: settingsEventName !== event.name ? settingsEventName : undefined,
        joinCode: settingsJoinCode !== event.joinCode ? settingsJoinCode : undefined,
        description: settingsDescription,
      });
      setSuccess('Event settings updated successfully!');
      setShowSettingsModal(false);
      await loadEventData(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update event settings');
    }
  };

  const openTokenModal = (member: EventMember) => {
    setSelectedMember(member);
    setTokenAmount(0);
    setTokenOperation('add');
    setShowTokenModal(true);
  };

  const openPromoteModal = (member: EventMember) => {
    setSelectedMember(member);
    setSelectedRole(member.role);
    setShowPromoteModal(true);
  };

  const openEditStationModal = (station: Shop) => {
    setSelectedStation(station);
    setEditStationName(station.name);
    setEditStationPrice(station.price);
    setEditStationDescription(station.description || '');
    setEditStationStock(station.stock);
    setEditStationAvailable(station.isAvailable);
    setEditStationImageUrl(station.imageUrl || '');
    setEditStationPurchaseLimit(station.purchaseLimit || 0);
    setShowEditStationModal(true);
  };

  const openDeleteStationModal = (station: Shop) => {
    setSelectedStation(station);
    setDeleteStationConfirmText('');
    setShowDeleteStationModal(true);
  };

  const openSettingsModal = () => {
    setSettingsEventName(event.name);
    setSettingsJoinCode(event.joinCode);
    setSettingsDescription(event.description || '');
    setShowSettingsModal(true);
  };

  if (loading) {
    return <div className="dashboard-container"><div className="loading">Loading event...</div></div>;
  }

  if (!event) {
    return <div className="dashboard-container"><div className="alert alert-error">Event not found</div></div>;
  }

  const canManage = myRole === 'admin' || myRole === 'manager';
  const isAdmin = myRole === 'admin';
  const isRegularMember = myRole === 'member';

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <button onClick={() => navigate('/dashboard')} className="back-button">← Back</button>
            <h1 style={{ marginTop: '10px' }}>{event.name}</h1>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Join Code: <strong style={{ fontFamily: 'monospace', fontSize: '16px', letterSpacing: '1px' }}>{event.joinCode}</strong>
              {isAdmin && (
                <button
                  onClick={openSettingsModal}
                  style={{
                    marginLeft: '10px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#5a67d8'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#667eea'}
                >
                  ⚙️ Settings
                </button>
              )}
            </p>
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
          <button className={activeTab === 'shop' ? 'tab active' : 'tab'} onClick={() => setActiveTab('shop')}>
            Shop ({shopItems.length})
          </button>
          {canManage && (
            <button className={activeTab === 'transactions' ? 'tab active' : 'tab'} onClick={() => setActiveTab('transactions')}>
              Transactions
            </button>
          )}
          {canManage && (
            <button className={activeTab === 'global-history' ? 'tab active' : 'tab'} onClick={() => setActiveTab('global-history')}>
              Global History
            </button>
          )}
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
                  <div className="stat-value">{shopItems.length}</div>
                  <div className="stat-label">Shop Items</div>
                </div>
                {isRegularMember && (
                  <div className="stat-card">
                    <div className="stat-value">{myTokens}</div>
                    <div className="stat-label">My Tokens</div>
                  </div>
                )}
              </div>

              <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Leaderboard</h3>
              <div className="leaderboard">
                {members.filter(m => m.role === 'member').slice(0, 10).map((member, index) => (
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

          {activeTab === 'shop' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Shop</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {canManage && (
                    <>
                      <button
                        onClick={() => navigate(`/events/${eventId}/bigscreen`)}
                        className="btn-secondary"
                        style={{
                          padding: '5px 15px',
                          fontSize: '14px',
                          width: 'auto',
                        }}
                      >
                        📺 Big Screen Mode
                      </button>
                      <button
                        onClick={() => setShowStationModal(true)}
                        className="btn-primary"
                        style={{
                          padding: '5px 10px',
                          fontSize: '17px',
                          width: 'auto',
                          float: 'right'
                        }}
                      >
                        + New Item
                      </button>
                    </>
                  )}
                </div>
              </div>

              {shopItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '10px' }}>
                  <p style={{ color: '#666' }}>No shop items yet.</p>
                  {canManage && <p style={{ color: '#999', fontSize: '14px', marginTop: '10px' }}>Create one to let members spend their tokens!</p>}
                </div>
              ) : (
                <div className="stations-grid">
                  {shopItems.map(station => (
                    <div key={station.id} className="station-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, flex: 1 }}>{station.name}</h4>
                        {canManage && (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              onClick={() => openEditStationModal(station)}
                              className="btn-small"
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => openDeleteStationModal(station)}
                              className="btn-small btn-secondary-small"
                              style={{ fontSize: '12px', padding: '4px 8px', background: '#dc2626' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                      {station.description && <p className="station-description">{station.description}</p>}
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '8px', marginBottom: '8px' }}>
                        Stock: <strong style={{ color: station.stock > 0 ? '#059669' : '#dc2626' }}>
                          {station.stock > 0 ? `${station.stock} available` : 'Out of stock'}
                        </strong>
                      </div>
                      <div className="station-footer">
                        <div className="station-price">{station.price} 🪙</div>
                        {station.isAvailable && isRegularMember && (
                          <button
                            onClick={() => handlePurchase(station.id, station.name)}
                            className="btn-purchase"
                            disabled={myTokens < station.price || station.stock <= 0}
                          >
                            {station.stock <= 0 ? 'Out of Stock' : myTokens < station.price ? 'Insufficient Tokens' : 'Purchase'}
                          </button>
                        )}
                        {!isRegularMember && (
                          <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                            Members only
                          </span>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Transaction History</h3>
                {canManage && (
                  <button
                    onClick={() => setShowScannerModal(true)}
                    className="btn-primary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      width: 'auto',
                    }}
                  >
                    🎫 Redeem Receipt
                  </button>
                )}
              </div>
              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '10px' }}>
                  <p style={{ color: '#666' }}>No transactions yet.</p>
                </div>
              ) : (
                <div className="transactions-list">
                  {transactions.map(txn => (
                    <div key={txn.id} className="transaction-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <div className="transaction-description">{txn.description}</div>
                          <div className="transaction-date">{new Date(txn.createdAt).toLocaleString()}</div>
                          {txn.type === 'purchase' && txn.receiptCode && (
                            <div style={{ marginTop: '8px' }}>
                              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Receipt Code:</div>
                              <div style={{
                                fontFamily: 'monospace',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                letterSpacing: '2px',
                                padding: '8px 12px',
                                background: txn.isRedeemed ? '#fee2e2' : '#d1fae5',
                                color: txn.isRedeemed ? '#991b1b' : '#065f46',
                                borderRadius: '6px',
                                display: 'inline-block',
                                border: txn.isRedeemed ? '2px solid #fecaca' : '2px solid #86efac',
                              }}>
                                {txn.receiptCode}
                              </div>
                              {txn.isRedeemed && (
                                <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '4px', fontWeight: '600' }}>
                                  ✓ Redeemed on {new Date(txn.redeemedAt!).toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className={`transaction-amount ${txn.amount > 0 ? 'positive' : 'negative'}`}>
                          {txn.amount > 0 ? '+' : ''}{txn.amount} 🪙
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && canManage && (
            <div>
              <h3 style={{ marginBottom: '15px' }}>💳 All Transactions</h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                View all transactions across all members in this event
              </p>
              {globalTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '10px' }}>
                  <p style={{ color: '#666' }}>No transactions yet.</p>
                </div>
              ) : (
                <div className="transactions-list">
                  {globalTransactions.map(txn => (
                    <div key={txn.id} className="transaction-item">
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                          <span style={{ fontWeight: '600', color: '#333' }}>{txn.userName}</span>
                          <span style={{
                            fontSize: '11px',
                            background: txn.type === 'purchase' ? '#fef3c7' : txn.amount > 0 ? '#d1fae5' : '#fee2e2',
                            color: txn.type === 'purchase' ? '#92400e' : txn.amount > 0 ? '#065f46' : '#991b1b',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}>
                            {txn.type === 'purchase' ? '🛒 PURCHASE' : txn.amount > 0 ? '➕ CREDIT' : '➖ DEBIT'}
                          </span>
                        </div>
                        <div className="transaction-description">
                          {txn.stationName ? `Purchased: ${txn.stationName}` : txn.description}
                        </div>
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

          {activeTab === 'global-history' && canManage && (
            <div>
              <h3 style={{ marginBottom: '15px' }}>📋 Global History</h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                Complete activity log including transactions, role changes, and administrative actions
              </p>

              <div className="transactions-list">
                {/* Combine transactions and role changes into a unified activity log */}
                {globalTransactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '10px' }}>
                    <p style={{ color: '#666' }}>No activity yet.</p>
                  </div>
                ) : (
                  globalTransactions.map(txn => (
                    <div key={txn.id} className="transaction-item">
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                          <span style={{ fontWeight: '600', color: '#333' }}>{txn.userName}</span>
                          <span style={{
                            fontSize: '11px',
                            background: txn.type === 'purchase' ? '#fef3c7' : txn.amount > 0 ? '#d1fae5' : '#fee2e2',
                            color: txn.type === 'purchase' ? '#92400e' : txn.amount > 0 ? '#065f46' : '#991b1b',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}>
                            {txn.type === 'purchase' ? '🛒 PURCHASE' : txn.amount > 0 ? '➕ CREDIT' : '➖ DEBIT'}
                          </span>
                        </div>
                        <div className="transaction-description">
                          {txn.stationName ? `Purchased: ${txn.stationName}` : txn.description}
                        </div>
                        <div className="transaction-date">{new Date(txn.createdAt).toLocaleString()}</div>
                      </div>
                      <div className={`transaction-amount ${txn.amount > 0 ? 'positive' : 'negative'}`}>
                        {txn.amount > 0 ? '+' : ''}{txn.amount} 🪙
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: '30px', padding: '15px', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                <p style={{ fontSize: '13px', color: '#1e40af', margin: 0 }}>
                  💡 <strong>Note:</strong> Role management logs will be added in a future update. This section will show member promotions, role changes, and other administrative actions.
                </p>
              </div>
            </div>
          )}
        </div>

        {isAdmin && (
          <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #e0e0e0' }}>
            <h3 style={{ color: '#dc2626', marginBottom: '10px' }}>⚠️ Danger Zone</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Manage this event's lifecycle. Archived events are hidden from your main dashboard but can be restored later.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              {!event.isArchived ? (
                <button
                  onClick={handleArchiveEvent}
                  style={{
                    background: '#f59e0b',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
                >
                  📦 Archive Event
                </button>
              ) : (
                <button
                  onClick={handleUnarchiveEvent}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                >
                  📤 Unarchive Event
                </button>
              )}
            </div>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px', marginTop: '20px' }}>
              Once you delete this event, all members, tokens, shop items, and transaction history will be permanently removed. This action cannot be undone.
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
                <label>Operation</label>
                <select value={tokenOperation} onChange={(e) => setTokenOperation(e.target.value as 'add' | 'remove')} className="form-select">
                  <option value="add">➕ Add Tokens</option>
                  <option value="remove">➖ Remove Tokens</option>
                </select>
              </div>
              <div className="form-group">
                <label>Token Amount</label>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(parseInt(e.target.value) || 0)}
                  placeholder="Enter amount (e.g., 10)"
                  min="0"
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
            <h2>Create Shop Item</h2>
            <form onSubmit={handleCreateStation}>
              <div className="form-group">
                <label>Item Name</label>
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
              <div className="form-group">
                <label>Stock Quantity</label>
                <input
                  type="number"
                  value={stationStock}
                  onChange={(e) => setStationStock(parseInt(e.target.value))}
                  placeholder="How many in stock?"
                  min={0}
                  required
                />
              </div>
              <div className="form-group">
                <label>Purchase Limit</label>
                <input
                  type="number"
                  value={stationPurchaseLimit}
                  onChange={(e) => setStationPurchaseLimit(parseInt(e.target.value))}
                  placeholder="Max purchases per member"
                  min={0}
                  required
                />
              </div>
              <div className="form-group">
                <label>Image URL (Optional)</label>
                <input
                  type="text"
                  value={stationImageUrl}
                  onChange={(e) => setStationImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e0e0e0' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary">Create Item</button>
                <button type="button" onClick={() => setShowStationModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditStationModal && selectedStation && (
        <div className="modal-overlay" onClick={() => setShowEditStationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Shop Item</h2>
            <form onSubmit={handleEditStation}>
              <div className="form-group">
                <label>Item Name</label>
                <input
                  type="text"
                  value={editStationName}
                  onChange={(e) => setEditStationName(e.target.value)}
                  placeholder="e.g., Premium Snack Box"
                  required
                />
              </div>
              <div className="form-group">
                <label>Price (Tokens)</label>
                <input
                  type="number"
                  value={editStationPrice}
                  onChange={(e) => setEditStationPrice(parseInt(e.target.value))}
                  placeholder="How many tokens?"
                  min={1}
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input
                  type="number"
                  value={editStationStock}
                  onChange={(e) => setEditStationStock(parseInt(e.target.value))}
                  placeholder="How many in stock?"
                  min={0}
                  required
                />
              </div>
              <div className="form-group">
                <label>Purchase Limit</label>
                <input
                  type="number"
                  value={editStationPurchaseLimit}
                  onChange={(e) => setEditStationPurchaseLimit(parseInt(e.target.value))}
                  placeholder="Max purchases per member"
                  min={0}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={editStationDescription}
                  onChange={(e) => setEditStationDescription(e.target.value)}
                  placeholder="What can they buy?"
                  rows={2}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e0e0e0' }}
                />
              </div>
              <div className="form-group">
                <label>Image URL (Optional)</label>
                <input
                  type="url"
                  value={editStationImageUrl}
                  onChange={(e) => setEditStationImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                {editStationImageUrl && (
                  <div style={{ marginTop: '10px' }}>
                    <img
                      src={editStationImageUrl}
                      alt="Preview"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        borderRadius: '10px',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editStationAvailable}
                    onChange={(e) => setEditStationAvailable(e.target.checked)}
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                  <span>Available for purchase</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary">Update Item</button>
                <button type="button" onClick={() => setShowEditStationModal(false)} className="btn-secondary">Cancel</button>
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
              <li>All {shopItems.length} shop item(s)</li>
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

      {showDeleteStationModal && selectedStation && (
        <div className="modal-overlay" onClick={() => setShowDeleteStationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>⚠️ Delete Shop Item</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              Are you sure you want to delete <strong>"{selectedStation.name}"</strong>?
            </p>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>
                <strong>Warning:</strong> This action cannot be undone!
              </p>
            </div>
            <form onSubmit={handleDeleteStation}>
              <div className="form-group">
                <label style={{ fontWeight: '600' }}>Type the item name to confirm: <strong>{selectedStation.name}</strong></label>
                <input
                  type="text"
                  value={deleteStationConfirmText}
                  onChange={(e) => setDeleteStationConfirmText(e.target.value)}
                  placeholder="Enter item name exactly"
                  required
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={deleteStationConfirmText !== selectedStation.name}
                  style={{
                    background: deleteStationConfirmText === selectedStation.name ? '#dc2626' : '#9ca3af',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: deleteStationConfirmText === selectedStation.name ? 'pointer' : 'not-allowed',
                    flex: 1
                  }}
                >
                  Delete Item
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteStationModal(false);
                    setDeleteStationConfirmText('');
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

      {showReceiptModal && selectedReceipt && (
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', textAlign: 'center' }}>
            <h2 style={{ color: '#059669', marginBottom: '10px' }}>✓ Purchase Successful!</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>{selectedReceipt.description}</p>

            <div style={{
              background: '#f0fdf4',
              border: '2px solid #86efac',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
                YOUR RECEIPT CODE
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '28px',
                fontWeight: 'bold',
                letterSpacing: '3px',
                color: '#065f46',
                marginBottom: '8px'
              }}>
                {selectedReceipt.receiptCode}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Show this code to an admin/manager to redeem your item
              </div>
            </div>

            <div style={{ fontSize: '13px', color: '#666', marginBottom: '15px', textAlign: 'left', background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
              <strong>Transaction Details:</strong><br />
              Amount: {selectedReceipt.amount} 🪙<br />
              Time: {new Date(selectedReceipt.createdAt).toLocaleString()}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  if (selectedReceipt.receiptCode) {
                    navigator.clipboard.writeText(selectedReceipt.receiptCode);
                    setSuccess('Receipt code copied to clipboard!');
                  }
                }}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                📋 Copy Code
              </button>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedReceipt(null);
                }}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showScannerModal && (
        <div className="modal-overlay" onClick={() => setShowScannerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h2>Redeem Receipt</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>Enter the receipt ID</p>
            <form onSubmit={handleRedeemReceipt}>
              <div className="form-group">
                <label>Receipt ID</label>
                <input
                  type="text"
                  value={scannerInput}
                  onChange={(e) => setScannerInput(e.target.value)}
                  placeholder="Enter receipt ID"
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e0e0e0' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary">Redeem Receipt</button>
                <button type="button" onClick={() => setShowScannerModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>Event Settings</h2>
            <form onSubmit={handleUpdateEventSettings}>
              <div className="form-group">
                <label>Event Name</label>
                <input
                  type="text"
                  value={settingsEventName}
                  onChange={(e) => setSettingsEventName(e.target.value)}
                  placeholder="Enter event name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Join Code</label>
                <input
                  type="text"
                  value={settingsJoinCode}
                  onChange={(e) => setSettingsJoinCode(e.target.value)}
                  placeholder="Enter join code"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={settingsDescription}
                  onChange={(e) => setSettingsDescription(e.target.value)}
                  placeholder="Enter event description"
                  rows={3}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e0e0e0' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary">Save Settings</button>
                <button type="button" onClick={() => setShowSettingsModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;

