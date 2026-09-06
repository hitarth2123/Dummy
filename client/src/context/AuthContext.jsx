import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@services/api.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to restore session on mount
    const stored = localStorage.getItem('ai_buddy_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    const data = response.data || response;
    const authenticatedUser = {
      ...data.user,
      token: data.accessToken,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
    setUser(authenticatedUser);
    localStorage.setItem('ai_buddy_user', JSON.stringify(authenticatedUser));
    return { ...data, user: authenticatedUser };
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    localStorage.removeItem('ai_buddy_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
