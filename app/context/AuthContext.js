'use client';

import { createContext, useEffect, useState } from 'react';
import { apiCall, getToken, setToken, clearToken } from '@/app/lib/api';

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setAuthToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getToken();
      if (storedToken) {
        setAuthToken(storedToken);
        document.cookie = `auth_token=${storedToken}; path=/`;
        try {
          const response = await apiCall('/adminlogin/me', {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          setAdmin(response.admin);
        } catch (err) {
          clearToken();
          setAuthToken(null);
          setAdmin(null);
          document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiCall('/adminlogin/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const newToken = response.token;
      setToken(newToken);
      setAuthToken(newToken);
      setAdmin(response.admin);
      document.cookie = `auth_token=${newToken}; path=/`;
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, phone, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiCall('/adminlogin/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, password }),
      });
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    setAuthToken(null);
    setAdmin(null);
    setError(null);
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const value = {
    admin,
    token,
    isLoading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
