'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

export default function PendingApprovalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkAttempts, setCheckAttempts] = useState(0);

  useEffect(() => {
    if (!email) {
      router.push('/register');
      return;
    }

    const checkApprovalStatus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `http://localhost:4002/api/adminlogin/check-approval?email=${encodeURIComponent(email)}`
        );
        const data = await response.json();

        if (data.success && data.approved) {
          setIsApproved(true);
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      } catch (err) {
        console.error('Error checking approval status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Check immediately
    checkApprovalStatus();

    // Then poll every 5 seconds
    const interval = setInterval(() => {
      checkApprovalStatus();
      setCheckAttempts(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [email, router]);

  if (!email) {
    return null;
  }

  if (isApproved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f9fb] px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold text-green-900">Registration Approved!</h2>
            <p className="mt-4 text-green-700">
              Your registration has been approved. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f9fb] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Auvia Admin</h1>
          <p className="mt-2 text-sm text-slate-500">Registration Pending</p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Clock className="h-16 w-16 text-blue-500 animate-spin" />
            </div>
          </div>

          <h2 className="text-center text-xl font-semibold text-slate-900">
            Awaiting Admin Approval
          </h2>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-blue-900">Email Sent</p>
                  <p className="text-sm text-blue-700 mt-1">
                    An approval request has been sent to the admin at <span className="font-mono break-all">nsvkm56@gmail.com</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Your Registration Email</p>
              <p className="text-sm text-slate-600 mt-1 font-mono break-all">{email}</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Check your email for an approval link. You can click it to approve the registration immediately.
            </p>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-center text-xs text-slate-500">
              Checking approval status{checkAttempts > 0 && ` (${checkAttempts} ${checkAttempts === 1 ? 'check' : 'checks'})`}...
            </p>
            <div className="mt-3 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse" />
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            This page will automatically refresh every 5 seconds.
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          © 2024 Auvia. All rights reserved.
        </p>
      </div>
    </div>
  );
}
