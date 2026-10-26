# Unganisha Care: Digital Healthcare Coordination Platform

A clickable, working prototype of a chronic-care coordination platform for Kenya. It connects patients, specialist clinics, laboratories, pharmacies and patient organisations, and puts **appointment reliability** at the centre: readiness checks, delay alerts and automatic service recovery so no patient is left stranded.

"Unganisha" (Kiswahili: *connect*) is a working name.

> Prototype only. Every person, clinic, laboratory, pharmacy and registration number is fictional. Payments, SMS and video are simulated.

## What is in it

**Public site**: home with an interactive reliability simulator, specialist directory with prices and punctuality, provider profiles and booking flow, care pathways (lupus, diabetes, hypertension, kidney disease), trust and privacy, partner onboarding, help and assisted booking, and a **Blueprint** page with the expert council review, architecture, phased roadmap and running costs.

**Six portals** (switch roles from the sidebar; all share one demo state, so an action in one portal shows up in the others):

| Portal | Highlights |
| --- | --- |
| Patient | Live appointment status, recovery choices, video room, reschedule/cancel, results with flags, prescriptions and refills, referrals, care plan, consent toggles, access log, feedback |
| Specialist | Today's schedule, "I'm ready", report delay, simulate no response, consult notes, lab orders, e-prescriptions, referrals inbox, performance |
| Laboratory | Order queue, home collection, processing, secure result release, price list |
| Pharmacy | Verify e-prescriptions, stock and price confirmation, stock-issue messaging, dispatch and delivery, refills |
| Patient organisation | Sessions, approved education, member broadcasts, and an enforced no-records boundary |
| Admin | KPIs, live service recovery, incident log, verification queue, configurable service rules, pathway definitions, audit log, complaints |

### Try the reliability engine

1. Open `/app/specialist` and, on Grace Wambui's consultation, tap **Report delay → 45 min** (or **Simulate no response**).
2. Open `/app/patient`: Grace is offered another verified rheumatologist, waiting, a free priority reschedule, or a full refund.
3. Open `/app/admin/reliability` to see the incident logged.

Service rules (readiness window, grace period, recovery threshold) are adjustable in `/app/admin/settings`. **Reset demo data** is in the sidebar.

## Stack

React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts, lucide-react. State lives in a reducer (`src/store/store.tsx`) persisted to `localStorage`; demo data is re-anchored to the current time every 8 hours.

```bash
npm install
npm run dev
npm run build
```

Deployed on Vercel as a static SPA (`vercel.json` adds SPA rewrites and security headers).

## Production direction

See the Blueprint page (`/blueprint`) for the full recommendation: modular-monolith API (Node.js/NestJS + PostgreSQL), durable workflows for the reliability engine, HL7 FHIR R4 at integration edges, bought-in SMS/WhatsApp/video/M-Pesa, and compliance with the Data Protection Act 2019 and Digital Health Act 2023 and its 2025 regulations. The legal and clinical operating model must be confirmed with Kenyan counsel and regulators before live services launch.
