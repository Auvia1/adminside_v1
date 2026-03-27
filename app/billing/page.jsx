'use client';

import { useState, useEffect } from 'react';
import useAuth from '@/app/hooks/useAuth';
import { apiGet, apiPatch } from '@/app/lib/api';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';
import SuccessMessage from '@/app/components/SuccessMessage';

export default function BillingPage() {
  const { clinic } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    plan: '',
    billing_cycle: 'Monthly',
    payment_method: '',
    card_last4: '',
    card_name: '',
    card_expiry: '',
    gst_number: '',
    monthly_amount: '',
  });

  useEffect(() => {
    if (clinic?.id) {
      loadBilling();
    }
  }, [clinic?.id]);

  const loadBilling = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiGet(`/billing/${clinic.id}`);
      setFormData(response.data || formData);
    } catch (err) {
      setError(err.message || 'Failed to load billing info');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await apiPatch(`/billing/${clinic.id}`, formData);
      setSuccess('Billing information updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to update billing');
    }
  };

  if (loading) return <LoadingSpinner text="Loading billing info..." />;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Payment</h1>
        <p className="text-sm text-slate-600 mt-1">Manage your subscription and payment methods</p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Plan</label>
              <select value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Select a plan</option>
                <option value="Starter">Starter</option>
                <option value="Growth">Growth</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Billing Cycle</label>
              <select value={formData.billing_cycle} onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annually">Annually</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Method</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Payment Method</label>
                <select value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="">Select method</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Card Name</label>
                <Input value={formData.card_name} onChange={(e) => setFormData({ ...formData, card_name: e.target.value })} placeholder="Name on card" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Card Last 4 Digits</label>
                <Input value={formData.card_last4} onChange={(e) => setFormData({ ...formData, card_last4: e.target.value })} placeholder="1234" readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Card Expiry (MM/YY)</label>
                <Input value={formData.card_expiry} onChange={(e) => setFormData({ ...formData, card_expiry: e.target.value })} placeholder="12/25" readOnly />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Tax Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">GST Number</label>
                <Input value={formData.gst_number} onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })} placeholder="27ABCDE1234F2Z5" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Monthly Amount</label>
                <Input value={formData.monthly_amount} onChange={(e) => setFormData({ ...formData, monthly_amount: e.target.value })} placeholder="₹10,000" readOnly />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => loadBilling()}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
