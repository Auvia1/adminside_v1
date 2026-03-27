'use client';

import { useState, useEffect } from 'react';
import useAuth from '@/app/hooks/useAuth';
import { apiGet, apiPost, apiPatch } from '@/app/lib/api';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';
import SuccessMessage from '@/app/components/SuccessMessage';

export default function ContractsPage() {
  const { clinic } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    contract_start: '',
    contract_end: '',
    agreement: false,
  });

  useEffect(() => {
    if (clinic?.id) {
      loadContract();
    }
  }, [clinic?.id]);

  const loadContract = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiGet(`/contracts/${clinic.id}`);
      setFormData(response.data || formData);
    } catch (err) {
      // Contract might not exist yet, which is OK
      setError('');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      if (formData.id) {
        await apiPatch(`/contracts/${clinic.id}`, formData);
        setSuccess('Contract updated successfully');
      } else {
        await apiPost('/contracts', { ...formData, clinic_id: clinic.id });
        setSuccess('Contract created successfully');
      }

      await loadContract();
    } catch (err) {
      setError(err.message || 'Failed to save contract');
    }
  };

  if (loading) return <LoadingSpinner text="Loading contract..." />;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Contracts</h1>
        <p className="text-sm text-slate-600 mt-1">Manage clinic contracts and agreements</p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Contract Start Date</label>
              <Input 
                type="date" 
                value={formData.contract_start} 
                onChange={(e) => setFormData({ ...formData, contract_start: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Contract End Date</label>
              <Input 
                type="date" 
                value={formData.contract_end} 
                onChange={(e) => setFormData({ ...formData, contract_end: e.target.value })} 
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.agreement} 
                onChange={(e) => setFormData({ ...formData, agreement: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">
                I confirm that the clinic contract terms and conditions are accepted
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => loadContract()}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Contract'}</Button>
          </div>
        </form>
      </Card>

      {formData.contract_start && (
        <Card className="p-6 bg-blue-50 border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-3">Contract Summary</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p><strong>Start Date:</strong> {new Date(formData.contract_start).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> {new Date(formData.contract_end).toLocaleDateString()}</p>
            <p><strong>Agreement Accepted:</strong> {formData.agreement ? '✓ Yes' : '✗ No'}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
