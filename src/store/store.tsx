import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { toast } from "../components/Toaster";
import { byId, labs, pharmacies, specialists, slotsFor, type Mode, type Specialist } from "../data/seed";
import { FEATURES } from "../lib/features";

export type Role = "patient" | "specialist" | "lab" | "pharmacy" | "org" | "admin";

export type ApptStatus =
  | "requested" // booked and paid (held); waiting for the specialist to confirm
  | "declined" // specialist could not take the slot; payment released
  | "confirmed" // confirmed by the specialist, waiting for the readiness window
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

export interface Reminder {
  id: string;
  label: string;
  at: string;
  channels: ("sms" | "app")[];
  to: ("patient" | "specialist")[];
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
  requestedAt?: string;
  confirmedAt?: string;
  joinCode?: string; // video room code, created when the specialist confirms a virtual visit
  reminders?: Reminder[];
  testsAdvised?: string[]; // tests the specialist recommended (labs connect in a later phase)
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

export type RxStatus =
  | "issued" // written by the specialist; the patient chooses where to fill it
  | "shared" // patient picked a pharmacy; digital hand-off arrives with the pharmacy phase
  | "collected" // patient confirms they have the medicine
  | "received"
  | "verified"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "issue";
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
  pharmacyId?: string;
  code?: string;
  apptId?: string;
  sharedAt?: string;
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

export type Channel = "app" | "sms" | "whatsapp";

export interface Notice {
  id: string;
  to: Role;
  patientId?: string;
  specialistId?: string;
  at: string;
  title: string;
  body: string;
  channel: Channel;
  also?: Channel[]; // same message sent on these channels too
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
  patientId: string;
  party: string;
  partyType: "specialist" | "lab" | "pharmacy" | "org" | "coordinator";
  scope: string;
  granted: boolean;
  locked?: boolean;
}

export interface VerificationItem {
  id: string;
  name: string;
  type: "Specialist" | "Laboratory" | "Pharmacy" | "Patient organisation" | "Patient ID";
  regulator: string;
  regNo: string;
  submitted: string;
  docs: string[];
  status: "pending" | "approved" | "rejected";
  specialistId?: string;
  patientId?: string;
}

export interface Rules {
  readinessWindowMin: number;
  graceMin: number;
  recoveryAfterMin: number;
  reminderHours: number[];
  freeCancelHours: number;
  maxAltSearchHours: number;
}

export interface Kyc {
  status: "pending" | "verified";
  idType: "National ID" | "Passport" | "Alien ID" | "Birth certificate";
  idMasked: string; // only the last digits are ever stored in this preview
  dob: string;
  sex: "Female" | "Male" | "Prefer not to say";
  nationality: string;
  county: string;
  town: string;
  language: string;
  submittedAt: string;
  verifiedAt?: string;
  idDoc?: string;
  selfie?: string;
  guardian?: { name: string; relation: string; phone: string };
}

export interface PatientProfile {
  name: string;
  age: number;
  county: string;
  phone: string;
  conditions: string[];
  email?: string;
  kyc?: Kyc;
  allergies?: string[];
  medications?: string[];
  bloodGroup?: string;
  emergency?: { name: string; relation: string; phone: string };
  insurance?: { scheme: string; number: string };
  registered?: boolean;
  createdAt?: string;
  consentAt?: string;
  consentVersion?: string;
  shareWithBookedSpecialists?: boolean;
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
  enrolment: Record<string, string[]>;
  profiles: Record<string, PatientProfile>; // registered patients; the demo patients are built in
  myPatientId?: string; // the person who registered on this device
}

const kyc = (idMasked: string, dob: string, sex: Kyc["sex"], county: string, town: string): Kyc => ({
  status: "verified", idType: "National ID", idMasked, dob, sex, nationality: "Kenyan", county, town, language: "English, Kiswahili",
  submittedAt: "2026-01-10T08:00:00.000Z", verifiedAt: "2026-01-10T12:00:00.000Z",
});

export const patients: Record<string, PatientProfile> = {
  "pt-grace": {
    name: "Grace Wambui", age: 34, county: "Nairobi (Kasarani)", phone: "+254 7•• ••• 214", conditions: ["Lupus (SLE)"],
    kyc: kyc("••••4821", "1992-03-14", "Female", "Nairobi", "Kasarani"), bloodGroup: "O+", allergies: ["Sulfonamide antibiotics"],
    medications: ["Hydroxychloroquine 200 mg daily", "Prednisolone 5 mg daily", "Calcium + Vitamin D3"],
    emergency: { name: "Peter Wambui", relation: "Brother", phone: "+254 7•• ••• 903" }, insurance: { scheme: "SHA", number: "••••6021" },
  },
  "pt-james": { name: "James Mutiso", age: 52, county: "Machakos", phone: "+254 7•• ••• 880", conditions: ["Rheumatoid arthritis"], kyc: kyc("••••3375", "1974-06-02", "Male", "Machakos", "Machakos Town"), bloodGroup: "A+" },
  "pt-halima": { name: "Halima Abdi", age: 41, county: "Mombasa", phone: "+254 7•• ••• 302", conditions: ["Type 2 diabetes"], kyc: kyc("••••9012", "1985-11-21", "Female", "Mombasa", "Nyali"), bloodGroup: "B+" },
  "pt-peter": { name: "Peter Kamau", age: 63, county: "Kiambu", phone: "+254 7•• ••• 551", conditions: ["Gout", "Hypertension"], kyc: kyc("••••7788", "1963-01-09", "Male", "Kiambu", "Ruiru"), bloodGroup: "O+" },
  "pt-esther": { name: "Esther Atieno", age: 29, county: "Kisumu", phone: "+254 7•• ••• 117", conditions: ["Lupus (SLE)"], kyc: kyc("••••2290", "1997-08-30", "Female", "Kisumu", "Milimani"), bloodGroup: "AB+" },
  "pt-samuel": { name: "Samuel Kiptoo", age: 47, county: "Uasin Gishu", phone: "+254 7•• ••• 640", conditions: ["Lupus nephritis"], kyc: kyc("••••5516", "1979-04-17", "Male", "Uasin Gishu", "Eldoret"), bloodGroup: "O-" },
};

const DEMO_PATIENT = "pt-grace";

export function registerProfile(id: string, p: PatientProfile) {
  patients[id] = p;
}

const VERSION = 4;
const KEY = "afyaconnect-state";
const OLD_KEYS = ["unganisha-demo-state"];
const STALE_MS = 8 * 60 * 60 * 1000;
export const ACCESS_DAYS = 90; // a specialist keeps file access this long after a completed visit
export const RX_REMINDER_HOURS = [1, 24, 72, 168];
export const REGISTERED_PREFIX = "pt-me-";
const MIN = 60000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

let counter = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}${(counter++).toString(36)}`;
const iso = (t: number) => new Date(t).toISOString();

function roundTo5(t: number) {
  return Math.ceil(t / (5 * MIN)) * 5 * MIN;
}

// Codes are derived from ids so reducers stay pure.
function seededRandom(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const CODE_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
function codeFor(seedStr: string, n: number) {
  const r = seededRandom(seedStr);
  return Array.from({ length: n }, () => CODE_CHARS[Math.floor(r() * CODE_CHARS.length)]).join("");
}
export const roomCodeFor = (id: string) => {
  const c = codeFor("room" + id, 10);
  return `${c.slice(0, 3)}-${c.slice(3, 7)}-${c.slice(7)}`;
};
export const rxCodeFor = (id: string) => "RX-" + codeFor("rx" + id, 6).toUpperCase();
export const roomUrl = (code: string) => `${typeof location !== "undefined" ? location.origin : ""}/room/${code}`;

const fmtWhen = (d: string) => new Date(d).toLocaleString("en-KE", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Reminders go to the patient and the specialist, by SMS and in the app.
export function buildReminders(atISO: string, mode: Mode, includePast = false): Reminder[] {
  const at = new Date(atISO).getTime();
  const all: Reminder[] = [
    { id: "r24", label: "24 hours before", at: iso(at - 24 * HOUR), channels: ["sms", "app"], to: ["patient", "specialist"] },
    { id: "r2", label: "2 hours before", at: iso(at - 2 * HOUR), channels: ["sms", "app"], to: ["patient", "specialist"] },
    { id: "r15", label: mode === "virtual" ? "15 minutes before, with the video link" : "15 minutes before, with directions", at: iso(at - 15 * MIN), channels: ["sms", "app"], to: ["patient", "specialist"] },
  ];
  return includePast ? all : all.filter((r) => new Date(r.at).getTime() > Date.now());
}

// After a prescription is issued the patient keeps getting reminders until they pick a pharmacy.
export function rxReminderState(p: Pick<Prescription, "status" | "createdAt">, now = Date.now()) {
  if (p.status !== "issued") return undefined;
  const base = new Date(p.createdAt).getTime();
  const since = (now - base) / HOUR;
  const nextH = RX_REMINDER_HOURS.find((h) => h > since);
  return {
    sent: RX_REMINDER_HOURS.filter((h) => h <= since).length,
    total: RX_REMINDER_HOURS.length,
    nextAt: nextH === undefined ? undefined : new Date(base + nextH * HOUR),
  };
}

// A specialist can open a patient's file only once they have confirmed a booking
// with that patient (and for ACCESS_DAYS after a completed visit). The patient can withdraw it.
export function fileAccess(s: Pick<State, "appointments" | "consents">, specialistId: string, patientId: string): "granted" | "pending" | "restricted" | "none" {
  const now = Date.now();
  const mine = s.appointments.filter((a) => a.specialistId === specialistId && a.patientId === patientId);
  const ok = mine.some(
    (a) => ["confirmed", "ready", "delayed", "recovery", "in_consult"].includes(a.status) || (a.status === "completed" && now - new Date(a.at).getTime() < ACCESS_DAYS * DAY),
  );
  if (!ok) return mine.some((a) => a.status === "requested") ? "pending" : "none";
  const c = s.consents.find((x) => x.patientId === patientId && x.party === nameOf(specialistId));
  return c && !c.granted ? "restricted" : "granted";
}

export function pathwaysFor(conditions: string[]) {
  const t = conditions.join(" ").toLowerCase();
  const out: string[] = [];
  if (/lupus/.test(t)) out.push("lupus");
  if (/diabet/.test(t)) out.push("diabetes");
  if (/hypertens|blood pressure/.test(t)) out.push("hypertension");
  if (/kidney|ckd|nephr/.test(t)) out.push("ckd");
  return out;
}

export const enrolledOf = (s: Pick<State, "enrolment" | "patientId">) => s.enrolment[s.patientId] ?? [];

function withConsent(consents: Consent[], patientId: string, sp: Specialist): Consent[] {
  if (consents.some((c) => c.patientId === patientId && c.party === sp.name)) return consents;
  return [...consents, { patientId, party: sp.name, partyType: "specialist", scope: "Your history, visit notes and prescriptions, for the care they give you", granted: patients[patientId]?.shareWithBookedSpecialists !== false }];
}

// Registered patients (and everything that belongs to them) survive a demo refresh or reset.
function keepUserData(old: State, fresh: State): State {
  const mine = Object.keys(old.profiles).filter((id) => old.profiles[id].registered);
  const base = { ...fresh, role: old.role, specialistId: old.specialistId };
  if (!mine.length) return base;
  const own = new Set(mine);
  const mineAppts = old.appointments.filter((a) => own.has(a.patientId));
  const apptIds = new Set(mineAppts.map((a) => a.id));
  const touches = (resource: string) => mine.some((id) => resource.includes(id)) || [...apptIds].some((id) => resource.includes(id));
  return {
    ...base,
    patientId: own.has(old.patientId) || old.patientId === DEMO_PATIENT ? old.patientId : DEMO_PATIENT,
    myPatientId: old.myPatientId,
    profiles: Object.fromEntries(mine.map((id) => [id, old.profiles[id]])),
    enrolment: { ...fresh.enrolment, ...Object.fromEntries(mine.map((id) => [id, old.enrolment[id] ?? []])) },
    appointments: [...fresh.appointments, ...mineAppts],
    labOrders: [...fresh.labOrders, ...old.labOrders.filter((o) => own.has(o.patientId))],
    prescriptions: [...fresh.prescriptions, ...old.prescriptions.filter((p) => own.has(p.patientId))],
    referrals: [...fresh.referrals, ...old.referrals.filter((r) => own.has(r.patientId))],
    consents: [...fresh.consents, ...old.consents.filter((c) => own.has(c.patientId))],
    verification: [...old.verification.filter((v) => v.patientId && own.has(v.patientId)), ...fresh.verification],
    notices: [...old.notices.filter((n) => n.patientId && own.has(n.patientId)), ...fresh.notices],
    audit: [...old.audit.filter((a) => touches(a.resource)), ...fresh.audit],
    incidents: [...old.incidents.filter((i) => i.apptId && apptIds.has(i.apptId)), ...fresh.incidents],
  };
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

  // An incoming request, so the specialist portal opens with something to confirm.
  const tomorrow = new Date(now + DAY);
  tomorrow.setHours(10, 30, 0, 0);
  appointments.push({
    id: "ap-peter-req", patientId: "pt-peter", specialistId: "sp-amina", at: tomorrow.toISOString(), mode: "virtual", fee: 3500, reason: "Gout follow-up and blood pressure check", status: "requested", requestedAt: iso(now - 12 * MIN),
    timeline: [ev(now - 12 * MIN, "Booking request sent. Payment (M-Pesa) is held until the doctor confirms", "Patient", "ok"), ev(now - 12 * MIN, "Waiting for Dr. Amina Odhiambo to confirm", "Platform", "info")],
  });
  appointments.find((a) => a.id === "ap-grace-past1")!.testsAdvised = ["Kidney function (UEC)", "Urine protein:creatinine", "Full blood count"];
  for (const a of appointments) {
    if (a.status !== "confirmed") continue;
    a.confirmedAt = a.timeline[1]?.at ?? a.timeline[0].at;
    a.reminders = buildReminders(a.at, a.mode, true);
    if (a.mode === "virtual") a.joinCode = roomCodeFor(a.id);
  }

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

  for (const p of prescriptions) p.code = rxCodeFor(p.id);

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
    { id: "n2", to: "patient", patientId: "pt-grace", at: iso(now - 2 * DAY), title: "Tests recommended before your review", body: "Dr. Amina Odhiambo advised a kidney panel, urine protein and a full blood count. Your results will sit in your health record.", channel: "sms", also: ["app"], read: true, tone: "info" },
    { id: "n3", to: "patient", patientId: "pt-grace", at: iso(now - 3 * DAY), title: "Refill due in 7 days", body: "Hydroxychloroquine and prednisolone. Tap to request your refill, then choose the pharmacy you prefer.", channel: "whatsapp", read: true, tone: "info" },
    { id: "n4", to: "specialist", specialistId: "sp-amina", at: iso(now - 30 * MIN), title: "Readiness check opens soon", body: "Please confirm you are ready for Grace Wambui (virtual) before the consultation time.", channel: "app", read: false, tone: "info" },
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
    { patientId: "pt-grace", party: "Dr. Amina Odhiambo", partyType: "specialist", scope: "Care team: notes, results, prescriptions", granted: true },
    { patientId: "pt-grace", party: "Dr. Njeri Mwangi", partyType: "specialist", scope: "Care team: notes, results, prescriptions", granted: true },
    { patientId: "pt-grace", party: "Dr. Faith Wairimu", partyType: "specialist", scope: "Referral letter and eye-related history", granted: true },
    { patientId: "pt-grace", party: "Bora Diagnostics", partyType: "lab", scope: "Lab orders and results it produced", granted: true },
    { patientId: "pt-grace", party: "Tumaini Pharmacy", partyType: "pharmacy", scope: "Prescriptions sent to it", granted: true },
    { patientId: "pt-grace", party: "Care coordinator (Wanjiku)", partyType: "coordinator", scope: "Appointments, referrals, reminders. No clinical notes", granted: true },
    { patientId: "pt-grace", party: "Lupus Warriors Support Network", partyType: "org", scope: "Membership and events only. Never medical records", granted: true, locked: true },
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
    enrolment: { "pt-grace": ["lupus"] },
    profiles: {},
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
  | { type: "enrol"; pathway: string }
  | { type: "accept"; id: string }
  | { type: "decline"; id: string; reason?: string }
  | { type: "register"; id: string; profile: PatientProfile }
  | { type: "profileUpdate"; id: string; patch: Partial<PatientProfile> }
  | { type: "usePatient"; id: string }
  | { type: "viewAsSpecialist"; id: string }
  | { type: "rxShare"; id: string; pharmacyId: string }
  | { type: "rxCollect"; id: string }
  | { type: "openFile"; specialistId: string; patientId: string }
  | { type: "deleteAccount"; id: string };

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
      return keepUserData(state, seed());
    case "book": {
      const sp = byId(specialists, action.specialistId)!;
      const pid = s.patientId;
      const p = patients[pid];
      const a: Appointment = {
        id: uid("ap"), patientId: pid, specialistId: sp.id, at: action.at, mode: action.mode,
        fee: action.mode === "virtual" ? sp.virtualFee : sp.fee, reason: action.reason || "Consultation", status: "requested", requestedAt: t,
        timeline: [
          ev("Booking request sent. Payment (M-Pesa, simulated) is held until the doctor confirms", "Patient", "ok"),
          ev(`Waiting for ${sp.name} to confirm. Specialists usually answer within 15 minutes`, "Platform", "info"),
        ],
      };
      s.appointments = [...s.appointments, a];
      const when = fmtWhen(action.at);
      const what = action.mode === "virtual" ? "your video link" : "the visit details";
      notify({ to: "patient", patientId: pid, title: "Booking request sent", body: `${sp.name}, ${when}. As soon as the doctor confirms you get ${what} and reminders by SMS and in the app.`, channel: "sms", also: ["app"], tone: "info" });
      notify({ to: "specialist", specialistId: sp.id, title: "New booking request", body: `${p.name}: ${a.reason}. ${when}. Confirm to share the ${action.mode === "virtual" ? "video link" : "visit details"} and open the patient's file to you.`, channel: "app", also: ["sms"], tone: "warn" });
      log(p.name, "Patient", "Requested appointment (payment held)", a.id);
      return s;
    }
    case "accept": {
      if (!appt || appt.status !== "requested") return state;
      const sp = byId(specialists, appt.specialistId)!;
      const code = appt.mode === "virtual" ? roomCodeFor(appt.id) : undefined;
      const reminders = buildReminders(appt.at, appt.mode);
      const when = fmtWhen(appt.at);
      const pat = patients[appt.patientId];
      patch(appt.id, (a) => ({
        ...a, status: "confirmed", confirmedAt: t, joinCode: code, reminders,
        timeline: [
          ...a.timeline,
          ev(`Confirmed by ${sp.name}`, sp.name, "ok"),
          ...(code ? [ev("Video link created and sent to both of you by SMS and in the app", "Platform", "ok")] : []),
          ev(`Reminders set for both of you (SMS and app): ${reminders.length ? reminders.map((r) => r.label.split(",")[0]).join(", ") : "starting soon"}`, "Platform", "info"),
          ev(`Patient file opened to ${sp.name} for this booking. The patient can withdraw access at any time`, "Platform", "info"),
        ],
      }));
      s.consents = withConsent(s.consents, appt.patientId, sp);
      notify({ to: "patient", patientId: appt.patientId, title: `Confirmed with ${sp.name}`, body: code ? `${when}. Your video link: ${roomUrl(code).replace(/^https?:\/\//, "")}. We remind you 24 h, 2 h and 15 min before.` : `${when} at ${sp.clinic}. We remind you 24 h, 2 h and 15 min before.`, channel: "sms", also: ["app"], tone: "ok" });
      notify({ to: "specialist", specialistId: sp.id, title: "Booking confirmed", body: `${pat.name}, ${when}. Reminders will reach you and the patient. The patient's file is now open to you.`, channel: "app", also: ["sms"], tone: "ok" });
      log(sp.name, "Specialist", "Confirmed booking; patient file opened for this visit", appt.id);
      return s;
    }
    case "decline": {
      if (!appt || appt.status !== "requested") return state;
      const sp = nameOf(appt.specialistId);
      patch(appt.id, (a) => ({ ...a, status: "declined", timeline: [...a.timeline, ev(`${sp} could not take this slot${action.reason ? `: ${action.reason}` : ""}. Payment released in full`, sp, "warn")] }));
      notify({ to: "patient", patientId: appt.patientId, title: `${sp} can't take that slot`, body: "You have not been charged. Pick another time or another specialist.", channel: "sms", also: ["app"], tone: "warn" });
      log(sp, "Specialist", "Declined booking request", appt.id);
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
        const naId = uid("ap");
        s.consents = withConsent(s.consents, appt.patientId, alt);
        const na: Appointment = { id: naId, joinCode: roomCodeFor(naId), patientId: appt.patientId, specialistId: alt.id, at: r.alternative.at, mode: "virtual", fee: appt.fee, reason: `${appt.reason} (moved from ${nameOf(appt.specialistId)})`, status: "ready", timeline: [ev(`Reassigned through service recovery from ${nameOf(appt.specialistId)}`, "Platform", "ok"), ev("Specialist confirmed readiness", alt.name, "ok")] };
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
      const sp = nameOf(appt.specialistId);
      const catalog = labs.flatMap((l) => l.tests);
      const advised = action.labs.map((c) => catalog.find((x) => x.code === c)?.name ?? c);
      patch(appt.id, (a) => ({
        ...a, status: "completed", notes: action.notes, followUpWeeks: action.followUpWeeks, testsAdvised: advised.length ? advised : undefined,
        timeline: [...a.timeline, ev("Consultation completed. Summary, advice and follow-up saved to the patient's record", sp, "ok")],
      }));
      if (action.labs.length && FEATURES.lab) {
        s.labOrders = [{ id: uid("lo"), patientId: appt.patientId, specialistId: appt.specialistId, labId: "lab-bora", tests: action.labs, status: "requested", collection: "home", createdAt: t }, ...s.labOrders];
        notify({ to: "lab", title: "New lab request", body: `${patients[appt.patientId].name}: ${action.labs.join(", ")}`, channel: "app", tone: "info" });
      }
      let rx: Prescription | undefined;
      if (action.rx.length) {
        const rid = uid("rx");
        rx = {
          id: rid, patientId: appt.patientId, specialistId: appt.specialistId, apptId: appt.id, code: rxCodeFor(rid), items: action.rx, delivery: true, createdAt: t, refillsLeft: 2,
          status: FEATURES.pharmacy ? "received" : "issued", pharmacyId: FEATURES.pharmacy ? "ph-tumaini" : undefined,
        };
        s.prescriptions = [rx, ...s.prescriptions];
        if (FEATURES.pharmacy) notify({ to: "pharmacy", title: "New e-prescription", body: `${patients[appt.patientId].name}: ${action.rx.map((r) => r.drug).join(", ")}`, channel: "app", tone: "info" });
      }
      notify({ to: "patient", patientId: appt.patientId, title: "Visit summary added to your record", body: `${sp} saved your summary. Follow-up in ${action.followUpWeeks} weeks, with reminders.`, channel: "app", tone: "ok" });
      if (advised.length && !FEATURES.lab) notify({ to: "patient", patientId: appt.patientId, title: "Tests recommended", body: `${advised.join(", ")}. Take them at any accredited lab and bring the results to your next visit. Digital lab booking comes in a later phase.`, channel: "sms", also: ["app"], tone: "info" });
      if (rx) notify({ to: "patient", patientId: appt.patientId, title: "Prescription ready: choose your pharmacy", body: `${sp} issued prescription ${rx.code}. Pick the pharmacy you prefer. We will keep reminding you until it is done.`, channel: "sms", also: ["app"], tone: "warn" });
      log(sp, "Specialist", "Completed consultation and wrote notes", appt.id);
      return s;
    }
    case "cancel":
      if (!appt) return state;
      patch(appt.id, (a) => ({ ...a, status: "cancelled", timeline: [...a.timeline, ev(a.status === "requested" ? "Cancelled before the doctor confirmed. Payment released in full" : "Cancelled by patient. Refund issued under the free-cancellation rule", "Patient", "info")] }));
      if (appt.status === "confirmed") notify({ to: "specialist", specialistId: appt.specialistId, title: "Appointment cancelled", body: `${patients[appt.patientId].name} cancelled ${fmtWhen(appt.at)}. The slot is free again.`, channel: "app", also: ["sms"], tone: "warn" });
      log(patients[appt.patientId].name, "Patient", "Cancelled appointment", appt.id);
      return s;
    case "reschedule":
      if (!appt) return state;
      patch(appt.id, (a) => {
        const pending = a.status === "requested";
        return {
          ...a, at: action.at, status: pending ? "requested" : "confirmed", recovery: undefined, delayMin: undefined,
          reminders: pending ? a.reminders : buildReminders(action.at, a.mode),
          timeline: [...a.timeline, ev(`Rescheduled to ${new Date(action.at).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}${pending ? ". Still waiting for the doctor to confirm" : ". Reminders and the video link carry over"}`, "Patient", "info")],
        };
      });
      notify({ to: "specialist", specialistId: appt.specialistId, title: "Appointment moved", body: `${patients[appt.patientId].name} moved to ${fmtWhen(action.at)}.`, channel: "app", tone: "info" });
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
      notify({ to: "specialist", specialistId: o.specialistId, title: "Results ready for review", body: `${patients[o.patientId].name}: ${o.tests.join(", ")}`, channel: "app", tone: "info" });
      log("Bora Diagnostics", "Laboratory", "Released results to patient and ordering specialist (encrypted)", o.id);
      return s;
    }
    case "rxStatus": {
      s.prescriptions = s.prescriptions.map((p) => (p.id === action.id ? { ...p, status: action.status, issue: action.issue } : p));
      const p = s.prescriptions.find((x) => x.id === action.id)!;
      const msg: Record<RxStatus, string> = { issued: "Prescription issued", shared: "Prescription shared", collected: "Medicines collected", received: "Prescription received", verified: "Prescription verified by pharmacist", ready: "Medicines ready", out_for_delivery: "Rider on the way", delivered: "Medicines delivered", issue: "There is a problem with your order" };
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
      const nid = uid("rx");
      const copy: Prescription = {
        ...p, id: nid, code: rxCodeFor(nid), createdAt: t, refillsLeft: p.refillsLeft - 1, isRefill: true, nextRefill: iso(now + 28 * DAY), sharedAt: undefined, issue: undefined,
        status: FEATURES.pharmacy ? "received" : "issued", pharmacyId: FEATURES.pharmacy ? p.pharmacyId : undefined,
      };
      s.prescriptions = [copy, ...s.prescriptions.map((x) => (x.id === p.id ? { ...x, nextRefill: undefined } : x))];
      if (FEATURES.pharmacy) {
        notify({ to: "pharmacy", title: "Refill request", body: `${patients[p.patientId].name}: ${p.items.map((i) => i.drug).join(", ")}`, channel: "app", tone: "info" });
        notify({ to: "patient", patientId: p.patientId, title: "Refill requested", body: "Your pharmacy will confirm stock and price shortly.", channel: "app", tone: "ok" });
      } else {
        notify({ to: "patient", patientId: p.patientId, title: "Refill ready: choose your pharmacy", body: `${p.items.map((i) => i.drug).join(", ")}. Pick where to fill it. We will remind you until it is done.`, channel: "sms", also: ["app"], tone: "warn" });
      }
      log(patients[p.patientId].name, "Patient", "Requested refill", p.id);
      return s;
    }
    case "rxShare": {
      const p = s.prescriptions.find((x) => x.id === action.id);
      const ph = action.pharmacyId === "other" ? { id: "other", name: "your own pharmacy" } : byId(pharmacies, action.pharmacyId);
      if (!p || !ph) return state;
      s.prescriptions = s.prescriptions.map((x) => (x.id === p.id ? { ...x, pharmacyId: ph.id, status: FEATURES.pharmacy ? "received" : "shared", sharedAt: t } : x));
      notify({ to: "patient", patientId: p.patientId, title: `Prescription shared with ${ph.name}`, body: FEATURES.pharmacy ? "They will confirm stock and price shortly." : `Show code ${p.code} at the counter. Direct hand-off to pharmacies arrives in a later phase. We will remind you to collect.`, channel: "app", also: FEATURES.pharmacy ? undefined : ["sms"], tone: "ok" });
      if (FEATURES.pharmacy) notify({ to: "pharmacy", title: "New e-prescription", body: `${patients[p.patientId].name}: ${p.items.map((i) => i.drug).join(", ")}`, channel: "app", tone: "info" });
      log(patients[p.patientId].name, "Patient", `Chose ${ph.name} for prescription (patient's choice)`, p.id);
      return s;
    }
    case "rxCollect": {
      const p = s.prescriptions.find((x) => x.id === action.id);
      if (!p) return state;
      s.prescriptions = s.prescriptions.map((x) => (x.id === p.id ? { ...x, status: "collected" } : x));
      log(patients[p.patientId].name, "Patient", "Confirmed medicines collected", p.id);
      return s;
    }
    case "consent":
      s.consents = s.consents.map((c) => (c.patientId === s.patientId && c.party === action.party && !c.locked ? { ...c, granted: !c.granted } : c));
      log(patients[s.patientId].name, "Patient", `Changed consent for ${action.party}`, `Consent ${s.patientId}`);
      return s;
    case "verify": {
      s.verification = s.verification.map((v) => (v.id === action.id ? { ...v, status: action.status } : v));
      const v = s.verification.find((x) => x.id === action.id);
      const prof = v?.patientId ? patients[v.patientId] : undefined;
      if (v?.patientId && prof?.kyc) {
        const ok = action.status === "approved";
        const next: PatientProfile = { ...prof, kyc: { ...prof.kyc, status: ok ? "verified" : "pending", verifiedAt: ok ? t : undefined } };
        registerProfile(v.patientId, next);
        s.profiles = { ...s.profiles, [v.patientId]: next };
        notify({ to: "patient", patientId: v.patientId, title: ok ? "Your ID is verified" : "We need a clearer ID photo", body: ok ? "Your profile is fully verified. Doctors can see a verified badge." : "Please upload the front of your ID again from your profile.", channel: "sms", also: ["app"], tone: ok ? "ok" : "warn" });
      }
      log("Admin (Ops)", "Administrator", `Verification ${action.status}`, action.id);
      return s;
    }
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
    case "enrol": {
      const cur = s.enrolment[s.patientId] ?? [];
      s.enrolment = { ...s.enrolment, [s.patientId]: cur.includes(action.pathway) ? cur.filter((p) => p !== action.pathway) : [...cur, action.pathway] };
      return s;
    }
    case "register": {
      const pr = action.profile;
      registerProfile(action.id, pr);
      s.profiles = { ...s.profiles, [action.id]: pr };
      s.myPatientId = action.id;
      s.patientId = action.id;
      s.role = "patient";
      s.enrolment = { ...s.enrolment, [action.id]: pathwaysFor(pr.conditions) };
      s.consents = [
        ...s.consents,
        { patientId: action.id, party: "Care coordinator", partyType: "coordinator", scope: "Appointments, reminders and help with booking. No clinical notes", granted: true },
      ];
      if (pr.kyc) {
        s.verification = [
          {
            id: uid("v"), name: pr.name, type: "Patient ID", regulator: "ID check (demo)", regNo: `${pr.kyc.idType} ${pr.kyc.idMasked}`, submitted: t, status: "pending", patientId: action.id,
            docs: [pr.kyc.idType + " (front)" + (pr.kyc.idDoc ? ": " + pr.kyc.idDoc : ""), pr.kyc.selfie ? "Selfie: " + pr.kyc.selfie : "No selfie supplied", "Date of birth and name match check"],
          },
          ...s.verification,
        ];
      }
      notify({ to: "patient", patientId: action.id, title: `Welcome, ${pr.name.split(" ")[0]}`, body: "Your account is ready. Book your first specialist. We will confirm your ID within 24 hours.", channel: "sms", also: ["app"], tone: "ok" });
      notify({ to: "admin", title: "New patient ID check", body: `${pr.name} registered and submitted ID for verification.`, channel: "app", tone: "info" });
      log(pr.name, "Patient", "Registered. Consent recorded (privacy notice v1)", `Patient ${action.id}`);
      return s;
    }
    case "profileUpdate": {
      const cur = patients[action.id];
      if (!cur) return state;
      const next: PatientProfile = { ...cur, ...action.patch };
      registerProfile(action.id, next);
      s.profiles = { ...s.profiles, [action.id]: next };
      log(next.name, "Patient", `Updated profile: ${Object.keys(action.patch).join(", ")}`, `Patient ${action.id}`);
      return s;
    }
    case "usePatient":
      if (action.id === DEMO_PATIENT || action.id === s.myPatientId) s.patientId = action.id;
      return s;
    case "viewAsSpecialist":
      s.specialistId = action.id;
      return s;
    case "openFile": {
      const actor = nameOf(action.specialistId);
      const recent = s.audit.find((a) => a.actor === actor && a.resource === `Patient ${action.patientId}` && now - new Date(a.at).getTime() < 5 * MIN);
      if (recent) return state;
      log(actor, "Specialist", "Opened patient file (access from a confirmed booking)", `Patient ${action.patientId}`);
      return s;
    }
    case "deleteAccount": {
      const id = action.id;
      if (!s.profiles[id]?.registered) return state;
      const apptIds = new Set(s.appointments.filter((a) => a.patientId === id).map((a) => a.id));
      s.profiles = Object.fromEntries(Object.entries(s.profiles).filter(([k]) => k !== id));
      s.enrolment = Object.fromEntries(Object.entries(s.enrolment).filter(([k]) => k !== id));
      s.appointments = s.appointments.filter((a) => a.patientId !== id);
      s.labOrders = s.labOrders.filter((o) => o.patientId !== id);
      s.prescriptions = s.prescriptions.filter((p) => p.patientId !== id);
      s.referrals = s.referrals.filter((r) => r.patientId !== id);
      s.notices = s.notices.filter((n) => n.patientId !== id);
      s.consents = s.consents.filter((c) => c.patientId !== id);
      s.verification = s.verification.filter((v) => v.patientId !== id);
      s.incidents = s.incidents.filter((i) => !i.apptId || !apptIds.has(i.apptId));
      delete patients[id];
      s.patientId = DEMO_PATIENT;
      s.myPatientId = undefined;
      log("Patient (deleted)", "Patient", "Account and records deleted at the patient's request", "Account");
      return s;
    }
  }
}

function hydrate(st: State) {
  for (const [id, p] of Object.entries(st.profiles ?? {})) registerProfile(id, p);
}

function load(): State {
  try {
    OLD_KEYS.forEach((k) => localStorage.removeItem(k));
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as State;
      if (saved.version === VERSION) {
        // Demo data is anchored to "now", so it is rebuilt when stale; registered patients and their records are kept.
        const out = Date.now() - saved.seededAt < STALE_MS ? saved : keepUserData(saved, seed());
        hydrate(out);
        return out;
      }
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
    case "book": return [`Request sent to ${byId(specialists, a.specialistId)?.name ?? "the specialist"}. You will be told the moment they confirm`, "ok"];
    case "accept": return ["Confirmed. Video link and reminders sent to both of you", "ok"];
    case "decline": return ["Request declined. The patient is told and refunded", "info"];
    case "ready": return ["Readiness confirmed. Patient notified", "ok"];
    case "delay": return a.minutes > s.rules.recoveryAfterMin ? ["Delay reported. Service recovery started for the patient", "warn"] : ["Delay reported. Patient told the new start time", "info"];
    case "noShow": return ["No response flagged. Patient offered options", "warn"];
    case "choose": return [{ wait: "You chose to wait. We'll update you", alternative: "Done. Your new doctor is ready", reschedule: "Rescheduled free of charge", refund: "Refund sent to M-Pesa" }[a.option], "ok"];
    case "start": return ["Consultation started", "ok"];
    case "complete": return ["Consultation saved. Summary and prescription sent to the patient", "ok"];
    case "cancel": return ["Appointment cancelled. Payment released", "ok"];
    case "reschedule": return ["Rescheduled. New time sent by SMS", "ok"];
    case "rate": return ["Thanks for rating your visit", "ok"];
    case "labStatus": return ["Order updated. Patient notified", "ok"];
    case "labRelease": return ["Results released securely", "ok"];
    case "rxStatus": return a.status === "issue" ? ["Patient told about the stock issue", "warn"] : ["Order updated. Patient notified", "ok"];
    case "rxStock": return ["Stock and price saved", "ok", "rxStock"];
    case "rxShare": return ["Prescription shared with your pharmacy", "ok"];
    case "rxCollect": return ["Marked as collected", "ok"];
    case "refill": return [FEATURES.pharmacy ? "Refill requested from your pharmacy" : "Refill ready. Choose your pharmacy", "ok"];
    case "consent": return ["Sharing preference updated", "ok", "consent"];
    case "verify": return [a.status === "approved" ? "Approved" : "More information requested", "ok"];
    case "rules": return ["Service rule saved", "ok", "rules"];
    case "complaint": return [`Complaint marked ${a.status}`, "ok"];
    case "feedback": return ["Feedback sent to the platform team", "ok"];
    case "referral": return ["Referral accepted", "ok"];
    case "enrol": return ["Care plan updated", "ok", "enrol"];
    case "register": return ["Account created. Welcome", "ok"];
    case "profileUpdate": return ["Saved", "ok", "profile"];
    case "usePatient": return [a.id === DEMO_PATIENT ? "Showing the demo patient" : "Showing your own account", "info", "usepatient"];
    case "viewAsSpecialist": return [`Viewing as ${byId(specialists, a.id)?.name ?? "specialist"}`, "info", "viewas"];
    case "deleteAccount": return ["Your account and records were deleted from this device", "info"];
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
