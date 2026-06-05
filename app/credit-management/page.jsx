'use client';

import { useState, useEffect } from 'react';
import useAuth from '@/app/hooks/useAuth';
import { apiGet } from '@/app/lib/api';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { Activity, PhoneCall, CreditCard, PlayCircle, Search } from 'lucide-react';

export default function CreditManagementWrapper() {
  return (
    <ProtectedRoute>
      <CreditManagementPage />
    </ProtectedRoute>
  );
}

function CreditManagementPage() {
  const { admin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Superadmin check - though maybe all admins can see it depending on layout. 
  // We'll allow any admin but rely on API for actual RBAC.

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Credit Management</h1>
        <p className="text-sm text-slate-600 mt-1">Track clinic credits, calls consumption, and payments.</p>
      </div>

      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'overview'
              ? 'border-(--brand-primary) text-(--brand-primary)'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </div>
        </button>
        <button
          onClick={() => setActiveTab('calls')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'calls'
              ? 'border-(--brand-primary) text-(--brand-primary)'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4" />
            Calls & Audio
          </div>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'payments'
              ? 'border-(--brand-primary) text-(--brand-primary)'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </div>
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && <CreditOverviewTab />}
        {activeTab === 'calls' && <CallsAndAudioTab />}
        {activeTab === 'payments' && <PaymentsTab />}
      </div>
    </div>
  );
}

function CreditOverviewTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiGet('/admin/credits/overview');
      setData(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load credit overview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading credit overview..." />;
  if (error) return <ErrorMessage message={error} onDismiss={() => setError('')} />;

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-900">
            <tr>
              <th className="px-6 py-4 font-semibold">Clinic</th>
              <th className="px-6 py-4 font-semibold">Current Balance</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Total Purchased</th>
              <th className="px-6 py-4 font-semibold">Total Consumed</th>
              <th className="px-6 py-4 font-semibold">Last Recharged</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                  No clinic credit data found.
                </td>
              </tr>
            ) : (
              data.map((clinic) => (
                <tr key={clinic.clinic_id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {clinic.clinic_name || clinic.clinic_id.substring(0,8)}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {clinic.current_balance?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4">
                    {clinic.is_low ? (
                      <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200">Low Balance</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Healthy</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">{clinic.total_credits_purchased?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-4">{clinic.total_credits_consumed?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-4">
                    {clinic.last_recharged_at ? new Date(clinic.last_recharged_at).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CallsAndAudioTab() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ start_date: '', end_date: '', clinic_id: '' });

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      setError('');
      // Build query string
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.clinic_id) params.append('clinic_id', filters.clinic_id);
      
      const res = await apiGet(`/admin/calls?${params.toString()}`);
      // Usually paginated, but depending on the API might return data in .data
      setCalls(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load calls');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Start Date</label>
          <Input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} className="w-auto text-sm h-9" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">End Date</label>
          <Input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} className="w-auto text-sm h-9" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Clinic ID</label>
          <Input type="text" placeholder="UUID" name="clinic_id" value={filters.clinic_id} onChange={handleFilterChange} className="w-auto text-sm h-9" />
        </div>
        <Button onClick={fetchCalls} className="h-9 px-4">
          <Search className="h-4 w-4 mr-2" /> Filter
        </Button>
      </Card>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><LoadingSpinner text="Loading calls..." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-900">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Clinic</th>
                  <th className="px-6 py-4 font-semibold">Duration (min)</th>
                  <th className="px-6 py-4 font-semibold">Credits Used</th>
                  <th className="px-6 py-4 font-semibold">Agent</th>
                  <th className="px-6 py-4 font-semibold">Recording</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {calls.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                      No calls found for these filters.
                    </td>
                  </tr>
                ) : (
                  calls.map((call) => (
                    <tr key={call.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">{new Date(call.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4">{call.clinics?.name || call.clinic_id?.substring(0,8) || '-'}</td>
                      <td className="px-6 py-4">{call.duration_minutes || '-'}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{call.credits_deducted || '0'}</td>
                      <td className="px-6 py-4">{call.agent_type || '-'}</td>
                      <td className="px-6 py-4">
                        {call.recording_url ? (
                          <audio controls src={call.recording_url} className="h-8 w-48 max-w-full">
                            Your browser does not support the audio element.
                          </audio>
                        ) : (
                          <span className="text-slate-400 text-xs">No audio</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function PaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ start_date: '', end_date: '', status: '' });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.status) params.append('status', filters.status);

      const res = await apiGet(`/admin/payments?${params.toString()}`);
      setPayments(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Start Date</label>
          <Input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} className="w-auto text-sm h-9" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">End Date</label>
          <Input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} className="w-auto text-sm h-9" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Status</label>
          <select 
            name="status" 
            value={filters.status} 
            onChange={handleFilterChange}
            className="w-auto h-9 px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-(--brand-primary)"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <Button onClick={fetchPayments} className="h-9 px-4">
          <Search className="h-4 w-4 mr-2" /> Filter
        </Button>
      </Card>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><LoadingSpinner text="Loading payments..." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-900">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Order ID</th>
                  <th className="px-6 py-4 font-semibold">Clinic</th>
                  <th className="px-6 py-4 font-semibold">Amount (₹)</th>
                  <th className="px-6 py-4 font-semibold">Credits</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">{new Date(payment.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono text-xs">{payment.razorpay_order_id || '-'}</td>
                      <td className="px-6 py-4">{payment.clinics?.name || payment.clinic_id?.substring(0,8) || '-'}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{payment.amount}</td>
                      <td className="px-6 py-4">{payment.credits_purchased}</td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={payment.status === 'success' ? 'outline' : payment.status === 'failed' ? 'destructive' : 'secondary'}
                          className={
                            payment.status === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 
                            payment.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : ''
                          }
                        >
                          {payment.status?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
