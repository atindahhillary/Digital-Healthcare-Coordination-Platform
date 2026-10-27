# AfyaConnect: Digital Healthcare Coordination Platform

A working prototype of a chronic-care coordination platform for Kenya. Most directories help patients find a doctor. AfyaConnect helps them through the whole journey: finding a specialist, sharing their history once, coordinating their clinicians and knowing what to do next. Appointment reliability sits at the centre: confirmations, reminders, readiness checks and automatic service recovery when a doctor is late.

("Afya" is Kiswahili for *health*.)

> Prototype only. Every specialist, clinic and demo patient is fictional, and payments, SMS and video are simulated. Anything you register stays in your own browser: no server database yet, so please use test details until the secure database goes live.

## Build order

The build goes one aspect at a time, made solid before the next is switched on.

| Phase | Scope | State |
| --- | --- | --- |
| 1 | **Patient and specialist**: registration with ID check, booking, confirmation, video link, reminders, health record, prescriptions | **Built in this prototype** |
| 2 | Laboratories | Built, switched **off** (`FEATURES.lab`) |
| 3 | Pharmacies | Built, switched **off** (`FEATURES.pharmacy`) |
| 4 | Whole hospital system: records exchange, SHA claims, USSD | Planned |

Flags live in `src/lib/features.ts`. While a module is off it shows a "coming soon" page and the rest of the app adapts: specialists *recommend* tests (the patient takes them at any lab), and a prescription is *held by the patient*, who chooses a pharmacy and keeps getting reminders until they do.

## The patient to specialist journey

1. **Register** (`/register`): phone verified by an SMS code, ID details (KYC) with a photo of the ID, health basics, emergency contact and consent. Under-18s need a guardian. Only the last four digits of an ID number are ever stored.
2. **Book**: pick a verified specialist and a slot. Payment (M-Pesa, simulated) is held.
3. **Doctor confirms** in the specialist portal. On confirmation both people get the **video link** (`/room/<code>`) and **reminders** at 24 h, 2 h and 15 min before, by SMS and in the app. If the doctor declines, the payment is released.
4. **File access**: a specialist can open the patient's file only after confirming a booking with them (and for 90 days after a completed visit). The patient can withdraw access any time, and every open is written to their access log.
5. **Consult**: readiness check, delay reporting and service recovery, then a visit summary, recommended tests and a prescription, all saved to the patient's record.
6. **Follow-up**: the patient gets a prescription code, can print or save it as PDF, and is reminded (1 h, 24 h, 72 h, then weekly) until they choose a pharmacy.

The **health record** (`/app/patient/record`) works like a student portal for health: overview, visits with each doctor's summary, prescriptions, and tests and results. Patients can download their record or delete their account (Data Protection Act 2019 rights).

## Portals (switch roles from the sidebar)

| Portal | Highlights |
| --- | --- |
| Patient | Home with onboarding, appointments with video link and reminders, health record, care plan and referrals, profile and privacy |
| Specialist | Booking requests to confirm, schedule, patient file (after confirmation), consult notes, prescriptions, performance |
| Admin | KPIs, incidents, provider and patient ID verification, service rules, audit log, complaints |
| Patient organisation | Sessions, approved education, member broadcasts, no access to records |
| Laboratory, Pharmacy | Built, off until their phase |

The public site adds a provider directory with on-time records, care pathways, trust and privacy, a **Blueprint** page (expert council review, architecture, roadmap, costs, data model) and an offline care assistant in English and Kiswahili.

## Try it

1. Create an account at `/register` (the SMS code appears in a notice) and book Dr. Amina Odhiambo.
2. On the booking, tap **Demo: open Dr Amina's side to confirm**, then **Confirm booking**.
3. Back as the patient, the video link and reminders are there. As the specialist, open the **Patient file**, then mark ready, start the consultation and complete it with a prescription.
4. As the patient, choose a pharmacy for the prescription. Approve your ID in **Admin > Providers**.

"Reset demo data" in the sidebar keeps your account and records.

## Stack

React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts, lucide-react, installable PWA that works offline. State is a reducer persisted to `localStorage` (`src/store/store.tsx`); the demo data is rebuilt every 8 hours while registered patients and their records are kept. The reducer is the single place where the access rules live, so moving to a real database means replacing it with a server, not rewriting the screens.

```bash
npm install
npm run dev
npm run build
```

Deployed on Vercel as a static SPA (`vercel.json` adds SPA rewrites and security headers).

## Explainer video

The landing page opens with a short vertical video of Dr. Afya, the platform guide, showing the five steps and where to find things in the app. It is built from code in `video/` (script, animated scenes, narration timeline, renderer), see `video/README.md`. The MP4s live in `public/video/` with versioned names; the app caches them once watched so the installed app can replay them offline.

## Updates on installed apps

The service worker takes over as soon as a new version is ready, and `src/lib/updates.ts` looks for one when the app opens, returns to the foreground or regains a connection (never while someone is typing), then reloads onto it. A release therefore reaches an installed app without reinstalling.

## Production direction

See `/blueprint`: modular-monolith API (Node.js and PostgreSQL), access enforced by row-level security (booking confirmed and consent not withdrawn), durable workflows for the reliability engine, HL7 FHIR R4 at the edges, bought-in SMS, video and M-Pesa, and compliance with the Data Protection Act 2019 and the Digital Health Act 2023. The legal and clinical operating model, ODPC registration and data residency must be confirmed with Kenyan counsel before real patients are onboarded.
