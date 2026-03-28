"use client";

import { useState } from "react";
import { CheckCircle2, Phone } from "lucide-react";
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
import { apiPost } from "@/app/lib/api";

const phoneTypeOptions = [
  "Reception Line",
  "AI Appointment Agent",
  "Emergency Contact",
];

function formatIndianPhoneNumber(phone) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return phone;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function isValidPhoneNumberForApi(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return false;
  const regex = /^\+?[0-9 \-]{7,20}$/;
  return regex.test(cleaned);
}

export default function NewPhoneNumberDialog({ clinicId, onCreate, triggerClassName }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [form, setForm] = useState({
    phoneNumber: "",
    type: phoneTypeOptions[0],
    status: "Live",
    isActive: true,
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm({
      phoneNumber: "",
      type: phoneTypeOptions[0],
      status: "Live",
      isActive: true,
    });
    setSubmitError("");
    setSubmitSuccess(false);
  }

  async function handleSubmit() {
    setSubmitError("");

    if (!form.phoneNumber.trim()) {
      setSubmitError("Phone number is required.");
      return;
    }

    if (!clinicId) {
      setSubmitError("Please select a clinic before provisioning a number.");
      return;
    }

    if (!isValidPhoneNumberForApi(form.phoneNumber)) {
      setSubmitError(
        "Invalid phone number format. Use digits, spaces, hyphens, and optional + sign (7-20 chars)."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        clinic_id: clinicId,
        number: form.phoneNumber.trim(),
        service_type: form.type,
        status: form.status,
        is_active: form.isActive,
      };

      const response = await apiPost("/phone-numbers", payload);
      if (!response?.success) {
        throw new Error(response?.error || "Failed to provision phone number.");
      }

      const created = response.data || {};
      const newPhoneNumber = {
        id: created.id,
        number: created.number || formatIndianPhoneNumber(form.phoneNumber),
        type: created.service_type || form.type,
        status: created.status || form.status,
      };

      if (typeof onCreate === "function") {
        await onCreate(newPhoneNumber);
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 1200);
    } catch (error) {
      setSubmitError(error.message || "Failed to provision phone number.");
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
          + Provision New Number
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Provision New Number</DialogTitle>
          <DialogDescription>
            Add a new clinic phone line and assign its service type.
          </DialogDescription>
        </DialogHeader>

        {submitError ? (
          <ErrorMessage
            message={submitError}
            onDismiss={() => setSubmitError("")}
            className="mt-4"
          />
        ) : null}

        {submitSuccess ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              Phone number provisioned successfully.
            </div>
          </div>
        ) : null}

        {isSubmitting ? (
          <LoadingSpinner text="Provisioning phone number..." size="sm" />
        ) : (
          <div className="mt-6 grid gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">Phone Number *</label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus-within:border-(--brand-primary)/40 focus-within:ring-2 focus-within:ring-(--brand-primary)/10">
                <Phone className="h-4 w-4 text-slate-400" />
                <Input
                  value={form.phoneNumber}
                  onChange={(event) => updateField("phoneNumber", event.target.value)}
                  placeholder="Enter 10-digit number"
                  className="h-auto border-0 p-0 text-sm shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">Service Type *</label>
              <select
                value={form.type}
                onChange={(event) => updateField("type", event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-(--brand-primary)/40 focus:ring-2 focus:ring-(--brand-primary)/10"
              >
                {phoneTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Status</label>
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-(--brand-primary)/40 focus:ring-2 focus:ring-(--brand-primary)/10"
                >
                  <option value="Live">Live</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Provisioning">Provisioning</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Active Number</label>
                <div className="flex h-10 items-center justify-between rounded-xl border border-slate-200 bg-white px-3">
                  <span className="text-xs text-slate-600">{form.isActive ? "Enabled" : "Disabled"}</span>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(value) => updateField("isActive", value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="h-9 px-4 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="h-9 bg-(--brand-primary) px-4 text-xs font-semibold text-white"
              >
                Create Number
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
