"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, UserRound, Plus, Trash2, Loader2, CalendarDays } from "lucide-react";
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

function timeToApi(value) {
  if (!value) return "";
  const [hour = "00", minute = "00"] = String(value).split(":");
  return `${hour}:${minute}:00`;
}

function timeFromApi(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function makeNewScheduleRow(slotDuration) {
  return {
    _tempId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    id: null, // null = not yet saved
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

export default function EditDoctorDialog({ doctorItem, clinicId, onUpdate, children }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  // ── Info tab state ──────────────────────────────────────────────────────────
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

  // ── Schedule tab state ──────────────────────────────────────────────────────
  const [schedules, setSchedules] = useState([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [deletingScheduleId, setDeletingScheduleId] = useState(null);
  const [savingScheduleIds, setSavingScheduleIds] = useState(new Set());

  // ── Sync when dialog opens ──────────────────────────────────────────────────
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
      setInfoError("");
      setInfoSuccess(false);
      setScheduleError("");
      setSchedules([]);
    }
  }, [open, doctorItem]);

  // ── Load schedules when Schedule tab activates ──────────────────────────────
  useEffect(() => {
    if (open && activeTab === "schedule" && doctorItem?.id) {
      loadSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab]);

  async function loadSchedules() {
    const cid = clinicId || doctorItem?.clinicId;
    if (!doctorItem?.id) return;

    try {
      setIsLoadingSchedules(true);
      setScheduleError("");
      const params = cid ? `?clinic_id=${cid}` : "";
      const res = await apiGet(`/doctors/${doctorItem.id}/schedule${params}`);
      if (!res?.success) throw new Error(res?.error || "Failed to load schedules");

      const rows = Array.isArray(res.data) ? res.data : [];
      setSchedules(
        rows.map((r) => ({
          _tempId: r.id,
          id: r.id,
          day_of_week: r.day_of_week,
          start_time: timeFromApi(r.start_time),
          end_time: timeFromApi(r.end_time),
          slot_duration_minutes: r.slot_duration_minutes,
          effective_from: r.effective_from ? r.effective_from.slice(0, 10) : "",
          effective_to: r.effective_to ? r.effective_to.slice(0, 10) : "",
          _dirty: false,
          _isNew: false,
        }))
      );
    } catch (err) {
      setScheduleError(err.message || "Failed to load schedules.");
    } finally {
      setIsLoadingSchedules(false);
    }
  }

  // ── Info tab handlers ───────────────────────────────────────────────────────
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

  // ── Schedule tab handlers ───────────────────────────────────────────────────
  function updateScheduleField(tempId, field, value) {
    setSchedules((prev) =>
      prev.map((s) => s._tempId === tempId ? { ...s, [field]: value, _dirty: true } : s)
    );
  }

  function addScheduleRow() {
    setSchedules((prev) => [
      ...prev,
      makeNewScheduleRow(form.consultation_duration_minutes),
    ]);
  }

  async function saveScheduleRow(row) {
    const cid = clinicId || doctorItem?.clinicId;
    setScheduleError("");
    if (!row.start_time || !row.end_time) {
      setScheduleError("Each schedule must have a start and end time.");
      return;
    }
    if (row.end_time <= row.start_time) {
      setScheduleError("End time must be after start time.");
      return;
    }

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
        const res = await apiPost(`/doctors/${doctorItem.id}/schedule`, {
          clinic_id: cid,
          ...payload,
        });
        if (!res?.success) throw new Error(res?.error || "Failed to create schedule.");
        const created = res.data;
        setSchedules((prev) =>
          prev.map((s) =>
            s._tempId === row._tempId
              ? { ...s, id: created.id, _tempId: created.id, _isNew: false, _dirty: false }
              : s
          )
        );
      } else {
        const res = await apiPatch(`/doctors/${doctorItem.id}/schedule/${row.id}`, payload);
        if (!res?.success) throw new Error(res?.error || "Failed to update schedule.");
        setSchedules((prev) =>
          prev.map((s) => s._tempId === row._tempId ? { ...s, _dirty: false } : s)
        );
      }
    } catch (err) {
      setScheduleError(err.message || "Failed to save schedule.");
    } finally {
      setSavingScheduleIds((prev) => {
        const next = new Set(prev);
        next.delete(row._tempId);
        return next;
      });
    }
  }

  async function deleteScheduleRow(row) {
    if (row._isNew) {
      setSchedules((prev) => prev.filter((s) => s._tempId !== row._tempId));
      return;
    }
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

  const tabs = [
    { id: "info", label: "Doctor Info" },
    { id: "schedule", label: "Schedule" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Doctor</DialogTitle>
          <DialogDescription>
            Update doctor details and manage their weekly schedule.
          </DialogDescription>
        </DialogHeader>

        {/* ── Tab Bar ── */}
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

        {/* ── Tab Content ── */}
        <div className="flex-1 overflow-y-auto min-h-0 mt-4">

          {/* ── DOCTOR INFO TAB ── */}
          {activeTab === "info" && (
            <div className="grid gap-4 pb-2">
              {infoError && (
                <ErrorMessage message={infoError} onDismiss={() => setInfoError("")} />
              )}
              {infoSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Doctor updated successfully.
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Doctor Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Dr. John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Speciality</label>
                <Input
                  value={form.speciality}
                  onChange={(e) => updateField("speciality", e.target.value)}
                  placeholder="Cardiology"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Consultation Duration (min) *</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.consultation_duration_minutes}
                    onChange={(e) => updateField("consultation_duration_minutes", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Max Appointments / Day *</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.max_appointments_per_day}
                    onChange={(e) => updateField("max_appointments_per_day", Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Consultation Fee (₹)</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-within:border-(--brand-primary)/40 focus-within:ring-2 focus-within:ring-(--brand-primary)/10">
                  <span className="font-semibold text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={form.price_charged}
                    onChange={(e) => updateField("price_charged", e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent text-xs text-slate-700 outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Leave empty to use clinic default pricing.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Active Status</label>
                <div className="flex h-10 items-center justify-between rounded-xl border border-slate-200 bg-white px-3">
                  <span className="text-xs text-slate-600">{form.is_active ? "Active" : "Inactive"}</span>
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => updateField("is_active", v)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" onClick={() => setOpen(false)} className="h-9 px-4 text-xs">
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveInfo}
                  disabled={isSavingInfo}
                  className="h-9 bg-(--brand-primary) px-4 text-xs font-semibold text-white"
                >
                  {isSavingInfo
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                    : <><UserRound className="h-4 w-4" /> Save Info</>}
                </Button>
              </div>
            </div>
          )}

          {/* ── SCHEDULE TAB ── */}
          {activeTab === "schedule" && (
            <div className="space-y-3 pb-2">
              {scheduleError && (
                <ErrorMessage message={scheduleError} onDismiss={() => setScheduleError("")} />
              )}

              {isLoadingSchedules ? (
                <div className="flex items-center justify-center py-10">
                  <LoadingSpinner text="Loading schedule..." size="sm" />
                </div>
              ) : (
                <>
                  {schedules.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                      <CalendarDays className="mx-auto mb-2 h-6 w-6 opacity-40" />
                      No schedule slots yet. Add one below.
                    </div>
                  )}

                  {schedules.map((row) => {
                    const isSaving = savingScheduleIds.has(row._tempId);
                    const isDeleting = deletingScheduleId === row._tempId;
                    return (
                      <div
                        key={row._tempId}
                        className={`rounded-2xl border bg-white p-3 space-y-3 transition ${
                          row._dirty || row._isNew
                            ? "border-(--brand-primary)/30 shadow-sm"
                            : "border-slate-100"
                        }`}
                      >
                        {/* Row header */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            {row._isNew ? "New Slot" : DAY_LABELS[row.day_of_week]}
                            {(row._dirty || row._isNew) && (
                              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-600">
                                unsaved
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            {(row._dirty || row._isNew) && (
                              <button
                                onClick={() => saveScheduleRow(row)}
                                disabled={isSaving}
                                className="flex items-center gap-1 rounded-lg bg-(--brand-primary)/10 px-2 py-1 text-[11px] font-semibold text-(--brand-primary) transition hover:bg-(--brand-primary)/20 disabled:opacity-50"
                              >
                                {isSaving
                                  ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving</>
                                  : "Save"}
                              </button>
                            )}
                            <button
                              onClick={() => deleteScheduleRow(row)}
                              disabled={isDeleting}
                              className="text-slate-300 hover:text-red-500 transition disabled:opacity-50"
                              title="Delete slot"
                            >
                              {isDeleting
                                ? <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                                : <Trash2 className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Fields grid */}
                        <div className="grid gap-3 sm:grid-cols-3">
                          {/* Day */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-500">Day *</label>
                            <select
                              value={row.day_of_week}
                              onChange={(e) => updateScheduleField(row._tempId, "day_of_week", Number(e.target.value))}
                              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none focus:border-(--brand-primary)/40 focus:ring-2 focus:ring-(--brand-primary)/10"
                            >
                              {dayOptions.map((d) => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Start */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-500">Start Time *</label>
                            <Input
                              type="time"
                              value={row.start_time}
                              onChange={(e) => updateScheduleField(row._tempId, "start_time", e.target.value)}
                              className="h-9 text-xs"
                            />
                          </div>

                          {/* End */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-500">End Time *</label>
                            <Input
                              type="time"
                              value={row.end_time}
                              onChange={(e) => updateScheduleField(row._tempId, "end_time", e.target.value)}
                              className="h-9 text-xs"
                            />
                          </div>

                          {/* Slot Duration */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-500">Slot Duration (min)</label>
                            <Input
                              type="number"
                              min={1}
                              value={row.slot_duration_minutes}
                              onChange={(e) => updateScheduleField(row._tempId, "slot_duration_minutes", Number(e.target.value))}
                              className="h-9 text-xs"
                            />
                          </div>

                          {/* Effective From */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-500">Effective From</label>
                            <Input
                              type="date"
                              value={row.effective_from}
                              onChange={(e) => updateScheduleField(row._tempId, "effective_from", e.target.value)}
                              className="h-9 text-xs"
                            />
                          </div>

                          {/* Effective To */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-500">Effective To</label>
                            <Input
                              type="date"
                              value={row.effective_to}
                              onChange={(e) => updateScheduleField(row._tempId, "effective_to", e.target.value)}
                              className="h-9 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add slot button */}
                  <button
                    onClick={addScheduleRow}
                    className="w-full rounded-xl border border-dashed border-slate-200 bg-transparent py-2.5 text-xs font-semibold text-slate-400 transition hover:border-(--brand-primary)/40 hover:text-(--brand-primary)"
                  >
                    <Plus className="inline h-4 w-4 mr-1" />
                    Add Schedule Slot
                  </button>

                  <p className="text-[10px] text-slate-400 text-center">
                    Changes to each slot are saved individually using the <strong>Save</strong> button on that row.
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
