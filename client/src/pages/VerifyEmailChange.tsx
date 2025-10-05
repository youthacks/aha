import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const VerifyEmailChange: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setError('Invalid verification link');
        setVerifying(false);
        return;
      }

      try {
        await api.post('/users/verify-email-change', { token });
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Email verification failed');
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>📧 Email Verification</h1>
        </div>

        {verifying && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Verifying your new email address...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <strong>Verification Failed</strong>
            <p>{error}</p>
            <button onClick={() => navigate('/settings')} className="btn-primary" style={{ marginTop: '20px' }}>
              Go to Settings
            </button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <strong>✓ Email Changed Successfully!</strong>
            <p>Your email address has been updated. Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailChange;
