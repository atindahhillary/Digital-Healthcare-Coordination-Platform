import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { toast } from "../components/Toaster";
import { byId, specialists, slotsFor, type Mode } from "../data/seed";

export type Role = "patient" | "specialist" | "lab" | "pharmacy" | "org" | "admin";

export type ApptStatus =
  | "confirmed" // booked and confirmed, waiting for the readiness window
  | "ready" // specialist confirmed readiness
  | "delayed" // specialist reported a delay within tolerance
  | "recovery" // service recovery in progress, patient choosing an option
  | "in_consult"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "reassigned";

export interface TimelineEvent {
  at: string;
  label: string;
  actor: string;
  tone?: "ok" | "warn" | "bad" | "info";
}

export interface Recovery {
  reason: string;
  minutes?: number;
  alternative?: { specialistId: string; at: string };
  nextSlots: string[];
  chosen?: "wait" | "alternative" | "reschedule" | "refund";
}

export interface Appointment {
  id: string;
  patientId: string;
  specialistId: string;
  at: string;
  mode: Mode;
  fee: number;
  reason: string;
  status: ApptStatus;
  delayMin?: number;
  timeline: TimelineEvent[];
  recovery?: Recovery;
  notes?: string;
  followUpWeeks?: number;
  rating?: number;
}

export type LabStatus = "requested" | "booked" | "sample_collected" | "processing" | "result_ready";
export interface LabResultRow {
  test: string;
  value: string;
  unit: string;
  range: string;
  flag?: "high" | "low";
}
export interface LabOrder {
  id: string;
  patientId: string;
  specialistId: string;
  labId: string;
  tests: string[];
  status: LabStatus;
  collection: "home" | "walk-in";
  scheduledFor?: string;
  createdAt: string;
  results?: LabResultRow[];
  releasedAt?: string;
}

export type RxStatus = "received" | "verified" | "ready" | "out_for_delivery" | "delivered" | "issue";
export interface RxItem {
  drug: string;
  dose: string;
  qty: number;
  price?: number;
  available?: boolean;
}
export interface Prescription {
  id: string;
  patientId: string;
  specialistId: string;
  pharmacyId: string;
  items: RxItem[];
  status: RxStatus;
  delivery: boolean;
  createdAt: string;
  refillsLeft: number;
  nextRefill?: string;
  issue?: string;
  isRefill?: boolean;
}

export interface Referral {
  id: string;
  patientId: string;
  fromId: string;
  toSpecialty: string;
  toId?: string;
  reason: string;
  status: "sent" | "accepted" | "booked" | "completed";
  createdAt: string;
}

export interface Incident {
  id: string;
  apptId?: string;
  specialistId: string;
  kind: "delay" | "provider_no_show" | "late_cancellation" | "patient_no_show";
  minutes?: number;
  resolution: string;
  at: string;
  open: boolean;
}

export interface Notice {
  id: string;
  to: Role;
  patientId?: string;
  at: string;
  title: string;
  body: string;
  channel: "app" | "sms" | "whatsapp";
  read: boolean;
  tone?: "ok" | "warn" | "bad" | "info";
}

export interface Audit {
  id: string;
  at: string;
  actor: string;
  role: string;
  action: string;
  resource: string;
}

export interface Complaint {
  id: string;
  patient: string;
  about: string;
  category: string;
  text: string;
  status: "new" | "investigating" | "resolved";
  at: string;
  refund?: number;
}

export interface Consent {
  party: string;
  partyType: "specialist" | "lab" | "pharmacy" | "org" | "coordinator";
  scope: string;
  granted: boolean;
  locked?: boolean;
}

export interface VerificationItem {
  id: string;
  name: string;
  type: "Specialist" | "Laboratory" | "Pharmacy" | "Patient organisation";
  regulator: string;
  regNo: string;
  submitted: string;
  docs: string[];
  status: "pending" | "approved" | "rejected";
  specialistId?: string;
}

export interface Rules {
  readinessWindowMin: number;
  graceMin: number;
  recoveryAfterMin: number;
  reminderHours: number[];
  freeCancelHours: number;
  maxAltSearchHours: number;
}

export interface State {
  version: number;
  seededAt: number;
  role: Role;
  patientId: string;
  specialistId: string;
  labId: string;
  pharmacyId: string;
  appointments: Appointment[];
  labOrders: LabOrder[];
  prescriptions: Prescription[];
  referrals: Referral[];
  incidents: Incident[];
  notices: Notice[];
  audit: Audit[];
  complaints: Complaint[];
  consents: Consent[];
  verification: VerificationItem[];
  rules: Rules;
  enrolledPathways: string[];
}

export const patients: Record<string, { name: string; age: number; county: string; phone: string; conditions: string[] }> = {
  "pt-grace": { name: "Grace Wambui", age: 34, county: "Nairobi (Kasarani)", phone: "+254 7•• ••• 214", conditions: ["Lupus (SLE)"] },
  "pt-james": { name: "James Mutiso", age: 52, county: "Machakos", phone: "+254 7•• ••• 880", conditions: ["Rheumatoid arthritis"] },
  "pt-halima": { name: "Halima Abdi", age: 41, county: "Mombasa", phone: "+254 7•• ••• 302", conditions: ["Type 2 diabetes"] },
  "pt-peter": { name: "Peter Kamau", age: 63, county: "Kiambu", phone: "+254 7•• ••• 551", conditions: ["Gout", "Hypertension"] },
  "pt-esther": { name: "Esther Atieno", age: 29, county: "Kisumu", phone: "+254 7•• ••• 117", conditions: ["Lupus (SLE)"] },
  "pt-samuel": { name: "Samuel Kiptoo", age: 47, county: "Uasin Gishu", phone: "+254 7•• ••• 640", conditions: ["Lupus nephritis"] },
};

const VERSION = 3;
const KEY = "unganisha-demo-state";
const MIN = 60000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

let counter = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}${(counter++).toString(36)}`;
const iso = (t: number) => new Date(t).toISOString();

function roundTo5(t: number) {
  return Math.ceil(t / (5 * MIN)) * 5 * MIN;
}

export function seed(): State {
  const now = Date.now();
  const soon = roundTo5(now + 25 * MIN);
  const ev = (t: number, label: string, actor: string, tone: TimelineEvent["tone"] = "info"): TimelineEvent => ({ at: iso(t), label, actor, tone });
  const booked = (_start: number, made: number) => [
    ev(made, "Appointment booked and paid", "Patient", "ok"),
    ev(made + 2 * MIN, "Confirmed by clinic. Reminders scheduled for 24 h and 2 h before", "Platform", "ok"),
  ];

  const appointments: Appointment[] = [
    {
      id: "ap-grace-today", patientId: "pt-grace", specialistId: "sp-amina", at: iso(soon), mode: "virtual", fee: 3500,
      reason: "3-month lupus review", status: "confirmed",
      timeline: [...booked(soon, soon - 9 * DAY), ev(soon - DAY, "24-hour reminder sent by SMS and app", "Platform"), ev(soon - 2 * HOUR, "2-hour reminder sent by SMS and app", "Platform")],
    },
    {
      id: "ap-amina-1", patientId: "pt-james", specialistId: "sp-amina", at: iso(soon - 150 * MIN), mode: "physical", fee: 4500, reason: "Rheumatoid arthritis follow-up", status: "completed",
      timeline: [...booked(soon - 150 * MIN, soon - 12 * DAY), ev(soon - 210 * MIN, "Specialist confirmed readiness", "Dr. Amina Odhiambo", "ok"), ev(soon - 148 * MIN, "Consultation started on time", "Platform", "ok"), ev(soon - 125 * MIN, "Consultation completed", "Dr. Amina Odhiambo", "ok")],
    },
    {
      id: "ap-amina-2", patientId: "pt-peter", specialistId: "sp-amina", at: iso(soon - 90 * MIN), mode: "virtual", fee: 3500, reason: "Gout flare review", status: "completed",
      timeline: [...booked(soon - 90 * MIN, soon - 4 * DAY), ev(soon - 150 * MIN, "Specialist confirmed readiness", "Dr. Amina Odhiambo", "ok"), ev(soon - 86 * MIN, "Consultation started", "Platform", "ok"), ev(soon - 70 * MIN, "Consultation completed", "Dr. Amina Odhiambo", "ok")],
    },
    {
      id: "ap-amina-3", patientId: "pt-esther", specialistId: "sp-amina", at: iso(soon + 60 * MIN), mode: "virtual", fee: 3500, reason: "New lupus diagnosis, first visit", status: "confirmed",
      timeline: booked(soon + 60 * MIN, soon - 3 * DAY),
    },
    {
      id: "ap-amina-4", patientId: "pt-samuel", specialistId: "sp-amina", at: iso(soon + 120 * MIN), mode: "physical", fee: 4500, reason: "Lupus nephritis, shared care with nephrology", status: "confirmed",
      timeline: booked(soon + 120 * MIN, soon - 6 * DAY),
    },
    {
      id: "ap-grace-past1", patientId: "pt-grace", specialistId: "sp-amina", at: iso(now - 91 * DAY), mode: "physical", fee: 4500, reason: "Lupus review", status: "completed", rating: 5,
      notes: "Joint pain improved. Continue hydroxychloroquine 200 mg daily and prednisolone 5 mg. Kidney panel and FBC before next review. Eye screening due.", followUpWeeks: 12,
      timeline: [...booked(now - 91 * DAY, now - 100 * DAY), ev(now - 91 * DAY - HOUR, "Specialist confirmed readiness", "Dr. Amina Odhiambo", "ok"), ev(now - 91 * DAY + 3 * MIN, "Consultation started", "Platform", "ok"), ev(now - 91 * DAY + 30 * MIN, "Consultation completed with follow-up plan", "Dr. Amina Odhiambo", "ok")],
    },
    {
      id: "ap-grace-past2", patientId: "pt-grace", specialistId: "sp-njeri", at: iso(now - 62 * DAY), mode: "virtual", fee: 4000, reason: "Kidney review (referral)", status: "completed", rating: 5,
      notes: "Urine protein mildly raised, eGFR normal. No change to treatment. Repeat UPCR in 3 months and share with rheumatology.",
      timeline: [...booked(now - 62 * DAY, now - 70 * DAY), ev(now - 62 * DAY - HOUR, "Specialist reported a 12 minute delay", "Dr. Njeri Mwangi", "warn"), ev(now - 62 * DAY - HOUR + MIN, "Patient informed, chose to wait", "Platform", "info"), ev(now - 62 * DAY + 12 * MIN, "Consultation started", "Platform", "ok"), ev(now - 62 * DAY + 35 * MIN, "Consultation completed", "Dr. Njeri Mwangi", "ok")],
    },
    {
      id: "ap-grace-eye", patientId: "pt-grace", specialistId: "sp-wairimu", at: iso(roundTo5(now + 19 * DAY)) , mode: "physical", fee: 3500, reason: "Annual hydroxychloroquine eye screening (referral)", status: "confirmed",
      timeline: booked(now + 19 * DAY, now - 5 * DAY),
    },
  ];
  // pin eye appointment to 10:30
  const eye = new Date(appointments[7].at);
  eye.setHours(10, 30, 0, 0);
  appointments[7].at = eye.toISOString();

  const labOrders: LabOrder[] = [
    {
      id: "lo-grace-prev", patientId: "pt-grace", specialistId: "sp-amina", labId: "lab-bora", tests: ["UEC", "UPCR", "CBC"], status: "result_ready", collection: "home",
      createdAt: iso(now - 98 * DAY), scheduledFor: iso(now - 96 * DAY), releasedAt: iso(now - 95 * DAY),
      results: [
        { test: "Creatinine", value: "78", unit: "µmol/L", range: "45 to 90" },
        { test: "eGFR", value: "92", unit: "mL/min/1.73m²", range: "> 90" },
        { test: "Urine protein:creatinine", value: "38", unit: "mg/mmol", range: "< 15", flag: "high" },
        { test: "Haemoglobin", value: "11.4", unit: "g/dL", range: "12.0 to 15.5", flag: "low" },
        { test: "White cells", value: "4.1", unit: "× 10⁹/L", range: "4.0 to 11.0" },
        { test: "Platelets", value: "210", unit: "× 10⁹/L", range: "150 to 400" },
      ],
    },
    { id: "lo-grace-now", patientId: "pt-grace", specialistId: "sp-amina", labId: "lab-bora", tests: ["UEC", "UPCR", "CBC", "C3C4"], status: "processing", collection: "home", createdAt: iso(now - 6 * DAY), scheduledFor: iso(now - 2 * DAY) },
    { id: "lo-esther", patientId: "pt-esther", specialistId: "sp-amina", labId: "lab-bora", tests: ["DSDNA", "C3C4", "CBC", "UA"], status: "requested", collection: "walk-in", createdAt: iso(now - 1 * DAY) },
    { id: "lo-samuel", patientId: "pt-samuel", specialistId: "sp-njeri", labId: "lab-bora", tests: ["UEC", "UPCR"], status: "booked", collection: "home", createdAt: iso(now - 2 * DAY), scheduledFor: iso(roundTo5(now + 20 * HOUR)) },
    { id: "lo-peter", patientId: "pt-peter", specialistId: "sp-amina", labId: "lab-bora", tests: ["UEC", "LIPID"], status: "sample_collected", collection: "walk-in", createdAt: iso(now - 1 * DAY), scheduledFor: iso(now - 3 * HOUR) },
  ];

  const prescriptions: Prescription[] = [
    {
      id: "rx-grace", patientId: "pt-grace", specialistId: "sp-amina", pharmacyId: "ph-tumaini", status: "delivered", delivery: true, isRefill: true,
      items: [
        { drug: "Hydroxychloroquine", dose: "200 mg once daily", qty: 30, price: 1950, available: true },
        { drug: "Prednisolone", dose: "5 mg once daily", qty: 30, price: 300, available: true },
        { drug: "Calcium + Vitamin D3", dose: "1 tablet daily", qty: 30, price: 650, available: true },
      ],
      createdAt: iso(now - 26 * DAY), refillsLeft: 2, nextRefill: iso(now + 4 * DAY),
    },
    {
      id: "rx-halima", patientId: "pt-halima", specialistId: "sp-hassan", pharmacyId: "ph-tumaini", status: "received", delivery: true,
      items: [
        { drug: "Metformin XR", dose: "1000 mg twice daily", qty: 60 },
        { drug: "Empagliflozin", dose: "10 mg once daily", qty: 30 },
      ],
      createdAt: iso(now - 40 * MIN), refillsLeft: 5,
    },
    {
      id: "rx-peter", patientId: "pt-peter", specialistId: "sp-amina", pharmacyId: "ph-tumaini", status: "verified", delivery: false,
      items: [
        { drug: "Allopurinol", dose: "100 mg once daily", qty: 30, price: 450, available: true },
        { drug: "Colchicine", dose: "0.5 mg twice daily (5 days)", qty: 10, available: false },
      ],
      createdAt: iso(now - 70 * MIN), refillsLeft: 2,
    },
    {
      id: "rx-james", patientId: "pt-james", specialistId: "sp-amina", pharmacyId: "ph-tumaini", status: "out_for_delivery", delivery: true,
      items: [{ drug: "Methotrexate", dose: "15 mg once weekly", qty: 4, price: 800, available: true }, { drug: "Folic acid", dose: "5 mg weekly", qty: 4, price: 120, available: true }],
      createdAt: iso(now - 2 * HOUR), refillsLeft: 3,
    },
  ];

  const referrals: Referral[] = [
    { id: "rf-1", patientId: "pt-grace", fromId: "sp-amina", toSpecialty: "Nephrology", toId: "sp-njeri", reason: "Raised urine protein, assess for lupus nephritis", status: "completed", createdAt: iso(now - 90 * DAY) },
    { id: "rf-2", patientId: "pt-grace", fromId: "sp-amina", toSpecialty: "Ophthalmology", toId: "sp-wairimu", reason: "Annual hydroxychloroquine retinal screening", status: "booked", createdAt: iso(now - 6 * DAY) },
    { id: "rf-3", patientId: "pt-esther", fromId: "sp-chebet", toSpecialty: "Rheumatology", toId: "sp-amina", reason: "Suspected SLE: rash, joint pain, positive ANA", status: "booked", createdAt: iso(now - 5 * DAY) },
    { id: "rf-4", patientId: "pt-samuel", fromId: "sp-kiprono", toSpecialty: "Nephrology", reason: "Rising creatinine on lupus treatment", status: "sent", createdAt: iso(now - 1 * DAY) },
  ];

  const kinds: Incident["kind"][] = ["delay", "delay", "delay", "late_cancellation", "provider_no_show", "patient_no_show", "delay"];
  const res = ["Patient waited, consult started late", "Moved to alternative specialist", "Rescheduled at no cost", "Full refund issued", "Coordinator called patient, rebooked same day"];
  const incidents: Incident[] = Array.from({ length: 26 }, (_, i) => {
    const sp = specialists[Math.floor(((i * 7) % 23) / 23 * specialists.length)];
    const kind = kinds[i % kinds.length];
    return {
      id: `in-${i}`,
      specialistId: sp.id,
      kind,
      minutes: kind === "delay" ? 8 + ((i * 13) % 34) : undefined,
      resolution: kind === "patient_no_show" ? "Patient contacted, follow-up rebooked" : res[i % res.length],
      at: iso(now - (i + 1) * 1.1 * DAY - (i % 5) * HOUR),
      open: i < 2,
    };
  });

  const notices: Notice[] = [
    { id: "n1", to: "patient", patientId: "pt-grace", at: iso(soon - 2 * HOUR), title: "Your review with Dr. Amina is today", body: `Virtual consultation at ${new Date(soon).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}. We will tell you when the doctor is ready.`, channel: "sms", read: false, tone: "info" },
    { id: "n2", to: "patient", patientId: "pt-grace", at: iso(now - 2 * DAY), title: "Home sample collected", body: "Bora Diagnostics collected your blood and urine samples. Results usually take 24 to 48 hours.", channel: "app", read: true, tone: "ok" },
    { id: "n3", to: "patient", patientId: "pt-grace", at: iso(now - 3 * DAY), title: "Refill due in 7 days", body: "Hydroxychloroquine and prednisolone. Tap to request your refill from Tumaini Pharmacy.", channel: "whatsapp", read: true, tone: "info" },
    { id: "n4", to: "specialist", at: iso(now - 30 * MIN), title: "Readiness check opens soon", body: "Please confirm you are ready for Grace Wambui (virtual) before the consultation time.", channel: "app", read: false, tone: "info" },
    { id: "n5", to: "admin", at: iso(now - 50 * MIN), title: "Verification pending", body: "Dr. Peter Sankale submitted credentials 2 days ago.", channel: "app", read: false, tone: "warn" },
  ];

  const audit: Audit[] = [
    { id: "a1", at: iso(now - 2 * DAY), actor: "Bora Diagnostics (rider)", role: "Laboratory", action: "Updated order status: sample collected", resource: "LabOrder lo-grace-now" },
    { id: "a2", at: iso(now - 26 * DAY), actor: "Tumaini Pharmacy", role: "Pharmacy", action: "Viewed prescription (consented scope: prescriptions)", resource: "Prescription rx-grace" },
    { id: "a3", at: iso(now - 62 * DAY), actor: "Dr. Njeri Mwangi", role: "Specialist", action: "Viewed lab results (consented scope: care team)", resource: "LabOrder lo-grace-prev" },
    { id: "a4", at: iso(now - 3 * HOUR), actor: "Admin (Ops)", role: "Administrator", action: "Updated service rule: grace period 10 min", resource: "Rules" },
    { id: "a5", at: iso(now - 4 * HOUR), actor: "Lupus Warriors Support Network", role: "Patient organisation", action: "Access to medical records denied (no clinical scope)", resource: "Patient pt-grace" },
  ];

  const complaints: Complaint[] = [
    { id: "c1", patient: "Esther Atieno", about: "Ziwa Medical Laboratory", category: "Result delay", text: "Results took four days instead of two.", status: "investigating", at: iso(now - 2 * DAY) },
    { id: "c2", patient: "James Mutiso", about: "Dr. Daniel Mutua", category: "Late start", text: "Consult started 35 minutes late with no message.", status: "resolved", at: iso(now - 9 * DAY), refund: 1900 },
    { id: "c3", patient: "Halima Abdi", about: "AfyaPlus Chemists, Nyali", category: "Out of stock", text: "Insulin pen out of stock and nobody called me.", status: "new", at: iso(now - 5 * HOUR) },
  ];

  const consents: Consent[] = [
    { party: "Dr. Amina Odhiambo", partyType: "specialist", scope: "Care team: notes, results, prescriptions", granted: true },
    { party: "Dr. Njeri Mwangi", partyType: "specialist", scope: "Care team: notes, results, prescriptions", granted: true },
    { party: "Dr. Faith Wairimu", partyType: "specialist", scope: "Referral letter and eye-related history", granted: true },
    { party: "Bora Diagnostics", partyType: "lab", scope: "Lab orders and results it produced", granted: true },
    { party: "Tumaini Pharmacy", partyType: "pharmacy", scope: "Prescriptions sent to it", granted: true },
    { party: "Care coordinator (Wanjiku)", partyType: "coordinator", scope: "Appointments, referrals, reminders. No clinical notes", granted: true },
    { party: "Lupus Warriors Support Network", partyType: "org", scope: "Membership and events only. Never medical records", granted: true, locked: true },
  ];

  const verification: VerificationItem[] = [
    { id: "v1", name: "Dr. Peter Sankale", type: "Specialist", regulator: "KMPDC", regNo: "DEMO-MP-17450", submitted: iso(now - 2 * DAY), docs: ["Practising licence 2026", "Specialist registration", "Indemnity cover", "National ID"], status: "pending", specialistId: "sp-sankale" },
    { id: "v2", name: "Kisii Precision Labs", type: "Laboratory", regulator: "KMLTTB", regNo: "DEMO-LAB-2231", submitted: iso(now - 3 * DAY), docs: ["Laboratory licence", "Accreditation certificate", "Data processor registration (ODPC)"], status: "pending" },
    { id: "v3", name: "Nyeri Wellness Pharmacy", type: "Pharmacy", regulator: "PPB", regNo: "DEMO-PPB-8812", submitted: iso(now - 4 * DAY), docs: ["Premises licence", "Superintendent pharmacist registration", "ODPC registration"], status: "pending" },
    { id: "v4", name: "Sickle Cell Circle Kenya", type: "Patient organisation", regulator: "NGO Board / Registrar", regNo: "DEMO-ORG-551", submitted: iso(now - 6 * DAY), docs: ["Registration certificate", "Content safeguarding policy"], status: "approved" },
  ];

  return {
    version: VERSION,
    seededAt: now,
    role: "patient",
    patientId: "pt-grace",
    specialistId: "sp-amina",
    labId: "lab-bora",
    pharmacyId: "ph-tumaini",
    appointments,
    labOrders,
    prescriptions,
    referrals,
    incidents,
    notices,
    audit,
    complaints,
    consents,
    verification,
    rules: { readinessWindowMin: 60, graceMin: 10, recoveryAfterMin: 20, reminderHours: [24, 2], freeCancelHours: 12, maxAltSearchHours: 4 },
    enrolledPathways: ["lupus"],
  };
}

// ---------- actions ----------

export type Action =
  | { type: "role"; role: Role }
  | { type: "reset" }
  | { type: "book"; specialistId: string; at: string; mode: Mode; reason: string }
  | { type: "ready"; id: string }
  | { type: "delay"; id: string; minutes: number }
  | { type: "noShow"; id: string }
  | { type: "choose"; id: string; option: NonNullable<Recovery["chosen"]>; slot?: string }
  | { type: "start"; id: string }
  | { type: "complete"; id: string; notes: string; followUpWeeks: number; labs: string[]; rx: RxItem[] }
  | { type: "cancel"; id: string }
  | { type: "reschedule"; id: string; at: string }
  | { type: "rate"; id: string; rating: number }
  | { type: "labStatus"; id: string; status: LabStatus }
  | { type: "labRelease"; id: string }
  | { type: "rxStatus"; id: string; status: RxStatus; issue?: string }
  | { type: "rxStock"; id: string; index: number; available: boolean; price?: number }
  | { type: "refill"; id: string }
  | { type: "consent"; party: string }
  | { type: "verify"; id: string; status: "approved" | "rejected" }
  | { type: "rules"; rules: Partial<Rules> }
  | { type: "complaint"; id: string; status: Complaint["status"] }
  | { type: "feedback"; about: string; category: string; text: string }
  | { type: "readAll"; role: Role }
  | { type: "referral"; id: string; status: Referral["status"] }
  | { type: "enrol"; pathway: string };

const nameOf = (id: string) => byId(specialists, id)?.name ?? "Specialist";

function alternativeFor(state: State, appt: Appointment) {
  const sp = byId(specialists, appt.specialistId)!;
  const start = new Date(appt.at).getTime();
  const horizon = start + state.rules.maxAltSearchHours * HOUR;
  const busy = state.appointments.filter((a) => ["confirmed", "ready", "delayed"].includes(a.status)).map((a) => a.specialistId + a.at);
  for (const alt of specialists) {
    if (alt.id === sp.id || alt.specialty !== sp.specialty || !alt.verified || !alt.modes.includes("virtual")) continue;
    // Demo assumption: the network keeps a standby slot 20 min after the original time.
    const t = roundTo5(Math.max(Date.now() + 10 * MIN, start + 15 * MIN));
    if (t <= horizon && !busy.includes(alt.id + iso(t))) return { specialistId: alt.id, at: iso(t) };
  }
  return undefined;
}

function nextSlots(state: State, specialistId: string, from: number, n = 3) {
  const sp = byId(specialists, specialistId)!;
  const taken = state.appointments.filter((a) => a.specialistId === specialistId).map((a) => a.at);
  const out: string[] = [];
  for (let d = 0; d < 10 && out.length < n; d++) {
    const day = new Date(from + d * DAY);
    day.setHours(0, 0, 0, 0);
    for (const s of slotsFor(sp, day, taken)) {
      if (s.getTime() > from + 2 * HOUR && out.length < n) out.push(s.toISOString());
    }
  }
  return out;
}

function reducer(state: State, action: Action): State {
  const now = Date.now();
  const t = iso(now);
  const s: State = { ...state };
  const log = (actor: string, role: string, act: string, resource: string) => {
    s.audit = [{ id: uid("a"), at: t, actor, role, action: act, resource }, ...s.audit];
  };
  const notify = (n: Omit<Notice, "id" | "at" | "read">) => {
    s.notices = [{ ...n, id: uid("n"), at: t, read: false }, ...s.notices];
  };
  const patch = (id: string, fn: (a: Appointment) => Appointment) => {
    s.appointments = s.appointments.map((a) => (a.id === id ? fn(a) : a));
  };
  const ev = (label: string, actor: string, tone: TimelineEvent["tone"] = "info"): TimelineEvent => ({ at: t, label, actor, tone });
  const appt = "id" in action ? s.appointments.find((a) => a.id === action.id) : undefined;

  switch (action.type) {
    case "role":
      return { ...state, role: action.role };
    case "reset":
      return { ...seed(), role: state.role };
    case "book": {
      const sp = byId(specialists, action.specialistId)!;
      const a: Appointment = {
        id: uid("ap"), patientId: s.patientId, specialistId: sp.id, at: action.at, mode: action.mode,
        fee: action.mode === "virtual" ? sp.virtualFee : sp.fee, reason: action.reason || "Consultation", status: "confirmed",
        timeline: [ev("Appointment booked (M-Pesa payment simulated)", "Patient", "ok"), ev(`Confirmed by ${sp.clinic}. Reminders scheduled for ${s.rules.reminderHours.join(" h and ")} h before`, "Platform", "ok")],
      };
      s.appointments = [...s.appointments, a];
      notify({ to: "patient", patientId: s.patientId, title: "Booking confirmed", body: `${sp.name}, ${new Date(action.at).toLocaleString("en-KE", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}. Reminders will follow by SMS.`, channel: "sms", tone: "ok" });
      notify({ to: "specialist", title: "New booking", body: `${patients[s.patientId].name}: ${a.reason}`, channel: "app", tone: "info" });
      log(patients[s.patientId].name, "Patient", "Booked appointment", a.id);
      return s;
    }
    case "ready": {
      if (!appt) return state;
      patch(appt.id, (a) => ({ ...a, status: "ready", timeline: [...a.timeline, ev("Specialist confirmed readiness", nameOf(a.specialistId), "ok")] }));
      notify({ to: "patient", patientId: appt.patientId, title: "Your doctor is ready", body: `${nameOf(appt.specialistId)} is ready. ${appt.mode === "virtual" ? "Join the video room at your time." : "Please check in at reception."}`, channel: "sms", tone: "ok" });
      log(nameOf(appt.specialistId), "Specialist", "Confirmed readiness", appt.id);
      return s;
    }
    case "delay": {
      if (!appt) return state;
      const m = action.minutes;
      const incident: Incident = { id: uid("in"), apptId: appt.id, specialistId: appt.specialistId, kind: "delay", minutes: m, resolution: "Pending patient choice", at: t, open: true };
      if (m <= s.rules.recoveryAfterMin) {
        patch(appt.id, (a) => ({ ...a, status: "delayed", delayMin: m, timeline: [...a.timeline, ev(`Specialist reported a ${m} minute delay`, nameOf(a.specialistId), "warn"), ev(`Patient informed with new start time. Inside the ${s.rules.recoveryAfterMin} minute tolerance, so no recovery needed`, "Platform", "info")] }));
        incident.resolution = "Patient informed, waited";
        incident.open = false;
        notify({ to: "patient", patientId: appt.patientId, title: `Running ${m} minutes late`, body: `${nameOf(appt.specialistId)} will start at ${new Date(new Date(appt.at).getTime() + m * MIN).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}. You can still reschedule for free.`, channel: "sms", tone: "warn" });
      } else {
        const recovery: Recovery = { reason: `${nameOf(appt.specialistId)} is delayed by ${m} minutes`, minutes: m, alternative: alternativeFor(s, appt), nextSlots: nextSlots(s, appt.specialistId, now) };
        patch(appt.id, (a) => ({ ...a, status: "recovery", delayMin: m, recovery, timeline: [...a.timeline, ev(`Specialist reported a ${m} minute delay`, nameOf(a.specialistId), "bad"), ev("Delay exceeds tolerance: service recovery started. Options sent to patient, care coordinator alerted", "Platform", "warn")] }));
        notify({ to: "patient", patientId: appt.patientId, title: "Your doctor is delayed. Choose what happens next", body: "Wait, see another qualified specialist sooner, reschedule free, or get a full refund.", channel: "sms", tone: "bad" });
        notify({ to: "admin", title: "Service recovery opened", body: `${nameOf(appt.specialistId)} delayed ${m} min with ${patients[appt.patientId].name}.`, channel: "app", tone: "warn" });
      }
      s.incidents = [incident, ...s.incidents];
      log(nameOf(appt.specialistId), "Specialist", `Reported ${m} min delay`, appt.id);
      return s;
    }
    case "noShow": {
      if (!appt) return state;
      const recovery: Recovery = { reason: `${nameOf(appt.specialistId)} did not confirm readiness and is unreachable`, alternative: alternativeFor(s, appt), nextSlots: nextSlots(s, appt.specialistId, now) };
      patch(appt.id, (a) => ({ ...a, status: "recovery", recovery, timeline: [...a.timeline, ev("Readiness deadline passed with no response. Clinic phoned, no answer", "Platform", "bad"), ev("Service recovery started. Patient offered options, care coordinator assigned", "Platform", "warn")] }));
      s.incidents = [{ id: uid("in"), apptId: appt.id, specialistId: appt.specialistId, kind: "provider_no_show", resolution: "Pending patient choice", at: t, open: true }, ...s.incidents];
      notify({ to: "patient", patientId: appt.patientId, title: "We could not reach your doctor", body: "We are sorry. Choose another specialist, a new time, or a full refund. A coordinator will also call you.", channel: "sms", tone: "bad" });
      notify({ to: "admin", title: "Provider no-show", body: `${nameOf(appt.specialistId)} missed the readiness check.`, channel: "app", tone: "bad" });
      log("Reliability engine", "System", "Flagged provider no-show", appt.id);
      return s;
    }
    case "choose": {
      if (!appt || !appt.recovery) return state;
      const r = appt.recovery;
      const close = (resolution: string) => {
        s.incidents = s.incidents.map((i) => (i.apptId === appt.id && i.open ? { ...i, open: false, resolution } : i));
      };
      if (action.option === "wait") {
        patch(appt.id, (a) => ({ ...a, status: "delayed", recovery: { ...r, chosen: "wait" }, timeline: [...a.timeline, ev("Patient chose to wait for the original specialist", "Patient", "info")] }));
        close("Patient chose to wait");
      } else if (action.option === "alternative" && r.alternative) {
        const alt = byId(specialists, r.alternative.specialistId)!;
        patch(appt.id, (a) => ({ ...a, status: "reassigned", recovery: { ...r, chosen: "alternative" }, timeline: [...a.timeline, ev(`Patient accepted ${alt.name}. Records shared under the care-team consent`, "Patient", "ok")] }));
        const na: Appointment = { id: uid("ap"), patientId: appt.patientId, specialistId: alt.id, at: r.alternative.at, mode: "virtual", fee: appt.fee, reason: `${appt.reason} (moved from ${nameOf(appt.specialistId)})`, status: "ready", timeline: [ev(`Reassigned through service recovery from ${nameOf(appt.specialistId)}`, "Platform", "ok"), ev("Specialist confirmed readiness", alt.name, "ok")] };
        s.appointments = [...s.appointments, na];
        close(`Moved to ${alt.name}`);
        notify({ to: "patient", patientId: appt.patientId, title: `${alt.name} will see you`, body: `Starts ${new Date(r.alternative.at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}. Same fee, no extra charge.`, channel: "sms", tone: "ok" });
      } else if (action.option === "reschedule" && action.slot) {
        patch(appt.id, (a) => ({ ...a, status: "rescheduled", recovery: { ...r, chosen: "reschedule" }, timeline: [...a.timeline, ev("Patient rescheduled at no cost", "Patient", "info")] }));
        s.appointments = [...s.appointments, { ...appt, id: uid("ap"), at: action.slot, status: "confirmed", recovery: undefined, delayMin: undefined, timeline: [ev(`Rebooked through service recovery (priority slot)`, "Platform", "ok")] }];
        close("Rescheduled at no cost");
      } else if (action.option === "refund") {
        patch(appt.id, (a) => ({ ...a, status: "cancelled", recovery: { ...r, chosen: "refund" }, timeline: [...a.timeline, ev(`Full refund of KES ${a.fee.toLocaleString()} sent to M-Pesa`, "Platform", "ok")] }));
        close("Full refund issued");
      }
      log(patients[appt.patientId].name, "Patient", `Recovery option: ${action.option}`, appt.id);
      return s;
    }
    case "start":
      if (!appt) return state;
      patch(appt.id, (a) => ({ ...a, status: "in_consult", timeline: [...a.timeline, ev("Consultation started", "Platform", "ok")] }));
      return s;
    case "complete": {
      if (!appt) return state;
      patch(appt.id, (a) => ({ ...a, status: "completed", notes: action.notes, followUpWeeks: action.followUpWeeks, timeline: [...a.timeline, ev("Consultation completed. Notes, orders and follow-up saved", nameOf(a.specialistId), "ok")] }));
      if (action.labs.length) {
        s.labOrders = [{ id: uid("lo"), patientId: appt.patientId, specialistId: appt.specialistId, labId: "lab-bora", tests: action.labs, status: "requested", collection: "home", createdAt: t }, ...s.labOrders];
        notify({ to: "lab", title: "New lab request", body: `${patients[appt.patientId].name}: ${action.labs.join(", ")}`, channel: "app", tone: "info" });
      }
      if (action.rx.length) {
        s.prescriptions = [{ id: uid("rx"), patientId: appt.patientId, specialistId: appt.specialistId, pharmacyId: "ph-tumaini", items: action.rx, status: "received", delivery: true, createdAt: t, refillsLeft: 2 }, ...s.prescriptions];
        notify({ to: "pharmacy", title: "New e-prescription", body: `${patients[appt.patientId].name}: ${action.rx.map((r) => r.drug).join(", ")}`, channel: "app", tone: "info" });
      }
      notify({ to: "patient", patientId: appt.patientId, title: "Your care plan was updated", body: `Follow-up in ${action.followUpWeeks} weeks.${action.labs.length ? " Lab tests ordered." : ""}${action.rx.length ? " Prescription sent to your pharmacy." : ""}`, channel: "app", tone: "ok" });
      log(nameOf(appt.specialistId), "Specialist", "Completed consultation and wrote notes", appt.id);
      return s;
    }
    case "cancel":
      if (!appt) return state;
      patch(appt.id, (a) => ({ ...a, status: "cancelled", timeline: [...a.timeline, ev("Cancelled by patient. Refund issued under the free-cancellation rule", "Patient", "info")] }));
      log(patients[appt.patientId].name, "Patient", "Cancelled appointment", appt.id);
      return s;
    case "reschedule":
      if (!appt) return state;
      patch(appt.id, (a) => ({ ...a, at: action.at, status: "confirmed", recovery: undefined, delayMin: undefined, timeline: [...a.timeline, ev(`Rescheduled to ${new Date(action.at).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`, "Patient", "info")] }));
      log(patients[appt.patientId].name, "Patient", "Rescheduled appointment", appt.id);
      return s;
    case "rate":
      if (!appt) return state;
      patch(appt.id, (a) => ({ ...a, rating: action.rating }));
      return s;
    case "labStatus": {
      s.labOrders = s.labOrders.map((o) => (o.id === action.id ? { ...o, status: action.status, scheduledFor: o.scheduledFor ?? iso(roundTo5(now + 18 * HOUR)) } : o));
      const o = s.labOrders.find((x) => x.id === action.id)!;
      const msg: Record<LabStatus, string> = { requested: "Request received", booked: "Sample collection booked", sample_collected: "Sample collected", processing: "Your sample is being processed", result_ready: "Results ready" };
      notify({ to: "patient", patientId: o.patientId, title: msg[action.status], body: `${o.tests.join(", ")} at Bora Diagnostics.`, channel: "sms", tone: "info" });
      log("Bora Diagnostics", "Laboratory", `Status: ${action.status}`, o.id);
      return s;
    }
    case "labRelease": {
      const sample: Record<string, LabResultRow[]> = {
        UEC: [{ test: "Creatinine", value: "81", unit: "µmol/L", range: "45 to 90" }, { test: "eGFR", value: "88", unit: "mL/min/1.73m²", range: "> 90", flag: "low" }, { test: "Potassium", value: "4.2", unit: "mmol/L", range: "3.5 to 5.1" }],
        UPCR: [{ test: "Urine protein:creatinine", value: "24", unit: "mg/mmol", range: "< 15", flag: "high" }],
        CBC: [{ test: "Haemoglobin", value: "12.1", unit: "g/dL", range: "12.0 to 15.5" }, { test: "Platelets", value: "232", unit: "× 10⁹/L", range: "150 to 400" }],
        C3C4: [{ test: "Complement C3", value: "0.82", unit: "g/L", range: "0.90 to 1.80", flag: "low" }, { test: "Complement C4", value: "0.14", unit: "g/L", range: "0.10 to 0.40" }],
      };
      s.labOrders = s.labOrders.map((o) => (o.id === action.id ? { ...o, status: "result_ready", releasedAt: t, results: o.tests.flatMap((c) => sample[c] ?? [{ test: c, value: "Normal", unit: "", range: "" }]) } : o));
      const o = s.labOrders.find((x) => x.id === action.id)!;
      notify({ to: "patient", patientId: o.patientId, title: "Your lab results are ready", body: `Shared securely with you and ${nameOf(o.specialistId)}. Your doctor will review them with you.`, channel: "sms", tone: "ok" });
      notify({ to: "specialist", title: "Results ready for review", body: `${patients[o.patientId].name}: ${o.tests.join(", ")}`, channel: "app", tone: "info" });
      log("Bora Diagnostics", "Laboratory", "Released results to patient and ordering specialist (encrypted)", o.id);
      return s;
    }
    case "rxStatus": {
      s.prescriptions = s.prescriptions.map((p) => (p.id === action.id ? { ...p, status: action.status, issue: action.issue } : p));
      const p = s.prescriptions.find((x) => x.id === action.id)!;
      const msg: Record<RxStatus, string> = { received: "Prescription received", verified: "Prescription verified by pharmacist", ready: "Medicines ready", out_for_delivery: "Rider on the way", delivered: "Medicines delivered", issue: "There is a problem with your order" };
      notify({ to: "patient", patientId: p.patientId, title: msg[action.status], body: action.issue ?? "Tumaini Pharmacy updated your order.", channel: action.status === "issue" ? "sms" : "app", tone: action.status === "issue" ? "warn" : "info" });
      log("Tumaini Pharmacy", "Pharmacy", `Status: ${action.status}`, p.id);
      return s;
    }
    case "rxStock":
      s.prescriptions = s.prescriptions.map((p) => (p.id === action.id ? { ...p, items: p.items.map((it, i) => (i === action.index ? { ...it, available: action.available, price: action.price ?? it.price } : it)) } : p));
      return s;
    case "refill": {
      const p = s.prescriptions.find((x) => x.id === action.id);
      if (!p || p.refillsLeft < 1) return state;
      s.prescriptions = [{ ...p, id: uid("rx"), status: "received", createdAt: t, refillsLeft: p.refillsLeft - 1, isRefill: true, nextRefill: iso(now + 28 * DAY) }, ...s.prescriptions.map((x) => (x.id === p.id ? { ...x, nextRefill: undefined } : x))];
      notify({ to: "pharmacy", title: "Refill request", body: `${patients[p.patientId].name}: ${p.items.map((i) => i.drug).join(", ")}`, channel: "app", tone: "info" });
      notify({ to: "patient", patientId: p.patientId, title: "Refill requested", body: "Tumaini Pharmacy will confirm stock and price shortly.", channel: "app", tone: "ok" });
      log(patients[p.patientId].name, "Patient", "Requested refill", p.id);
      return s;
    }
    case "consent":
      s.consents = s.consents.map((c) => (c.party === action.party && !c.locked ? { ...c, granted: !c.granted } : c));
      log(patients[s.patientId].name, "Patient", `Changed consent for ${action.party}`, "Consent");
      return s;
    case "verify":
      s.verification = s.verification.map((v) => (v.id === action.id ? { ...v, status: action.status } : v));
      log("Admin (Ops)", "Administrator", `Verification ${action.status}`, action.id);
      return s;
    case "rules":
      s.rules = { ...s.rules, ...action.rules };
      log("Admin (Ops)", "Administrator", `Updated service rules: ${Object.keys(action.rules).join(", ")}`, "Rules");
      return s;
    case "complaint":
      s.complaints = s.complaints.map((c) => (c.id === action.id ? { ...c, status: action.status } : c));
      log("Admin (Ops)", "Administrator", `Complaint ${action.status}`, action.id);
      return s;
    case "feedback":
      s.complaints = [{ id: uid("c"), patient: patients[s.patientId].name, about: action.about, category: action.category, text: action.text, status: "new", at: t }, ...s.complaints];
      notify({ to: "admin", title: "New patient feedback", body: `${action.category}: ${action.about}`, channel: "app", tone: "info" });
      return s;
    case "readAll":
      s.notices = s.notices.map((n) => (n.to === action.role ? { ...n, read: true } : n));
      return s;
    case "referral":
      s.referrals = s.referrals.map((r) => (r.id === action.id ? { ...r, status: action.status } : r));
      return s;
    case "enrol":
      s.enrolledPathways = s.enrolledPathways.includes(action.pathway) ? s.enrolledPathways.filter((p) => p !== action.pathway) : [...s.enrolledPathways, action.pathway];
      return s;
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      // Demo data is anchored to "now"; reseed when it goes stale.
      if (s.version === VERSION && Date.now() - s.seededAt < 8 * HOUR) return s;
    }
  } catch {
    /* storage unavailable: fall through to a fresh seed */
  }
  return seed();
}

const Ctx = createContext<{ state: State; dispatch: (a: Action) => void } | null>(null);

// Instant confirmation for every action, so a tap never feels like it did nothing.
function feedback(a: Action, s: State): [string, "ok" | "warn" | "info", string?] | undefined {
  switch (a.type) {
    case "book": return ["Booked. Confirmation sent by SMS", "ok"];
    case "ready": return ["Readiness confirmed. Patient notified", "ok"];
    case "delay": return a.minutes > s.rules.recoveryAfterMin ? ["Delay reported. Service recovery started for the patient", "warn"] : ["Delay reported. Patient told the new start time", "info"];
    case "noShow": return ["No response flagged. Patient offered options", "warn"];
    case "choose": return [{ wait: "You chose to wait. We'll update you", alternative: "Done. Your new doctor is ready", reschedule: "Rescheduled free of charge", refund: "Refund sent to M-Pesa" }[a.option], "ok"];
    case "start": return ["Consultation started", "ok"];
    case "complete": return ["Consultation saved. Orders sent", "ok"];
    case "cancel": return ["Appointment cancelled. Refund issued", "ok"];
    case "reschedule": return ["Rescheduled. New time sent by SMS", "ok"];
    case "rate": return ["Thanks for rating your visit", "ok"];
    case "labStatus": return ["Order updated. Patient notified", "ok"];
    case "labRelease": return ["Results released securely", "ok"];
    case "rxStatus": return a.status === "issue" ? ["Patient told about the stock issue", "warn"] : ["Order updated. Patient notified", "ok"];
    case "rxStock": return ["Stock and price saved", "ok", "rxStock"];
    case "refill": return ["Refill requested from your pharmacy", "ok"];
    case "consent": return ["Sharing preference updated", "ok", "consent"];
    case "verify": return [a.status === "approved" ? "Provider approved" : "More information requested", "ok"];
    case "rules": return ["Service rule saved", "ok", "rules"];
    case "complaint": return [`Complaint marked ${a.status}`, "ok"];
    case "feedback": return ["Feedback sent to the platform team", "ok"];
    case "referral": return ["Referral accepted", "ok"];
    case "enrol": return ["Care plan updated", "ok", "enrol"];
    case "reset": return ["Demo data reset", "info"];
    default: return undefined;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);
  const rulesRef = useRef(state);
  rulesRef.current = state;
  const dispatch = useCallback((a: Action) => {
    rawDispatch(a);
    const f = feedback(a, rulesRef.current);
    if (f) toast(navigator.onLine ? f[0] : `${f[0]}. Saved on this device while offline`, f[1], f[2]);
  }, []);
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
