'use client';

import {
  Bell,
  Building2,
  MapPinned,
  PhoneCall,
  Search,
  Settings,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import NewClinicDialog from "../components/NewClinicDialog";

const stats = [
  {
    label: "Total Clinics",
    value: "42",
    delta: "+12%",
    icon: Building2,
  },
  {
    label: "Active Phone Numbers",
    value: "156",
    meta: "89% Utilized",
    icon: PhoneCall,
  },
  {
    label: "Daily Revenue",
    value: "₹2,84,500",
    delta: "+8%",
    icon: MapPinned,
  },
];

const liveStatus = [
  {
    name: "Dr. Reddy's Clinic",
    location: "KPHB · 24 Numbers",
    status: "default",
  },
  {
    name: "Apollo Madhapur",
    location: "Madhapur · 42 Numbers",
    status: "default",
  },
  {
    name: "Care Banjara Hills",
    location: "Banjara Hills · 30 Numbers",
    status: "warning",
  },
  {
    name: "Max Gurgaon",
    location: "Delhi NCR · 60 Numbers",
    status: "default",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Welcome back! Here's your clinic overview.</p>
        </div>
        <NewClinicDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                  {stat.delta && (
                    <p className="mt-1 text-xs text-emerald-700 font-semibold">
                      {stat.delta}
                    </p>
                  )}
                  {stat.meta && (
                    <p className="mt-1 text-xs text-slate-500">{stat.meta}</p>
                  )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <div className="border-b border-slate-200 p-4">
            <h2 className="font-semibold text-slate-900">Live Status</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {liveStatus.map((clinic, idx) => (
              <div key={idx} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100">
                    <Building2 className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {clinic.name}
                    </p>
                    <p className="text-xs text-slate-500">{clinic.location}</p>
                  </div>
                </div>
                <Badge
                  variant={
                    clinic.status === "warning" ? "warning" : "default"
                  }
                >
                  {clinic.status === "warning" ? "Degraded" : "Active"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-200 p-4">
            <h2 className="font-semibold text-slate-900">Quick Actions</h2>
          </div>
          <div className="space-y-2 p-4">
            <Button variant="outline" className="w-full justify-start text-xs">
              <Bell className="h-4 w-4 mr-2" /> View Alerts
            </Button>
            <Button variant="outline" className="w-full justify-start text-xs">
              <Settings className="h-4 w-4 mr-2" /> Settings
            </Button>
            <Button variant="outline" className="w-full justify-start text-xs">
              <Search className="h-4 w-4 mr-2" /> Reports
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
