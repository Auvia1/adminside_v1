'use client';

import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SuccessMessage({ message, autoClose = true, duration = 3000, onDismiss, className = '' }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!autoClose || !visible) return;

    const timer = setTimeout(() => {
      setVisible(false);
      if (onDismiss) onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [autoClose, duration, visible, onDismiss]);

  if (!visible) return null;

  return (
    <div className={`rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 flex items-start gap-3 ${className}`}>
      <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-emerald-600" />
      <div className="flex-1">
        <p>{message}</p>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          if (onDismiss) onDismiss();
        }}
        className="flex-shrink-0 text-emerald-500 hover:text-emerald-700"
      >
        ✕
      </button>
    </div>
  );
}
