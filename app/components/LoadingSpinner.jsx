'use client';

import { Loader } from 'lucide-react';

export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <Loader className={`${sizeClass} animate-spin text-[var(--brand-primary)]`} />
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  );
}
