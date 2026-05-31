'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/app/hooks/useAuth';
import { apiCall } from '@/app/lib/api';
import { CheckCircle2, XCircle, Loader, AlertCircle } from 'lucide-react';

export default function PendingRegistrationsPage() {
  const router = useRouter();
  const { admin, isLoading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!authLoading && (!admin || admin.role !== 'superadmin')) {
      router.push('/');
      return;
    }

    if (!authLoading && admin?.role === 'superadmin') {
      loadPendingRegistrations();
    }
  }, [admin, authLoading, router]);

  const loadPendingRegistrations = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await apiCall('/adminlogin/pending');
      if (response.success) {
        setRegistrations(response.pendingRegistrations || []);
      } else {
        setError(response.error || 'Failed to load pending registrations');
      }
    } catch (err) {
      setError('Error loading pending registrations');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setActionLoading(prev => ({ ...prev, [id]: 'approve' }));
      const response = await apiCall(`/adminlogin/${id}/approve`, {
        method: 'PATCH',
      });

      if (response.success) {
        setSuccessMessage(`Approved registration for ${response.admin.name}`);
        setRegistrations(registrations.filter(r => r.id !== id));
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to approve registration');
      }
    } catch (err) {
      setError('Error approving registration');
      console.error(err);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoading(prev => ({ ...prev, [id]: 'reject' }));
      const response = await apiCall(`/adminlogin/${id}/reject`, {
        method: 'PATCH',
      });

      if (response.success) {
        setSuccessMessage(`Rejected registration for ${response.admin.name}`);
        setRegistrations(registrations.filter(r => r.id !== id));
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to reject registration');
      }
    } catch (err) {
      setError('Error rejecting registration');
      console.error(err);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (admin?.role !== 'superadmin') {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Pending Registrations</h1>
        <p className="text-sm text-slate-600 mt-2">
          Manage new registration requests waiting for approval
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-3 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600">No pending registrations at this time.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Submitted</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {registrations.map(registration => (
                  <tr key={registration.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {registration.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{registration.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{registration.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(registration.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2 flex">
                      <button
                        onClick={() => handleApprove(registration.id)}
                        disabled={!!actionLoading[registration.id]}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition font-semibold text-xs disabled:opacity-50"
                      >
                        {actionLoading[registration.id] === 'approve' ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(registration.id)}
                        disabled={!!actionLoading[registration.id]}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition font-semibold text-xs disabled:opacity-50"
                      >
                        {actionLoading[registration.id] === 'reject' ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
