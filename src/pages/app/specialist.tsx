import { AlarmClock, CalendarCheck2, CheckCircle2, ClipboardPen, FileText, FlaskConical, Hourglass, Lock, MapPin, Pill, Plus, Star, Timer, Trash2, UserX, Video, X } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Reminders, statusMeta, Timeline, useTick, VideoLink, VideoRoom } from "../../components/Appointment";
import { KycBadge, PatientFileModal } from "../../components/PatientFile";
import { Avatar, Badge, Button, Card, CardHead, Empty, Field, inputCls, Modal, PageTitle, Stat } from "../../components/ui";
import { byId, labs, specialists } from "../../data/seed";
import { FEATURES } from "../../lib/features";
import { cx, date, dateTime, kes, minutesUntil, time } from "../../lib/format";
import { fileAccess, patients, useStore, type Appointment, type RxItem } from "../../store/store";

function ConsultModal({ a, onClose, onOpenFile }: { a: Appointment; onClose: () => void; onOpenFile: () => void }) {
  const { state, dispatch } = useStore();
  const pt = patients[a.patientId];
  const [notes, setNotes] = useState("");
  const [weeks, setWeeks] = useState(12);
  const [tests, setTests] = useState<string[]>(["UEC", "UPCR", "CBC"]);
  const [rx, setRx] = useState<RxItem[]>([{ drug: "Hydroxychloroquine", dose: "200 mg once daily", qty: 30 }]);
  const lab = byId(labs, "lab-bora")!;
  const access = fileAccess(state, a.specialistId, a.patientId);
  const visits = state.appointments.filter((x) => x.patientId === a.patientId && x.status === "completed").sort((x, y) => +new Date(y.at) - +new Date(x.at));

  return (
    <Modal open onClose={onClose} title={`Consultation · ${pt.name}`} wide>
      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); dispatch({ type: "complete", id: a.id, notes: notes || "Reviewed. Plan discussed with patient.", followUpWeeks: weeks, labs: tests, rx: rx.filter((r) => r.drug) }); onClose(); }}>
          <Field label="Visit summary for the patient" hint="Saved to the patient's health record. They can read it any time.">
            <textarea className={inputCls} rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Symptoms, assessment and the plan, in words the patient can follow" />
          </Field>
          <Field label="Follow-up">
            <select className={inputCls} value={weeks} onChange={(e) => setWeeks(+e.target.value)}>
              {[2, 4, 8, 12, 24].map((w) => <option key={w} value={w}>In {w} weeks (reminders set automatically)</option>)}
            </select>
          </Field>
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><FlaskConical size={16} className="text-violet-600" /> {FEATURES.lab ? `Lab order · ${lab.name}` : "Tests to recommend"}</p>
            {!FEATURES.lab && <p className="mb-2 text-xs text-ink-mute">The patient sees these in their record and takes them at any accredited lab. Digital lab ordering comes in a later phase.</p>}
            <div className="grid gap-2 sm:grid-cols-2">
              {lab.tests.map((t) => (
                <label key={t.code} className={cx("flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-sm", tests.includes(t.code) ? "border-violet-400 bg-violet-50" : "border-line")}>
                  <input type="checkbox" className="accent-violet-600" checked={tests.includes(t.code)} onChange={() => setTests(tests.includes(t.code) ? tests.filter((x) => x !== t.code) : [...tests, t.code])} />
                  <span className="min-w-0 flex-1 truncate">{t.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Pill size={16} className="text-orange-600" /> Prescription</p>
            {!FEATURES.pharmacy && <p className="mb-2 text-xs text-ink-mute">The patient receives a prescription code and chooses their own pharmacy. We remind them until they do.</p>}
            <div className="space-y-2">
              {rx.map((r, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_70px_auto] gap-2">
                  <input className={inputCls} aria-label="Drug" value={r.drug} onChange={(e) => setRx(rx.map((x, j) => (j === i ? { ...x, drug: e.target.value } : x)))} placeholder="Medicine" />
                  <input className={inputCls} aria-label="Dose" value={r.dose} onChange={(e) => setRx(rx.map((x, j) => (j === i ? { ...x, dose: e.target.value } : x)))} placeholder="Dose" />
                  <input className={inputCls} aria-label="Quantity" type="number" value={r.qty} onChange={(e) => setRx(rx.map((x, j) => (j === i ? { ...x, qty: +e.target.value } : x)))} />
                  <button type="button" onClick={() => setRx(rx.filter((_, j) => j !== i))} className="grid w-10 place-items-center rounded-xl text-ink-mute hover:bg-canvas" aria-label="Remove"><Trash2 size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setRx([...rx, { drug: "", dose: "", qty: 30 }])} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"><Plus size={15} /> Add medicine</button>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="ghost" type="button" onClick={onClose}>Close</Button>
            <Button type="submit"><CheckCircle2 size={16} /> Complete visit</Button>
          </div>
        </form>
        <aside className="space-y-4 rounded-2xl bg-canvas p-4 text-sm">
          <div>
            <p className="font-bold">{pt.name}, {pt.age}</p>
            <p className="text-ink-mute">{pt.county}</p>
            <div className="mt-1.5"><KycBadge status={pt.kyc?.status} /></div>
          </div>
          {access === "granted" ? (
            <>
              <div><p className="text-xs font-bold uppercase tracking-wide text-ink-mute">Conditions</p><div className="mt-1 flex flex-wrap gap-1">{pt.conditions.length ? pt.conditions.map((c) => <Badge key={c}>{c}</Badge>) : <span className="text-ink-mute">None recorded</span>}</div></div>
              <div><p className="text-xs font-bold uppercase tracking-wide text-ink-mute">Allergies</p><div className="mt-1 flex flex-wrap gap-1">{pt.allergies?.length ? pt.allergies.map((c) => <Badge key={c} tone="bad">{c}</Badge>) : <span className="text-ink-mute">None recorded</span>}</div></div>
              <div><p className="text-xs font-bold uppercase tracking-wide text-ink-mute">Last visit</p><p className="mt-1 text-ink-soft">{visits[0] ? `${date(visits[0].at)}: ${visits[0].notes ?? visits[0].reason}` : "No earlier visits"}</p></div>
              <Button size="sm" variant="secondary" className="w-full" onClick={onOpenFile}><FileText size={15} /> Open full file</Button>
            </>
          ) : <p className="rounded-xl bg-amber-50 p-3 text-amber-900">The patient has not shared their file with you.</p>}
        </aside>
      </div>
    </Modal>
  );
}

function DelayPicker({ onPick, onClose }: { onPick: (m: number) => void; onClose: () => void }) {
  const { state } = useStore();
  return (
    <Modal open onClose={onClose} title="Report a delay">
      <p className="text-sm text-ink-soft">The patient is told straight away. Delays over {state.rules.recoveryAfterMin} minutes start service recovery: the patient can wait, see a colleague, reschedule or get a refund.</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[5, 10, 25, 45].map((m) => (
          <button key={m} onClick={() => { onPick(m); onClose(); }} className={cx("rounded-xl border-2 p-3 text-center font-bold focus-ring", m > state.rules.recoveryAfterMin ? "border-rose-200 hover:bg-rose-50" : "border-amber-200 hover:bg-amber-50")}>
            {m} min
            <span className="block text-[11px] font-medium text-ink-mute">{m > state.rules.recoveryAfterMin ? "Recovery" : "Notify only"}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-800">If the patient may be having an emergency, do not use this. Follow the emergency escalation protocol.</p>
    </Modal>
  );
}

const DECLINE_REASONS = ["I am not available at that time", "Please pick a later slot", "Not the right specialty for this concern"];

function DeclineModal({ a, onClose }: { a: Appointment; onClose: () => void }) {
  const { dispatch } = useStore();
  return (
    <Modal open onClose={onClose} title="Decline this request">
      <p className="text-sm text-ink-soft">{patients[a.patientId].name} is told straight away and the payment is released in full. Pick a reason to send.</p>
      <ul className="mt-4 space-y-2">
        {DECLINE_REASONS.map((r) => (
          <li key={r}><button onClick={() => { dispatch({ type: "decline", id: a.id, reason: r }); onClose(); }} className="w-full rounded-xl border border-line p-3 text-left text-sm font-semibold hover:border-brand-300 focus-ring">{r}</button></li>
        ))}
      </ul>
    </Modal>
  );
}

export function SpecialistHome() {
  useTick();
  const { state, dispatch } = useStore();
  const sp = byId(specialists, state.specialistId)!;
  const today = new Date().toDateString();
  const mine = state.appointments.filter((a) => a.specialistId === sp.id).sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const requests = mine.filter((a) => a.status === "requested");
  const list = mine.filter((a) => a.status !== "requested" && a.status !== "declined" && (new Date(a.at).toDateString() === today || ["ready", "delayed", "in_consult", "recovery"].includes(a.status)));
  const later = mine.filter((a) => a.status === "confirmed" && new Date(a.at).toDateString() !== today && new Date(a.at).getTime() > Date.now());
  const [consult, setConsult] = useState<Appointment>();
  const [delay, setDelay] = useState<Appointment>();
  const [decline, setDecline] = useState<Appointment>();
  const [video, setVideo] = useState<Appointment>();
  const [fileOf, setFileOf] = useState<string>();
  const [open, setOpen] = useState<string>();
  const refs = state.referrals.filter((r) => r.toId === sp.id || (!r.toId && r.toSpecialty === sp.specialty));
  const withRequests = specialists.filter((s) => s.id !== sp.id && state.appointments.some((a) => a.specialistId === s.id && a.status === "requested"));

  const FileButton = ({ a }: { a: Appointment }) => {
    const acc = fileAccess(state, a.specialistId, a.patientId);
    return acc === "granted" ? (
      <Button size="sm" variant="secondary" onClick={() => setFileOf(a.patientId)}><FileText size={15} /> Patient file</Button>
    ) : (
      <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-canvas px-3 text-xs font-semibold text-ink-mute"><Lock size={13} /> {acc === "restricted" ? "File not shared" : "File locked"}</span>
    );
  };

  return (
    <>
      <PageTitle
        title="Today's clinic"
        sub={`${sp.name} · ${sp.clinic}`}
        action={
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-mute">Viewing as</span>
            <select value={sp.id} onChange={(e) => dispatch({ type: "viewAsSpecialist", id: e.target.value })} className="h-10 rounded-xl border border-line bg-white px-2.5 font-semibold" aria-label="Viewing as specialist">
              {specialists.filter((s) => s.verified).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        }
      />
      {withRequests.length > 0 && requests.length === 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
          <Hourglass size={17} className="shrink-0" />
          <p className="min-w-0 flex-1">A booking request is waiting for <b>{withRequests[0].name}</b>.</p>
          <Button size="sm" onClick={() => dispatch({ type: "viewAsSpecialist", id: withRequests[0].id })}>View as {withRequests[0].name.replace("Dr. ", "Dr ")}</Button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Hourglass size={20} />} tone="amber" label="Requests to confirm" value={requests.length} sub="Patients are waiting" />
        <Stat icon={<CalendarCheck2 size={20} />} label="Appointments today" value={list.length} />
        <Stat icon={<Timer size={20} />} tone="sky" label="On-time rate" value={`${sp.punctuality}%`} sub="Last 90 days" />
        <Stat icon={<Star size={20} />} tone="violet" label="Rating" value={sp.rating} sub={`${sp.reviews} reviews`} />
      </div>

      {requests.length > 0 && (
        <Card className="mt-6 border-amber-300">
          <CardHead title={<span className="flex items-center gap-2"><Hourglass size={17} className="text-amber-600" /> Booking requests</span>} sub="Confirm to share the video link, set reminders for you both and open the patient's file." />
          <ul className="divide-y divide-line">
            {requests.map((a) => {
              const pt = patients[a.patientId];
              return (
                <li key={a.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar name={pt.name} hue={(pt.age * 37) % 360} size={42} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-bold">{pt.name} <KycBadge status={pt.kyc?.status} /></p>
                      <p className="text-[13px] text-ink-mute">{pt.age} years{pt.kyc?.sex && pt.kyc.sex !== "Prefer not to say" ? ` · ${pt.kyc.sex}` : ""} · {pt.county}</p>
                      <p className="mt-0.5 text-sm text-ink-soft">{a.reason}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-bold">{date(a.at)}, {time(a.at)}</p>
                      <p className="text-ink-mute">{a.mode === "virtual" ? "Video" : "In person"} · {kes(a.fee)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 sm:pl-[54px]">
                    <Button size="sm" onClick={() => dispatch({ type: "accept", id: a.id })}><CheckCircle2 size={15} /> Confirm booking</Button>
                    <Button size="sm" variant="secondary" onClick={() => setDecline(a)}><X size={15} /> Decline</Button>
                    <span className="inline-flex h-9 items-center gap-1.5 text-xs text-ink-mute"><Lock size={13} /> File opens when you confirm</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHead title="Schedule" sub={`Confirm readiness up to ${state.rules.readinessWindowMin} minutes before each consultation.`} />
            {list.length === 0 && <Empty icon={<CalendarCheck2 />} title="No appointments today" />}
            <ul className="divide-y divide-line">
              {list.map((a) => {
                const pt = patients[a.patientId];
                const m = minutesUntil(a.at);
                const pending = a.status === "confirmed";
                const inWindow = pending && m <= state.rules.readinessWindowMin && m > -30;
                const meta = statusMeta[a.status];
                return (
                  <li key={a.id} className={cx("px-5 py-4", inWindow && "bg-brand-50/40")}>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-14 shrink-0 text-center">
                        <p className="text-sm font-bold">{time(a.at)}</p>
                        <p className="text-[11px] text-ink-mute">{a.mode === "virtual" ? <Video size={12} className="mx-auto" /> : <MapPin size={12} className="mx-auto" />}</p>
                      </div>
                      <Avatar name={pt.name} hue={(pt.age * 37) % 360} size={38} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{pt.name}</p>
                        <p className="truncate text-[13px] text-ink-mute">{a.reason}</p>
                      </div>
                      <Badge tone={inWindow ? "warn" : meta.tone}>{inWindow ? "Confirm readiness" : meta.label}</Badge>
                    </div>
                    {(["confirmed", "ready", "delayed", "in_consult"] as string[]).includes(a.status) && (
                      <div className="mt-3 flex flex-wrap gap-2 pl-[70px] max-sm:pl-0">
                        {pending && <Button size="sm" onClick={() => dispatch({ type: "ready", id: a.id })}><CheckCircle2 size={15} /> I'm ready</Button>}
                        {(a.status === "ready" || a.status === "delayed" || a.status === "in_consult") && (
                          <Button size="sm" onClick={() => { if (a.status !== "in_consult") dispatch({ type: "start", id: a.id }); if (a.mode === "virtual") setVideo(a); setConsult(a); }}><ClipboardPen size={15} /> {a.status === "in_consult" ? "Write notes" : "Start consultation"}</Button>
                        )}
                        {a.status !== "in_consult" && <Button size="sm" variant="secondary" onClick={() => setDelay(a)}><AlarmClock size={15} /> Report delay</Button>}
                        <FileButton a={a} />
                        {pending && <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "noShow", id: a.id })} title="Demo: simulate the specialist missing the readiness check"><UserX size={15} /> Simulate no response</Button>}
                      </div>
                    )}
                    {a.status === "completed" && <div className="mt-3 pl-[70px] max-sm:pl-0"><FileButton a={a} /></div>}
                    {a.status === "recovery" && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 sm:ml-[70px]">Service recovery in progress. The patient is choosing an option and a coordinator has been alerted.</p>}
                    <button onClick={() => setOpen(open === a.id ? undefined : a.id)} className="mt-2 text-xs font-semibold text-ink-mute hover:text-ink sm:ml-[70px]">{open === a.id ? "Hide" : "Show"} link, reminders and activity</button>
                    {open === a.id && (
                      <div className="mt-3 space-y-3 sm:ml-[70px]">
                        {a.mode === "virtual" && <VideoLink a={a} />}
                        <Reminders a={a} forDoctor />
                        <Timeline a={a} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHead title="Upcoming confirmed bookings" sub="Video link and reminders are already sent to you and the patient." />
            {later.length === 0 && <Empty icon={<CalendarCheck2 />} title="Nothing else confirmed yet" body="Bookings you confirm appear here." />}
            <ul className="divide-y divide-line">
              {later.map((a) => {
                const pt = patients[a.patientId];
                return (
                  <li key={a.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-20 shrink-0"><p className="text-sm font-bold">{date(a.at)}</p><p className="text-xs text-ink-mute">{time(a.at)} · {a.mode === "virtual" ? "Video" : "In person"}</p></div>
                      <Avatar name={pt.name} hue={(pt.age * 37) % 360} size={36} />
                      <div className="min-w-0 flex-1"><p className="font-semibold">{pt.name}</p><p className="truncate text-[13px] text-ink-mute">{a.reason}</p></div>
                      <FileButton a={a} />
                    </div>
                    {a.mode === "virtual" && <div className="mt-3 sm:ml-[92px]"><VideoLink a={a} /></div>}
                    <div className="mt-2 sm:ml-[92px]"><Reminders a={a} forDoctor /></div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHead title="Referrals inbox" />
            <ul className="divide-y divide-line">
              {refs.map((r) => (
                <li key={r.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{patients[r.patientId].name}</p><Badge tone={r.status === "sent" ? "warn" : "ok"}>{r.status}</Badge></div>
                  <p className="text-[13px] text-ink-mute">From {byId(specialists, r.fromId)?.name}: {r.reason}</p>
                  {r.status === "sent" && <Button size="sm" className="mt-2" onClick={() => dispatch({ type: "referral", id: r.id, status: "accepted" })}>Accept referral</Button>}
                </li>
              ))}
              {refs.length === 0 && <li className="p-5 text-sm text-ink-mute">No referrals.</li>}
            </ul>
          </Card>
          <Card className="p-5 text-sm">
            <p className="font-bold">How a booking works</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-ink-soft">
              <li>The patient requests a time and pays. It is held until you confirm.</li>
              <li>You confirm. Both of you get the video link and reminders by SMS and in the app.</li>
              <li>The patient's file opens to you for that visit. They can withdraw access, and every view is logged.</li>
              <li>From {state.rules.readinessWindowMin} min before, tap “I'm ready”. Running late? Report it and the patient is told.</li>
              <li>After the visit, your summary and prescription go to the patient's record. They choose their pharmacy.</li>
            </ol>
          </Card>
        </div>
      </div>
      {consult && <ConsultModal a={consult} onClose={() => setConsult(undefined)} onOpenFile={() => setFileOf(consult.patientId)} />}
      {delay && <DelayPicker onPick={(m) => dispatch({ type: "delay", id: delay.id, minutes: m })} onClose={() => setDelay(undefined)} />}
      {decline && <DeclineModal a={decline} onClose={() => setDecline(undefined)} />}
      {fileOf && <PatientFileModal patientId={fileOf} specialistId={sp.id} onClose={() => setFileOf(undefined)} />}
      {video && !consult && <VideoRoom a={video} asDoctor onClose={() => setVideo(undefined)} />}
    </>
  );
}

export function SpecialistPerformance() {
  const { state } = useStore();
  const sp = byId(specialists, state.specialistId)!;
  const data = Array.from({ length: 12 }, (_, i) => ({ w: `W${i + 1}`, ontime: Math.round(sp.punctuality - 4 + Math.sin(i) * 2 + i * 0.4), wait: Math.max(2, Math.round(sp.avgWait + 3 - i * 0.3 + Math.cos(i) * 2)) }));
  const incidents = state.incidents.filter((i) => i.specialistId === sp.id);
  return (
    <>
      <PageTitle title="Performance" sub="The same numbers patients see on your profile." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Timer size={20} />} label="On-time starts" value={`${sp.punctuality}%`} sub="Target 95%" />
        <Stat icon={<AlarmClock size={20} />} tone="amber" label="Average wait" value={`${sp.avgWait} min`} />
        <Stat icon={<UserX size={20} />} tone="rose" label="Incidents (30 d)" value={incidents.length} />
        <Stat icon={<Star size={20} />} tone="violet" label="Patient rating" value={sp.rating} />
      </div>
      <Card className="mt-6">
        <CardHead title="On-time rate and average wait, last 12 weeks" />
        <div className="h-72 p-4">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ left: -10, right: 10, top: 10 }}>
              <CartesianGrid stroke="#E3EAF2" vertical={false} />
              <XAxis dataKey="w" tick={{ fontSize: 12, fill: "#6B7C93" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" domain={[80, 100]} tick={{ fontSize: 12, fill: "#6B7C93" }} axisLine={false} tickLine={false} unit="%" />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 12, fill: "#6B7C93" }} axisLine={false} tickLine={false} unit="m" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E3EAF2" }} />
              <Line yAxisId="l" type="monotone" dataKey="ontime" name="On time %" stroke="#0A7F73" strokeWidth={2.5} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="wait" name="Avg wait (min)" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="mt-6">
        <CardHead title="Incidents" />
        <ul className="divide-y divide-line">
          {incidents.length === 0 && <li className="p-5 text-sm text-ink-mute">No incidents recorded.</li>}
          {incidents.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <Badge tone={i.kind === "provider_no_show" ? "bad" : "warn"}>{i.kind.replace(/_/g, " ")}</Badge>
              <span className="flex-1">{i.minutes ? `${i.minutes} min · ` : ""}{i.resolution}</span>
              <span className="text-ink-mute">{dateTime(i.at)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
