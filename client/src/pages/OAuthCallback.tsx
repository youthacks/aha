import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Parse fragment like #access_token=...&user=...
    const hash = window.location.hash || '';
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const token = params.get('access_token');
    const userStr = params.get('user');

    if (token) {
      localStorage.setItem('token', token);
    }

    if (userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        localStorage.setItem('user', JSON.stringify(user));
      } catch (e) {
        // ignore
      }
    }

    // Navigate to dashboard
    navigate('/dashboard');
  }, [navigate]);

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
      <div>Completing OAuth login...</div>
    </div>
  );
};

export default OAuthCallback;
