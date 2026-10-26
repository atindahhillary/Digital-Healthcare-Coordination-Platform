import { AlarmClock, ArrowRightLeft, BellRing, CheckCircle2, ClipboardCheck, PhoneCall, ShieldAlert, UserX } from "lucide-react";
import { useState } from "react";
import { cx } from "../lib/format";

type Scenario = "ontime" | "minor" | "major" | "noshow";

const scenarios: { id: Scenario; label: string; icon: typeof CheckCircle2 }[] = [
  { id: "ontime", label: "Doctor is on time", icon: CheckCircle2 },
  { id: "minor", label: "Running 8 min late", icon: AlarmClock },
  { id: "major", label: "Running 40 min late", icon: ShieldAlert },
  { id: "noshow", label: "Doctor does not respond", icon: UserX },
];

const flows: Record<Scenario, { t: string; who: string; text: string; tone: "ok" | "warn" | "bad" | "info" }[]> = {
  ontime: [
    { t: "T-24 h", who: "Platform", text: "Reminder to patient (SMS + app) and to the specialist.", tone: "info" },
    { t: "T-60 min", who: "Platform", text: "Readiness check opens. Specialist taps “I am ready”.", tone: "ok" },
    { t: "T-0", who: "Patient", text: "“Dr Amina is ready. Join your video consultation.”", tone: "ok" },
    { t: "T+30 min", who: "Specialist", text: "Notes, lab order and refill sent. Follow-up auto-scheduled.", tone: "ok" },
  ],
  minor: [
    { t: "T-15 min", who: "Specialist", text: "Reports an 8 minute delay with one tap.", tone: "warn" },
    { t: "T-15 min", who: "Platform", text: "Inside the 10 minute grace window. Patient gets the new start time.", tone: "info" },
    { t: "T+8 min", who: "Patient", text: "Consultation starts. Patient can still reschedule free.", tone: "ok" },
    { t: "Later", who: "Admin", text: "Delay logged against the specialist's punctuality score.", tone: "info" },
  ],
  major: [
    { t: "T-10 min", who: "Specialist", text: "Reports a 40 minute delay (theatre overrun).", tone: "bad" },
    { t: "T-10 min", who: "Platform", text: "Over the 20 minute limit: service recovery starts automatically.", tone: "warn" },
    { t: "T-9 min", who: "Patient", text: "Offered: another verified rheumatologist at T+15, wait, priority reschedule, or full refund.", tone: "info" },
    { t: "T+15 min", who: "Patient", text: "Chooses the alternative. Records shared under existing consent. Seen same day.", tone: "ok" },
  ],
  noshow: [
    { t: "T-60 min", who: "Platform", text: "Readiness check opens. No response from the specialist.", tone: "warn" },
    { t: "T-20 min", who: "Platform", text: "Clinic phoned automatically. No answer. Escalated to care coordinator.", tone: "bad" },
    { t: "T-19 min", who: "Patient", text: "Told early, before they log in. Options sent by SMS and app.", tone: "info" },
    { t: "Same day", who: "Admin", text: "Provider no-show incident opened. Repeat no-shows trigger review.", tone: "info" },
  ],
};

const phone: Record<Scenario, { title: string; body: string; tone: string; icon: typeof BellRing }> = {
  ontime: { title: "Your doctor is ready", body: "Dr Amina Odhiambo is ready for your 10:30 video consultation.", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200", icon: CheckCircle2 },
  minor: { title: "Running 8 minutes late", body: "New start time 10:38. Reply 1 to keep, 2 to reschedule free.", tone: "bg-amber-50 text-amber-900 ring-amber-200", icon: AlarmClock },
  major: { title: "Your doctor is delayed", body: "See Dr Brian Kiprono at 10:45 instead, wait, reschedule free or get a refund.", tone: "bg-rose-50 text-rose-800 ring-rose-200", icon: ArrowRightLeft },
  noshow: { title: "We could not reach your doctor", body: "We are sorry. A coordinator will call you in 5 minutes with options.", tone: "bg-rose-50 text-rose-800 ring-rose-200", icon: PhoneCall },
};

export default function Simulator() {
  const [s, setS] = useState<Scenario>("major");
  const p = phone[s];
  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
      <div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Scenario">
          {scenarios.map((x) => (
            <button key={x.id} role="radio" aria-checked={s === x.id} onClick={() => setS(x.id)} className={cx("inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition focus-ring", s === x.id ? "border-white bg-white text-ink" : "border-white/20 text-white/80 hover:border-white/50 hover:text-white")}>
              <x.icon size={15} /> {x.label}
            </button>
          ))}
        </div>
        <ol className="mt-7 space-y-3">
          {flows[s].map((f, i) => (
            <li key={s + i} className="flex gap-4 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 animate-rise" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}>
              <span className="w-16 shrink-0 font-mono text-xs font-semibold text-brand-200">{f.t}</span>
              <div>
                <p className={cx("text-xs font-bold uppercase tracking-wider", { ok: "text-emerald-300", warn: "text-amber-300", bad: "text-rose-300", info: "text-sky-300" }[f.tone])}>{f.who}</p>
                <p className="mt-0.5 text-[15px] text-white/90">{f.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="mx-auto w-full max-w-[300px]">
        <div className="rounded-[2.4rem] bg-[#0e1b26] p-3 shadow-2xl ring-1 ring-white/10">
          <div className="overflow-hidden rounded-[1.9rem] bg-gradient-to-b from-slate-100 to-white">
            <div className="flex justify-between px-6 pb-2 pt-3 text-[11px] font-semibold text-ink">
              <span>10:20</span>
              <span className="h-5 w-20 rounded-full bg-[#0e1b26]" />
              <span>4G</span>
            </div>
            <div className="space-y-3 px-3 pb-6 pt-3">
              <div key={s} className={cx("rounded-2xl p-3.5 ring-1 animate-rise", p.tone)}>
                <p className="flex items-center gap-2 text-[13px] font-bold"><p.icon size={15} /> {p.title}</p>
                <p className="mt-1 text-[13px] leading-snug">{p.body}</p>
              </div>
              <div className="rounded-2xl bg-white p-3.5 shadow-card ring-1 ring-line">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-mute">SMS · works on any phone</p>
                <p className="mt-1 text-[13px] text-ink">{p.body}</p>
              </div>
              <div className="rounded-2xl bg-white p-3.5 shadow-card ring-1 ring-line">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-ink"><ClipboardCheck size={15} className="text-brand-600" /> Every step is logged</p>
                <p className="mt-1 text-[12px] text-ink-mute">Punctuality, delays and outcomes feed provider performance reports.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
