"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Plus, Trash2, UserRound } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
import { apiPost } from "@/app/lib/api";

const steps = ["Doctor Info", "Schedule", "Time Off"];

const dayOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function timeToApi(value) {
  if (!value) return "";
  const [hour = "00", minute = "00"] = String(value).split(":");
  return `${hour}:${minute}:00`;
}

function toIstIso(localDateTime) {
  if (!localDateTime) return "";
  const normalized = localDateTime.length === 16 ? `${localDateTime}:00` : localDateTime;
  return `${normalized}+05:30`;
}

function makeDefaultSchedule() {
  return {
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
    slot_duration_minutes: 30,
    effective_from: "",
    effective_to: "",
  };
}

function makeDefaultTimeOff() {
  return {
    start_time: "",
    end_time: "",
    reason: "",
  };
}

export default function NewDoctorDialog({ clinicId, onCreate, triggerClassName }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [doctorForm, setDoctorForm] = useState({
    name: "",
    speciality: "",
    consultation_duration_minutes: 30,
    buffer_time_minutes: 0,
    max_appointments_per_day: 10,
  });
  const [schedules, setSchedules] = useState([makeDefaultSchedule()]);
  const [timeOffs, setTimeOffs] = useState([]);

  const isFirst = step === 0;
  const isLast = step === steps.length - 1;
  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  function resetForm() {
    setStep(0);
    setSubmitError("");
    setSubmitSuccess(false);
    setDoctorForm({
      name: "",
      speciality: "",
      consultation_duration_minutes: 30,
      buffer_time_minutes: 0,
      max_appointments_per_day: 10,
    });
    setSchedules([makeDefaultSchedule()]);
    setTimeOffs([]);
  }

  function updateDoctor(field, value) {
    setDoctorForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateSchedule(index, field, value) {
    setSchedules((prev) =>
      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    );
  }

  function updateTimeOff(index, field, value) {
    setTimeOffs((prev) =>
      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    );
  }

  function validateForm() {
    if (!clinicId) return "Please select a clinic first.";
    if (!doctorForm.name.trim()) return "Doctor name is required.";
    if (Number(doctorForm.consultation_duration_minutes) <= 0) {
      return "Consultation duration must be greater than 0.";
    }
    if (Number(doctorForm.buffer_time_minutes) < 0) {
      return "Buffer time cannot be negative.";
    }
    if (Number(doctorForm.max_appointments_per_day) <= 0) {
      return "Max appointments per day must be greater than 0.";
    }

    for (const schedule of schedules) {
      if (!schedule.start_time || !schedule.end_time) {
        return "Each schedule row must include start and end time.";
      }
      if (schedule.end_time <= schedule.start_time) {
        return "Schedule end time must be greater than start time.";
      }
      if (Number(schedule.slot_duration_minutes) <= 0) {
        return "Schedule slot duration must be greater than 0.";
      }
    }

    for (const timeOff of timeOffs) {
      if (!timeOff.start_time || !timeOff.end_time) {
        return "Each time-off row must include start and end time.";
      }
      if (timeOff.end_time <= timeOff.start_time) {
        return "Time-off end must be greater than start.";
      }
    }

    return "";
  }

  async function handleSubmit() {
    setSubmitError("");

    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      const createDoctorResponse = await apiPost("/doctors", {
        clinic_id: clinicId,
        name: doctorForm.name.trim(),
        speciality: doctorForm.speciality.trim() || undefined,
        consultation_duration_minutes: Number(doctorForm.consultation_duration_minutes),
        buffer_time_minutes: Number(doctorForm.buffer_time_minutes),
        max_appointments_per_day: Number(doctorForm.max_appointments_per_day),
      });

      if (!createDoctorResponse?.success) {
        throw new Error(createDoctorResponse?.error || "Failed to create doctor.");
      }

      const doctor = createDoctorResponse.data;

      for (const schedule of schedules) {
        await apiPost(`/doctors/${doctor.id}/schedule`, {
          clinic_id: clinicId,
          day_of_week: Number(schedule.day_of_week),
          start_time: timeToApi(schedule.start_time),
          end_time: timeToApi(schedule.end_time),
          slot_duration_minutes: Number(schedule.slot_duration_minutes),
          effective_from: schedule.effective_from || undefined,
          effective_to: schedule.effective_to || null,
        });
      }

      for (const timeOff of timeOffs) {
        await apiPost(`/doctors/${doctor.id}/time-off`, {
          clinic_id: clinicId,
          start_time: toIstIso(timeOff.start_time),
          end_time: toIstIso(timeOff.end_time),
          reason: timeOff.reason?.trim() || undefined,
        });
      }

      if (typeof onCreate === "function") {
        await onCreate({
          id: doctor.id,
          name: doctor.name,
          speciality: doctor.speciality || "General",
          consultationDuration: doctor.consultation_duration_minutes || 30,
          maxAppointmentsPerDay: doctor.max_appointments_per_day || 0,
          isActive: Boolean(doctor.is_active),
        });
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 1400);
    } catch (error) {
      setSubmitError(error.message || "Failed to add doctor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className={triggerClassName || ""} disabled={!clinicId}>
          + Add Doctor
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add New Doctor</DialogTitle>
          <DialogDescription>
            Add doctor info, weekly schedule, and optional time off in 3 steps.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Step {step + 1} of {steps.length}
            </span>
            <span>{steps[step]}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-(--brand-primary) transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {submitError ? (
          <ErrorMessage message={submitError} onDismiss={() => setSubmitError("")} className="mt-4" />
        ) : null}

        {submitSuccess ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              Doctor created successfully.
            </div>
          </div>
        ) : null}

        {isSubmitting ? (
          <LoadingSpinner text="Saving doctor, schedule, and time off..." size="sm" />
        ) : (
          <div className="mt-6 space-y-4">
            {step === 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Doctor Name *</label>
                  <Input
                    value={doctorForm.name}
                    onChange={(event) => updateDoctor("name", event.target.value)}
                    placeholder="Dr. John Doe"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Speciality</label>
                  <Input
                    value={doctorForm.speciality}
                    onChange={(event) => updateDoctor("speciality", event.target.value)}
                    placeholder="Cardiology"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Consultation Duration (min) *</label>
                  <Input
                    type="number"
                    min={1}
                    value={doctorForm.consultation_duration_minutes}
                    onChange={(event) =>
                      updateDoctor("consultation_duration_minutes", Number(event.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Buffer Time (min)</label>
                  <Input
                    type="number"
                    min={0}
                    value={doctorForm.buffer_time_minutes}
                    onChange={(event) => updateDoctor("buffer_time_minutes", Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Max Appointments Per Day *</label>
                  <Input
                    type="number"
                    min={1}
                    value={doctorForm.max_appointments_per_day}
                    onChange={(event) =>
                      updateDoctor("max_appointments_per_day", Number(event.target.value))
                    }
                  />
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-3">
                {schedules.map((schedule, index) => (
                  <div key={`schedule-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-600">Schedule #{index + 1}</p>
                      {schedules.length > 1 ? (
                        <button
                          onClick={() =>
                            setSchedules((prev) => prev.filter((_, rowIndex) => rowIndex !== index))
                          }
                          className="text-slate-400 transition hover:text-rose-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500">Day *</label>
                        <select
                          value={schedule.day_of_week}
                          onChange={(event) =>
                            updateSchedule(index, "day_of_week", Number(event.target.value))
                          }
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                        >
                          {dayOptions.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500">Start Time *</label>
                        <Input
                          type="time"
                          value={schedule.start_time}
                          onChange={(event) => updateSchedule(index, "start_time", event.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500">End Time *</label>
                        <Input
                          type="time"
                          value={schedule.end_time}
                          onChange={(event) => updateSchedule(index, "end_time", event.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500">Slot Duration (min) *</label>
                        <Input
                          type="number"
                          min={1}
                          value={schedule.slot_duration_minutes}
                          onChange={(event) =>
                            updateSchedule(index, "slot_duration_minutes", Number(event.target.value))
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500">Effective From</label>
                        <Input
                          type="date"
                          value={schedule.effective_from}
                          onChange={(event) => updateSchedule(index, "effective_from", event.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500">Effective To</label>
                        <Input
                          type="date"
                          value={schedule.effective_to}
                          onChange={(event) => updateSchedule(index, "effective_to", event.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() => setSchedules((prev) => [...prev, makeDefaultSchedule()])}
                  className="h-9 text-xs"
                >
                  <Plus className="h-4 w-4" /> Add Another Schedule
                </Button>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-3">
                {timeOffs.map((timeOff, index) => (
                  <div key={`timeoff-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-600">Time Off #{index + 1}</p>
                      <button
                        onClick={() =>
                          setTimeOffs((prev) => prev.filter((_, rowIndex) => rowIndex !== index))
                        }
                        className="text-slate-400 transition hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500">Start *</label>
                        <Input
                          type="datetime-local"
                          value={timeOff.start_time}
                          onChange={(event) => updateTimeOff(index, "start_time", event.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500">End *</label>
                        <Input
                          type="datetime-local"
                          value={timeOff.end_time}
                          onChange={(event) => updateTimeOff(index, "end_time", event.target.value)}
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-500">Reason</label>
                        <Input
                          value={timeOff.reason}
                          onChange={(event) => updateTimeOff(index, "reason", event.target.value)}
                          placeholder="Annual Leave"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() => setTimeOffs((prev) => [...prev, makeDefaultTimeOff()])}
                  className="h-9 text-xs"
                >
                  <Plus className="h-4 w-4" /> Add Time Off
                </Button>

                <p className="text-xs text-slate-400">
                  Time off is optional. Add only if this doctor has known leaves.
                </p>
              </div>
            ) : null}

            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setStep((prev) => Math.max(prev - 1, 0))} disabled={isFirst}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>

              <div className="flex items-center gap-2">
                {!isLast ? (
                  <Button onClick={() => setStep((prev) => Math.min(prev + 1, steps.length - 1))}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} className="bg-(--brand-primary) text-white">
                    <UserRound className="h-4 w-4" /> Save Doctor
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
