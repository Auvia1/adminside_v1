"use client";

import {
  ArrowUpRight,
  Building2,
  Download,
  LineChart,
  ShieldCheck,
  ShieldEllipsis,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

const metrics = [
  {
    label: "Monthly Revenue",
    value: "₹12,48,500",
    trend: "+14.2%",
    icon: LineChart,
  },
  {
    label: "Footfall",
    value: "2,840",
    trend: "+8.1%",
    icon: ShieldEllipsis,
  },
  {
    label: "Opex per Patient",
    value: "₹214.50",
    trend: "-2.4%",
    icon: ArrowUpRight,
    negative: true,
  },
  {
    label: "Profit Margin %",
    value: "74.2%",
    trend: "Optimal",
    icon: ShieldCheck,
    isStatus: true,
  },
];

const chartBars = [
  { month: "Jan", revenue: 44, cost: 18 },
  { month: "Feb", revenue: 62, cost: 24 },
  { month: "Mar", revenue: 50, cost: 20 },
  { month: "Apr", revenue: 70, cost: 28 },
  { month: "May", revenue: 76, cost: 30 },
  { month: "Jun", revenue: 64, cost: 26 },
];

const infra = [
  { label: "AWS Infrastructure", value: "₹1,54,300", percent: 68, color: "bg-emerald-500" },
  { label: "Agent Webhooks", value: "₹82,450", percent: 42, color: "bg-blue-500" },
  { label: "TTS Processing", value: "₹64,200", percent: 32, color: "bg-amber-500" },
];

const rows = [
  {
    name: "Dr. Reddy's Clinic",
    location: "Madhapur, Hyderabad",
    patients: "142",
    revenue: "₹68,400",
    margin: "74%",
    status: "Optimal",
  },
  {
    name: "Apollo Diagnostics",
    location: "KPHB, Hyderabad",
    patients: "98",
    revenue: "₹41,200",
    margin: "68%",
    status: "Optimal",
  },
  {
    name: "Care Hospital",
    location: "LB Nagar, Hyderabad",
    patients: "76",
    revenue: "₹32,900",
    margin: "54%",
    status: "Alert",
  },
];

export default function AnalyticsPage() {
  return (
    <div className="px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Selected Unit
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
            <Building2 className="h-4 w-4 text-(--brand-primary)" />
            Dr. Reddy&apos;s Clinic
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
            Dr. Reddy&apos;s Clinic • Madhapur
          </div>
          <Button
            variant="outline"
            className="h-9 rounded-xl text-xs font-semibold transition hover:-translate-y-0.5"
          >
            <Download className="h-4 w-4" /> Download CSV Report
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Clinic Insights Hub</h1>
          <p className="mt-1 text-sm text-slate-500">
            Advanced analytics for Dr. Reddy&apos;s Clinic • Madhapur, Hyderabad
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl text-xs">
            Today
          </Button>
          <Button size="sm" className="rounded-xl text-xs">
            Last 30 Days
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.label}
              className="p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {item.label}
                </p>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-(--brand-primary)/10 text-(--brand-primary)">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-end gap-2">
                <p className="text-2xl font-semibold text-slate-800">
                  {item.value}
                </p>
                {item.isStatus ? (
                  <Badge className="bg-emerald-50 text-emerald-600">{item.trend}</Badge>
                ) : (
                  <Badge
                    className={
                      item.negative
                        ? "bg-rose-50 text-rose-500"
                        : "bg-emerald-50 text-emerald-600"
                    }
                  >
                    {item.trend}
                  </Badge>
                )}
              </div>
              {item.label === "Profit Margin %" ? (
                <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
                  <div className="h-full w-[74%] rounded-full bg-emerald-500" />
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Revenue vs. Technical Costs</p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-(--brand-primary)" /> Revenue
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-200" /> Costs
              </span>
            </div>
          </div>
          <div className="mt-4 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartBars} barCategoryGap={18} barGap={6}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 8" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148,163,184,0.08)" }}
                  contentStyle={{
                    background: "#ffffff",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="revenue" fill="var(--brand-primary)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="cost" fill="#e2e8f0" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Technical Infrastructure</p>
            <Badge className="bg-emerald-50 text-emerald-600">Optimal</Badge>
          </div>
          <div className="mt-5 space-y-4">
            {infra.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{item.label}</span>
                  <span className="font-semibold text-slate-700">{item.value}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <div>
              <p className="text-[10px] uppercase text-slate-400">Total Tech Spend</p>
              <p className="text-sm font-semibold text-slate-800">₹3,00,950</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-slate-500">
              Detailed Ledger →
            </Button>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            Network Health & Clinic Performance
          </p>
          <Badge className="bg-emerald-50 text-emerald-600">Operational across 12 nodes</Badge>
        </div>
        <div className="mt-4 grid gap-2 text-xs text-slate-400">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 border-b border-slate-100 pb-2 text-[10px] uppercase">
            <span>Clinic Name & Location</span>
            <span>Patients (Daily)</span>
            <span>Revenue/Day</span>
            <span>Margin</span>
            <span>Status</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-600 transition hover:-translate-y-0.5 hover:shadow"
            >
              <div>
                <p className="font-semibold text-slate-700">{row.name}</p>
                <p className="text-[10px] text-slate-400">{row.location}</p>
              </div>
              <span>{row.patients}</span>
              <span>{row.revenue}</span>
              <span>{row.margin}</span>
              <Badge className={row.status === "Alert" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}>
                {row.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
