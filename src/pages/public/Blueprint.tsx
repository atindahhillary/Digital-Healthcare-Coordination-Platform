import { Boxes, Briefcase, CircleDollarSign, Cpu, Gavel, HeartPulse, Layers, Palette, Route, Target, TriangleAlert, Users } from "lucide-react";
import { Badge, Card } from "../../components/ui";

const council = [
  {
    icon: HeartPulse, board: "Clinical advisory board", who: "Rheumatology, nephrology, primary care, nursing, pharmacy",
    points: [
      "Emergencies must never enter the delay workflow. Red-flag symptoms on booking and in-app route to 999 / 112 and the nearest emergency unit.",
      "An alternative specialist is offered only if same specialty, verified, and the patient consents to sharing records. The original specialist stays the doctor of record.",
      "Pathways are templates the treating specialist can adjust per patient. Every pathway needs clinical sign-off and a review date.",
      "Results go to patient and ordering clinician together, with abnormal values flagged to the clinician first.",
    ],
  },
  {
    icon: Users, board: "Patient & community board", who: "Patient organisations, caregivers, people living with lupus and diabetes",
    points: [
      "Tell patients early. A message 20 minutes before is worth more than an apology after.",
      "SMS and assisted phone booking are not optional extras: many patients share phones or ration data.",
      "Show prices and punctuality before booking. Trust comes from transparency.",
      "Patient organisations want to signpost services, not see records. Keep that wall visible.",
    ],
  },
  {
    icon: Gavel, board: "Regulatory & privacy board", who: "Data protection counsel, digital health policy, compliance",
    points: [
      "Register with the ODPC and complete a DPIA before handling real patient data.",
      "Map to the Digital Health Act 2023 and its 2025 regulations; plan for Digital Health Agency registration and national exchange standards.",
      "Confirm data residency for health records with counsel before choosing a hosting region.",
      "Virtual consultations run through KMPDC-approved facilities; pharmacy fulfilment stays with PPB-licensed premises.",
    ],
  },
  {
    icon: Cpu, board: "Technology & architecture board", who: "Solution architect, security engineer, integrations lead",
    points: [
      "Start as a modular monolith with clear service boundaries. Split out services only when load demands it.",
      "The reliability engine is a durable workflow (timers, retries, escalations) that survives restarts, not cron jobs.",
      "Use HL7 FHIR R4 resources at the edges (Appointment, ServiceRequest, DiagnosticReport, MedicationRequest, Consent) so lab, pharmacy and national exchange integrations are adapters, not rewrites.",
      "Buy, do not build: SMS, WhatsApp, video, payments and identity verification come from proven providers.",
    ],
  },
  {
    icon: Palette, board: "Product & design board", who: "Product lead, UX researcher, accessibility specialist",
    points: [
      "Mobile-first, one primary action per screen, plain English and Kiswahili.",
      "Status is always visible: a patient should never wonder whether their doctor is coming.",
      "WCAG 2.2 AA contrast and touch targets; works with screen readers and large text.",
      "Prototype with 8 to 10 patients and 5 providers before the MVP specification is frozen.",
    ],
  },
  {
    icon: Briefcase, board: "Operations & finance board", who: "Health operations, finance, partnerships",
    points: [
      "Contract service standards with providers: readiness, punctuality, result turnaround, stock confirmation.",
      "Fund recovery: who pays for refunds and alternative specialists must be in provider agreements.",
      "Care coordinators are the human safety net. Budget for them from day one.",
      "Revenue options: booking commission, provider subscriptions, employer and insurer programmes.",
    ],
  },
];

const phases = [
  { p: "Phase 0", t: "Discovery", w: "Weeks 1 to 4", items: ["Requirements workshop", "Clickable prototype (this site)", "Legal & clinical operating model", "MVP specification and budget"] },
  { p: "Phase 1", t: "MVP launch", w: "Weeks 5 to 20", items: ["Public website and provider directory", "Patient registration and secure accounts", "Provider onboarding and verification", "Booking, reminders, readiness and delay management", "Patient and admin dashboards", "Referral and follow-up tracking", "Feedback and reporting"] },
  { p: "Phase 2", t: "Connected care", w: "Months 6 to 9", items: ["Laboratory integration and home collection", "Pharmacy fulfilment and refills", "M-Pesa payments and refunds", "Care pathways engine", "Patient organisation portal"] },
  { p: "Phase 3", t: "Network scale", w: "Months 10 to 18", items: ["Secure record exchange with national standards", "SHA and insurer claims", "USSD access", "Advanced care management and analytics", "New counties and conditions"] },
];

const costs = [
  ["Cloud hosting, database, backups", "USD 300 to 900 / month", "Scales with users; in-country hosting may cost more"],
  ["SMS (reminders, readiness, delays)", "Per message", "Roughly 6 to 10 messages per patient per month"],
  ["WhatsApp Business messaging", "Per conversation", "Through a Meta business solution provider"],
  ["Video consultations", "Per participant-minute", "Or self-hosted at a fixed server cost"],
  ["M-Pesa collections & refunds", "Safaricom tariff per transaction", "Daraja API itself has no licence fee"],
  ["Email, monitoring, error tracking", "USD 50 to 200 / month", ""],
  ["Security testing", "Annual penetration test", "Plus a pre-launch test"],
  ["Maintenance & support", "15 to 20% of build cost / year", "Patches, upgrades, small features"],
];

export default function Blueprint() {
  return (
    <div className="bg-canvas pb-20">
      <section className="border-b border-line bg-white">
        <div className="container-x py-14">
          <Badge tone="brand">Expert council review</Badge>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">Platform blueprint</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-soft">How six advisory boards reviewed the brief, the architecture we recommend, what launches first, and what it costs to run.</p>
        </div>
      </section>

      <section className="container-x mt-10">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><Target className="text-brand-600" /> The defining promise</h2>
        <Card className="mt-4 bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white sm:p-8">
          <p className="text-xl font-bold leading-snug sm:text-2xl">Healthcare services connected around the patient, with reliability and continuity at the centre.</p>
          <p className="mt-3 text-white/80">Every board tested its recommendations against one question: does this make it less likely that a patient is left stranded without communication or a next step?</p>
        </Card>
      </section>

      <section className="container-x mt-12">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><Users className="text-brand-600" /> What the boards said</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {council.map((c) => (
            <Card key={c.board} className="p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><c.icon size={20} /></span>
              <p className="mt-4 font-bold">{c.board}</p>
              <p className="text-xs text-ink-mute">{c.who}</p>
              <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
                {c.points.map((p) => <li key={p} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />{p}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section className="container-x mt-12">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><Layers className="text-brand-600" /> Recommended architecture</h2>
        <Card className="mt-5 p-5 sm:p-8">
          <div className="grid gap-3">
            <Tier label="Channels" tone="bg-sky2-50 text-sky2-700 ring-sky2-100" items={["Patient PWA (mobile-first)", "Provider web portals", "SMS & WhatsApp", "Assisted booking (call centre)", "USSD (phase 3)"]} />
            <Tier label="API gateway" tone="bg-slate-50 text-slate-700 ring-slate-200" items={["Auth (OTP + MFA)", "Role & consent checks on every request", "Rate limiting", "Audit logging"]} />
            <Tier label="Core services (modular monolith)" tone="bg-brand-50 text-brand-800 ring-brand-100" items={["Identity & profiles", "Directory & verification", "Scheduling", "Reliability engine (durable workflows)", "Care pathways", "Orders: lab & pharmacy", "Referrals", "Notifications", "Payments & refunds", "Feedback & complaints", "Reporting"]} />
            <Tier label="Data" tone="bg-violet-50 text-violet-800 ring-violet-100" items={["PostgreSQL (encrypted)", "Object storage for documents", "Append-only audit store", "Analytics replica (de-identified)"]} />
            <Tier label="Integrations (adapters)" tone="bg-orange-50 text-orange-800 ring-orange-100" items={["FHIR R4 facade", "Lab systems", "Pharmacy systems", "M-Pesa Daraja", "SMS / WhatsApp gateways", "Video provider", "National exchange & SHA (later)"]} />
          </div>
          <div className="mt-6 grid gap-4 border-t border-line pt-6 text-sm md:grid-cols-3">
            <div><p className="font-bold">Suggested stack</p><p className="mt-1 text-ink-soft">TypeScript end to end: React PWA, Node.js (NestJS) API, PostgreSQL, a durable workflow engine for timers and escalations, managed queues.</p></div>
            <div><p className="font-bold">Why a modular monolith</p><p className="mt-1 text-ink-soft">One deployable keeps a small team fast and cheap to run. Clean module boundaries let services split out later.</p></div>
            <div><p className="font-bold">Extensible pathways</p><p className="mt-1 text-ink-soft">Conditions are data: steps, intervals, care team and red flags. New pathways ship as configuration.</p></div>
          </div>
        </Card>
      </section>

      <section className="container-x mt-12">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><Route className="text-brand-600" /> Phased roadmap</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {phases.map((p, i) => (
            <Card key={p.p} className={i === 1 ? "p-6 ring-2 ring-brand-500" : "p-6"}>
              <div className="flex items-center justify-between">
                <Badge tone={i === 1 ? "brand" : "neutral"}>{p.p}</Badge>
                <span className="text-xs font-semibold text-ink-mute">{p.w}</span>
              </div>
              <p className="mt-3 text-lg font-bold">{p.t}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
                {p.items.map((x) => <li key={x}>• {x}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section className="container-x mt-12 grid gap-6 lg:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><CircleDollarSign className="text-brand-600" /> Recurring operating costs</h2>
          <Card className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead><tr className="border-b border-line bg-canvas/60 text-left"><th className="px-4 py-3">Item</th><th className="px-4 py-3">Pricing basis</th><th className="px-4 py-3">Notes</th></tr></thead>
              <tbody>
                {costs.map(([a, b, c]) => <tr key={a} className="border-b border-line last:border-0"><td className="px-4 py-3 font-medium">{a}</td><td className="px-4 py-3">{b}</td><td className="px-4 py-3 text-ink-mute">{c}</td></tr>)}
              </tbody>
            </table>
          </Card>
          <p className="mt-2 text-xs text-ink-mute">Planning ranges only. Final figures need vendor quotes once volumes and hosting location are agreed.</p>
        </div>
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><TriangleAlert className="text-brand-600" /> Key risks</h2>
          <Card className="mt-5 divide-y divide-line">
            {[
              ["Provider adoption", "Start with a small, committed specialist group and pay them reliably."],
              ["Delays become normal", "Publish punctuality, tie it to ranking and contracts."],
              ["Regulatory change", "Keep compliance modular; review the 2025 regulations quarterly."],
              ["Data breach", "Least-privilege access, encryption, tested incident plan."],
              ["Connectivity", "SMS fallback, audio-only video, offline-tolerant PWA."],
            ].map(([a, b]) => <div key={a} className="p-4"><p className="font-bold">{a}</p><p className="text-sm text-ink-soft">{b}</p></div>)}
          </Card>
        </div>
      </section>

      <section className="container-x mt-12">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><Boxes className="text-brand-600" /> What this prototype covers</h2>
        <Card className="mt-5 grid gap-x-8 gap-y-2 p-6 text-sm sm:grid-cols-2">
          {[
            "Public site, provider directory with punctuality, booking flow",
            "Patient portal: appointments, live status, recovery choices, results, refills, referrals, consent",
            "Specialist portal: readiness check, delay reporting, notes, lab orders, e-prescriptions",
            "Laboratory portal: order queue, collection, processing, secure result release",
            "Pharmacy portal: verification, stock and price confirmation, delivery, refills",
            "Patient organisation portal with a visible no-records boundary",
            "Admin: KPIs, incidents, verification queue, service rules, audit log, complaints",
            "Shared demo state: an action in one portal appears in the others",
          ].map((x) => <p key={x} className="flex gap-2"><span className="text-brand-600">✓</span>{x}</p>)}
        </Card>
      </section>
    </div>
  );
}

function Tier({ label, items, tone }: { label: string; items: string[]; tone: string }) {
  return (
    <div className="grid gap-2 md:grid-cols-[200px_1fr] md:items-center">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => <span key={i} className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ring-1 ${tone}`}>{i}</span>)}
      </div>
    </div>
  );
}
