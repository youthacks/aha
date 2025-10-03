import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resendMessage, setResendMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

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

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
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
          <h3 style={{ marginBottom: '15px', color: '#333' }}>Account Information</h3>
          <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px' }}>
            <p style={{ marginBottom: '10px' }}>
              <strong>User ID:</strong> {user.id}
            </p>
            <p style={{ marginBottom: '10px' }}>
              <strong>Email:</strong> {user.email}
            </p>
            <p style={{ marginBottom: '10px' }}>
              <strong>Name:</strong> {user.firstName} {user.lastName}
            </p>
            <p>
              <strong>Email Status:</strong>{' '}
              {user.isEmailVerified ? (
                <span style={{ color: '#4caf50' }}>Verified ✓</span>
              ) : (
                <span style={{ color: '#ff9800' }}>Not Verified</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

