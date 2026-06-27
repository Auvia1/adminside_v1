"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  UserRound,
  Plus,
  Trash2,
  Loader2,
  CalendarDays,
  Clock,
  Ticket,
  ChevronDown,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import ErrorMessage from "./ErrorMessage";
import LoadingSpinner from "./LoadingSpinner";
import { apiGet, apiPatch, apiPost, apiDelete } from "@/app/lib/api";

// ── Helpers ─────────────────────────────────────────────────────────────────
const dayOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function timeToApi(v) {
  if (!v) return "";
  const [h = "00", m = "00"] = String(v).split(":");
  return `${h}:${m}:00`;
}
function timeFromApi(v) {
  if (!v) return "";
  return String(v).slice(0, 5);
}
function toIstIso(localDateTime) {
  if (!localDateTime) return "";
  const normalized = localDateTime.length === 16 ? `${localDateTime}:00` : localDateTime;
  return `${normalized}+05:30`;
}
function fromIstIso(isoString) {
  if (!isoString) return "";
  // Returns YYYY-MM-DDTHH:MM for datetime-local input
  return String(isoString).slice(0, 16);
}
function tempId() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeNewScheduleRow(slotDuration) {
  return {
    _tempId: tempId(),
    id: null,
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
    slot_duration_minutes: slotDuration || 30,
    effective_from: "",
    effective_to: "",
    _dirty: false,
    _isNew: true,
  };
}

function makeNewTimeOffRow() {
  return {
    _tempId: tempId(),
    id: null,
    start_time: "",
    end_time: "",
    reason: "",
    _dirty: false,
    _isNew: true,
  };
}

function makeNewTokenSlotRow() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    _tempId: tempId(),
    id: null,
    day_of_week: 1,
    start_time: "09:00",
    end_time: "13:00",
    max_appointments_per_slot: 15,
    status: "open",
    effective_from: today,
    effective_to: "",
    _dirty: false,
    _isNew: true,
  };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function EditDoctorDialog({ doctorItem, clinicId, onUpdate, isTokenSystem, children }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  // ── Info state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: "",
    speciality: "",
    consultation_duration_minutes: 30,
    max_appointments_per_day: 10,
    is_active: true,
    price_charged: "",
  });
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [infoSuccess, setInfoSuccess] = useState(false);

  // ── Schedule state ──────────────────────────────────────────────────────────
  const [schedules, setSchedules] = useState([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [deletingScheduleId, setDeletingScheduleId] = useState(null);
  const [savingScheduleIds, setSavingScheduleIds] = useState(new Set());

  // ── Time-off state ──────────────────────────────────────────────────────────
  const [timeOffs, setTimeOffs] = useState([]);
  const [isLoadingTimeOffs, setIsLoadingTimeOffs] = useState(false);
  const [timeOffError, setTimeOffError] = useState("");
  const [deletingTimeOffId, setDeletingTimeOffId] = useState(null);
  const [savingTimeOffIds, setSavingTimeOffIds] = useState(new Set());

  // ── Token Slots state ────────────────────────────────────────────────────────
  const [tokenSlots, setTokenSlots] = useState([]);
  const [isLoadingTokenSlots, setIsLoadingTokenSlots] = useState(false);
  const [tokenSlotError, setTokenSlotError] = useState("");
  const [deletingTokenSlotId, setDeletingTokenSlotId] = useState(null);
  const [savingTokenSlotIds, setSavingTokenSlotIds] = useState(new Set());

  // ── Reset on open ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (open && doctorItem) {
      setActiveTab("info");
      setForm({
        name: doctorItem.name || "",
        speciality: doctorItem.speciality || "",
        consultation_duration_minutes: doctorItem.consultationDuration ?? 30,
        max_appointments_per_day: doctorItem.maxAppointmentsPerDay ?? 10,
        is_active: doctorItem.isActive ?? true,
        price_charged: doctorItem.priceCharged != null ? String(doctorItem.priceCharged) : "",
      });
      setInfoError(""); setInfoSuccess(false);
      setScheduleError(""); setSchedules([]);
      setTimeOffError(""); setTimeOffs([]);
      setTokenSlotError(""); setTokenSlots([]);
    }
  }, [open, doctorItem]);

  // ── Load both when schedule tab opens ───────────────────────────────────────
  useEffect(() => {
    if (open && activeTab === "schedule" && doctorItem?.id) {
      loadSchedules();
      loadTimeOffs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab]);

  // ── Load token slots when token-slots tab opens ──────────────────────────────
  useEffect(() => {
    if (open && activeTab === "tokenSlots" && doctorItem?.id) {
      loadTokenSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab]);

  async function loadSchedules() {
    const cid = clinicId || doctorItem?.clinicId;
    try {
      setIsLoadingSchedules(true);
      setScheduleError("");
      const params = cid ? `?clinic_id=${cid}` : "";
      const res = await apiGet(`/doctors/${doctorItem.id}/schedule${params}`);
      if (!res?.success) throw new Error(res?.error || "Failed to load schedules");
      setSchedules(
        (Array.isArray(res.data) ? res.data : []).map((r) => ({
          _tempId: r.id,
          id: r.id,
          day_of_week: r.day_of_week,
          start_time: timeFromApi(r.start_time),
          end_time: timeFromApi(r.end_time),
          slot_duration_minutes: r.slot_duration_minutes,
          effective_from: r.effective_from ? r.effective_from.slice(0, 10) : "",
          effective_to: r.effective_to ? r.effective_to.slice(0, 10) : "",
          _dirty: false, _isNew: false,
        }))
      );
    } catch (err) {
      setScheduleError(err.message || "Failed to load schedules.");
    } finally {
      setIsLoadingSchedules(false);
    }
  }

  async function loadTimeOffs() {
    const cid = clinicId || doctorItem?.clinicId;
    try {
      setIsLoadingTimeOffs(true);
      setTimeOffError("");
      const params = cid ? `?clinic_id=${cid}` : "";
      const res = await apiGet(`/doctors/${doctorItem.id}/time-off${params}`);
      if (!res?.success) throw new Error(res?.error || "Failed to load time off");
      setTimeOffs(
        (Array.isArray(res.data) ? res.data : []).map((r) => ({
          _tempId: r.id,
          id: r.id,
          start_time: fromIstIso(r.start_time),
          end_time: fromIstIso(r.end_time),
          reason: r.reason || "",
          _dirty: false, _isNew: false,
        }))
      );
    } catch (err) {
      setTimeOffError(err.message || "Failed to load time off.");
    } finally {
      setIsLoadingTimeOffs(false);
    }
  }

  // ── Info handlers ────────────────────────────────────────────────────────────
  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveInfo() {
    setInfoError("");
    if (!form.name.trim()) { setInfoError("Doctor name is required."); return; }
    if (Number(form.consultation_duration_minutes) <= 0) { setInfoError("Consultation duration must be > 0."); return; }
    if (Number(form.max_appointments_per_day) <= 0) { setInfoError("Max appointments/day must be > 0."); return; }
    setIsSavingInfo(true);
    try {
      const payload = {
        name: form.name.trim(),
        speciality: form.speciality.trim() || undefined,
        consultation_duration_minutes: Number(form.consultation_duration_minutes),
        max_appointments_per_day: Number(form.max_appointments_per_day),
        is_active: Boolean(form.is_active),
        price_charged: form.price_charged !== "" ? Number(form.price_charged) : null,
      };
      const res = await apiPatch(`/doctors/${doctorItem.id}`, payload);
      if (!res?.success) throw new Error(res?.error || "Failed to update doctor.");
      const updated = res.data || {};
      if (typeof onUpdate === "function") {
        await onUpdate({
          id: doctorItem.id,
          name: updated.name || form.name.trim(),
          speciality: updated.speciality || form.speciality.trim() || "General",
          consultationDuration: updated.consultation_duration_minutes ?? Number(form.consultation_duration_minutes),
          maxAppointmentsPerDay: updated.max_appointments_per_day ?? Number(form.max_appointments_per_day),
          isActive: updated.is_active !== undefined ? Boolean(updated.is_active) : form.is_active,
          priceCharged: updated.price_charged != null ? updated.price_charged : (form.price_charged !== "" ? Number(form.price_charged) : null),
        });
      }
      setInfoSuccess(true);
      setTimeout(() => setInfoSuccess(false), 2000);
    } catch (err) {
      setInfoError(err.message || "Failed to update doctor.");
    } finally {
      setIsSavingInfo(false);
    }
  }

  // ── Schedule handlers ────────────────────────────────────────────────────────
  function updateScheduleField(tid, field, value) {
    setSchedules((prev) => prev.map((s) => s._tempId === tid ? { ...s, [field]: value, _dirty: true } : s));
  }
  function addScheduleRow() {
    setSchedules((prev) => [...prev, makeNewScheduleRow(form.consultation_duration_minutes)]);
  }
  async function saveScheduleRow(row) {
    const cid = clinicId || doctorItem?.clinicId;
    setScheduleError("");
    if (!row.start_time || !row.end_time) { setScheduleError("Start and end time required."); return; }
    if (row.end_time <= row.start_time) { setScheduleError("End time must be after start time."); return; }
    setSavingScheduleIds((prev) => new Set(prev).add(row._tempId));
    try {
      const payload = {
        day_of_week: Number(row.day_of_week),
        start_time: timeToApi(row.start_time),
        end_time: timeToApi(row.end_time),
        slot_duration_minutes: Number(row.slot_duration_minutes),
        effective_from: row.effective_from || undefined,
        effective_to: row.effective_to || null,
      };
      if (row._isNew) {
        const res = await apiPost(`/doctors/${doctorItem.id}/schedule`, { clinic_id: cid, ...payload });
        if (!res?.success) throw new Error(res?.error || "Failed to create schedule.");
        const created = res.data;
        setSchedules((prev) => prev.map((s) =>
          s._tempId === row._tempId ? { ...s, id: created.id, _tempId: created.id, _isNew: false, _dirty: false } : s
        ));
      } else {
        const res = await apiPatch(`/doctors/${doctorItem.id}/schedule/${row.id}`, payload);
        if (!res?.success) throw new Error(res?.error || "Failed to update schedule.");
        setSchedules((prev) => prev.map((s) => s._tempId === row._tempId ? { ...s, _dirty: false } : s));
      }
    } catch (err) {
      setScheduleError(err.message || "Failed to save schedule.");
    } finally {
      setSavingScheduleIds((prev) => { const n = new Set(prev); n.delete(row._tempId); return n; });
    }
  }
  async function deleteScheduleRow(row) {
    if (row._isNew) { setSchedules((prev) => prev.filter((s) => s._tempId !== row._tempId)); return; }
    if (!window.confirm("Delete this schedule slot?")) return;
    setDeletingScheduleId(row._tempId);
    try {
      const res = await apiDelete(`/doctors/${doctorItem.id}/schedule/${row.id}`);
      if (!res?.success) throw new Error(res?.error || "Failed to delete schedule.");
      setSchedules((prev) => prev.filter((s) => s._tempId !== row._tempId));
    } catch (err) {
      setScheduleError(err.message || "Failed to delete schedule.");
    } finally {
      setDeletingScheduleId(null);
    }
  }

  // ── Time-off handlers ────────────────────────────────────────────────────────
  function updateTimeOffField(tid, field, value) {
    setTimeOffs((prev) => prev.map((t) => t._tempId === tid ? { ...t, [field]: value, _dirty: true } : t));
  }
  function addTimeOffRow() {
    setTimeOffs((prev) => [...prev, makeNewTimeOffRow()]);
  }
  async function saveTimeOffRow(row) {
    const cid = clinicId || doctorItem?.clinicId;
    setTimeOffError("");
    if (!row.start_time || !row.end_time) { setTimeOffError("Start and end date/time required."); return; }
    if (row.end_time <= row.start_time) { setTimeOffError("End must be after start."); return; }
    setSavingTimeOffIds((prev) => new Set(prev).add(row._tempId));
    try {
      if (row._isNew) {
        const res = await apiPost(`/doctors/${doctorItem.id}/time-off`, {
          clinic_id: cid,
          start_time: toIstIso(row.start_time),
          end_time: toIstIso(row.end_time),
          reason: row.reason?.trim() || undefined,
        });
        if (!res?.success) throw new Error(res?.error || "Failed to create time off.");
        const created = res.data;
        setTimeOffs((prev) => prev.map((t) =>
          t._tempId === row._tempId ? { ...t, id: created.id, _tempId: created.id, _isNew: false, _dirty: false } : t
        ));
      } else {
        const res = await apiPatch(`/doctors/${doctorItem.id}/time-off/${row.id}`, {
          start_time: toIstIso(row.start_time),
          end_time: toIstIso(row.end_time),
          reason: row.reason?.trim() || undefined,
        });
        if (!res?.success) throw new Error(res?.error || "Failed to update time off.");
        setTimeOffs((prev) => prev.map((t) => t._tempId === row._tempId ? { ...t, _dirty: false } : t));
      }
    } catch (err) {
      setTimeOffError(err.message || "Failed to save time off.");
    } finally {
      setSavingTimeOffIds((prev) => { const n = new Set(prev); n.delete(row._tempId); return n; });
    }
  }
  async function deleteTimeOffRow(row) {
    if (row._isNew) { setTimeOffs((prev) => prev.filter((t) => t._tempId !== row._tempId)); return; }
    if (!window.confirm("Delete this time-off entry?")) return;
    setDeletingTimeOffId(row._tempId);
    try {
      const res = await apiDelete(`/doctors/${doctorItem.id}/time-off/${row.id}`);
      if (!res?.success) throw new Error(res?.error || "Failed to delete time off.");
      setTimeOffs((prev) => prev.filter((t) => t._tempId !== row._tempId));
    } catch (err) {
      setTimeOffError(err.message || "Failed to delete time off.");
    } finally {
      setDeletingTimeOffId(null);
    }
  }

  // ── Token Slot handlers ──────────────────────────────────────────────────────
  async function loadTokenSlots() {
    if (!clinicId) return;
    try {
      setIsLoadingTokenSlots(true);
      setTokenSlotError("");
      const res = await apiGet(`/slots?clinic_id=${clinicId}&doctor_id=${doctorItem.id}`);
      if (!res?.success) throw new Error(res?.error || "Failed to load token slots");
      setTokenSlots(
        (Array.isArray(res.data) ? res.data : []).map((r) => ({
          _tempId: r.id,
          id: r.id,
          day_of_week: r.day_of_week,
          start_time: timeFromApi(r.start_time),
          end_time: timeFromApi(r.end_time),
          max_appointments_per_slot: r.max_appointments_per_slot,
          status: r.status || "open",
          effective_from: r.effective_from ? r.effective_from.slice(0, 10) : "",
          effective_to: r.effective_to ? r.effective_to.slice(0, 10) : "",
          _dirty: false,
          _isNew: false,
        }))
      );
    } catch (err) {
      setTokenSlotError(err.message || "Failed to load token slots.");
    } finally {
      setIsLoadingTokenSlots(false);
    }
  }

  function updateTokenSlotField(tid, field, value) {
    setTokenSlots((prev) =>
      prev.map((s) => (s._tempId === tid ? { ...s, [field]: value, _dirty: true } : s))
    );
  }

  function addTokenSlotRow() {
    setTokenSlots((prev) => [...prev, makeNewTokenSlotRow()]);
  }

  async function saveTokenSlotRow(row) {
    if (!clinicId) return;
    setTokenSlotError("");
    if (!row.start_time || !row.end_time) {
      setTokenSlotError("Start and end time are required.");
      return;
    }
    if (row.end_time <= row.start_time) {
      setTokenSlotError("End time must be after start time.");
      return;
    }
    if (!row.max_appointments_per_slot || Number(row.max_appointments_per_slot) <= 0) {
      setTokenSlotError("Max appointments must be a positive number.");
      return;
    }
    setSavingTokenSlotIds((prev) => new Set(prev).add(row._tempId));
    try {
      const payload = {
        clinic_id: clinicId,
        doctor_id: doctorItem.id,
        day_of_week: Number(row.day_of_week),
        start_time: timeToApi(row.start_time),
        end_time: timeToApi(row.end_time),
        max_appointments_per_slot: Number(row.max_appointments_per_slot),
        status: row.status || "open",
        effective_from: row.effective_from || undefined,
        effective_to: row.effective_to || null,
      };
      if (row._isNew) {
        const res = await apiPost(`/slots`, payload);
        if (!res?.success) throw new Error(res?.error || "Failed to create token slot.");
        const created = res.data;
        setTokenSlots((prev) =>
          prev.map((s) =>
            s._tempId === row._tempId
              ? { ...s, id: created.id, _tempId: created.id, _isNew: false, _dirty: false }
              : s
          )
        );
      } else {
        const { clinic_id, doctor_id, ...patchPayload } = payload;
        const res = await apiPatch(`/slots/${row.id}`, patchPayload);
        if (!res?.success) throw new Error(res?.error || "Failed to update token slot.");
        setTokenSlots((prev) =>
          prev.map((s) => (s._tempId === row._tempId ? { ...s, _dirty: false } : s))
        );
      }
    } catch (err) {
      setTokenSlotError(err.message || "Failed to save token slot.");
    } finally {
      setSavingTokenSlotIds((prev) => {
        const n = new Set(prev);
        n.delete(row._tempId);
        return n;
      });
    }
  }

  async function deleteTokenSlotRow(row) {
    if (row._isNew) {
      setTokenSlots((prev) => prev.filter((s) => s._tempId !== row._tempId));
      return;
    }
    if (!window.confirm("Delete this token slot block?")) return;
    setDeletingTokenSlotId(row._tempId);
    try {
      const res = await apiDelete(`/slots/${row.id}`);
      if (!res?.success) throw new Error(res?.error || "Failed to delete token slot.");
      setTokenSlots((prev) => prev.filter((s) => s._tempId !== row._tempId));
    } catch (err) {
      setTokenSlotError(err.message || "Failed to delete token slot.");
    } finally {
      setDeletingTokenSlotId(null);
    }
  }

  const tabs = [
    { id: "info", label: "Doctor Info" },
    { id: "schedule", label: "Schedule & Time Off" },
    ...(isTokenSystem ? [{ id: "tokenSlots", label: "Token Slots" }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      {/* Wider dialog to fit two columns on Schedule/Token tabs */}
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Doctor</DialogTitle>
          <DialogDescription>
            Update doctor details, manage their weekly schedule, and set time off.
          </DialogDescription>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex-shrink-0 mt-4 flex gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 mt-4">

          {/* ── DOCTOR INFO TAB ── */}
          {activeTab === "info" && (
            <div className="grid gap-4 pb-2">
              {infoError && <ErrorMessage message={infoError} onDismiss={() => setInfoError("")} />}
              {infoSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Doctor updated successfully.
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Doctor Name *</label>
                <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Dr. John Doe" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Speciality</label>
                <Input value={form.speciality} onChange={(e) => updateField("speciality", e.target.value)} placeholder="Cardiology" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Consultation Duration (min) *</label>
                  <Input type="number" min={1} value={form.consultation_duration_minutes} onChange={(e) => updateField("consultation_duration_minutes", Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Max Appointments / Day *</label>
                  <Input type="number" min={1} value={form.max_appointments_per_day} onChange={(e) => updateField("max_appointments_per_day", Number(e.target.value))} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Consultation Fee (₹)</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-within:border-(--brand-primary)/40 focus-within:ring-2 focus-within:ring-(--brand-primary)/10">
                  <span className="font-semibold text-slate-400 text-xs">₹</span>
                  <input type="number" min={0} value={form.price_charged} onChange={(e) => updateField("price_charged", e.target.value)} placeholder="0.00" className="w-full bg-transparent text-xs text-slate-700 outline-none" />
                </div>
                <p className="text-[10px] text-slate-400">Leave empty to use clinic default pricing.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Active Status</label>
                <div className="flex h-10 items-center justify-between rounded-xl border border-slate-200 bg-white px-3">
                  <span className="text-xs text-slate-600">{form.is_active ? "Active" : "Inactive"}</span>
                  <Switch checked={form.is_active} onCheckedChange={(v) => updateField("is_active", v)} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" onClick={() => setOpen(false)} className="h-9 px-4 text-xs">Cancel</Button>
                <Button onClick={handleSaveInfo} disabled={isSavingInfo} className="h-9 bg-(--brand-primary) px-4 text-xs font-semibold text-white">
                  {isSavingInfo ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><UserRound className="h-4 w-4" /> Save Info</>}
                </Button>
              </div>
            </div>
          )}

          {/* ── SCHEDULE & TIME OFF TAB ── */}
          {activeTab === "schedule" && (
            <div className="grid grid-cols-2 gap-4 pb-2 min-h-0">

              {/* ── LEFT: Weekly Schedule ── */}
              <div className="space-y-3 min-w-0">
                {/* Section header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-slate-100 text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                    </span>
                    Weekly Schedule
                  </div>
                </div>

                {scheduleError && <ErrorMessage message={scheduleError} onDismiss={() => setScheduleError("")} />}

                {isLoadingSchedules ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner text="Loading..." size="sm" />
                  </div>
                ) : (
                  <>
                    {schedules.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">
                        <CalendarDays className="mx-auto mb-1.5 h-5 w-5 opacity-40" />
                        No schedule slots yet.
                      </div>
                    )}

                    <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-0.5">
                      {schedules.map((row) => {
                        const isSaving = savingScheduleIds.has(row._tempId);
                        const isDeleting = deletingScheduleId === row._tempId;
                        return (
                          <div
                            key={row._tempId}
                            className={`rounded-2xl border bg-white p-3 space-y-2.5 transition ${
                              row._dirty || row._isNew ? "border-(--brand-primary)/30 shadow-sm" : "border-slate-100"
                            }`}
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                {row._isNew ? "New Slot" : DAY_LABELS[row.day_of_week]}
                                {(row._dirty || row._isNew) && (
                                  <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-600">unsaved</span>
                                )}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {(row._dirty || row._isNew) && (
                                  <button
                                    onClick={() => saveScheduleRow(row)}
                                    disabled={isSaving}
                                    className="flex items-center gap-1 rounded-lg bg-(--brand-primary)/10 px-2 py-1 text-[11px] font-semibold text-(--brand-primary) hover:bg-(--brand-primary)/20 disabled:opacity-50"
                                  >
                                    {isSaving ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving</> : "Save"}
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteScheduleRow(row)}
                                  disabled={isDeleting}
                                  className="text-slate-300 hover:text-red-500 transition disabled:opacity-50"
                                >
                                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Fields */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-semibold text-slate-500">Day *</label>
                                <select
                                  value={row.day_of_week}
                                  onChange={(e) => updateScheduleField(row._tempId, "day_of_week", Number(e.target.value))}
                                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 outline-none"
                                >
                                  {dayOptions.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-slate-500">Start *</label>
                                <Input type="time" value={row.start_time} onChange={(e) => updateScheduleField(row._tempId, "start_time", e.target.value)} className="h-8 text-xs" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-slate-500">End *</label>
                                <Input type="time" value={row.end_time} onChange={(e) => updateScheduleField(row._tempId, "end_time", e.target.value)} className="h-8 text-xs" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-slate-500">Slot (min)</label>
                                <Input type="number" min={1} value={row.slot_duration_minutes} onChange={(e) => updateScheduleField(row._tempId, "slot_duration_minutes", Number(e.target.value))} className="h-8 text-xs" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-slate-500">From</label>
                                <Input type="date" value={row.effective_from} onChange={(e) => updateScheduleField(row._tempId, "effective_from", e.target.value)} className="h-8 text-xs" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-slate-500">To</label>
                                <Input type="date" value={row.effective_to} onChange={(e) => updateScheduleField(row._tempId, "effective_to", e.target.value)} className="h-8 text-xs" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={addScheduleRow}
                      className="w-full rounded-xl border border-dashed border-slate-200 py-2 text-xs font-semibold text-slate-400 transition hover:border-(--brand-primary)/40 hover:text-(--brand-primary)"
                    >
                      <Plus className="inline h-3.5 w-3.5 mr-1" />
                      Add Schedule Slot
                    </button>
                  </>
                )}
              </div>

              {/* ── RIGHT: Time Off ── */}
              <div className="space-y-3 min-w-0 border-l border-slate-100 pl-4">
                {/* Section header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-rose-50 text-rose-400">
                      <Clock className="h-3.5 w-3.5" />
                    </span>
                    Time Off / Leaves
                  </div>
                </div>

                {timeOffError && <ErrorMessage message={timeOffError} onDismiss={() => setTimeOffError("")} />}

                {isLoadingTimeOffs ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner text="Loading..." size="sm" />
                  </div>
                ) : (
                  <>
                    {timeOffs.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">
                        <Clock className="mx-auto mb-1.5 h-5 w-5 opacity-40" />
                        No time off recorded.
                      </div>
                    )}

                    <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-0.5">
                      {timeOffs.map((row) => {
                        const isSaving = savingTimeOffIds.has(row._tempId);
                        const isDeleting = deletingTimeOffId === row._tempId;
                        return (
                          <div
                            key={row._tempId}
                            className={`rounded-2xl border bg-white p-3 space-y-2.5 transition ${
                              row._dirty || row._isNew ? "border-rose-300/50 shadow-sm" : "border-slate-100"
                            }`}
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                {row._isNew ? "New Leave" : "Time Off"}
                                {(row._dirty || row._isNew) && (
                                  <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-600">unsaved</span>
                                )}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {(row._dirty || row._isNew) && (
                                  <button
                                    onClick={() => saveTimeOffRow(row)}
                                    disabled={isSaving}
                                    className="flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-500 hover:bg-rose-100 disabled:opacity-50"
                                  >
                                    {isSaving ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving</> : "Save"}
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteTimeOffRow(row)}
                                  disabled={isDeleting}
                                  className="text-slate-300 hover:text-red-500 transition disabled:opacity-50"
                                >
                                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Fields */}
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-slate-500">Start Date & Time *</label>
                                <Input
                                  type="datetime-local"
                                  value={row.start_time}
                                  onChange={(e) => updateTimeOffField(row._tempId, "start_time", e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-slate-500">End Date & Time *</label>
                                <Input
                                  type="datetime-local"
                                  value={row.end_time}
                                  onChange={(e) => updateTimeOffField(row._tempId, "end_time", e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-slate-500">Reason</label>
                                <Input
                                  value={row.reason}
                                  onChange={(e) => updateTimeOffField(row._tempId, "reason", e.target.value)}
                                  placeholder="e.g. Annual Leave"
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={addTimeOffRow}
                      className="w-full rounded-xl border border-dashed border-rose-200 py-2 text-xs font-semibold text-slate-400 transition hover:border-rose-400/60 hover:text-rose-500"
                    >
                      <Plus className="inline h-3.5 w-3.5 mr-1" />
                      Add Time Off
                    </button>

                    <p className="text-[10px] text-slate-400 text-center">
                      Time off blocks the doctor from receiving appointments during that window.
                    </p>
                  </>
                )}
              </div>

            </div>
          )}

          {/* ── TOKEN SLOTS TAB ── */}
          {activeTab === "tokenSlots" && (
            <div className="space-y-4 pb-2">
              {/* Header info banner */}
              <div className="flex items-start gap-2.5 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
                <Ticket className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-700">
                  <p className="font-semibold">Token-Based Availability Blocks</p>
                  <p className="mt-0.5 text-indigo-500">
                    Each block defines a recurring time window (e.g. Morning 09:00–13:00) on a given
                    day. Patients receive sequential tokens within the block — no fixed slot time.
                  </p>
                </div>
              </div>

              {tokenSlotError && (
                <ErrorMessage message={tokenSlotError} onDismiss={() => setTokenSlotError("")} />
              )}

              {isLoadingTokenSlots ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner text="Loading token slots..." size="sm" />
                </div>
              ) : (
                <>
                  {tokenSlots.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center">
                      <Ticket className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                      <p className="text-xs text-slate-400">No token slot blocks configured yet.</p>
                      <p className="mt-0.5 text-[10px] text-slate-300">Add a block below to get started.</p>
                    </div>
                  )}

                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-0.5">
                    {tokenSlots.map((row) => {
                      const isSaving = savingTokenSlotIds.has(row._tempId);
                      const isDeleting = deletingTokenSlotId === row._tempId;
                      return (
                        <div
                          key={row._tempId}
                          className={`rounded-2xl border bg-white p-3.5 space-y-3 transition ${
                            row._dirty || row._isNew
                              ? "border-indigo-300/50 shadow-sm"
                              : "border-slate-100"
                          }`}
                        >
                          {/* Card header */}
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              {row._isNew ? "New Block" : `${DAY_LABELS[row.day_of_week]} · ${row.start_time}–${row.end_time}`}
                              {(row._dirty || row._isNew) && (
                                <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-600">
                                  unsaved
                                </span>
                              )}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {(row._dirty || row._isNew) && (
                                <button
                                  onClick={() => saveTokenSlotRow(row)}
                                  disabled={isSaving}
                                  className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
                                >
                                  {isSaving ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving</> : "Save"}
                                </button>
                              )}
                              <button
                                onClick={() => deleteTokenSlotRow(row)}
                                disabled={isDeleting}
                                className="text-slate-300 hover:text-red-500 transition disabled:opacity-50"
                              >
                                {isDeleting
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400" />
                                  : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Fields grid */}
                          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
                            {/* Day of week */}
                            <div className="col-span-2 md:col-span-1 space-y-1">
                              <label className="text-[10px] font-semibold text-slate-500">Day *</label>
                              <div className="relative">
                                <select
                                  value={row.day_of_week}
                                  onChange={(e) =>
                                    updateTokenSlotField(row._tempId, "day_of_week", Number(e.target.value))
                                  }
                                  className="h-8 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-2 pr-6 text-xs text-slate-700 outline-none"
                                >
                                  {dayOptions.map((d) => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                  ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                              </div>
                            </div>

                            {/* Start time */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-500">Start Time *</label>
                              <input
                                type="time"
                                value={row.start_time}
                                onChange={(e) =>
                                  updateTokenSlotField(row._tempId, "start_time", e.target.value)
                                }
                                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                              />
                            </div>

                            {/* End time */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-500">End Time *</label>
                              <input
                                type="time"
                                value={row.end_time}
                                onChange={(e) =>
                                  updateTokenSlotField(row._tempId, "end_time", e.target.value)
                                }
                                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                              />
                            </div>

                            {/* Max appointments */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-500">Max Tokens *</label>
                              <input
                                type="number"
                                min={1}
                                value={row.max_appointments_per_slot}
                                onChange={(e) =>
                                  updateTokenSlotField(
                                    row._tempId,
                                    "max_appointments_per_slot",
                                    Number(e.target.value)
                                  )
                                }
                                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                              />
                            </div>

                            {/* Status */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-500">Status</label>
                              <div className="relative">
                                <select
                                  value={row.status}
                                  onChange={(e) =>
                                    updateTokenSlotField(row._tempId, "status", e.target.value)
                                  }
                                  className="h-8 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-2 pr-6 text-xs text-slate-700 outline-none"
                                >
                                  <option value="open">Open</option>
                                  <option value="full">Full</option>
                                  <option value="closed">Closed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                              </div>
                            </div>

                            {/* Effective from */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-500">From</label>
                              <input
                                type="date"
                                value={row.effective_from}
                                onChange={(e) =>
                                  updateTokenSlotField(row._tempId, "effective_from", e.target.value)
                                }
                                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                              />
                            </div>

                            {/* Effective to */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-500">Until</label>
                              <input
                                type="date"
                                value={row.effective_to}
                                onChange={(e) =>
                                  updateTokenSlotField(row._tempId, "effective_to", e.target.value)
                                }
                                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={addTokenSlotRow}
                    className="w-full rounded-xl border border-dashed border-indigo-200 py-2 text-xs font-semibold text-slate-400 transition hover:border-indigo-400/60 hover:text-indigo-500"
                  >
                    <Plus className="inline h-3.5 w-3.5 mr-1" />
                    Add Token Slot Block
                  </button>

                  <p className="text-center text-[10px] text-slate-400">
                    Each block repeats weekly on the selected day. Patients receive sequential token
                    numbers — no fixed appointment time within the block.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
