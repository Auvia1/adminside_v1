'use client';

import { useState, useEffect } from 'react';
import { Upload, Trash2, FileText } from 'lucide-react';
import useAuth from '@/app/hooks/useAuth';
import { apiGet, apiPost, apiDelete } from '@/app/lib/api';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';
import SuccessMessage from '@/app/components/SuccessMessage';

export default function DocumentsPage() {
  const { clinic } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (clinic?.id) {
      loadDocuments();
    }
  }, [clinic?.id]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiGet(`/documents?clinic_id=${clinic.id}`);
      setDocuments(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setError('');

      for (const file of files) {
        // NOTE: File upload would normally go to cloud storage first
        // For now, we create document record without URL
        await apiPost('/documents', {
          clinic_id: clinic.id,
          name: file.name,
          url: '', // Would be cloud storage URL
          type: file.type,
          docType: 'clinic_license',
        });
      }

      setSuccess(`${files.length} document(s) uploaded successfully`);
      await loadDocuments();
    } catch (err) {
      setError(err.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      setError('');
      await apiDelete(`/documents/${docId}`);
      setSuccess('Document deleted successfully');
      await loadDocuments();
    } catch (err) {
      setError(err.message || 'Failed to delete document');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="text-sm text-slate-600 mt-1">Manage clinic documents and uploads</p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

      <Card className="p-6">
        <div className="mb-6">
          <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 cursor-pointer hover:border-slate-300 transition">
            <Upload className="h-8 w-8 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Upload Documents</span>
            <span className="text-xs text-slate-500">Click to select or drag and drop</span>
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploading} className="hidden" />
          </label>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading documents..." />
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">File Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Type</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Size</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Upload Date</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      {doc.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{doc.docType}</td>
                    <td className="px-6 py-4 text-slate-600">{doc.file_size || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(doc.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </button>
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
}
