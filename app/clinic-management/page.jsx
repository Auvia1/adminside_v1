

"use client";

import { useState } from "react";
import {
  Bell,
  ChevronDown,
  ClipboardList,
  Clock,
  CalendarDays,
  Ban,
  Bot,
  Languages,
  MessageCircle,
  ImageIcon,
  Check,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Save,
  TimerReset,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Input } from "../components/ui/input";

const clinics = [
  "Dr. Reddy's Clinic • Madhapur",
  "Apollo Diagnostics • KPHB",
  "Care Hospital • LB Nagar",
];

const phoneNumbers = [
  { number: "+91 40 2345 6789", type: "Reception Line", status: "Live" },
  { number: "+91 40 2345 6790", type: "AI Appointment Agent", status: "Live" },
  { number: "+91 99887 76655", type: "Emergency Support", status: "Live" },
];

// Maps to clinic_settings table
const defaultSettings = {
  advance_booking_days: 30,
  min_booking_notice_period: 60,
  cancellation_window_hours: 24,
  ai_agent_enabled: true,
  ai_agent_languages: ["te-IN", "en-IN"],
  whatsapp_number: "9988776655",
  logo_url: "",
  followup_time: "09:00",
  price_per_appointment: 500,
};

const languageOptions = [
  { value: "en-IN", label: "English (India)", flag: "🇬🇧" },
  { value: "te-IN", label: "Telugu",          flag: "🇮🇳" },
  { value: "hi-IN", label: "Hindi",           flag: "🇮🇳" },
  { value: "ta-IN", label: "Tamil",           flag: "🇮🇳" },
  { value: "kn-IN", label: "Kannada",         flag: "🇮🇳" },
  { value: "ml-IN", label: "Malayalam",       flag: "🇮🇳" },
  { value: "mr-IN", label: "Marathi",         flag: "🇮🇳" },
];

function SettingRow({ icon: Icon, label, sublabel, children }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-50 text-slate-400">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          {sublabel && <p className="text-[11px] text-slate-400">{sublabel}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-(--brand-primary)/10 text-(--brand-primary)">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </div>
      {action}
    </div>
  );
}

export default function ClinicManagementPage() {
  const [selectedClinic, setSelectedClinic] = useState(clinics[0]);
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);

  function update(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function toggleLanguage(val) {
    setSettings((prev) => {
      const langs = prev.ai_agent_languages;
      return {
        ...prev,
        ai_agent_languages: langs.includes(val)
          ? langs.filter((l) => l !== val)
          : [...langs, val],
      };
    });
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="px-6 py-6">
      {/* ── Top Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Clinic Console
          </p>
          <div className="relative mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="w-full appearance-none bg-transparent pr-6 text-sm text-slate-700 outline-none"
            >
              {clinics.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button
            onClick={handleSave}
            className="h-9 rounded-xl bg-(--brand-primary) px-4 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(15,102,118,0.2)] transition hover:-translate-y-0.5"
          >
            {saved ? (
              <><Sparkles className="h-4 w-4" /> Saved!</>
            ) : (
              <><Save className="h-4 w-4" /> Save Changes</>
            )}
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

      {/* ── Row 1: General Info + Booking Rules ── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_1.2fr]">

        {/* General Info */}
        <Card className="p-5">
          <SectionHeader
            icon={ShieldCheck}
            title="General Info"
            action={
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            }
          />
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

            {/* Price per Appointment */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-slate-400">
                <Sparkles className="h-3 w-3" /> Price per Appointment
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus-within:border-(--brand-primary)/40 focus-within:ring-2 focus-within:ring-(--brand-primary)/10">
                <span className="font-semibold text-slate-400">₹</span>
                <input
                  type="number"
                  min={0}
                  value={settings.price_per_appointment}
                  onChange={(e) => update("price_per_appointment", Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-transparent outline-none text-xs text-slate-700"
                />
              </div>
            </div>

            {/* Logo URL */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-slate-400">
                <ImageIcon className="h-3 w-3" /> Logo URL
              </div>
              <Input
                value={settings.logo_url}
                onChange={(e) => update("logo_url", e.target.value)}
                placeholder="https://cdn.example.com/logo.png"
                className="h-8 rounded-xl text-xs text-slate-600"
              />
            </div>
          </div>
        </Card>

        {/* Booking Rules */}
        <Card className="p-5">
          <SectionHeader icon={CalendarDays} title="Booking Rules" />
          <div className="mt-4 space-y-3">

            <SettingRow
              icon={CalendarDays}
              label="Advance Booking"
              sublabel="How far ahead patients can book"
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={settings.advance_booking_days}
                  onChange={(e) => update("advance_booking_days", Number(e.target.value))}
                  className="h-8 w-16 rounded-xl text-center text-xs"
                />
                <span className="text-xs text-slate-400">days</span>
              </div>
            </SettingRow>

            <SettingRow
              icon={Clock}
              label="Min Notice Period"
              sublabel="Minimum lead time before appointment"
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={settings.min_booking_notice_period}
                  onChange={(e) => update("min_booking_notice_period", Number(e.target.value))}
                  className="h-8 w-16 rounded-xl text-center text-xs"
                />
                <span className="text-xs text-slate-400">min</span>
              </div>
            </SettingRow>

            <SettingRow
              icon={Ban}
              label="Cancellation Window"
              sublabel="Latest a patient can cancel"
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={settings.cancellation_window_hours}
                  onChange={(e) => update("cancellation_window_hours", Number(e.target.value))}
                  className="h-8 w-16 rounded-xl text-center text-xs"
                />
                <span className="text-xs text-slate-400">hrs</span>
              </div>
            </SettingRow>

            <SettingRow
              icon={TimerReset}
              label="Follow-up Time"
              sublabel="Daily time to send follow-up messages"
            >
              <Input
                type="time"
                value={settings.followup_time}
                onChange={(e) => update("followup_time", e.target.value)}
                className="h-8 w-28 rounded-xl text-xs"
              />
            </SettingRow>

          </div>
        </Card>
      </div>

      {/* ── Row 2: Phone Numbers + AI Agent Config ── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">

        {/* Phone Numbers */}
        <Card className="p-5">
          <SectionHeader
            icon={ClipboardList}
            title="Phone Numbers"
            action={
              <div className="text-right text-xs text-slate-400">
                <p className="text-[10px] uppercase">Total Active</p>
                <p className="text-sm font-semibold text-slate-800">04</p>
              </div>
            }
          />
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

          {/* WhatsApp Number */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-slate-400">
              <MessageCircle className="h-3 w-3" /> WhatsApp Business Number
            </div>
            <Input
              value={settings.whatsapp_number}
              onChange={(e) => update("whatsapp_number", e.target.value)}
              placeholder="10-digit number"
              className="h-8 rounded-xl text-xs text-slate-600"
            />
          </div>
        </Card>

        {/* AI Agent Config */}
        <Card className="p-5">
          <SectionHeader icon={Bot} title="AI Agent Config" />
          <div className="mt-4 space-y-3">

            <SettingRow
              icon={Bot}
              label="AI Voice Agent"
              sublabel="Enable the AI appointment agent"
            >
              <Switch
                checked={settings.ai_agent_enabled}
                onCheckedChange={(val) => update("ai_agent_enabled", val)}
              />
            </SettingRow>

            <SettingRow
              icon={Languages}
              label="Agent Languages"
              sublabel="Select all supported languages"
            >
              <span className="text-xs text-slate-400">
                {settings.ai_agent_languages.length} selected
              </span>
            </SettingRow>

            {/* Multi-language pill selector */}
            <div
              className={`flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 transition-opacity ${
                !settings.ai_agent_enabled ? "pointer-events-none opacity-40" : ""
              }`}
            >
              {languageOptions.map((l) => {
                const active = settings.ai_agent_languages.includes(l.value);
                return (
                  <button
                    key={l.value}
                    onClick={() => toggleLanguage(l.value)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 ${
                      active
                        ? "border-(--brand-primary)/30 bg-(--brand-primary)/10 text-(--brand-primary)"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {active && <Check className="h-3 w-3" />}
                    {l.flag} {l.label}
                  </button>
                );
              })}
            </div>

          </div>
        </Card>
      </div>
    </div>
  );
}
