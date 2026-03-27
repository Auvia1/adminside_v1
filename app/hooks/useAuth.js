'use client';

import { useContext } from 'react';
import { AuthContext } from '@/app/context/AuthContext';

/**
 * Hook to access auth state and methods
 * Must be used inside AuthProvider
 */
export default function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
