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
import { apiPost } from "@/app/lib/api";
import ErrorMessage from "./ErrorMessage";
import SuccessMessage from "./SuccessMessage";
import LoadingSpinner from "./LoadingSpinner";
import { validateRegistrationForm } from "@/app/utils/validation";

const steps = [
  "Basic Details",
  "Credentials",
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [form, setForm] = useState({
    clinicName: "",
    clinicType: "",
    address: "",
    city: "",
    state: "",
    postal: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    latitude: "",
    longitude: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    ownerId: "",
    receptionistName: "",
    receptionistEmail: "",
    receptionistPhone: "",
    receptionistShift: "",
    plan: "",
    billingCycle: "monthly",
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
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    if (isLast) {
      // Don't proceed to finish, submit instead
      return;
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

  const handleSubmit = async () => {
    setSubmitError("");
    setValidationErrors({});

    // Validate form
    const errors = validateRegistrationForm(form);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setSubmitError("Please fix validation errors before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payload for API
      // NOTE: File uploads are skipped for now (placeholder prepared)
      const documentPayload = form.documents.length
        ? form.documents.map((file) => ({
            name: file.name,
            url: "", // Would be cloud storage URL
            type: file.type,
            docType: "clinic_license", // Could be inferred from filename
          }))
        : [];

      const payload = {
        clinicName: form.clinicName,
        clinicType: form.clinicType || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        postal: form.postal || undefined,
        phone: form.phone,
        email: form.email,
        username: form.username,
        password: form.password,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        ownerPhone: form.ownerPhone || undefined,
        ownerId: form.ownerId || undefined,
        receptionistName: form.receptionistName || undefined,
        receptionistEmail: form.receptionistEmail || undefined,
        receptionistPhone: form.receptionistPhone || undefined,
        receptionistShift: form.receptionistShift || undefined,
        plan: form.plan || undefined,
        billingCycle: form.billingCycle || undefined,
        paymentMethod: form.paymentMethod || undefined,
        gstNumber: form.gstNumber || undefined,
        contractStart: form.contractStart || undefined,
        contractEnd: form.contractEnd || undefined,
        agreement: form.agreement,
        documents: documentPayload,
      };

      const response = await apiPost("/clinics/register", payload);

      if (response.success) {
        setSubmitSuccess(true);
        // Reset form after 2 seconds
        setTimeout(() => {
          setOpen(false);
          setStep(0);
          setForm({
            clinicName: "",
            clinicType: "",
            address: "",
            city: "",
            state: "",
            postal: "",
            phone: "",
            email: "",
            username: "",
            password: "",
            confirmPassword: "",
            latitude: "",
            longitude: "",
            ownerName: "",
            ownerEmail: "",
            ownerPhone: "",
            ownerId: "",
            receptionistName: "",
            receptionistEmail: "",
            receptionistPhone: "",
            receptionistShift: "",
            plan: "",
            billingCycle: "monthly",
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
          setSubmitSuccess(false);
        }, 2000);
      }
    } catch (error) {
      setSubmitError(error.message || "Failed to register clinic. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
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
            <DialogTitle>Clinic Registered Successfully!</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
            <p className="text-center text-slate-600">
              Your clinic has been registered successfully. You can now log in with your credentials.
            </p>
            <p className="mt-2 text-center text-sm text-slate-500">
              Closing in a moment...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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

        {submitError && (
          <ErrorMessage message={submitError} onDismiss={() => setSubmitError("")} />
        )}

        {isSubmitting ? (
          <LoadingSpinner text="Registering clinic..." />
        ) : (
          <div className="mt-6 grid gap-4">
            {step === 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Clinic Name *</label>
                  <Input
                    value={form.clinicName}
                    onChange={updateField("clinicName")}
                    className={validationErrors.clinicName ? "border-red-500" : ""}
                  />
                  {validationErrors.clinicName && (
                    <p className="text-xs text-red-500">{validationErrors.clinicName}</p>
                  )}
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
                  <Input
                    value={form.postal}
                    onChange={updateField("postal")}
                    className={validationErrors.postal ? "border-red-500" : ""}
                  />
                  {validationErrors.postal && (
                    <p className="text-xs text-red-500">{validationErrors.postal}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Phone *</label>
                  <Input
                    value={form.phone}
                    onChange={updateField("phone")}
                    className={validationErrors.phone ? "border-red-500" : ""}
                    placeholder="10-digit number"
                  />
                  {validationErrors.phone && (
                    <p className="text-xs text-red-500">{validationErrors.phone}</p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Email *</label>
                  <Input
                    value={form.email}
                    onChange={updateField("email")}
                    className={validationErrors.email ? "border-red-500" : ""}
                  />
                  {validationErrors.email && (
                    <p className="text-xs text-red-500">{validationErrors.email}</p>
                  )}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Username *</label>
                  <Input
                    value={form.username}
                    onChange={updateField("username")}
                    className={validationErrors.username ? "border-red-500" : ""}
                    placeholder="For clinic login"
                  />
                  {validationErrors.username && (
                    <p className="text-xs text-red-500">{validationErrors.username}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Password *</label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={updateField("password")}
                    className={validationErrors.password ? "border-red-500" : ""}
                    placeholder="Min 6 characters"
                  />
                  {validationErrors.password && (
                    <p className="text-xs text-red-500">{validationErrors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Confirm Password *</label>
                  <Input
                    type="password"
                    value={form.confirmPassword}
                    onChange={updateField("confirmPassword")}
                    className={validationErrors.confirmPassword ? "border-red-500" : ""}
                    placeholder="Re-enter password"
                  />
                  {validationErrors.confirmPassword && (
                    <p className="text-xs text-red-500">{validationErrors.confirmPassword}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Latitude (Optional)</label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={form.latitude}
                    onChange={updateField("latitude")}
                    className={validationErrors.latitude ? "border-red-500" : ""}
                    placeholder="e.g., 19.0760"
                  />
                  {validationErrors.latitude && (
                    <p className="text-xs text-red-500">{validationErrors.latitude}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Longitude (Optional)</label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={form.longitude}
                    onChange={updateField("longitude")}
                    className={validationErrors.longitude ? "border-red-500" : ""}
                    placeholder="e.g., 72.8777"
                  />
                  {validationErrors.longitude && (
                    <p className="text-xs text-red-500">{validationErrors.longitude}</p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Owner Name *</label>
                  <Input
                    value={form.ownerName}
                    onChange={updateField("ownerName")}
                    className={validationErrors.ownerName ? "border-red-500" : ""}
                  />
                  {validationErrors.ownerName && (
                    <p className="text-xs text-red-500">{validationErrors.ownerName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Owner Email *</label>
                  <Input
                    value={form.ownerEmail}
                    onChange={updateField("ownerEmail")}
                    className={validationErrors.ownerEmail ? "border-red-500" : ""}
                  />
                  {validationErrors.ownerEmail && (
                    <p className="text-xs text-red-500">{validationErrors.ownerEmail}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Owner Phone</label>
                  <Input
                    value={form.ownerPhone}
                    onChange={updateField("ownerPhone")}
                    className={validationErrors.ownerPhone ? "border-red-500" : ""}
                    placeholder="10-digit number"
                  />
                  {validationErrors.ownerPhone && (
                    <p className="text-xs text-red-500">{validationErrors.ownerPhone}</p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Govt ID / License</label>
                  <Input value={form.ownerId} onChange={updateField("ownerId")} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Receptionist Name (Optional)</label>
                  <Input value={form.receptionistName} onChange={updateField("receptionistName")} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Receptionist Email</label>
                  <Input
                    value={form.receptionistEmail}
                    onChange={updateField("receptionistEmail")}
                    className={validationErrors.receptionistEmail ? "border-red-500" : ""}
                  />
                  {validationErrors.receptionistEmail && (
                    <p className="text-xs text-red-500">{validationErrors.receptionistEmail}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Receptionist Phone</label>
                  <Input
                    value={form.receptionistPhone}
                    onChange={updateField("receptionistPhone")}
                    className={validationErrors.receptionistPhone ? "border-red-500" : ""}
                    placeholder="10-digit number"
                  />
                  {validationErrors.receptionistPhone && (
                    <p className="text-xs text-red-500">{validationErrors.receptionistPhone}</p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Shift / Coverage</label>
                  <Input value={form.receptionistShift} onChange={updateField("receptionistShift")} />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Plan</label>
                  <select value={form.plan} onChange={updateField("plan")} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="">Select a plan</option>
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Billing Cycle</label>
                  <select value={form.billingCycle} onChange={updateField("billingCycle")} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Payment Method</label>
                  <select value={form.paymentMethod} onChange={updateField("paymentMethod")} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="">Select payment method</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Card Number</label>
                  <Input
                    value={form.cardNumber}
                    onChange={updateField("cardNumber")}
                    placeholder="Leave blank if not paying by card"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Name on Card</label>
                  <Input value={form.cardName} onChange={updateField("cardName")} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Expiry</label>
                  <Input
                    value={form.cardExpiry}
                    onChange={updateField("cardExpiry")}
                    placeholder="MM/YY"
                    className={validationErrors.cardExpiry ? "border-red-500" : ""}
                  />
                  {validationErrors.cardExpiry && (
                    <p className="text-xs text-red-500">{validationErrors.cardExpiry}</p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">GST Number</label>
                  <Input
                    value={form.gstNumber}
                    onChange={updateField("gstNumber")}
                    placeholder="15-character GST format"
                    className={validationErrors.gstNumber ? "border-red-500" : ""}
                  />
                  {validationErrors.gstNumber && (
                    <p className="text-xs text-red-500">{validationErrors.gstNumber}</p>
                  )}
                </div>
              </div>
            )}

            {step === 5 && (
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

            {step === 6 && (
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

            {step === 7 && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-700">Review Summary</p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li><strong>Clinic:</strong> {form.clinicName || "—"}</li>
                  <li><strong>Type:</strong> {form.clinicType || "—"}</li>
                  <li><strong>Email:</strong> {form.email || "—"}</li>
                  <li><strong>Username:</strong> {form.username || "—"}</li>
                  <li><strong>Owner:</strong> {form.ownerName || "—"}</li>
                  <li><strong>Receptionist:</strong> {form.receptionistName || "—"}</li>
                  <li><strong>Plan:</strong> {form.plan || "—"}</li>
                  <li><strong>Billing Cycle:</strong> {form.billingCycle || "—"}</li>
                  <li><strong>Payment Method:</strong> {form.paymentMethod || "—"}</li>
                  {form.latitude && <li><strong>Latitude:</strong> {form.latitude}</li>}
                  {form.longitude && <li><strong>Longitude:</strong> {form.longitude}</li>}
                  <li><strong>Documents:</strong> {form.documents.length} files</li>
                  <li><strong>Contract Start:</strong> {form.contractStart || "—"}</li>
                  <li><strong>Contract End:</strong> {form.contractEnd || "—"}</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            className="h-9 rounded-xl"
            onClick={handleBack}
            disabled={isFirst || isSubmitting}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            className="h-9 rounded-xl"
            onClick={isLast ? handleSubmit : handleNext}
            disabled={isSubmitting}
          >
            {isLast ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Register Clinic
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
