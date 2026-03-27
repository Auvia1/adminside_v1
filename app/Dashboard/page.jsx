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
    name: "Yashoda Gachibowli",
    location: "Gachibowli · 0 Active",
    status: "danger",
  },
  {
    name: "Continental Financial",
    location: "Financial Dist · 18 Numbers",
    status: "default",
  },
];

const regions = ["Madhapur", "KPHB", "Banjara Hills", "Kukatpally"];
const locations = [
  "Hyderabad, Telangana",
  "Bengaluru, Karnataka",
  "Mumbai, Maharashtra",
  "Chennai, Tamil Nadu",
  "Delhi, NCR",
];

export default function DashboardPage() {
  return (
    <div className="px-6 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex w-full max-w-[320px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm transition focus-within:border-(--brand-primary)/40 focus-within:ring-2 focus-within:ring-(--brand-primary)/20">
          <MapPinned className="h-4 w-4 text-(--brand-primary)" />
          <input
            list="admin-locations"
            placeholder="Select location"
            className="w-full bg-transparent text-sm text-slate-600 outline-none"
          />
          <span className="text-xs text-slate-400">🇮🇳</span>
          <datalist id="admin-locations">
            {locations.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button className="relative rounded-full p-2 text-slate-400 transition hover:scale-105 hover:bg-slate-100 hover:text-(--brand-primary)">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-(--brand-primary)" />
          </button>
          <button className="rounded-full p-2 text-slate-400 transition hover:scale-105 hover:bg-slate-100 hover:text-(--brand-primary)">
            <Settings className="h-5 w-5" />
          </button>
          <div className="hidden h-6 w-px bg-slate-200 md:block" />
          <NewClinicDialog />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.label}
              className="p-4 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400">
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
                {item.delta ? (
                  <Badge>{item.delta}</Badge>
                ) : (
                  <span className="text-xs text-slate-400">{item.meta}</span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="relative overflow-hidden p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(235,178,168,0.9),rgba(185,142,153,0.6),rgba(143,115,134,0.6))]" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow transition focus-within:border-(--brand-primary)/40 focus-within:ring-2 focus-within:ring-(--brand-primary)/20">
                <Search className="h-4 w-4" />
                <input
                  placeholder="Search Madhapur, KPHB clinics..."
                  className="w-full bg-transparent text-sm text-slate-500 outline-none"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0 transition hover:-translate-y-0.5"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-16 flex items-center justify-center">
              <div className="relative h-65 w-90">
                {["left-8 top-12", "left-32 top-32", "right-20 top-20"].map(
                  (position, index) => (
                    <div
                      key={position}
                      className={`absolute ${position} flex h-7 w-7 items-center justify-center rounded-full bg-white text-(--brand-primary) shadow transition hover:scale-110 hover:shadow-lg`}
                    >
                      <MapPinned className="h-4 w-4" />
                    </div>
                  )
                )}
                <div className="absolute left-28 bottom-16 flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-500 shadow transition hover:scale-110 hover:shadow-lg">
                  <MapPinned className="h-4 w-4" />
                </div>
                <div className="absolute right-24 bottom-10 flex h-7 w-7 items-center justify-center rounded-full bg-white text-orange-500 shadow transition hover:scale-110 hover:shadow-lg">
                  <MapPinned className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {regions.map((region) => (
                <span
                  key={region}
                  className="rounded-full bg-white/70 px-4 py-1 text-[11px] font-semibold text-slate-500 shadow transition hover:-translate-y-0.5 hover:bg-white"
                >
                  {region.toUpperCase()}
                </span>
              ))}
            </div>

            <div className="absolute bottom-5 right-5 flex flex-col gap-2">
              <Button
                size="sm"
                className="h-9 w-9 rounded-xl p-0 transition hover:-translate-y-0.5"
              >
                +
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-9 rounded-xl p-0 transition hover:-translate-y-0.5"
              >
                -
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">LIVE STATUS</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-400 transition hover:scale-105"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {liveStatus.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold ${
                      item.status === "danger"
                        ? "bg-rose-50 text-rose-500"
                        : item.status === "warning"
                        ? "bg-orange-50 text-orange-500"
                        : "bg-emerald-50 text-emerald-500"
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400">{item.location}</p>
                  </div>
                </div>
                <span className="text-slate-300">›</span>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <Button
              variant="outline"
              className="h-10 w-full rounded-xl text-xs font-semibold transition hover:-translate-y-0.5"
            >
              EXPORT REGIONAL DATA
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
