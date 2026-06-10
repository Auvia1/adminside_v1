'use client';

import { useState, useEffect } from 'react';
import useAuth from '@/app/hooks/useAuth';
import { apiGet, apiPost } from '@/app/lib/api';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { Activity, PhoneCall, CreditCard, PlayCircle, Search, ArrowDownLeft, ArrowUpRight, Plus, X } from 'lucide-react';

function formatDuration(seconds) {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatTime(timestamp) {
  if (!timestamp) return "N/A";
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "N/A";
  }
}

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
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);

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

  const handleAdjustClick = (clinic) => {
    setSelectedClinic(clinic);
    setShowAdjustModal(true);
  };

  const handleModalClose = () => {
    setShowAdjustModal(false);
    setSelectedClinic(null);
  };

  const handleAdjustmentSuccess = () => {
    fetchOverview();
    handleModalClose();
  };

  if (loading) return <LoadingSpinner text="Loading credit overview..." />;
  if (error) return <ErrorMessage message={error} onDismiss={() => setError('')} />;

  return (
    <>
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
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
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
                    <td className="px-6 py-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdjustClick(clinic)}
                        className="h-8 px-3 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adjust
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showAdjustModal && selectedClinic && (
        <AdjustCreditsModal
          clinic={selectedClinic}
          onClose={handleModalClose}
          onSuccess={handleAdjustmentSuccess}
        />
      )}
    </>
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

      <Card className="border-slate-100 shadow-sm">
        <div className="bg-slate-50 border-b border-slate-100 rounded-t-xl px-4 py-3">
          <div className="grid grid-cols-[100px_1fr_1.2fr_1fr_1.5fr_80px_120px] text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
            <span>Time & Type</span>
            <span>Clinic</span>
            <span>Caller</span>
            <span>Duration</span>
            <span>AI Summary</span>
            <span>Credits</span>
            <span>Recording</span>
          </div>
        </div>
        <div className="p-4 space-y-3 bg-white rounded-b-xl">
          {loading ? (
            <div className="py-8 text-center"><LoadingSpinner text="Loading calls..." /></div>
          ) : calls.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              No calls found for these filters.
            </div>
          ) : (
            calls.map((call) => (
              <div
                key={call.id}
                className={`grid grid-cols-[100px_1fr_1.2fr_1fr_1.5fr_80px_120px] items-center gap-3 rounded-2xl border border-slate-100 px-4 py-3 text-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow ${
                  call.type === "incoming"
                    ? "border-l-2 border-l-[var(--brand-primary)]"
                    : "border-l-2 border-l-slate-300"
                }`}
              >
                <div className="text-xs font-semibold">
                  {formatTime(call.time).split(" ")[0]}
                  <span className="block text-[10px] text-slate-400">
                    {formatTime(call.time).split(" ")[1]}
                  </span>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                    {call.type === 'incoming' ? (
                      <ArrowDownLeft className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <ArrowUpRight className="h-3 w-3 text-slate-500" />
                    )}
                    {call.type === 'incoming' ? 'Incoming' : 'Outgoing'}
                  </div>
                </div>
                
                <div className="text-xs font-medium text-slate-900 truncate">
                  {call.clinics?.name || call.clinic_name || call.clinic_id?.substring(0,8) || '-'}
                </div>

                <div>
                  <p className="font-semibold text-slate-800">{call.caller}</p>
                </div>
                
                <div>
                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider bg-slate-50">
                    {call.agent_type || "Unknown"}
                  </Badge>
                  <div className="text-[10px] text-slate-500 mt-1 font-medium">{formatDuration(call.duration)}</div>
                </div>
                
                <div>
                  {call.ai_summary ? (
                    <p className="text-xs text-slate-500 line-clamp-2">"{call.ai_summary}"</p>
                  ) : (
                    <p className="text-xs text-slate-400">No summary</p>
                  )}
                </div>

                <div className="font-medium text-slate-900 text-xs">
                  {call.duration ? Math.ceil(call.duration / 60) : 0} cr
                </div>

                <div className="flex items-center justify-end">
                  {call.recording ? (
                    <audio controls src={call.recording} className="h-8 w-28 max-w-full text-xs">
                      No audio
                    </audio>
                  ) : (
                    <span className="text-xs text-slate-400">No recording</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
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

function AdjustCreditsModal({ clinic, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || isNaN(amount) || parseFloat(amount) === 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await apiPost('/credits/adjust', {
        clinic_id: clinic.clinic_id,
        amount: parseFloat(amount),
        description: description || `Manual adjustment by admin`
      });

      setSuccess(`Credits adjusted successfully! New balance: ${response.data.new_balance.toFixed(2)}`);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to adjust credits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Adjust Credits</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">Clinic</p>
            <p className="text-sm text-slate-900 font-semibold">{clinic.clinic_name || clinic.clinic_id}</p>
            <p className="text-xs text-slate-500 mt-1">Current Balance: {clinic.current_balance?.toFixed(2)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">₹</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Positive to add credits, negative to deduct
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Description (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g., Refund for service issue"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Processing...' : 'Adjust Credits'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
