"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, ClipboardList } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href) => pathname === href;

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-slate-200 bg-white px-4 py-6">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-(--brand-primary)/10 text-(--brand-primary)">
          <span className="text-sm font-semibold">AA</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Auvia Admin</p>
          <p className="text-[11px] text-slate-400">INDIA NETWORK</p>
        </div>
      </div>

      <nav className="mt-6 space-y-1 text-sm text-slate-600">
        <Link
          href="/Dashboard"
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 font-semibold transition hover:-translate-y-0.5 ${
            isActive("/Dashboard")
              ? "bg-(--brand-primary)/10 text-(--brand-primary)"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <BarChart3 className="h-4 w-4" /> Dashboard
        </Link>
        <Link
          href="/Analytics"
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 font-semibold transition hover:-translate-y-0.5 ${
            isActive("/Analytics")
              ? "bg-(--brand-primary)/10 text-(--brand-primary)"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <ClipboardList className="h-4 w-4" /> Analytics
        </Link>
        <Link
          href="/clinic-management"
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 font-semibold transition hover:-translate-y-0.5 ${
            isActive("/clinic-management")
              ? "bg-(--brand-primary)/10 text-(--brand-primary)"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <Building2 className="h-4 w-4" /> Clinic Management
        </Link>
      </nav>

      <div className="mt-auto flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-xs text-slate-600">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-(--brand-primary)">
          AD
        </div>
        <div>
          <p className="text-xs font-semibold">Admin</p>
          <p className="text-[10px] text-slate-400">Super User</p>
        </div>
      </div>
    </aside>
  );
}
