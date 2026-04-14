import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('email');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [oauthRedirectLoading, setOauthRedirectLoading] = useState(false);

  // OAuth settings
  const [youthacksEnabled, setYouthacksEnabled] = useState(false);
  const [youthacksId, setYouthacksId] = useState<string | null>(null);
  const [loadingOAuth, setLoadingOAuth] = useState(false);

  // Email change states
  const [newEmail, setNewEmail] = useState('');
  const [emailChanging, setEmailChanging] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEmailChanging(true);

    try {
      const response = await api.post('/users/request-email-change', { newEmail });
      setSuccess(response.data.message);
      setNewEmail('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request email change');
    } finally {
      setEmailChanging(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setPasswordChanging(true);

    try {
      const response = await api.post('/users/request-password-change', { currentPassword });
      setSuccess(response.data.message);
      setCurrentPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request password change');
    } finally {
      setPasswordChanging(false);
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthStatus = params.get('oauth');
    if (oauthStatus === 'linked') {
      setActiveTab('oauth');
      setSuccess('Youthacks account connected successfully.');
      navigate('/settings', { replace: true });
      return;
    }

    if (oauthStatus === 'failed') {
      const statusCode = params.get('status');
      const reason = params.get('reason');

      setActiveTab('oauth');

      if (statusCode === '403') {
        setError(reason || 'OAuth access denied. Your Youthacks account is not connected yet. Connect it from this page first.');
      } else {
        setError(reason || 'Failed to connect Youthacks account. Please try again.');
      }

      navigate('/settings', { replace: true });
    }
  }, [location.search, navigate]);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const resp = await api.get('/users/settings');
        setYouthacksEnabled(Boolean(resp.data.youthacksEnabled || resp.data.youthacksId));
        setYouthacksId(resp.data.youthacksId || null);
      } catch (err) {
        // ignore
      }
    };

    fetchSettings();
  }, []);

  const handleUpdateOAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingOAuth(true);
    setError('');
    setSuccess('');

    try {
      const resp = await api.post('/users/settings/youthacks', { enabled: youthacksEnabled });
      setYouthacksEnabled(Boolean(resp.data.youthacksEnabled || resp.data.youthacksId));
      setYouthacksId(resp.data.youthacksId || null);
      setSuccess(resp.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update OAuth settings');
    } finally {
      setLoadingOAuth(false);
    }
  };

  const handleYouthacksLogin = async () => {
    setError('');
    setSuccess('');
    setOauthRedirectLoading(true);

    try {
      sessionStorage.setItem('oauth_intent', 'link');
      const response = await api.get('/auth/youthacks-link-url', { withCredentials: true });
      const redirectUrl = response.data?.redirectUrl;

      if (!redirectUrl) {
        throw new Error('Missing OAuth redirect URL');
      }

      window.location.assign(redirectUrl);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start Youthacks login');
      setOauthRedirectLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <button onClick={() => navigate('/dashboard')} className="back-button">← Back</button>
            <h1 style={{ marginTop: '10px' }}>Account Settings</h1>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Manage your account information and security
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="tabs">
          <button
            className={activeTab === 'email' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('email')}
          >
            📧 Email
          </button>
          <button
            className={activeTab === 'password' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('password')}
          >
            🔒 Password
          </button>
          <button
            className={activeTab === 'oauth' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('oauth')}
          >
            🔑 OAuth
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'email' && (
            <div>
              <h3 style={{ marginBottom: '10px' }}>Change Email Address</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                Current email: <strong>{user?.email}</strong>
              </p>
              <div style={{
                background: '#e0f2fe',
                border: '1px solid #0284c7',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <p style={{ fontSize: '13px', color: '#0369a1', margin: 0 }}>
                  <strong>ℹ️ How it works:</strong><br />
                  We'll send a verification email to your new email address. Click the link in that email to confirm the change.
                </p>
              </div>

              <form onSubmit={handleEmailChange}>
                <div className="form-group">
                  <label>New Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter your new email"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={emailChanging}
                  style={{ width: 'auto' }}
                >
                  {emailChanging ? 'Sending...' : 'Send Verification Email'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div>
              <h3 style={{ marginBottom: '10px' }}>Change Password</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                Update your password to keep your account secure
              </p>
              <div style={{
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>
                  <strong>⚠️ Security Notice:</strong><br />
                  We'll send a confirmation email to <strong>{user?.email}</strong>.
                  Click the link in that email to set your new password.
                </p>
              </div>

              <form onSubmit={handlePasswordChange}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={passwordChanging}
                  style={{ width: 'auto' }}
                >
                  {passwordChanging ? 'Sending...' : 'Send Confirmation Email'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'oauth' && (
            <div>
              <h3 style={{ marginBottom: '10px' }}>Youthacks OAuth</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                Connect your Youthacks account here. Once linked and enabled, you can sign in from the login page using "Login with Youthacks".
              </p>

              <div style={{
                background: youthacksId ? '#ecfdf5' : '#f8fafc',
                border: `1px solid ${youthacksId ? '#10b981' : '#cbd5e1'}`,
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px',
              }}>
                <p style={{ fontSize: '13px', color: '#334155', margin: 0 }}>
                  <strong>Connection status:</strong> {youthacksId ? 'Connected' : 'Not connected'}<br />
                  <strong>Linked account:</strong> {youthacksId || 'None'}
                </p>
              </div>

              <form onSubmit={handleUpdateOAuth}>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={youthacksEnabled}
                      onChange={(e) => setYouthacksEnabled(e.target.checked)}
                    /> Enable Youthacks login for this account
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button type="submit" className="btn-primary" disabled={loadingOAuth}>
                    {loadingOAuth ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleYouthacksLogin}
                    disabled={oauthRedirectLoading}
                  >
                    {oauthRedirectLoading ? 'Redirecting...' : 'Connect Youthacks Account'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

