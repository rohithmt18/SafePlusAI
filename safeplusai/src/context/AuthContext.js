import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth as authAPI, setToken, getToken, clearToken } from '../services/apiService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);

  // On mount — verify existing token
  useEffect(() => {
    async function init() {
      const token = getToken();
      if (token) {
        try {
          const data = await authAPI.me();
          setUser(data.user);
          setBackendOnline(true);
        } catch (err) {
          // Token invalid or backend down
          if (err.message.includes('Session expired') || err.message.includes('Invalid token')) {
            clearToken();
          } else {
            setBackendOnline(false);
          }
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  const register = async ({ name, email, password, phone }) => {
    if (!name?.trim()) throw new Error('Full name is required.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');

    const data = await authAPI.register({ name, email, password, phone });
    setToken(data.token);
    setUser(data.user);
    setBackendOnline(true);
    return data.user;
  };

  const login = async ({ email, password }) => {
    const data = await authAPI.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    setBackendOnline(true);
    return data.user;
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const updateSettings = async (newSettings) => {
    try {
      const data = await authAPI.updateSettings(newSettings);
      setUser(data.user);
    } catch {
      // Optimistic local update if backend fails
      setUser(prev => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, backendOnline, register, login, logout, updateSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
