import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  completeOAuthLogin: (token: string, oauthUser?: User | null) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      const storedUser = authService.getCurrentUser();

      if (token && storedUser) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
        } catch (error) {
          authService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    validateToken();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.user);
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    await authService.register({ email, password, firstName, lastName });
  };

  const completeOAuthLogin = async (token: string, oauthUser?: User | null) => {
    localStorage.setItem('token', token);

    if (oauthUser) {
      localStorage.setItem('user', JSON.stringify(oauthUser));
      setUser(oauthUser);
      return;
    }

    const profile = await authService.getProfile();
    localStorage.setItem('user', JSON.stringify(profile));
    setUser(profile);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        completeOAuthLogin,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
