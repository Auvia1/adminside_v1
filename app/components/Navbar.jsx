"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, MapPin, Settings } from "lucide-react";
import { Button } from "./ui/button";

const LOCATIONS = [
  "Hyderabad, Telangana",
  "Bengaluru, Karnataka",
  "Mumbai, Maharashtra",
  "Chennai, Tamil Nadu",
  "Delhi, NCR",
];

export default function Navbar() {
  const [locationQuery, setLocationQuery] = useState(LOCATIONS[0]);
  const [isOpen, setIsOpen] = useState(false);

  const filteredLocations = useMemo(() => {
    const query = locationQuery.trim().toLowerCase();
    if (!query) return LOCATIONS;
    return LOCATIONS.filter((item) => item.toLowerCase().includes(query));
  }, [locationQuery]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
            <span className="text-sm font-semibold">AA</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Auvia Admin</p>
            <p className="text-[11px] text-slate-400">INDIA NETWORK</p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 text-sm font-medium text-slate-500 md:flex">
          <Link
            href="/Dashboard"
            className="rounded-xl px-3 py-2 transition hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)]"
          >
            Dashboard
          </Link>
          <Link
            href="/Analytics"
            className="rounded-xl px-3 py-2 transition hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)]"
          >
            Analytics
          </Link>
          <Link
            href="/Clinic%20Management"
            className="rounded-xl px-3 py-2 transition hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)]"
          >
            Clinic Management
          </Link>
        </nav>

        <div className="flex flex-1 items-center justify-center">
          <div className="relative w-full max-w-[320px]">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm transition focus-within:border-[var(--brand-primary)]/40 focus-within:ring-2 focus-within:ring-[var(--brand-primary)]/20">
              <MapPin className="h-4 w-4 text-[var(--brand-primary)]" />
              <input
                value={locationQuery}
                onChange={(event) => {
                  setLocationQuery(event.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                placeholder="Search location"
                className="w-full bg-transparent text-sm text-slate-600 outline-none"
              />
              <span className="ml-auto text-xs text-slate-400">🇮🇳</span>
            </div>
            {isOpen ? (
              <div className="absolute left-0 right-0 top-[52px] z-20 rounded-2xl border border-slate-200 bg-white p-2 text-sm text-slate-600 shadow-xl">
                {filteredLocations.length ? (
                  <div className="space-y-1">
                    {filteredLocations.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onMouseDown={() => {
                          setLocationQuery(item);
                          setIsOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)]"
                      >
                        <span>{item}</span>
                        <span className="text-xs text-slate-400">Select</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-2 text-xs text-slate-400">
                    No results found
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative text-slate-400 transition hover:scale-105 hover:text-[var(--brand-primary)]">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
          </button>
          <button className="text-slate-400 transition hover:scale-105 hover:text-[var(--brand-primary)]">
            <Settings className="h-5 w-5" />
          </button>
          <Button className="h-9 rounded-xl bg-[var(--brand-primary)] px-4 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(15,102,118,0.25)] transition hover:-translate-y-0.5">
            Register Clinic
          </Button>
        </div>
      </div>
    </header>
  );
}
