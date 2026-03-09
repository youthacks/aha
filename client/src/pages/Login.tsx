import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleYouthacksLogin = async () => {
    setError('');
    setOauthLoading(true);

    try {
      const response = await api.get('/auth/youthacks-url', { withCredentials: true });
      const redirectUrl = response.data?.redirectUrl;

      if (!redirectUrl) {
        throw new Error('Missing OAuth redirect URL');
      }

      window.location.assign(redirectUrl);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start Youthacks login.');
      setOauthLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back! 👋</h1>
          <p>Login to your account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: '12px' }}>
          <button
            type="button"
            onClick={handleYouthacksLogin}
            className="btn-secondary"
            style={{ display: 'inline-block' }}
            disabled={oauthLoading}
          >
            {oauthLoading ? 'Redirecting...' : 'Login with Youthacks'}
          </button>
        </div>

        <div className="form-footer">
          <Link to="/forgot-password">Forgot password?</Link>
          <p style={{ marginTop: '15px' }}>
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

