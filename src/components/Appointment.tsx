import { AlarmClock, ArrowRightLeft, BadgeCheck, CalendarClock, CheckCircle2, Clock, MapPin, Mic, PhoneOff, RefreshCcw, Undo2, Video, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { byId, slotsFor, specialists } from "../data/seed";
import { cx, date, dateTime, kes, minutesUntil, time } from "../lib/format";
import { useStore, type Appointment, type ApptStatus } from "../store/store";
import { Avatar, Badge, Button, Modal, type Tone } from "./ui";

export const statusMeta: Record<ApptStatus, { label: string; tone: Tone }> = {
  confirmed: { label: "Confirmed", tone: "info" },
  ready: { label: "Doctor ready", tone: "ok" },
  delayed: { label: "Running late", tone: "warn" },
  recovery: { label: "Action needed", tone: "bad" },
  in_consult: { label: "In consultation", tone: "brand" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  rescheduled: { label: "Rescheduled", tone: "neutral" },
  reassigned: { label: "Moved to another doctor", tone: "neutral" },
};

export function useTick(ms = 30000) {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((x) => x + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

const steps = ["Booked", "Confirmed", "Reminded", "Doctor ready", "Consultation", "Follow-up set"];

function stepIndex(a: Appointment) {
  switch (a.status) {
    case "confirmed": return minutesUntil(a.at) < 24 * 60 ? 2 : 1;
    case "delayed":
    case "recovery": return 2;
    case "ready": return 3;
    case "in_consult": return 4;
    case "completed": return 5;
    default: return 1;
  }
}

export function Stepper({ a }: { a: Appointment }) {
  const idx = stepIndex(a);
  const troubled = a.status === "recovery" || a.status === "delayed";
  return (
    <ol className="grid grid-cols-6 gap-1.5" aria-label="Appointment progress">
      {steps.map((s, i) => (
        <li key={s} className="min-w-0">
          <div className={cx("h-1.5 rounded-full", i <= idx ? "bg-brand-500" : i === idx + 1 && troubled ? (a.status === "recovery" ? "bg-rose-400" : "bg-amber-400") : "bg-line")} />
          <p className={cx("mt-1.5 truncate text-[10px] font-semibold sm:text-[11px]", i <= idx ? "text-brand-700" : "text-ink-mute")}>{s}</p>
        </li>
      ))}
    </ol>
  );
}

export function Timeline({ a }: { a: Appointment }) {
  return (
    <ol className="relative space-y-3 border-l-2 border-line pl-5">
      {[...a.timeline].reverse().map((e, i) => (
        <li key={i} className="relative">
          <span className={cx("absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white", { ok: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-rose-500", info: "bg-sky2-500" }[e.tone ?? "info"])} />
          <p className="text-sm font-medium text-ink">{e.label}</p>
          <p className="text-xs text-ink-mute">{e.actor} · {dateTime(e.at)}</p>
        </li>
      ))}
    </ol>
  );
}

export function VideoRoom({ a, onClose }: { a: Appointment; onClose: () => void }) {
  const sp = byId(specialists, a.specialistId)!;
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#0b1620] text-white">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="font-semibold">{sp.name}</p>
          <p className="text-xs text-white/60">Encrypted video room · {String(Math.floor(secs / 60)).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}</p>
        </div>
        <Badge tone="ok">Low-bandwidth mode available</Badge>
      </div>
      <div className="relative flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse-soft rounded-full"><Avatar name={sp.name} hue={sp.hue} size={128} /></div>
          <p className="text-white/70">Demo video room. In production this uses an approved, encrypted video provider.</p>
        </div>
        <div className="absolute bottom-6 right-6 grid h-36 w-28 place-items-center rounded-2xl bg-white/10 text-sm text-white/60 ring-1 ring-white/15">You</div>
      </div>
      <div className="flex items-center justify-center gap-4 pb-10 pt-4">
        <button className="grid h-14 w-14 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Mute"><Mic /></button>
        <button className="grid h-14 w-14 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Camera"><Video /></button>
        <button onClick={onClose} className="grid h-14 w-14 place-items-center rounded-full bg-rose-600 hover:bg-rose-700" aria-label="Leave call"><PhoneOff /></button>
      </div>
    </div>
  );
}

export function RescheduleModal({ a, open, onClose, onPick, title = "Pick a new time" }: { a: Appointment; open: boolean; onClose: () => void; onPick: (iso: string) => void; title?: string }) {
  const { state } = useStore();
  const sp = byId(specialists, a.specialistId)!;
  const [day, setDay] = useState(0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const taken = state.appointments.filter((x) => x.specialistId === sp.id && ["confirmed", "ready", "delayed"].includes(x.status)).map((x) => x.at);
  const slots = slotsFor(sp, days[day], taken);
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-ink-mute">{sp.name} · free of charge</p>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {days.map((d, i) => (
          <button key={i} onClick={() => setDay(i)} className={cx("min-w-[64px] rounded-xl border px-2 py-2 text-center focus-ring", i === day ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line")}>
            <span className="block text-[11px] font-semibold uppercase text-ink-mute">{d.toLocaleDateString("en-KE", { weekday: "short" })}</span>
            <span className="block text-lg font-bold">{d.getDate()}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.length === 0 && <p className="col-span-full py-6 text-center text-sm text-ink-mute">No slots this day.</p>}
        {slots.map((s) => (
          <button key={s.toISOString()} onClick={() => { onPick(s.toISOString()); onClose(); }} className="rounded-xl border border-line py-2.5 text-sm font-semibold hover:border-brand-400 hover:bg-brand-50 focus-ring">
            {time(s)}
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function RecoveryPanel({ a }: { a: Appointment }) {
  const { dispatch } = useStore();
  const r = a.recovery!;
  const alt = r.alternative && byId(specialists, r.alternative.specialistId);
  const [pick, setPick] = useState(false);
  return (
    <div className="rounded-2xl border border-rose-200 bg-gradient-to-b from-rose-50 to-white p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-rose-700"><AlarmClock size={16} /> {r.reason}</p>
      <p className="mt-1 text-sm text-ink-soft">We are sorry. You will not be left waiting without a plan. Choose what works for you. A care coordinator can also call you.</p>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {alt && r.alternative && (
          <button onClick={() => dispatch({ type: "choose", id: a.id, option: "alternative" })} className="group flex items-start gap-3 rounded-xl border-2 border-brand-500 bg-white p-3.5 text-left shadow-sm hover:bg-brand-50 focus-ring sm:col-span-2">
            <Avatar name={alt.name} hue={alt.hue} size={40} />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">See {alt.name} at {time(r.alternative.at)} <Badge tone="brand">Recommended</Badge></p>
              <p className="text-[13px] text-ink-soft">{alt.title} · {alt.punctuality}% on time · same fee · your records shared under your care-team consent</p>
            </div>
            <ArrowRightLeft size={18} className="mt-1 text-brand-600" />
          </button>
        )}
        <button onClick={() => dispatch({ type: "choose", id: a.id, option: "wait" })} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3.5 text-left hover:border-brand-300 focus-ring">
          <Clock size={18} className="text-amber-600" />
          <span className="text-sm"><b>Wait</b>{r.minutes ? ` until about ${time(new Date(new Date(a.at).getTime() + r.minutes * 60000))}` : " for the doctor"}</span>
        </button>
        <button onClick={() => setPick(true)} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3.5 text-left hover:border-brand-300 focus-ring">
          <CalendarClock size={18} className="text-sky2-600" />
          <span className="text-sm"><b>Reschedule</b> with priority, free</span>
        </button>
        <button onClick={() => dispatch({ type: "choose", id: a.id, option: "refund" })} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3.5 text-left hover:border-brand-300 focus-ring sm:col-span-2">
          <Wallet size={18} className="text-emerald-600" />
          <span className="text-sm"><b>Cancel and get a full refund</b> of {kes(a.fee)} to M-Pesa</span>
        </button>
      </div>
      <RescheduleModal a={a} open={pick} onClose={() => setPick(false)} onPick={(slot) => dispatch({ type: "choose", id: a.id, option: "reschedule", slot })} title="Priority reschedule" />
    </div>
  );
}

export function AppointmentCard({ a, focus }: { a: Appointment; focus?: boolean }) {
  useTick();
  const { dispatch } = useStore();
  const sp = byId(specialists, a.specialistId)!;
  const [video, setVideo] = useState(false);
  const [resched, setResched] = useState(false);
  const [showTl, setShowTl] = useState(!!focus);
  const mins = minutesUntil(a.at) + (a.delayMin ?? 0);
  const active = ["confirmed", "ready", "delayed", "recovery", "in_consult"].includes(a.status);
  const meta = statusMeta[a.status];

  return (
    <div className={cx("rounded-2xl border bg-white shadow-card", focus ? "border-brand-200" : "border-line")}>
      <div className="flex flex-wrap items-start gap-4 p-4 sm:p-5">
        <Avatar name={sp.name} hue={sp.hue} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-ink">{sp.name}</p>
            {sp.verified && <BadgeCheck size={16} className="text-brand-600" aria-label="Verified" />}
            <Badge tone={meta.tone}>{meta.label}</Badge>
          </div>
          <p className="text-sm text-ink-mute">{sp.title} · {a.reason}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-soft">
            <span className="inline-flex items-center gap-1.5"><CalendarClock size={14} /> {date(a.at)}, {time(a.at)}{a.delayMin ? ` → ${time(new Date(new Date(a.at).getTime() + a.delayMin * 60000))}` : ""}</span>
            <span className="inline-flex items-center gap-1.5">{a.mode === "virtual" ? <Video size={14} /> : <MapPin size={14} />}{a.mode === "virtual" ? "Video consultation" : sp.clinic}</span>
            <span className="inline-flex items-center gap-1.5"><Wallet size={14} /> {kes(a.fee)} paid</span>
          </div>
        </div>
        {active && a.status !== "in_consult" && mins > -30 && (
          <div className="rounded-xl bg-canvas px-3 py-2 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-mute">Starts</p>
            <p className="text-lg font-bold text-ink">{mins <= 0 ? "now" : mins < 120 ? `${mins} min` : mins < 2880 ? `${Math.round(mins / 60)} h` : `${Math.round(mins / 1440)} d`}</p>
          </div>
        )}
      </div>

      {active && (
        <div className="space-y-4 border-t border-line px-4 py-4 sm:px-5">
          <Stepper a={a} />
          {a.status === "recovery" && a.recovery && <RecoveryPanel a={a} />}
          {a.status === "confirmed" && mins <= 75 && (
            <p className="flex items-center gap-2 rounded-xl bg-sky2-50 px-3 py-2.5 text-sm text-sky2-700"><Clock size={16} /> We are checking that {sp.name.replace("Dr. ", "Dr ")} is ready. You will get an SMS the moment they confirm.</p>
          )}
          {a.status === "ready" && (
            <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800"><CheckCircle2 size={16} /> Your doctor has confirmed they are ready{a.mode === "virtual" ? ". Join when it is time." : ". Please check in at reception."}</p>
          )}
          {a.status === "delayed" && (
            <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800"><AlarmClock size={16} /> Running {a.delayMin} minutes late. New start {time(new Date(new Date(a.at).getTime() + (a.delayMin ?? 0) * 60000))}. You can still reschedule free.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {a.mode === "virtual" && (a.status === "ready" || a.status === "in_consult" || a.status === "delayed") && (
              <Button onClick={() => { if (a.status !== "in_consult") dispatch({ type: "start", id: a.id }); setVideo(true); }}><Video size={16} /> {a.status === "in_consult" ? "Rejoin video" : "Join video consultation"}</Button>
            )}
            {a.status !== "recovery" && a.status !== "in_consult" && (
              <>
                <Button variant="secondary" onClick={() => setResched(true)}><RefreshCcw size={15} /> Reschedule</Button>
                <Button variant="ghost" onClick={() => dispatch({ type: "cancel", id: a.id })}><Undo2 size={15} /> Cancel</Button>
              </>
            )}
            <Button variant="ghost" onClick={() => setShowTl(!showTl)}>{showTl ? "Hide" : "Show"} activity</Button>
          </div>
          {showTl && <Timeline a={a} />}
        </div>
      )}
      {!active && showTl && <div className="border-t border-line p-5"><Timeline a={a} /></div>}
      {video && <VideoRoom a={a} onClose={() => setVideo(false)} />}
      <RescheduleModal a={a} open={resched} onClose={() => setResched(false)} onPick={(at) => dispatch({ type: "reschedule", id: a.id, at })} />
    </div>
  );
}
