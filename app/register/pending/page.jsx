'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Clock, CheckCircle2 } from 'lucide-react';

export default function PendingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');

  if (!email) {
    router.push('/register');
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f9fb] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Auvia Admin</h1>
          <p className="mt-2 text-sm text-slate-500">Registration Submitted</p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="flex justify-center mb-6">
            <Clock className="h-16 w-16 text-blue-500 animate-pulse" />
          </div>

          <h2 className="text-center text-xl font-semibold text-slate-900">
            Registration Pending Approval
          </h2>

          <div className="mt-6 space-y-4 text-center">
            <p className="text-slate-600">
              Thank you for registering! Your account is currently pending admin approval.
            </p>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">Registration Email</p>
              <p className="text-sm text-blue-700 mt-1 font-mono break-all">{email}</p>
            </div>

            <p className="text-sm text-slate-600">
              An administrator will review your request and approve your access soon. You'll be able to login once approved.
            </p>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <button
              onClick={() => router.push('/login')}
              className="w-full h-10 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              Try Logging In
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            If you've been approved, you can login with your email and password above.
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          © 2024 Auvia. All rights reserved.
        </p>
      </div>
    </div>
  );
}
