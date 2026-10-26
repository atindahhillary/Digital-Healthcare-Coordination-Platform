import { BadgeCheck, CheckCircle2, Clock, Languages, MapPin, ShieldCheck, Smartphone, Star, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { slotsFor, type Mode, type Specialist } from "../data/seed";
import { cx, date, kes, time } from "../lib/format";
import { useStore } from "../store/store";
import { Avatar, Badge, Button, Field, inputCls, Modal } from "./ui";

export function nextSlot(sp: Specialist, taken: string[] = []) {
  for (let i = 0; i < 10; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const s = slotsFor(sp, d, taken);
    if (s.length) return s[0];
  }
  return undefined;
}

export function SpecialistCard({ sp, onBook }: { sp: Specialist; onBook: () => void }) {
  const slot = useMemo(() => nextSlot(sp), [sp]);
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start gap-3.5">
        <Avatar name={sp.name} hue={sp.hue} size={56} />
        <div className="min-w-0 flex-1">
          <Link to={`/specialists/${sp.id}`} className="flex items-center gap-1.5 font-bold text-ink hover:text-brand-700">
            {sp.name} {sp.verified && <BadgeCheck size={16} className="shrink-0 text-brand-600" aria-label="Verified" />}
          </Link>
          <p className="text-sm text-ink-mute">{sp.title}</p>
          <p className="mt-1 flex items-center gap-1 text-[13px] text-ink-soft"><MapPin size={13} /> {sp.town}, {sp.county}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 divide-x divide-line rounded-xl bg-canvas py-2.5 text-center">
        <div>
          <p className="flex items-center justify-center gap-1 text-sm font-bold"><Star size={13} className="fill-amber-400 text-amber-400" />{sp.rating}</p>
          <p className="text-[11px] text-ink-mute">{sp.reviews} reviews</p>
        </div>
        <div>
          <p className={cx("text-sm font-bold", sp.punctuality >= 95 ? "text-emerald-700" : sp.punctuality >= 90 ? "text-ink" : "text-amber-700")}>{sp.punctuality}%</p>
          <p className="text-[11px] text-ink-mute">on time</p>
        </div>
        <div>
          <p className="text-sm font-bold">{sp.avgWait} min</p>
          <p className="text-[11px] text-ink-mute">avg wait</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {sp.conditions.slice(0, 3).map((c) => <Badge key={c} tone="neutral">{c}</Badge>)}
      </div>
      <div className="mt-auto pt-4">
        <div className="flex items-end justify-between gap-2 border-t border-line pt-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-mute">From</p>
            <p className="font-bold text-ink">{kes(Math.min(sp.fee, sp.virtualFee || sp.fee))}</p>
            {slot && <p className="text-xs text-brand-700">Next: {date(slot)}, {time(slot)}</p>}
          </div>
          <Button onClick={onBook} disabled={!sp.verified} size="sm">{sp.verified ? "Book" : "Verifying"}</Button>
        </div>
      </div>
    </article>
  );
}

export function BookingModal({ sp, open, onClose }: { sp: Specialist; open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(sp.modes[0]);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string>();
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const days = Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const taken = state.appointments.filter((x) => x.specialistId === sp.id && ["confirmed", "ready", "delayed"].includes(x.status)).map((x) => x.at);
  const slots = slotsFor(sp, days[day], taken);
  const fee = mode === "virtual" ? sp.virtualFee : sp.fee;

  const close = () => {
    onClose();
    setTimeout(() => { setStep(1); setSlot(undefined); }, 300);
  };

  return (
    <Modal open={open} onClose={close} title={step === 3 ? "Booked" : `Book ${sp.name}`} wide>
      {step === 1 && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Avatar name={sp.name} hue={sp.hue} size={48} />
            <div>
              <p className="font-bold">{sp.name}</p>
              <p className="text-sm text-ink-mute">{sp.title} · {sp.clinic}</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {sp.modes.map((m) => (
              <button key={m} onClick={() => setMode(m)} className={cx("flex items-center gap-3 rounded-xl border-2 p-3.5 text-left focus-ring", mode === m ? "border-brand-500 bg-brand-50" : "border-line")}>
                {m === "virtual" ? <Video className="text-brand-600" size={20} /> : <MapPin className="text-brand-600" size={20} />}
                <span>
                  <span className="block text-sm font-bold">{m === "virtual" ? "Video consultation" : "In person"}</span>
                  <span className="block text-xs text-ink-mute">{kes(m === "virtual" ? sp.virtualFee : sp.fee)}{m === "physical" ? ` · ${sp.town}` : " · from your phone"}</span>
                </span>
              </button>
            ))}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Choose a day</p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {days.map((d, i) => {
                const n = slotsFor(sp, d, taken).length;
                return (
                  <button key={i} disabled={!n} onClick={() => { setDay(i); setSlot(undefined); }} className={cx("min-w-[66px] rounded-xl border px-2 py-2 text-center focus-ring disabled:opacity-40", i === day ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line")}>
                    <span className="block text-[11px] font-semibold uppercase text-ink-mute">{i === 0 ? "Today" : d.toLocaleDateString("en-KE", { weekday: "short" })}</span>
                    <span className="block text-lg font-bold">{d.getDate()}</span>
                    <span className="block text-[10px] text-ink-mute">{n ? `${n} slots` : "Full"}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Available times</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {slots.length === 0 && <p className="col-span-full py-4 text-sm text-ink-mute">No free slots. Try another day.</p>}
              {slots.map((s) => (
                <button key={s.toISOString()} onClick={() => setSlot(s.toISOString())} className={cx("rounded-xl border py-2.5 text-sm font-semibold focus-ring", slot === s.toISOString() ? "border-brand-600 bg-brand-600 text-white" : "border-line hover:border-brand-300")}>
                  {time(s)}
                </button>
              ))}
            </div>
          </div>
          <Field label="Reason for visit (optional)" hint="Shared only with this specialist.">
            <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Lupus follow-up, new joint pain" />
          </Field>
          <div className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-mute">Free cancellation up to {state.rules.freeCancelHours} h before. If the doctor is late, you choose what happens.</p>
            <Button disabled={!slot} onClick={() => setStep(2)}>Continue</Button>
          </div>
        </div>
      )}
      {step === 2 && slot && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-canvas p-4">
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-ink-mute">Specialist</dt><dd className="text-right font-semibold">{sp.name}</dd>
              <dt className="text-ink-mute">When</dt><dd className="text-right font-semibold">{date(slot)}, {time(slot)}</dd>
              <dt className="text-ink-mute">Type</dt><dd className="text-right font-semibold">{mode === "virtual" ? "Video consultation" : `In person, ${sp.town}`}</dd>
              <dt className="text-ink-mute">Consultation fee</dt><dd className="text-right font-semibold">{kes(fee)}</dd>
              <dt className="text-ink-mute">Booking fee</dt><dd className="text-right font-semibold">KES 0</dd>
              <dt className="border-t border-line pt-2 font-bold">Total</dt><dd className="border-t border-line pt-2 text-right text-lg font-bold">{kes(fee)}</dd>
            </dl>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border-2 border-brand-500 bg-brand-50 p-3.5">
              <Smartphone size={20} className="text-brand-700" />
              <span><span className="block text-sm font-bold">M-Pesa (STK push)</span><span className="block text-xs text-ink-mute">Simulated in this demo</span></span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-line p-3.5 text-ink-mute">
              <ShieldCheck size={20} />
              <span><span className="block text-sm font-bold">SHA / insurance</span><span className="block text-xs">Phase 2 integration</span></span>
            </div>
          </div>
          <div className="flex justify-between gap-3 border-t border-line pt-4">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => { dispatch({ type: "book", specialistId: sp.id, at: slot, mode, reason }); setStep(3); }}>Pay {kes(fee)} and confirm</Button>
          </div>
        </div>
      )}
      {step === 3 && slot && (
        <div className="py-4 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={34} /></span>
          <p className="mt-4 text-xl font-bold">You are booked with {sp.name}</p>
          <p className="mt-1 text-ink-mute">{date(slot)} at {time(slot)}. Confirmation sent by SMS.</p>
          <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm">
            <li className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-brand-600" /> Reminders {state.rules.reminderHours.map((h) => `${h} h`).join(" and ")} before.</li>
            <li className="flex gap-2"><BadgeCheck size={16} className="mt-0.5 shrink-0 text-brand-600" /> The doctor confirms readiness up to {state.rules.readinessWindowMin} min before. We tell you when they are ready.</li>
            <li className="flex gap-2"><Languages size={16} className="mt-0.5 shrink-0 text-brand-600" /> If they run late, you choose: wait, another doctor, a new time or a refund.</li>
          </ul>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="secondary" onClick={close}>Done</Button>
            <Button onClick={() => { close(); navigate("/app/patient/appointments"); }}>View in my portal</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
