"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Upload } from "lucide-react";
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

const steps = [
  "Basic Details",
  "Owner Details",
  "Receptionist",
  "Plan & Payment",
  "Documents",
  "Contracts",
  "Review",
];

export default function NewClinicDialog({ triggerClassName }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    clinicName: "",
    clinicType: "",
    address: "",
    city: "",
    state: "",
    postal: "",
    phone: "",
    email: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    ownerId: "",
    receptionistName: "",
    receptionistEmail: "",
    receptionistPhone: "",
    receptionistShift: "",
    plan: "",
    billingCycle: "Monthly",
    paymentMethod: "",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
    gstNumber: "",
    contractStart: "",
    contractEnd: "",
    documents: [],
    agreement: false,
  });

  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  const updateField = (field) => (event) => {
    const value = event?.target?.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (isLast) {
      setOpen(false);
      setStep(0);
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      setStep((prev) => prev - 1);
    }
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    setForm((prev) => ({ ...prev, documents: files }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={`h-9 rounded-xl bg-(--brand-primary) px-4 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(15,102,118,0.25)] transition hover:-translate-y-0.5 ${
            triggerClassName || ""
          }`}
        >
          Register Clinic
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-180">
        <DialogHeader>
          <DialogTitle>Register New Clinic</DialogTitle>
          <DialogDescription>
            Complete the steps below to onboard a clinic into Auvia Admin.
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

        <div className="mt-6 grid gap-4">
          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Clinic Name</label>
                <Input value={form.clinicName} onChange={updateField("clinicName")} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Clinic Type</label>
                <Input value={form.clinicType} onChange={updateField("clinicType")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-500">Address</label>
                <Input value={form.address} onChange={updateField("address")} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">City</label>
                <Input value={form.city} onChange={updateField("city")} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">State</label>
                <Input value={form.state} onChange={updateField("state")} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Postal Code</label>
                <Input value={form.postal} onChange={updateField("postal")} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Phone</label>
                <Input value={form.phone} onChange={updateField("phone")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-500">Email</label>
                <Input value={form.email} onChange={updateField("email")} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-500">Owner Name</label>
                <Input value={form.ownerName} onChange={updateField("ownerName")} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Owner Email</label>
                <Input value={form.ownerEmail} onChange={updateField("ownerEmail")} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Owner Phone</label>
                <Input value={form.ownerPhone} onChange={updateField("ownerPhone")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-500">Govt ID / License</label>
                <Input value={form.ownerId} onChange={updateField("ownerId")} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-500">Receptionist Name</label>
                <Input value={form.receptionistName} onChange={updateField("receptionistName")} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Receptionist Email</label>
                <Input value={form.receptionistEmail} onChange={updateField("receptionistEmail")} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Receptionist Phone</label>
                <Input value={form.receptionistPhone} onChange={updateField("receptionistPhone")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-500">Shift / Coverage</label>
                <Input value={form.receptionistShift} onChange={updateField("receptionistShift")} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Plan</label>
                <Input value={form.plan} onChange={updateField("plan")} placeholder="Starter / Growth / Enterprise" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Billing Cycle</label>
                <Input value={form.billingCycle} onChange={updateField("billingCycle")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-500">Payment Method</label>
                <Input value={form.paymentMethod} onChange={updateField("paymentMethod")} placeholder="Card / UPI / Bank Transfer" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Card Number</label>
                <Input value={form.cardNumber} onChange={updateField("cardNumber")} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Name on Card</label>
                <Input value={form.cardName} onChange={updateField("cardName")} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Expiry</label>
                <Input value={form.cardExpiry} onChange={updateField("cardExpiry")} placeholder="MM/YY" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">CVV</label>
                <Input value={form.cardCvv} onChange={updateField("cardCvv")} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Upload Documents</label>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 transition hover:border-(--brand-primary)/50 hover:bg-(--brand-primary)/5">
                  <Upload className="h-5 w-5 text-(--brand-primary)" />
                  <span>Clinic license, tax IDs, approvals</span>
                  <input type="file" multiple className="hidden" onChange={handleFileChange} />
                </label>
              </div>
              {form.documents.length ? (
                <div className="space-y-1 text-xs text-slate-500">
                  {form.documents.map((file) => (
                    <div key={file.name} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {file.name}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {step === 5 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Contract Start</label>
                <Input type="date" value={form.contractStart} onChange={updateField("contractStart")} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Contract End</label>
                <Input type="date" value={form.contractEnd} onChange={updateField("contractEnd")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <input type="checkbox" checked={form.agreement} onChange={updateField("agreement")} />
                  I confirm that the clinic contract terms are accepted.
                </label>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-700">Review Summary</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>Clinic: {form.clinicName || "—"}</li>
                <li>Owner: {form.ownerName || "—"}</li>
                <li>Receptionist: {form.receptionistName || "—"}</li>
                <li>Plan: {form.plan || "—"}</li>
                <li>Billing: {form.billingCycle || "—"}</li>
                <li>Documents: {form.documents.length} files</li>
              </ul>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            className="h-9 rounded-xl"
            onClick={handleBack}
            disabled={isFirst}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button className="h-9 rounded-xl" onClick={handleNext}>
            {isLast ? "Finish" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
