import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeOAuthLogin } = useAuth();

  useEffect(() => {
    const getOAuthIntent = (): 'login' | 'link' => {
      const value = sessionStorage.getItem('oauth_intent');
      return value === 'link' ? 'link' : 'login';
    };

    const clearOAuthIntent = () => {
      sessionStorage.removeItem('oauth_intent');
    };

    const navigateOAuthFailure = (reason?: string | null, statusCode?: number | string | null, mode?: 'login' | 'link') => {
      const intent = mode || getOAuthIntent();
      const status = statusCode ? String(statusCode) : null;

      if (intent === 'link') {
        const fallback403 = 'OAuth access denied. Your Youthacks account is not connected yet. Connect it from Settings first.';
        const resolvedReason = status === '403' ? (reason || fallback403) : (reason || 'Failed to connect Youthacks account.');
        clearOAuthIntent();
        navigate(`/settings?oauth=failed&status=${encodeURIComponent(status || '500')}&reason=${encodeURIComponent(resolvedReason)}`, {
          replace: true,
        });
        return;
      }

      clearOAuthIntent();
      if (reason) {
        navigate(`/login?oauth=failed&status=${encodeURIComponent(status || '500')}&reason=${encodeURIComponent(reason)}`, {
          replace: true,
        });
        return;
      }

      navigate('/login?oauth=failed', { replace: true });
    };

    const finalizeOAuth = async () => {
      const queryParams = new URLSearchParams(location.search);
      const code = queryParams.get('code');
      const state = queryParams.get('state');

      // If provider redirected to frontend callback, exchange via API so SPA flow stays in-app.
      if (code && state) {
        try {
          const response = await api.get('/auth/youthacks/exchange', {
            params: { code, state },
            withCredentials: true,
          });

          const result = response.data;
          const responseMode = result?.mode === 'link' ? 'link' : 'login';

          if (responseMode === 'link') {
            clearOAuthIntent();
            navigate('/settings?oauth=linked', { replace: true });
            return;
          }

          if (result?.access_token) {
            await completeOAuthLogin(result.access_token, result.user || null);
            clearOAuthIntent();
            navigate('/dashboard', { replace: true });
            return;
          }

          navigateOAuthFailure(null, null, responseMode);
          return;
        } catch (err: any) {
          const backendMessage = err?.response?.data?.message;
          const statusCode = err?.response?.status || err?.response?.data?.statusCode;
          const oauthMode = err?.response?.data?.oauthMode === 'link' ? 'link' : getOAuthIntent();
          navigateOAuthFailure(backendMessage, statusCode, oauthMode);
          return;
        }
      }

      // Parse fragment like #access_token=...&user=...
      const hash = window.location.hash || '';
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const token = params.get('access_token');
      const userStr = params.get('user');

      if (!token) {
        navigateOAuthFailure('Missing OAuth access token in callback response.');
        return;
      }

      let oauthUser: any = null;
      if (userStr) {
        try {
          oauthUser = JSON.parse(decodeURIComponent(userStr));
        } catch {
          oauthUser = null;
        }
      }

      try {
        await completeOAuthLogin(token, oauthUser);
        clearOAuthIntent();
        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        const backendMessage = err?.response?.data?.message;
        const statusCode = err?.response?.status || err?.response?.data?.statusCode;
        navigateOAuthFailure(backendMessage, statusCode);
      }
    };

    finalizeOAuth();
  }, [completeOAuthLogin, location.search, navigate]);

  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
      <div>Completing OAuth login...</div>
    </div>
  );
};

export default OAuthCallback;
