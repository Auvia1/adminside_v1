/**
 * API Wrapper - Centralized fetch utility with auth header injection
 * Handles all HTTP requests to the backend API with automatic token management
 */

const API_BASE_URL = 'http://localhost:4002/api';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}

export async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      clearToken();
      // Redirect to login if in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json();

    // Check if response indicates success
    if (!response.ok) {
      const errorMessage = data.error || data.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error.message);
    throw new Error(error.message || 'Failed to fetch from server');
  }
}

// Convenience methods for common HTTP verbs
export const apiGet = (endpoint) =>
  apiCall(endpoint, { method: 'GET' });

export const apiPost = (endpoint, body) =>
  apiCall(endpoint, { method: 'POST', body: JSON.stringify(body) });

export const apiPatch = (endpoint, body) =>
  apiCall(endpoint, { method: 'PATCH', body: JSON.stringify(body) });

export const apiDelete = (endpoint) =>
  apiCall(endpoint, { method: 'DELETE' });
