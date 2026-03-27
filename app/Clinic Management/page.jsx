import {
  Bell,
  Building2,
  ChevronDown,
  ClipboardList,
  FileText,
  KeyRound,
  Plus,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";

const phoneNumbers = [
  {
    number: "+91 40 2345 6789",
    type: "Reception Line",
    status: "Live",
  },
  {
    number: "+91 40 2345 6790",
    type: "AI Appointment Agent",
    status: "Live",
  },
  {
    number: "+91 99887 76655",
    type: "Emergency Support",
    status: "Live",
  },
];

const featureFlags = [
  {
    title: "AI Voice Agent",
    description: "High-fidelity Telugu/English TTS",
    enabled: true,
  },
  {
    title: "Automated Scheduling",
    description: "Calendar Sync & Reminder SMS",
    enabled: true,
  },
  {
    title: "Revenue Analytics",
    description: "Advanced billing & collection insights",
    enabled: false,
  },
  {
    title: "Patient WhatsApp",
    description: "Official Business API integration",
    enabled: false,
  },
];

export default function ClinicManagementPage() {
  return (
    <div className="px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Clinic Console
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
            Dr. Reddy&apos;s Clinic • Madhapur
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button
            className="h-9 rounded-xl bg-(--brand-primary) px-4 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(15,102,118,0.2)] transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> Add New Clinic
          </Button>
          <button className="relative rounded-full p-2 text-slate-400 transition hover:scale-105 hover:bg-slate-100 hover:text-(--brand-primary)">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-(--brand-primary)" />
          </button>
          <button className="rounded-full p-2 text-slate-400 transition hover:scale-105 hover:bg-slate-100 hover:text-(--brand-primary)">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_1.2fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-(--brand-primary)/10 text-(--brand-primary)">
                <ShieldCheck className="h-4 w-4" />
              </span>
              General Info
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Owner Name</p>
              <p className="font-semibold text-slate-700">Dr. K. Venkat Reddy</p>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] uppercase text-slate-400">Plan Type</p>
                <Badge className="mt-1 bg-indigo-50 text-indigo-600">Enterprise Plan</Badge>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-slate-400">Renewal Date</p>
                <p className="font-semibold text-slate-700">12 Dec, 2024</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Payment Status
              </div>
              <div className="flex items-center gap-2">
                Paid • ₹18,500/mo
                <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-(--brand-primary)/10 text-(--brand-primary)">
                <KeyRound className="h-4 w-4" />
              </span>
              Technical Configuration
            </div>
            <Button variant="outline" size="sm" className="rounded-xl text-xs">
              Test Integration
            </Button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Webhook URL</span>
                  <button className="text-(--brand-primary)">Edit</button>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  https://api.reddyclinic.in/webhooks
                  <button className="ml-auto rounded-lg border border-slate-200 px-2 py-1 text-[10px] text-slate-400">
                    Copy
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>TTS API Key</span>
                  <button className="text-(--brand-primary)">Regenerate</button>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  ••••••••••••••••
                  <button className="ml-auto rounded-lg border border-slate-200 px-2 py-1 text-[10px] text-slate-400">
                    View
                  </button>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-500">
                <Building2 className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">Infrastructure Region</p>
              <p className="text-sm font-semibold text-slate-700">Asia-South-1 (Mumbai)</p>
              <p className="mt-1 text-[11px] text-slate-400">Latency: 14ms • Status: Operational</p>
              <Button variant="outline" size="sm" className="mt-4 rounded-xl text-xs">
                Change Region
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-(--brand-primary)/10 text-(--brand-primary)">
                <ClipboardList className="h-4 w-4" />
              </span>
              Phone Numbers
            </div>
            <div className="text-right text-xs text-slate-400">
              <p className="text-[10px] uppercase">Total Active</p>
              <p className="text-sm font-semibold text-slate-800">04</p>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-400">Active VoIP lines managed by Auvia.</p>
          <div className="mt-4 space-y-2 rounded-2xl border border-slate-100 bg-white p-3">
            <div className="grid grid-cols-[1.2fr_1fr_0.6fr_0.2fr] text-[10px] uppercase text-slate-400">
              <span>Number</span>
              <span>Service Type</span>
              <span>Status</span>
            </div>
            {phoneNumbers.map((item) => (
              <div
                key={item.number}
                className="grid grid-cols-[1.2fr_1fr_0.6fr_0.2fr] items-center rounded-xl px-2 py-2 text-xs text-slate-600 transition hover:bg-slate-50"
              >
                <span>{item.number}</span>
                <span>{item.type}</span>
                <Badge className="w-fit bg-emerald-50 text-emerald-600">{item.status}</Badge>
                <button className="justify-self-end text-slate-300 hover:text-slate-500">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button className="mt-2 w-full rounded-xl border border-dashed border-slate-200 py-2 text-xs font-semibold text-slate-400 transition hover:border-(--brand-primary)/40 hover:text-(--brand-primary)">
              + Provision New Number
            </button>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-(--brand-primary)/10 text-(--brand-primary)">
              <FileText className="h-4 w-4" />
            </span>
            Feature Privileges
          </div>
          <div className="mt-4 space-y-3">
            {featureFlags.map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-3 py-3 text-sm text-slate-600 transition hover:-translate-y-0.5 hover:shadow"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                  <p className="text-[11px] text-slate-400">{item.description}</p>
                </div>
                <Switch defaultChecked={item.enabled} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
