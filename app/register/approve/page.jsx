'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader } from 'lucide-react';

function ApproveRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing your approval...');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Invalid approval link. Token is missing.');
      return;
    }

    const approveRegistration = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4002';
        const response = await fetch(
          `${backendUrl}/api/adminlogin/approve/${token}`
        );
        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage('Registration Approved Successfully!');
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setStatus('error');
          setError(data.error || 'Failed to approve registration');
        }
      } catch (err) {
        console.error('Error approving registration:', err);
        setStatus('error');
        setError('An error occurred while processing your approval. Please try again.');
      }
    };

    approveRegistration();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f9fb] px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Auvia Admin</h1>
          <p className="mt-2 text-sm text-slate-500">Clinic Management System</p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          {status === 'processing' && (
            <div className="text-center space-y-4">
              <Loader className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
              <p className="text-slate-700">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
              <h2 className="text-2xl font-bold text-green-900">{message}</h2>
              <p className="text-sm text-slate-600">
                Redirecting to login page...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <AlertCircle className="mx-auto h-16 w-16 text-red-600" />
              <h2 className="text-2xl font-bold text-red-900">Approval Failed</h2>
              <p className="text-sm text-red-700">{error}</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full h-10 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  Go to Login
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          © 2024 Auvia. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function ApproveRegistrationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f6f9fb]">
        <Loader className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    }>
      <ApproveRegistrationContent />
    </Suspense>
  );
}
