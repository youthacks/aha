import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const hasVerified = React.useRef(false);

  useEffect(() => {
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email || !token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    if (hasVerified.current) {
      return;
    }

    const verifyEmail = async () => {
      try {
        hasVerified.current = true;
        const response = await authService.verifyEmail(email, token);

        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');

        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (err: any) {
        if (err.response?.data?.message === 'Email already verified') {
          setStatus('success');
          setMessage('Email already verified! Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setStatus('error');
          setMessage(err.response?.data?.message || 'Verification failed');
        }
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>
            {status === 'loading' && '⏳ Verifying...'}
            {status === 'success' && '✅ Verified!'}
            {status === 'error' && '❌ Error'}
          </h1>
        </div>

        {status === 'loading' && <div className="loading">Verifying your email...</div>}

        {status === 'success' && (
          <div className="alert alert-success">
            {message}
            <p style={{ marginTop: '10px' }}>Redirecting to dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="alert alert-error">
            {message}
            <p style={{ marginTop: '10px' }}>
              <button onClick={() => navigate('/login')} className="link-button">
                Go to Login
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
