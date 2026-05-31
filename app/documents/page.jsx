'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, Trash2, FileText, FileImage, File, Search,
  CheckCircle2, AlertCircle, Loader2, Brain, CloudUpload,
  RefreshCw, X, ChevronDown
} from 'lucide-react';
import useAuth from '@/app/hooks/useAuth';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';
import SuccessMessage from '@/app/components/SuccessMessage';
import ProtectedRoute from '@/app/components/ProtectedRoute';

// ─── Constants ───────────────────────────────────────────────────────────────
const DOC_TYPE_OPTIONS = [
  { value: 'policy', label: 'Policy' },
  { value: 'handbook', label: 'Handbook' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'form', label: 'Form' },
  { value: 'report', label: 'Report' },
  { value: 'license', label: 'License' },
  { value: 'misc', label: 'Miscellaneous' },
];

const ACCEPTED_FILE_TYPES = '.pdf,.txt,.doc,.docx,.jpg,.jpeg,.png';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType) {
  if (!fileType) return <File className="h-5 w-5 text-slate-400" />;
  if (fileType.startsWith('image/')) return <FileImage className="h-5 w-5 text-blue-500" />;
  if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
  return <FileText className="h-5 w-5 text-amber-500" />;
}

function getRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ─── Upload Status Badge ─────────────────────────────────────────────────────
function StatusBadge({ status, label }) {
  const config = {
    idle: { color: 'bg-slate-100 text-slate-500', icon: null },
    uploading: { color: 'bg-blue-50 text-blue-600', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    embedding: { color: 'bg-purple-50 text-purple-600', icon: <Brain className="h-3 w-3 animate-pulse" /> },
    success: { color: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle2 className="h-3 w-3" /> },
    error: { color: 'bg-red-50 text-red-600', icon: <AlertCircle className="h-3 w-3" /> },
  };

  const { color, icon } = config[status] || config.idle;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${color}`}>
      {icon}
      {label}
    </span>
  );
}

// ─── Main Page Wrapper ───────────────────────────────────────────────────────
export default function DocumentsPageWrapper() {
  return (
    <ProtectedRoute>
      <DocumentsPage />
    </ProtectedRoute>
  );
}

// ─── Documents Page ──────────────────────────────────────────────────────────
function DocumentsPage() {
  const { clinic } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');

  // Upload state
  const [uploadQueue, setUploadQueue] = useState([]); // { file, status, message }
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('misc');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // ─── Load Documents ──────────────────────────────────────────────────────
  const loadDocuments = useCallback(async () => {
    if (!clinic?.id) return;
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/documents?clinic_id=${clinic.id}`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data || []);
      } else {
        setError(data.error || 'Failed to load documents');
      }
    } catch (err) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // ─── File Selection ──────────────────────────────────────────────────────
  const handleFilesSelected = (files) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const newItems = fileList.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      status: 'idle',
      message: 'Ready to upload',
    }));

    setUploadQueue((prev) => [...prev, ...newItems]);
  };

  const handleFileInputChange = (e) => {
    handleFilesSelected(e.target.files);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const removeFromQueue = (id) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const clearQueue = () => {
    setUploadQueue([]);
  };

  // ─── Drag & Drop ──────────────────────────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  // ─── Upload & Embed Flow ──────────────────────────────────────────────────
  const handleUploadAll = async () => {
    const pendingItems = uploadQueue.filter((q) => q.status === 'idle' || q.status === 'error');
    if (pendingItems.length === 0) return;

    setIsUploading(true);
    setError('');

    let successCount = 0;
    let failCount = 0;

    for (const item of pendingItems) {
      try {
        // ── Step 1: Upload to Google Cloud Storage ──
        updateQueueItem(item.id, 'uploading', 'Uploading to cloud storage...');

        const formData = new FormData();
        formData.append('clinic_id', clinic.id);
        formData.append('doc_type', selectedDocType);
        formData.append('files', item.file);

        const uploadRes = await fetch('/api/upload-documents', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'Cloud upload failed');
        }

        // ── Step 2: Extract text and generate embeddings ──
        updateQueueItem(item.id, 'embedding', 'Generating embeddings...');

        // Read file text content for embedding
        let fileContent = '';
        try {
          fileContent = await item.file.text();
        } catch {
          // Binary files (images, etc.) won't have readable text
          fileContent = `[File: ${item.file.name}] [Type: ${item.file.type}] [Size: ${item.file.size} bytes]`;
        }

        // Only embed if we have meaningful text content
        if (fileContent && fileContent.length > 10) {
          const embedRes = await fetch('/api/embed-documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clinicId: clinic.id,
              fileName: item.file.name,
              fileContent: fileContent,
            }),
          });

          const embedData = await embedRes.json();

          if (!embedRes.ok || !embedData.success) {
            // Embedding failure is non-fatal — file is already uploaded
            console.warn(`⚠️ Embedding failed for ${item.file.name}:`, embedData.error);
            updateQueueItem(item.id, 'success', `Uploaded (embedding skipped: ${embedData.error})`);
          } else {
            updateQueueItem(item.id, 'success', `Uploaded & embedded (${embedData.chunks} chunks)`);
          }
        } else {
          updateQueueItem(item.id, 'success', 'Uploaded (no text to embed)');
        }

        successCount++;
      } catch (err) {
        console.error(`❌ Failed to process ${item.file.name}:`, err);
        updateQueueItem(item.id, 'error', err.message || 'Upload failed');
        failCount++;
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      setSuccess(`${successCount} document(s) uploaded and embedded successfully${failCount > 0 ? ` (${failCount} failed)` : ''}`);
      await loadDocuments();
    } else if (failCount > 0) {
      setError(`All ${failCount} document(s) failed to upload`);
    }
  };

  const updateQueueItem = (id, status, message) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status, message } : item))
    );
  };

  // ─── Delete Document ──────────────────────────────────────────────────────
  const handleDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      setError('');
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccess('Document deleted successfully');
        await loadDocuments();
      } else {
        setError(data.error || 'Failed to delete document');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete document');
    }
  };

  // ─── Filtered Documents ───────────────────────────────────────────────────
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.doc_type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || doc.doc_type === filterType;
    return matchesSearch && matchesType;
  });

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents & Knowledge</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload documents to create AI knowledge embeddings for your clinic
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDocuments} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

      {/* ── Upload Zone ─────────────────────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CloudUpload className="h-5 w-5 text-[var(--brand-primary)]" />
          <h2 className="text-base font-semibold text-slate-800">Upload Documents</h2>
        </div>

        {/* Doc Type Selector */}
        <div className="mb-4 flex items-center gap-3">
          <label className="text-xs font-medium text-slate-600">Document Type:</label>
          <div className="relative">
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-slate-700 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
            >
              {DOC_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed
            px-6 py-10 cursor-pointer transition-all duration-200
            ${dragOver
              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 scale-[1.01]'
              : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
            }
          `}
        >
          <div className={`rounded-full p-3 transition-colors ${dragOver ? 'bg-[var(--brand-primary)]/10' : 'bg-slate-100'}`}>
            <Upload className={`h-6 w-6 ${dragOver ? 'text-[var(--brand-primary)]' : 'text-slate-400'}`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              {dragOver ? 'Drop files here' : 'Click to select or drag and drop'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              PDF, TXT, DOC, DOCX, JPG, PNG — Max 10MB per file
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Upload Queue */}
        {uploadQueue.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-600">
                {uploadQueue.length} file(s) in queue
              </p>
              <div className="flex gap-2">
                {!isUploading && (
                  <button
                    onClick={clearQueue}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl border border-slate-100 bg-white p-2">
              {uploadQueue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 bg-slate-50/80 hover:bg-slate-50 transition-colors"
                >
                  {getFileIcon(item.file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{item.file.name}</p>
                    <p className="text-[10px] text-slate-400">{formatFileSize(item.file.size)}</p>
                  </div>
                  <StatusBadge status={item.status} label={item.message} />
                  {(item.status === 'idle' || item.status === 'error') && !isUploading && (
                    <button
                      onClick={() => removeFromQueue(item.id)}
                      className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUploadAll}
              disabled={isUploading || uploadQueue.every((q) => q.status === 'success')}
              className="w-full mt-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading & Embedding...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Upload & Create Embeddings
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* ── Documents List ──────────────────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--brand-primary)]" />
            <h2 className="text-base font-semibold text-slate-800">
              Uploaded Documents
              {documents.length > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-400">({documents.length})</span>
              )}
            </h2>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] w-48"
              />
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-xs font-medium text-slate-600 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              >
                <option value="">All Types</option>
                {DOC_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading documents..." />
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-slate-100 p-4 mb-3">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">
              {documents.length === 0 ? 'No documents uploaded yet' : 'No documents match your search'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {documents.length === 0
                ? 'Upload documents above to create AI knowledge for your clinic'
                : 'Try adjusting your search or filter criteria'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">File</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Size</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Uploaded</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="group hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {getFileIcon(doc.file_type)}
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]">
                          {doc.file_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {doc.doc_type || 'misc'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {doc.created_at ? getRelativeTime(doc.created_at) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                        title="Delete document"
                      >
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
