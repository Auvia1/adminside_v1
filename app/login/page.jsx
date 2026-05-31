'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/app/hooks/useAuth';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { AlertCircle, Loader } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    try {
      await login(email, password);
      router.push('/Dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f9fb] px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Auvia Admin</h1>
          <p className="mt-2 text-sm text-slate-500">Clinic Management System</p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched({ ...touched, email: true })}
                placeholder="Enter your email"
                disabled={isLoading}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, password: true })}
                placeholder="Enter your password"
                disabled={isLoading}
                className="h-10"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="mt-6 w-full h-10 rounded-xl bg-[var(--brand-primary)] text-white font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <a
              href="/register"
              className="font-semibold text-[var(--brand-primary)] hover:underline"
            >
              Register here
            </a>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          © 2024 Auvia. All rights reserved.
        </p>
      </div>
    </div>
  );
}
