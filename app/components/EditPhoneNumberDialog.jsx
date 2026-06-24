"use client";

import { useState, useEffect } from "react";
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
import { apiPatch } from "@/app/lib/api";

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

export default function EditPhoneNumberDialog({ phoneNumberItem, onUpdate, children }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [form, setForm] = useState({
    phoneNumber: phoneNumberItem.number || "",
    type: phoneNumberItem.type || phoneTypeOptions[0],
    status: phoneNumberItem.status || "Live",
    isActive: phoneNumberItem.status === "Live" || phoneNumberItem.status === "Provisioning",
  });

  // Sync state if phoneNumberItem props change or when dialog opens
  useEffect(() => {
    if (open && phoneNumberItem) {
      setForm({
        phoneNumber: phoneNumberItem.number || "",
        type: phoneNumberItem.type || phoneTypeOptions[0],
        status: phoneNumberItem.status || "Live",
        isActive: phoneNumberItem.isActive ?? (phoneNumberItem.status === "Live" || phoneNumberItem.status === "Provisioning"),
      });
      setSubmitError("");
      setSubmitSuccess(false);
    }
  }, [open, phoneNumberItem]);

  function updateField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "status") {
        next.isActive = value === "Live" || value === "Provisioning";
      } else if (field === "isActive") {
        next.status = value ? "Live" : "Inactive";
      }
      return next;
    });
  }

  async function handleSubmit() {
    setSubmitError("");

    if (!form.phoneNumber.trim()) {
      setSubmitError("Phone number is required.");
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
        number: form.phoneNumber.trim(),
        service_type: form.type,
        status: form.status,
        is_active: form.isActive,
      };

      const response = await apiPatch(`/phone-numbers/${phoneNumberItem.id}`, payload);
      if (!response?.success) {
        throw new Error(response?.error || "Failed to update phone number.");
      }

      const updated = response.data || {};
      const updatedPhoneNumber = {
        id: updated.id,
        number: updated.number || form.phoneNumber.trim(),
        type: updated.service_type || form.type,
        status: updated.status || form.status,
        isActive: updated.is_active !== undefined ? Boolean(updated.is_active) : form.isActive,
      };

      if (typeof onUpdate === "function") {
        await onUpdate(updatedPhoneNumber);
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setOpen(false);
      }, 1200);
    } catch (error) {
      setSubmitError(error.message || "Failed to update phone number.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Phone Number</DialogTitle>
          <DialogDescription>
            Update phone number details, service type, and active status.
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
              Phone number updated successfully.
            </div>
          </div>
        ) : null}

        {isSubmitting ? (
          <LoadingSpinner text="Updating phone number..." size="sm" />
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
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
