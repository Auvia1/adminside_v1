'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/app/hooks/useAuth';
import { apiGet, apiPatch } from '@/app/lib/api';
import { Card } from '@/app/components/ui/card';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';
import SuccessMessage from '@/app/components/SuccessMessage';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { Check, X } from 'lucide-react';

export default function UsersPageWrapper() {
  return (
    <ProtectedRoute>
      <UsersPage />
    </ProtectedRoute>
  );
}

function UsersPage() {
  const router = useRouter();
  const { isAuthenticated, admin, isLoading: authLoading } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch users
  const fetchUsers = async () => {
    if (!isAuthenticated || !admin) return;
    try {
      setLoading(true);
      setError('');
      const data = await apiGet('/adminlogin/users');
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAuthenticated, admin]);

  const handleApprove = async (id) => {
    try {
      setError('');
      await apiPatch(`/adminlogin/${id}/approve`);
      setSuccess('User approved successfully');
      setUsers(users.map(u => u.id === id ? { ...u, approval_status: 'approved' } : u));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this user?')) return;
    try {
      setError('');
      await apiPatch(`/adminlogin/${id}/reject`);
      setSuccess('User rejected successfully');
      setUsers(users.map(u => u.id === id ? { ...u, approval_status: 'rejected' } : u));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (authLoading || !isAuthenticated) {
    return <LoadingSpinner />;
  }

  const pendingUsers = users.filter((u) => u.approval_status === 'pending');
  const approvedUsers = users.filter((u) => u.approval_status === 'approved');

  const renderTable = (tableUsers, emptyMessage, title) => (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">{title}</h2>
      <Card>
        {loading ? (
          <div className="p-6">
            <LoadingSpinner text="Loading users..." />
          </div>
        ) : tableUsers.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                        {user.role || 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        user.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        user.approval_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {user.approval_status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {user.approval_status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApprove(user.id)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100"
                            >
                              <Check className="h-3 w-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(user.id)}
                              className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                            >
                              <X className="h-3 w-3" />
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">No actions available</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            User Management
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {admin?.name} - Users
          </h1>
        </div>
      </div>


      {/* Error and Success Messages */}
      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError('')}
          className="mb-4"
        />
      )}
      {success && <SuccessMessage message={success} className="mb-4" />}

      {renderTable(pendingUsers, "No pending users.", "Pending Approvals")}
      {renderTable(approvedUsers, "No approved users.", "Active Users")}
    </div>
  );
}
