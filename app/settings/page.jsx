'use client';

import { useState, useEffect } from 'react';
import useAuth from '@/app/hooks/useAuth';
import { apiGet, apiPatch, apiPost } from '@/app/lib/api';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';
import SuccessMessage from '@/app/components/SuccessMessage';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { Lock } from 'lucide-react';

export default function SettingsPageWrapper() {
  return (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  );
}

function SettingsPage() {
  const { admin, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (admin?.id) {
      loadSettings();
    }
  }, [admin?.id]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiGet('/adminlogin/me');
      if (response?.admin) {
        setFormData({
          name: response.admin.name || '',
          email: response.admin.email || '',
          phone: response.admin.phone || '',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const response = await apiPatch('/adminlogin/me', formData);
      if (response?.success) {
        setSuccess('Profile updated successfully');
      }
    } catch (err) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await apiPost('/adminlogin/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setSuccess('Password changed successfully! Logging out...');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.name) return <LoadingSpinner text="Loading settings..." />;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-sm text-slate-600 mt-1">Manage your administrator profile and account settings</p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

      {/* Admin Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Admin Information</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Phone Number</label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => loadSettings()} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </Card>

      {/* Change Password */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Current Password</label>
            <Input 
              type="password" 
              value={passwordData.current_password} 
              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })} 
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">New Password</label>
              <Input 
                type="password" 
                value={passwordData.new_password} 
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })} 
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
              <Input 
                type="password" 
                value={passwordData.confirm_password} 
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })} 
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setPasswordData({ current_password: '', new_password: '', confirm_password: '' })} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
