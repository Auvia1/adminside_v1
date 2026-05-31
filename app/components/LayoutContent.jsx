'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import AuthProvider from '@/app/context/AuthContext';
import Sidebar from '@/app/components/Sidebar';

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const [isPublicRoute, setIsPublicRoute] = useState(true);

  useEffect(() => {
    const publicRoutes = ['/login', '/register'];
    setIsPublicRoute(publicRoutes.includes(pathname));
  }, [pathname]);

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-[#f6f9fb]">
        {!isPublicRoute && <Sidebar />}
        <main className={`flex-1 ${!isPublicRoute ? 'ml-64' : ''} overflow-y-auto`}>{children}</main>
      </div>
    </AuthProvider>
  );
}
