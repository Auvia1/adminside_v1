'use client';

import AuthProvider from '@/app/context/AuthContext';
import Sidebar from '@/app/components/Sidebar';

export default function LayoutContent({ children }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-[#f6f9fb]">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </AuthProvider>
  );
}
