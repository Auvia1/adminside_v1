'use client';

import { createContext, useEffect, useState } from 'react';
import { apiCall, getToken, setToken, clearToken } from '@/app/lib/api';

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [clinic, setClinic] = useState(null);
  const [token, setAuthToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth on app load (check if token exists and is valid)
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getToken();
      if (storedToken) {
        setAuthToken(storedToken);
        // Sync to cookie for middleware to access
        document.cookie = `auth_token=${storedToken}; path=/`;
        // Verify token is still valid by calling /auth/me
        try {
          const response = await apiCall('/auth/me', {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          setClinic(response.clinic);
        } catch (err) {
          // Token is invalid, clear it
          clearToken();
          setAuthToken(null);
          setClinic(null);
          document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      const newToken = response.token;
      setToken(newToken);
      setAuthToken(newToken);
      setClinic(response.clinic);
      // Sync to cookie for middleware to access
      document.cookie = `auth_token=${newToken}; path=/`;
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
    setClinic(null);
    setError(null);
    // Clear the cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const value = {
    clinic,
    token,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
