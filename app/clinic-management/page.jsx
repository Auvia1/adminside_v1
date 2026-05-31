"use client";

import { useMemo, useCallback, useEffect, useState, useRef } from "react";
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
  Check,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Save,
  TimerReset,
  Upload,
  Trash2,
  Brain,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Input } from "../components/ui/input";
import NewPhoneNumberDialog from "../components/NewPhoneNumberDialog";
import NewDoctorDialog from "../components/NewDoctorDialog";
import ErrorMessage from "../components/ErrorMessage";
import SuccessMessage from "../components/SuccessMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import ProtectedRoute from "../components/ProtectedRoute";
import { apiGet, apiPatch } from "../lib/api";

const defaultSettings = {
  advance_booking_days: 30,
  min_booking_notice_period: 60,
  cancellation_window_hours: 24,
  ai_agent_enabled: true,
  ai_agent_languages: ["en-IN"],
  whatsapp_number: "",
  followup_time: "09:00",
  price_per_appointment: 500,
  documents: [],
};

const languageOptions = [
  { value: "en-IN", label: "English (India)", flag: "🇬🇧" },
  { value: "te-IN", label: "Telugu", flag: "🇮🇳" },
  { value: "hi-IN", label: "Hindi", flag: "🇮🇳" },
  { value: "ta-IN", label: "Tamil", flag: "🇮🇳" },
  { value: "kn-IN", label: "Kannada", flag: "🇮🇳" },
  { value: "ml-IN", label: "Malayalam", flag: "🇮🇳" },
  { value: "mr-IN", label: "Marathi", flag: "🇮🇳" },
];

function formatClinicLabel(clinic) {
  const city = clinic.city || clinic.state || "Unknown";
  return `${clinic.name} • ${city}`;
}

function normalizeTime(timeValue) {
  if (!timeValue) return "09:00";
  const value = String(timeValue);
  if (value.length >= 5) {
    return value.slice(0, 5);
  }
  return "09:00";
}

function toApiTime(timeValue) {
  if (!timeValue) return "09:00:00";
  if (String(timeValue).includes(":")) {
    const parts = String(timeValue).split(":");
    if (parts.length === 2) return `${parts[0]}:${parts[1]}:00`;
    if (parts.length >= 3) return `${parts[0]}:${parts[1]}:${parts[2]}`;
  }
  return "09:00:00";
}

function normalizeSettings(rawSettings) {
  if (!rawSettings) return defaultSettings;
  return {
    advance_booking_days: Number(rawSettings.advance_booking_days ?? 30),
    min_booking_notice_period: Number(rawSettings.min_booking_notice_period ?? 60),
    cancellation_window_hours: Number(rawSettings.cancellation_window_hours ?? 24),
    ai_agent_enabled: Boolean(rawSettings.ai_agent_enabled ?? true),
    ai_agent_languages: Array.isArray(rawSettings.ai_agent_languages)
      ? rawSettings.ai_agent_languages
      : ["en-IN"],
    whatsapp_number: rawSettings.whatsapp_number || "",
    followup_time: normalizeTime(rawSettings.followup_time),
    price_per_appointment: Number(rawSettings.price_per_appointment ?? 0),
    documents: Array.isArray(rawSettings.documents) ? rawSettings.documents : [],
  };
}

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

export default function ClinicManagementPageWrapper() {
  return (
    <ProtectedRoute>
      <ClinicManagementPage />
    </ProtectedRoute>
  );
}

function ClinicManagementPage() {
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [selectedClinicData, setSelectedClinicData] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [documents, setDocuments] = useState([]);

  const [isLoadingClinics, setIsLoadingClinics] = useState(true);
  const [isLoadingClinicData, setIsLoadingClinicData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [pageError, setPageError] = useState("");

  // Document upload + embedding state
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleLanguage = (value) => {
    setSettings((prev) => {
      const languages = prev.ai_agent_languages || [];
      return {
        ...prev,
        ai_agent_languages: languages.includes(value)
          ? languages.filter((item) => item !== value)
          : [...languages, value],
      };
    });
  };

  const loadClinics = useCallback(async () => {
    try {
      setIsLoadingClinics(true);
      setPageError("");

      const response = await apiGet("/clinics/admin/all?page=1&limit=100");
      if (!response?.success) {
        throw new Error(response?.error || "Unable to fetch clinics");
      }

      const fetchedClinics = Array.isArray(response?.data?.clinics)
        ? response.data.clinics
        : [];
      setClinics(fetchedClinics);

      if (fetchedClinics.length > 0) {
        setSelectedClinicId(fetchedClinics[0].id);
      }
    } catch (error) {
      setPageError(error.message || "Failed to load clinics.");
      setClinics([]);
      setSelectedClinicId("");
    } finally {
      setIsLoadingClinics(false);
    }
  }, []);

  const loadSelectedClinicData = useCallback(async (clinicId) => {
    if (!clinicId) return;

    try {
      setIsLoadingClinicData(true);
      setPageError("");

      const [response, phoneResponse, doctorResponse, documentsResponse] = await Promise.all([
        apiGet(`/clinics/${clinicId}/settings`),
        apiGet(`/phone-numbers?clinic_id=${clinicId}`),
        apiGet(`/doctors?clinic_id=${clinicId}`),
        fetch(`/api/documents?clinic_id=${clinicId}&limit=100`).then(r => r.json()),
      ]);
      if (!response?.success) {
        throw new Error(response?.error || "Unable to fetch clinic settings");
      }
      if (!phoneResponse?.success) {
        throw new Error(phoneResponse?.error || "Unable to fetch phone numbers");
      }
      if (!doctorResponse?.success) {
        throw new Error(doctorResponse?.error || "Unable to fetch doctors");
      }

      const clinicPayload = response?.data?.clinic || null;
      const settingsPayload = response?.data?.settings || null;
      const phonePayload = Array.isArray(phoneResponse?.data)
        ? phoneResponse.data
        : [];
      const doctorPayload = Array.isArray(doctorResponse?.data)
        ? doctorResponse.data
        : [];
      const documentsPayload = documentsResponse?.success ? Array.isArray(documentsResponse?.data) ? documentsResponse.data : [] : [];
      const filesCount = documentsResponse?.pagination?.total || documentsPayload.length || 0;

      setSelectedClinicData(clinicPayload);
      setSettings(normalizeSettings(settingsPayload));
      setTotalFiles(filesCount);
      setDocuments(documentsPayload);
      setPhoneNumbers(
        phonePayload.map((item) => ({
          id: item.id,
          number: item.number,
          type: item.service_type || "Reception Line",
          status: item.status || (item.is_active ? "Live" : "Inactive"),
        }))
      );
      setDoctors(
        doctorPayload.map((item) => ({
          id: item.id,
          name: item.name,
          speciality: item.speciality || "General",
          consultationDuration: item.consultation_duration_minutes || 30,
          maxAppointmentsPerDay: item.max_appointments_per_day || 0,
          isActive: Boolean(item.is_active),
        }))
      );
    } catch (error) {
      setPageError(error.message || "Failed to load clinic details.");
      setSelectedClinicData(null);
      setSettings(defaultSettings);
      setPhoneNumbers([]);
      setDoctors([]);
      setDocuments([]);
      setTotalFiles(0);
    } finally {
      setIsLoadingClinicData(false);
    }
  }, []);

  useEffect(() => {
    loadClinics();
  }, [loadClinics]);

  useEffect(() => {
    if (selectedClinicId) {
      loadSelectedClinicData(selectedClinicId);
    }
  }, [selectedClinicId, loadSelectedClinicData]);

  const handleSave = async () => {
    if (!selectedClinicId) return;

    try {
      setIsSaving(true);
      setPageError("");
      setSavedMessage("");

      const whatsappDigits = String(settings.whatsapp_number || "")
        .replace(/\D/g, "")
        .trim();
      if (whatsappDigits && (whatsappDigits.length < 10 || whatsappDigits.length > 15)) {
        throw new Error("WhatsApp number must contain 10 to 15 digits");
      }

      const payload = {
        advance_booking_days: Number(settings.advance_booking_days),
        min_booking_notice_period: Number(settings.min_booking_notice_period),
        cancellation_window_hours: Number(settings.cancellation_window_hours),
        followup_time: toApiTime(settings.followup_time),
        ai_agent_enabled: Boolean(settings.ai_agent_enabled),
        ai_agent_languages: settings.ai_agent_languages || ["en-IN"],
        // DB constraint expects null or a 10-15 digit numeric string.
        whatsapp_number: whatsappDigits || null,
        price_per_appointment: Number(settings.price_per_appointment || 0),
      };

      const response = await apiPatch(`/clinics/${selectedClinicId}/settings`, payload);
      if (!response?.success) {
        throw new Error(response?.error || "Failed to save settings");
      }

      setSavedMessage("Clinic settings saved successfully.");
      setTimeout(() => setSavedMessage(""), 2500);
    } catch (error) {
      setPageError(error.message || "Failed to save clinic settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePhoneNumber = (phoneNumberData) => {
    setPhoneNumbers((prev) => [phoneNumberData, ...prev]);
  };

  const handleCreateDoctor = (doctorData) => {
    setDoctors((prev) => [doctorData, ...prev]);
  };

  const handleDeleteDocument = async (docId, docName) => {
    if (!window.confirm(`Delete "${docName}"?`)) return;

    try {
      setPageError("");
      const response = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to delete document");
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      setTotalFiles((prev) => Math.max(0, prev - 1));
      setSavedMessage("Document deleted successfully.");
      setTimeout(() => setSavedMessage(""), 2500);
    } catch (error) {
      setPageError(error.message || "Failed to delete document.");
    }
  };

  // ─── Document Upload + Embedding Handlers ─────────────────────────────────
  const handleFilesSelected = (files) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;
    const newItems = fileList.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      status: "idle",
      message: "Ready to upload",
    }));
    setUploadQueue((prev) => [...prev, ...newItems]);
  };

  const handleFileInputChange = (event) => {
    handleFilesSelected(event.target.files);
    event.target.value = "";
  };

  const removeFromQueue = (id) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQueueItem = (id, status, message) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status, message } : item))
    );
  };

  const handleUploadAndEmbed = async () => {
    const pendingItems = uploadQueue.filter((q) => q.status === "idle" || q.status === "error");
    if (pendingItems.length === 0 || !selectedClinicId) return;

    setIsUploading(true);
    setPageError("");
    let successCount = 0;
    let failCount = 0;

    for (const item of pendingItems) {
      try {
        // Step 1: Upload to Google Cloud Storage
        updateQueueItem(item.id, "uploading", "Uploading to cloud...");

        const formData = new FormData();
        formData.append("clinic_id", selectedClinicId);
        formData.append("doc_type", "misc");
        formData.append("files", item.file);

        const uploadRes = await fetch("/api/upload-documents", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || "Cloud upload failed");
        }

        // Step 2: Extract text and generate embeddings
        updateQueueItem(item.id, "embedding", "Creating embeddings...");

        let fileContent = "";
        try {
          fileContent = await item.file.text();
        } catch {
          fileContent = `[File: ${item.file.name}] [Type: ${item.file.type}] [Size: ${item.file.size} bytes]`;
        }

        if (fileContent && fileContent.length > 10) {
          const embedRes = await fetch("/api/embed-documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clinicId: selectedClinicId,
              fileName: item.file.name,
              fileContent: fileContent,
            }),
          });
          const embedData = await embedRes.json();

          if (!embedRes.ok || !embedData.success) {
            console.warn(`⚠️ Embedding failed for ${item.file.name}:`, embedData.error);
            updateQueueItem(item.id, "success", `Uploaded (embedding skipped)`);
          } else {
            updateQueueItem(item.id, "success", `Uploaded & embedded (${embedData.chunks} chunks)`);
          }
        } else {
          updateQueueItem(item.id, "success", "Uploaded (no text to embed)");
        }

        successCount++;
      } catch (err) {
        console.error(`❌ Failed to process ${item.file.name}:`, err);
        updateQueueItem(item.id, "error", err.message || "Upload failed");
        failCount++;
      }
    }

    setIsUploading(false);

    // Refresh documents list from database
    try {
      const docsResponse = await fetch(`/api/documents?clinic_id=${selectedClinicId}&limit=100`).then(r => r.json());
      if (docsResponse?.success) {
        setDocuments(Array.isArray(docsResponse?.data) ? docsResponse.data : []);
        setTotalFiles(docsResponse?.pagination?.total || 0);
      }
    } catch {}

    if (successCount > 0) {
      setSavedMessage(`${successCount} document(s) uploaded & embedded${failCount > 0 ? ` (${failCount} failed)` : ""}`);
      setTimeout(() => setSavedMessage(""), 3000);
    } else if (failCount > 0) {
      setPageError(`All ${failCount} document(s) failed to upload.`);
    }
  };

  return (
    <div className="px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Clinic Console
          </p>
          <div className="relative mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
            <select
              value={selectedClinicId}
              onChange={(event) => setSelectedClinicId(event.target.value)}
              className="w-full appearance-none bg-transparent pr-6 text-sm text-slate-700 outline-none"
              disabled={isLoadingClinics || clinics.length === 0}
            >
              {clinics.length === 0 ? (
                <option value="">No clinics found</option>
              ) : (
                clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {formatClinicLabel(clinic)}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={!selectedClinicId || isSaving || isLoadingClinicData}
            className="h-9 rounded-xl bg-(--brand-primary) px-4 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(15,102,118,0.2)] transition hover:-translate-y-0.5 disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <Sparkles className="h-4 w-4 animate-pulse" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Changes
              </>
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

      {savedMessage ? <SuccessMessage message={savedMessage} className="mt-4" /> : null}
      {pageError ? (
        <ErrorMessage message={pageError} onDismiss={() => setPageError("")} className="mt-4" />
      ) : null}

      {isLoadingClinics || isLoadingClinicData ? (
        <LoadingSpinner text="Loading clinic management data..." />
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_1.2fr]">
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
              <p className="font-semibold text-slate-700">
                {selectedClinicData?.owner_name || "Not available"}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] uppercase text-slate-400">Plan Type</p>
                <Badge className="mt-1 bg-indigo-50 text-indigo-600">
                  {selectedClinicData?.subscription_plan || "trial"}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-slate-400">Last Updated</p>
                <p className="font-semibold text-slate-700">
                  {selectedClinicData?.updated_at
                    ? new Date(selectedClinicData.updated_at).toLocaleDateString()
                    : "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Product Status
              </div>
              <div className="flex items-center gap-2">
                Using Auvia
                <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
              </div>
            </div>

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
                  onChange={(event) => update("price_per_appointment", Number(event.target.value))}
                  placeholder="0.00"
                  className="w-full bg-transparent text-xs text-slate-700 outline-none"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
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
                    min={10}
                    max={90}
                    value={settings.advance_booking_days}
                    onChange={(event) => update("advance_booking_days", Number(event.target.value))}
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
                    max={360}
                    value={settings.min_booking_notice_period}
                    onChange={(event) =>
                      update("min_booking_notice_period", Number(event.target.value))
                    }
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
                    max={168}
                    value={settings.cancellation_window_hours}
                    onChange={(event) =>
                      update("cancellation_window_hours", Number(event.target.value))
                    }
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
                  onChange={(event) => update("followup_time", event.target.value)}
                  className="h-8 w-28 rounded-xl text-xs"
                />
              </SettingRow>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader
              icon={Upload}
              title="Documents & Knowledge"
              action={
                <div className="text-right text-xs text-slate-400">
                  <p className="text-[10px] uppercase">Total Files</p>
                  <p className="text-sm font-semibold text-slate-800">{totalFiles}</p>
                </div>
              }
            />
            <p className="mt-1 text-[11px] text-slate-400">Upload documents to create AI knowledge embeddings</p>
            <div className="mt-4 space-y-3">
              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFilesSelected(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-sm transition-all duration-200 ${
                  dragOver
                    ? "border-(--brand-primary) bg-(--brand-primary)/5 scale-[1.01]"
                    : "border-slate-200 bg-slate-50 hover:border-(--brand-primary)/50 hover:bg-(--brand-primary)/5"
                }`}
              >
                <div className={`rounded-full p-2 transition-colors ${dragOver ? "bg-(--brand-primary)/10" : "bg-slate-100"}`}>
                  <Upload className={`h-5 w-5 ${dragOver ? "text-(--brand-primary)" : "text-(--brand-primary)"}`} />
                </div>
                <span className="font-semibold text-slate-700">
                  {dragOver ? "Drop files here" : "Upload Documents"}
                </span>
                <span className="text-[11px] text-slate-400">PDF, TXT, DOC — Files will be embedded for AI knowledge</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>

              {/* Upload Queue */}
              {uploadQueue.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase text-slate-400">
                      {uploadQueue.length} file(s) queued
                    </p>
                    {!isUploading && (
                      <button
                        onClick={() => setUploadQueue([])}
                        className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-slate-100 bg-white p-2">
                    {uploadQueue.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-slate-50/80 hover:bg-slate-50 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-slate-700 truncate">{item.file.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {item.file.size < 1024 * 1024
                              ? `${(item.file.size / 1024).toFixed(1)} KB`
                              : `${(item.file.size / (1024 * 1024)).toFixed(1)} MB`}
                          </p>
                        </div>
                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0 ${
                          item.status === "uploading" ? "bg-blue-50 text-blue-600" :
                          item.status === "embedding" ? "bg-purple-50 text-purple-600" :
                          item.status === "success" ? "bg-emerald-50 text-emerald-600" :
                          item.status === "error" ? "bg-red-50 text-red-600" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {item.status === "uploading" && <Loader2 className="h-3 w-3 animate-spin" />}
                          {item.status === "embedding" && <Brain className="h-3 w-3 animate-pulse" />}
                          {item.status === "success" && <CheckCircle2 className="h-3 w-3" />}
                          {item.status === "error" && <AlertCircle className="h-3 w-3" />}
                          {item.message}
                        </span>
                        {(item.status === "idle" || item.status === "error") && !isUploading && (
                          <button
                            onClick={() => removeFromQueue(item.id)}
                            className="p-0.5 text-slate-300 hover:text-slate-500 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Upload & Embed Button */}
                  <button
                    onClick={handleUploadAndEmbed}
                    disabled={isUploading || uploadQueue.every((q) => q.status === "success")}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-(--brand-primary) px-4 py-2.5 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(15,102,118,0.2)] transition hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading & Embedding...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        Upload & Create Embeddings
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Existing Documents List */}
              {documents?.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase text-slate-400">Uploaded Files ({documents.length})</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 transition group">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="truncate font-medium text-slate-700">{doc.file_name}</div>
                            <div className="text-[10px] text-slate-400">
                              {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'Unknown size'} • {doc.doc_type || 'misc'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <Check className="h-4 w-4 text-emerald-500" />
                          <button
                            onClick={() => handleDeleteDocument(doc.id, doc.file_name)}
                            className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                            title="Delete document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <SectionHeader
            icon={ClipboardList}
            title="Phone Numbers"
            action={
              <div className="text-right text-xs text-slate-400">
                <p className="text-[10px] uppercase">Total Active</p>
                <p className="text-sm font-semibold text-slate-800">{phoneNumbers.length}</p>
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
                key={item.id || item.number}
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

            {phoneNumbers.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                No phone numbers found for this clinic.
              </div>
            ) : null}

            <NewPhoneNumberDialog
              clinicId={selectedClinicId}
              onCreate={handleCreatePhoneNumber}
              triggerClassName="mt-2 w-full rounded-xl border border-dashed border-slate-200 bg-transparent py-2 text-xs font-semibold text-slate-400 shadow-none transition hover:border-(--brand-primary)/40 hover:text-(--brand-primary)"
            />
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-slate-400">
              <MessageCircle className="h-3 w-3" /> WhatsApp Business Number
            </div>
            <Input
              value={settings.whatsapp_number}
              onChange={(event) => update("whatsapp_number", event.target.value)}
              placeholder="10-digit number"
              className="h-8 rounded-xl text-xs text-slate-600"
            />
          </div>
        </Card>

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
                onCheckedChange={(value) => update("ai_agent_enabled", value)}
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

            <div
              className={`flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 transition-opacity ${
                !settings.ai_agent_enabled ? "pointer-events-none opacity-40" : ""
              }`}
            >
              {languageOptions.map((language) => {
                const isActive = settings.ai_agent_languages.includes(language.value);
                return (
                  <button
                    key={language.value}
                    onClick={() => toggleLanguage(language.value)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 ${
                      isActive
                        ? "border-(--brand-primary)/30 bg-(--brand-primary)/10 text-(--brand-primary)"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {isActive && <Check className="h-3 w-3" />}
                    {language.flag} {language.label}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="p-5">
          <SectionHeader
            icon={ShieldCheck}
            title="Doctors"
            action={
              <div className="flex items-center gap-3">
                <div className="text-right text-xs text-slate-400">
                  <p className="text-[10px] uppercase">Total Doctors</p>
                  <p className="text-sm font-semibold text-slate-800">{doctors.length}</p>
                </div>
                <NewDoctorDialog
                  clinicId={selectedClinicId}
                  onCreate={handleCreateDoctor}
                  triggerClassName="h-9 rounded-xl bg-(--brand-primary) px-4 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(15,102,118,0.2)] transition hover:-translate-y-0.5"
                />
              </div>
            }
          />

          <p className="mt-1 text-xs text-slate-400">All active doctors configured for this clinic.</p>

          <div className="mt-4 space-y-2 rounded-2xl border border-slate-100 bg-white p-3">
            <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.4fr] text-[10px] uppercase text-slate-400">
              <span>Name</span>
              <span>Speciality</span>
              <span>Duration</span>
              <span>Max/Day</span>
              <span>Status</span>
            </div>

            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="grid grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.4fr] items-center rounded-xl px-2 py-2 text-xs text-slate-600 transition hover:bg-slate-50"
              >
                <span className="font-semibold text-slate-700">{doctor.name}</span>
                <span>{doctor.speciality}</span>
                <span>{doctor.consultationDuration} min</span>
                <span>{doctor.maxAppointmentsPerDay}</span>
                <Badge className={doctor.isActive ? "w-fit bg-emerald-50 text-emerald-600" : "w-fit bg-slate-100 text-slate-500"}>
                  {doctor.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))}

            {doctors.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                No doctors found for this clinic.
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
