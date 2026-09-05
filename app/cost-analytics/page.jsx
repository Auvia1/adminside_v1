'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  IndianRupee,
  PhoneCall,
  TrendingUp,
  Clock,
  RotateCw,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart as PieChartIcon,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Mic,
  Volume2,
  FileText,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { apiGet } from '@/app/lib/api';

// ─── Color Palette ──────────────────────────────────────────────────────────
const COST_COLORS = {
  audio_in: '#0f6676',    // brand teal – Gemini Live input stream
  audio_out: '#6366f1',   // indigo – Gemini Live synthesized voice
  text_summary: '#f59e0b',// amber – Gemini 2.5 Flash post-call summary
  telephony: '#8b5cf6',   // violet – Vobiz provider
  whatsapp: '#06b6d4',    // cyan – appointment notifications
  recording: '#94a3b8',   // slate – recording & storage
};

const COST_LABELS = {
  audio_in: 'Audio Input (Gemini Live)',
  audio_out: 'Audio Output (Gemini Live)',
  text_summary: 'Text Summary (Flash)',
  telephony: 'Telephony (Vobiz)',
  whatsapp: 'WhatsApp',
  recording: 'Recording & Storage',
};

const RATE_PER_MINUTE = 5; // ₹5/min billed to clinics

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatRupee(value) {
  const num = Number(value || 0);
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toFixed(2)}`;
}

function formatDurationMinutes(mins) {
  const m = Number(mins || 0);
  const whole = Math.floor(m);
  const secs = Math.round((m - whole) * 60);
  if (whole === 0 && secs === 0) return '0s';
  if (whole === 0) return `${secs}s`;
  return secs > 0 ? `${whole}m ${secs}s` : `${whole}m`;
}

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
  };
}

// ─── Custom Tooltip for Charts ──────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      {label && <p className="mb-1 text-xs font-semibold text-slate-700">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: entry.color }}
          />
          <span>{entry.name}:</span>
          <span className="font-semibold text-slate-800">₹{Number(entry.value).toFixed(4)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut center label ─────────────────────────────────────────────────────
function DonutCenterLabel({ viewBox, total }) {
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-400 text-[10px]">
        Total
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-800 text-[16px] font-bold">
        ₹{Number(total).toFixed(2)}
      </text>
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Page Wrapper
// ═══════════════════════════════════════════════════════════════════════════
export default function CostAnalyticsWrapper() {
  return (
    <ProtectedRoute>
      <CostAnalyticsPage />
    </ProtectedRoute>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════
function CostAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      setSummaryError('');
      const params = new URLSearchParams();
      if (dateRange.start_date) params.append('start_date', dateRange.start_date);
      if (dateRange.end_date) params.append('end_date', dateRange.end_date);

      const res = await apiGet(`/call-cost-breakdown/admin/summary?${params.toString()}`);
      setSummary(res.data || null);
    } catch (err) {
      setSummaryError(err.message || 'Failed to load cost summary');
    } finally {
      setSummaryLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // ── Stat cards data ───────────────────────────────────────────────────
  const stats = [
    {
      label: 'Total Spend',
      value: formatRupee(summary?.total_cost),
      meta: `${dateRange.start_date} – ${dateRange.end_date}`,
      icon: IndianRupee,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Total Calls',
      value: Number(summary?.total_calls || 0).toLocaleString(),
      meta: 'Calls with cost data',
      icon: PhoneCall,
      color: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Avg Cost / Call',
      value: formatRupee(summary?.avg_cost_per_call),
      meta: 'Average across all calls',
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Avg Duration',
      value: formatDurationMinutes(summary?.avg_duration_minutes),
      meta: 'Average call duration',
      icon: Clock,
      color: 'bg-violet-50 text-violet-600',
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: PieChartIcon },
    { id: 'details', label: 'Call Details', icon: BarChart3 },
    { id: 'margins', label: 'Margins', icon: Wallet },
  ];

  return (
    <div className="space-y-6 px-6 py-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cost Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">
            Detailed per-call cost breakdown — Gemini 3.1 Live (Speech-to-Speech), Text Summary, Telephony & WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date range */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange((d) => ({ ...d, start_date: e.target.value }))}
              className="h-9 w-auto text-sm"
            />
            <span className="text-xs text-slate-400">to</span>
            <Input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange((d) => ({ ...d, end_date: e.target.value }))}
              className="h-9 w-auto text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            disabled={summaryLoading}
            className="h-9"
          >
            <RotateCw className={`h-4 w-4 ${summaryLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {summaryError && (
        <ErrorMessage message={summaryError} onDismiss={() => setSummaryError('')} />
      )}

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      {summaryLoading && !summary ? (
        <LoadingSpinner text="Loading cost summary..." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                className="group p-4 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {item.label}
                  </p>
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${item.color} transition group-hover:scale-110`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-slate-800">{item.value}</p>
                  <span className="text-xs text-slate-400">{item.meta}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex space-x-2 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'border-(--brand-primary) text-(--brand-primary)'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────── */}
      <div className="mt-2">
        {activeTab === 'overview' && <OverviewTab summary={summary} loading={summaryLoading} />}
        {activeTab === 'details' && <CallDetailsTab dateRange={dateRange} />}
        {activeTab === 'margins' && <MarginsTab dateRange={dateRange} summary={summary} summaryLoading={summaryLoading} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Overview Tab — Donut + Area Chart + Ranked List
// ═══════════════════════════════════════════════════════════════════════════
function OverviewTab({ summary, loading }) {
  if (loading) return <LoadingSpinner text="Loading charts..." />;
  if (!summary) {
    return (
      <Card className="p-12 text-center">
        <p className="text-sm text-slate-500">No cost data available for this period.</p>
      </Card>
    );
  }

  // Build donut data — mapped from the Gemini 3.1 Native billing model
  // llm_in_cost = Audio Input (Gemini Live stream) + Text Summary Input (Flash)
  // llm_out_cost = Audio Output (Gemini Live voice) + Text Summary Output (Flash)
  // Since text summary tokens are negligibly small vs audio tokens, we show:
  //   Audio In ≈ llm_in_cost, Audio Out ≈ llm_out_cost
  // The "other" column = recording & storage cost
  const costComponents = [
    { key: 'audio_in', value: Number(summary.total_llm_in_cost || 0) },
    { key: 'audio_out', value: Number(summary.total_llm_out_cost || 0) },
    { key: 'telephony', value: Number(summary.total_telephony_cost || 0) },
    { key: 'whatsapp', value: Number(summary.total_whatsapp_cost || 0) },
    { key: 'recording', value: Number(summary.total_other_cost || 0) },
  ].filter((c) => c.value > 0);

  const donutData = costComponents.map((c) => ({
    name: COST_LABELS[c.key],
    value: c.value,
    color: COST_COLORS[c.key],
  }));

  const totalCost = Number(summary.total_cost || 0);

  // Ranked list (sorted desc)
  const ranked = [...costComponents].sort((a, b) => b.value - a.value);
  const maxVal = ranked[0]?.value || 1;

  // Token & usage stats — reflects Gemini 3.1 native audio token model (25 tokens/sec)
  const tokenStats = [
    { label: 'Audio + Summary In Tokens', value: Number(summary.total_llm_in_tokens || 0).toLocaleString() },
    { label: 'Audio + Summary Out Tokens', value: Number(summary.total_llm_out_tokens || 0).toLocaleString() },
    { label: 'Total Calls', value: Number(summary.total_calls || 0).toLocaleString() },
    { label: 'Credits Billed', value: `₹${Number(summary.total_credits_billed || 0).toFixed(2)}` },
  ];

  return (
    <div className="space-y-6">
      {/* ── Row 1: Donut + Ranked Bars ─────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Donut Chart */}
        <Card className="relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/60 via-transparent to-indigo-50/40" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">Cost Breakdown</h2>
                <p className="text-xs text-slate-400">Distribution by component</p>
              </div>
              <Badge className="bg-white/80 text-slate-600 shadow-sm">₹ INR</Badge>
            </div>

            {donutData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                No cost data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.color}
                        className="transition-opacity duration-200 hover:opacity-80"
                      />
                    ))}
                    {/* Center label */}
                    <Pie dataKey="value" data={[{ value: 1 }]} cx="50%" cy="50%" outerRadius={0}>
                    </Pie>
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  {/* Manually render center label */}
                  <text x="50%" y="46%" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 11 }}>
                    Total
                  </text>
                  <text x="50%" y="56%" textAnchor="middle" className="fill-slate-800" style={{ fontSize: 16, fontWeight: 700 }}>
                    ₹{totalCost.toFixed(2)}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Legend */}
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {donutData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: item.color }}
                  />
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Ranked Bars + Token Stats */}
        <div className="flex flex-col gap-6">
          <Card className="flex-1 p-6">
            <h2 className="text-sm font-semibold text-slate-700">Top Cost Components</h2>
            <p className="mb-4 text-xs text-slate-400">Ranked by total spend</p>

            <div className="space-y-3">
              {ranked.map((item) => {
                const pct = totalCost > 0 ? ((item.value / totalCost) * 100).toFixed(1) : 0;
                return (
                  <div key={item.key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{COST_LABELS[item.key]}</span>
                      <span className="font-semibold text-slate-800">
                        ₹{item.value.toFixed(4)}{' '}
                        <span className="font-normal text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${(item.value / maxVal) * 100}%`,
                          background: COST_COLORS[item.key],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Usage Stats</h2>
            <div className="grid grid-cols-2 gap-3">
              {tokenStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-slate-50 px-3 py-2.5 transition hover:bg-slate-100"
                >
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">{stat.label}</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-800">{stat.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Call Details Tab — Filter + Paginated Table
// ═══════════════════════════════════════════════════════════════════════════
function CallDetailsTab({ dateRange }) {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
    clinic_id: '',
  });

  const fetchRecords = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.clinic_id) params.append('clinic_id', filters.clinic_id);
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());

      const res = await apiGet(`/call-cost-breakdown/admin/all?${params.toString()}`);
      setRecords(res.data || []);
      if (res.pagination) {
        setPagination((prev) => ({ ...prev, ...res.pagination, page }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load cost records');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    fetchRecords(1);
  }, []);

  const handleFilter = () => fetchRecords(1);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchRecords(newPage);
  };

  return (
    <div className="space-y-4">
      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <Card className="flex flex-wrap items-end gap-4 p-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Start Date</label>
          <Input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters((f) => ({ ...f, start_date: e.target.value }))}
            className="h-9 w-auto text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">End Date</label>
          <Input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters((f) => ({ ...f, end_date: e.target.value }))}
            className="h-9 w-auto text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Clinic ID</label>
          <Input
            type="text"
            placeholder="UUID"
            value={filters.clinic_id}
            onChange={(e) => setFilters((f) => ({ ...f, clinic_id: e.target.value }))}
            className="h-9 w-auto text-sm"
          />
        </div>
        <Button onClick={handleFilter} className="h-9 px-4">
          <Search className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </Card>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner text="Loading cost records..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-900">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold">Date</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold">Caller</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold">Duration</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-right">Billed Min</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-right">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: COST_COLORS.audio_in }} />
                      Audio In
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-right">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: COST_COLORS.audio_out }} />
                      Audio Out
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-right">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: COST_COLORS.telephony }} />
                      Telephony
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-right">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: COST_COLORS.whatsapp }} />
                      WhatsApp
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-right">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: COST_COLORS.recording }} />
                      Recording
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                      No cost records found for this period.
                    </td>
                  </tr>
                ) : (
                  records.map((row) => (
                    <tr key={row.id} className="transition hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        <span className="font-semibold text-slate-800">
                          {new Date(row.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                        <span className="ml-1 text-slate-400">
                          {new Date(row.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-700">
                        {row.phone_number || row.caller_phone || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-700">
                        {formatDurationMinutes(row.duration_minutes)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-slate-700">
                        {Math.ceil(row.duration_minutes)}m
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-slate-600">
                        {Number(row.llm_in_cost).toFixed(4)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-slate-600">
                        {Number(row.llm_out_cost).toFixed(4)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-slate-600">
                        {Number(row.telephony_cost).toFixed(4)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-slate-600">
                        {Number(row.whatsapp_cost).toFixed(4)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-slate-600">
                        {Number(row.other_cost).toFixed(4)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold text-slate-900">
                        ₹{Number(row.total_cost).toFixed(4)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {!loading && records.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-400">
              Page {pagination.page} of {pagination.totalPages} •{' '}
              <span className="font-semibold text-slate-600">{pagination.total}</span> total records
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page number pills */}
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold transition ${
                      pageNum === pagination.page
                        ? 'bg-(--brand-primary) text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Margins Tab — Revenue (₹5/min) vs Cost = Margin
// ═══════════════════════════════════════════════════════════════════════════
function MarginsTab({ dateRange, summary, summaryLoading }) {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
    clinic_id: '',
  });

  const fetchRecords = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.clinic_id) params.append('clinic_id', filters.clinic_id);
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());

      const res = await apiGet(`/call-cost-breakdown/admin/all?${params.toString()}`);
      setRecords(res.data || []);
      if (res.pagination) {
        setPagination((prev) => ({ ...prev, ...res.pagination, page }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load margin data');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    fetchRecords(1);
  }, []);

  const handleFilter = () => fetchRecords(1);
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchRecords(newPage);
  };

  // ── Aggregate margin stats from summary ────────────────────────────
  const roundedDurationMin = summary?.total_billed_duration_minutes !== undefined
    ? Number(summary.total_billed_duration_minutes || 0)
    : Math.ceil(Number(summary?.avg_duration_minutes || 0) * Number(summary?.total_calls || 0));
  const totalRevenue = roundedDurationMin * RATE_PER_MINUTE;
  const totalCost = Number(summary?.total_cost || 0);
  const totalMargin = totalRevenue - totalCost;
  const marginPct = totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100) : 0;
  const isPositive = totalMargin >= 0;

  const marginStats = [
    {
      label: 'Total Revenue',
      value: formatRupee(totalRevenue),
      sub: `${roundedDurationMin} min × ₹${RATE_PER_MINUTE}/min`,
      color: 'bg-sky-50 text-sky-600',
      icon: IndianRupee,
    },
    {
      label: 'Total Cost',
      value: formatRupee(totalCost),
      sub: 'Audio In + Audio Out + Telephony + WA + Recording',
      color: 'bg-rose-50 text-rose-600',
      icon: TrendingUp,
    },
    {
      label: 'Net Margin',
      value: `${totalMargin >= 0 ? '+' : ''}${formatRupee(totalMargin)}`,
      sub: `${marginPct.toFixed(1)}% margin`,
      color: isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
      icon: isPositive ? ArrowUpRight : ArrowDownRight,
    },
    {
      label: 'Margin / Call',
      value: Number(summary?.total_calls || 0) > 0
        ? `${totalMargin / Number(summary.total_calls) >= 0 ? '+' : ''}₹${(totalMargin / Number(summary.total_calls)).toFixed(2)}`
        : '₹0.00',
      sub: `Avg across ${Number(summary?.total_calls || 0)} calls`,
      color: isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Margin Summary Cards ──────────────────────────────────────── */}
      {summaryLoading ? (
        <LoadingSpinner text="Calculating margins..." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {marginStats.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                className="group p-4 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {item.label}
                  </p>
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${item.color} transition group-hover:scale-110`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-slate-800">{item.value}</p>
                  <span className="text-xs text-slate-400">{item.sub}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Margin Breakdown Visual ───────────────────────────────────── */}
      {!summaryLoading && summary && (
        <Card className="relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-50/50 via-transparent to-emerald-50/50" />
          <div className="relative">
            <h2 className="mb-1 text-sm font-semibold text-slate-700">Revenue vs Cost Waterfall</h2>
            <p className="mb-5 text-xs text-slate-400">Visualizing where your ₹{RATE_PER_MINUTE}/min goes</p>

            <div className="flex items-end gap-3">
              {/* Revenue bar */}
              <div className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-bold text-sky-600">{formatRupee(totalRevenue)}</span>
                <div className="w-full rounded-xl bg-sky-100 flex items-end" style={{ height: 120 }}>
                  <div className="h-full w-full rounded-xl bg-gradient-to-t from-sky-500 to-sky-400 transition-all duration-500" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Revenue</span>
              </div>

              {/* Cost bar — scaled proportionally */}
              <div className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-bold text-rose-600">{formatRupee(totalCost)}</span>
                <div className="w-full rounded-xl bg-rose-50 flex items-end" style={{ height: 120 }}>
                  <div
                    className="w-full rounded-xl bg-gradient-to-t from-rose-500 to-rose-400 transition-all duration-500"
                    style={{ height: totalRevenue > 0 ? `${Math.min((totalCost / totalRevenue) * 100, 100)}%` : '0%' }}
                  />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cost</span>
              </div>

              {/* Margin bar */}
              <div className="flex flex-1 flex-col items-center gap-2">
                <span className={`text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {totalMargin >= 0 ? '+' : ''}{formatRupee(totalMargin)}
                </span>
                <div className={`w-full rounded-xl flex items-end ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`} style={{ height: 120 }}>
                  <div
                    className={`w-full rounded-xl transition-all duration-500 ${isPositive ? 'bg-gradient-to-t from-emerald-500 to-emerald-400' : 'bg-gradient-to-t from-red-500 to-red-400'}`}
                    style={{ height: totalRevenue > 0 ? `${Math.min((Math.abs(totalMargin) / totalRevenue) * 100, 100)}%` : '0%' }}
                  />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Margin</span>
              </div>

              {/* Margin % indicator */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                <p className={`text-3xl font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {marginPct.toFixed(1)}%
                </p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Margin %</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <Card className="flex flex-wrap items-end gap-4 p-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Start Date</label>
          <Input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters((f) => ({ ...f, start_date: e.target.value }))}
            className="h-9 w-auto text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">End Date</label>
          <Input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters((f) => ({ ...f, end_date: e.target.value }))}
            className="h-9 w-auto text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Clinic ID</label>
          <Input
            type="text"
            placeholder="UUID"
            value={filters.clinic_id}
            onChange={(e) => setFilters((f) => ({ ...f, clinic_id: e.target.value }))}
            className="h-9 w-auto text-sm"
          />
        </div>
        <Button onClick={handleFilter} className="h-9 px-4">
          <Search className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </Card>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

      {/* ── Per-Call Margin Table ───────────────────────────────────────── */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner text="Loading margin data..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-900">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold">Date</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold">Caller</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold">Duration</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-right">Rounded Time</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-right">Revenue (₹5/min)</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-right">Total Cost</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-right">Margin</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-right">Margin %</th>
                  <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                      No records found for this period.
                    </td>
                  </tr>
                ) : (
                  records.map((row) => {
                    const durationMin = Number(row.duration_minutes || 0);
                    const roundedDurationMin = Math.ceil(durationMin);
                    const revenue = roundedDurationMin * RATE_PER_MINUTE;
                    const cost = Number(row.total_cost || 0);
                    const margin = revenue - cost;
                    const mPct = revenue > 0 ? ((margin / revenue) * 100) : 0;
                    const pos = margin >= 0;

                    return (
                      <tr key={row.id} className="transition hover:bg-slate-50/60">
                        <td className="whitespace-nowrap px-4 py-3 text-xs">
                          <span className="font-semibold text-slate-800">
                            {new Date(row.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </span>
                          <span className="ml-1 text-slate-400">
                            {new Date(row.created_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-700">
                          {row.phone_number || row.caller_phone || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-700">
                          {formatDurationMinutes(durationMin)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-slate-700">
                          {roundedDurationMin}m
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-sky-700 font-semibold">
                          ₹{revenue.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-rose-600">
                          ₹{cost.toFixed(4)}
                        </td>
                        <td className={`whitespace-nowrap px-4 py-3 text-right font-mono text-xs font-bold ${pos ? 'text-emerald-600' : 'text-red-600'}`}>
                          {pos ? '+' : ''}₹{margin.toFixed(4)}
                        </td>
                        <td className={`whitespace-nowrap px-4 py-3 text-right text-xs font-semibold ${pos ? 'text-emerald-600' : 'text-red-600'}`}>
                          {mPct.toFixed(1)}%
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          {pos ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">
                              <ArrowUpRight className="mr-0.5 h-3 w-3" />
                              Profit
                            </Badge>
                          ) : (
                            <Badge className="bg-red-50 text-red-700 border-red-100">
                              <ArrowDownRight className="mr-0.5 h-3 w-3" />
                              Loss
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {!loading && records.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-400">
              Page {pagination.page} of {pagination.totalPages} •{' '}
              <span className="font-semibold text-slate-600">{pagination.total}</span> total records
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold transition ${
                      pageNum === pagination.page
                        ? 'bg-(--brand-primary) text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
