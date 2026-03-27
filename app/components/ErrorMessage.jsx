'use client';

import { AlertCircle } from 'lucide-react';

export default function ErrorMessage({ message, onDismiss, className = '' }) {
  return (
    <div className={`rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3 ${className}`}>
      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p>{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-red-500 hover:text-red-700"
        >
          ✕
        </button>
      )}
    </div>
  );
}
