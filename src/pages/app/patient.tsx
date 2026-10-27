import {
  ArrowRight, BookOpen, CalendarPlus, Check, CheckCircle2, ChevronRight, Clock, Download, Eye, FileText, FlaskConical, HeartHandshake, Lock, MessageSquareWarning,
  Pill, Send, ShieldCheck, Siren, Sparkles, Star, Trash2, UserRound, Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AppointmentCard, statusMeta, Timeline } from "../../components/Appointment";
import { downloadRecord, KycBadge, PatientFile } from "../../components/PatientFile";
import { PrescriptionCard } from "../../components/Prescriptions";
import { toast } from "../../components/Toaster";
import { Avatar, Badge, Button, Card, CardHead, Empty, Field, inputCls, Modal, PageTitle, Progress } from "../../components/ui";
import { byId, pathways, specialists } from "../../data/seed";
import { FEATURES } from "../../lib/features";
import { ago, channelLabel, cx, date, dateTime } from "../../lib/format";
import { BLOOD_GROUPS, CONDITION_OPTIONS, splitList } from "../../lib/kyc";
import { enrolledOf, patients, useStore, type Prescription } from "../../store/store";
import { every, kindIcon } from "../public/Pathways";

// Re-exported for the portals that share these step trackers.
export { labSteps, MiniSteps, rxSteps } from "../../components/Steps";
import { MiniSteps } from "../../components/Steps";

const ACTIVE = ["requested", "confirmed", "ready", "delayed", "recovery", "in_consult"];
const DEMO = "pt-grace";

function useMine() {
  const { state } = useStore();
  const pid = state.patientId;
  return {
    state,
    me: patients[pid],
    appts: state.appointments.filter((a) => a.patientId === pid).sort((a, b) => +new Date(a.at) - +new Date(b.at)),
    labOrders: state.labOrders.filter((o) => o.patientId === pid),
    rx: state.prescriptions.filter((p) => p.patientId === pid),
    referrals: state.referrals.filter((r) => r.patientId === pid),
  };
}

function RefillCard({ p }: { p: Prescription }) {
  const { dispatch } = useStore();
  const days = p.nextRefill ? Math.ceil((+new Date(p.nextRefill) - Date.now()) / 86400000) : 0;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-orange-700"><Pill size={20} /></span>
          <div>
            <p className="font-bold">Medicine refill</p>
            <p className="text-sm text-ink-mute">{p.items.map((i) => i.drug).join(", ")}</p>
          </div>
        </div>
        <Badge tone={days <= 5 ? "warn" : "neutral"}>Due in {Math.max(days, 0)} d</Badge>
      </div>
      <Button className="mt-4 w-full" variant="secondary" onClick={() => dispatch({ type: "refill", id: p.id })} disabled={p.refillsLeft < 1}><Send size={15} /> Get my refill ({p.refillsLeft} left)</Button>
      <p className="mt-2 text-xs text-ink-mute">You then choose the pharmacy you prefer.</p>
    </Card>
  );
}

export function PatientHome() {
  const { state, me, appts, rx } = useMine();
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const active = appts.filter((a) => ACTIVE.includes(a.status));
  const next = active[0];
  const notices = state.notices.filter((n) => n.to === "patient" && n.patientId === state.patientId).slice(0, 5);
  const waiting = rx.filter((r) => r.status === "issued");
  const refill = rx.find((p) => p.nextRefill && ["delivered", "collected"].includes(p.status));
  const advised = [...appts].reverse().find((a) => a.testsAdvised?.length);
  const hasResults = state.labOrders.some((o) => o.patientId === state.patientId && o.results);
  const enrolled = enrolledOf(state);
  const p = pathways.find((x) => x.id === enrolled[0]);
  const viewingDemo = state.patientId === DEMO;
  const mine = state.myPatientId === state.patientId;
  const firstVisit = mine && appts.filter((a) => a.status !== "cancelled" && a.status !== "declined").length === 0;
  const hour = new Date().getHours();

  return (
    <>
      {viewingDemo && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-sky2-100 bg-sky2-50 p-3.5 text-sm text-sky2-700">
          <UserRound size={18} className="shrink-0" />
          <p className="min-w-0 flex-1">You are viewing the demo patient, <b>Grace Wambui</b>.</p>
          {state.myPatientId ? (
            <Button size="sm" onClick={() => dispatch({ type: "usePatient", id: state.myPatientId! })}>Back to my account</Button>
          ) : (
            <Button size="sm" onClick={() => navigate("/register")}>Register as yourself <ArrowRight size={14} /></Button>
          )}
        </div>
      )}

      <PageTitle title={`Good ${hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}, ${me.name.split(" ")[0]}`} sub="Here is everything happening in your care today." />

      {firstVisit && (
        <Card className="mb-6 overflow-hidden border-brand-200">
          <div className="bg-gradient-to-r from-brand-600 to-brand-800 p-5 text-white">
            <p className="flex items-center gap-2 text-lg font-extrabold"><Sparkles size={18} /> Welcome. Let's get your first visit booked.</p>
            <p className="mt-1 text-sm text-white/80">Your account is ready. Here is where you are.</p>
          </div>
          <ul className="divide-y divide-line">
            {[
              { done: true, t: "Account created", s: "Phone verified and consent saved" },
              { done: me.kyc?.status === "verified", t: "ID check", s: me.kyc?.status === "verified" ? "Verified" : "In review. Usually within 24 hours. You can book meanwhile" },
              { done: !!(me.emergency && (me.conditions.length || me.allergies?.length || me.medications?.length)), t: "Health basics", s: "Add or change them any time in your profile" },
              { done: false, t: "Book your first specialist", s: "The doctor confirms, then you both get the video link and reminders", cta: true },
            ].map((x) => (
              <li key={x.t} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3.5">
                <span className={cx("grid h-7 w-7 shrink-0 place-items-center rounded-full", x.done ? "bg-brand-600 text-white" : "border-2 border-line text-ink-mute")}>{x.done ? <Check size={15} strokeWidth={3} /> : null}</span>
                <span className="min-w-0 flex-1 basis-40"><b className="block text-[15px]">{x.t}</b><span className="text-[13px] text-ink-mute">{x.s}</span></span>
                {x.cta && <Button size="sm" className="ml-10 sm:ml-0" onClick={() => navigate("/find-care")}>Find a specialist</Button>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { to: "/find-care", icon: CalendarPlus, t: "Book a visit", s: "Video or in person", c: "bg-sky2-500" },
          { to: "/app/patient/record", icon: FileText, t: "Health record", s: "Visits, notes, results", c: "bg-violet-500" },
          { to: "/app/patient/record?tab=rx", icon: Pill, t: "Prescriptions", s: waiting.length ? `${waiting.length} waiting for you` : "Codes and reminders", c: "bg-orange-500" },
          { to: "/app/patient/care", icon: Users, t: "Care plan", s: "Referrals and support", c: "bg-pink-500" },
        ].map((x) => (
          <Link key={x.t} to={x.to} className="rounded-3xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
            <span className={`grid h-11 w-11 place-items-center rounded-full text-white shadow-sm ${x.c}`}><x.icon size={20} /></span>
            <p className="mt-3 font-bold leading-tight">{x.t}</p>
            <p className="text-xs text-ink-mute">{x.s}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-6">
          {waiting.length > 0 && (
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 font-bold"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" /> Needs you</h2>
              {waiting.map((r) => <PrescriptionCard key={r.id} rx={r} />)}
            </div>
          )}
          {next ? <AppointmentCard a={next} focus /> : !firstVisit && (
            <Card><Empty icon={<CalendarPlus />} title="No upcoming appointments" body="Book your next review from the directory." /></Card>
          )}
          {next && next.status === "confirmed" && viewingDemo && (
            <Card className="flex flex-wrap items-center gap-4 border-dashed bg-gradient-to-r from-brand-50 to-white p-5">
              <Sparkles className="text-brand-600" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">Try the reliability engine</p>
                <p className="text-sm text-ink-soft">Switch to the specialist view, report a 35 minute delay or mark readiness, then come back here.</p>
              </div>
              <Link to="/app/specialist" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-ink/90">Open specialist view <ArrowRight size={15} /></Link>
            </Card>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {refill && <RefillCard p={refill} />}
            {advised && !FEATURES.lab && !hasResults && (
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-700"><FlaskConical size={20} /></span>
                  <div><p className="font-bold">Tests recommended</p><p className="text-sm text-ink-mute">{byId(specialists, advised.specialistId)?.name} · {date(advised.at)}</p></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">{advised.testsAdvised!.map((t) => <Badge key={t} tone="info">{t}</Badge>)}</div>
                <p className="mt-3 text-xs text-ink-mute">Take them at any accredited lab. Digital lab booking and results come in a later phase.</p>
              </Card>
            )}
          </div>
          {active.length > 1 && (
            <div className="space-y-3">
              <h2 className="font-bold">Also coming up</h2>
              {active.slice(1, 3).map((a) => <AppointmentCard key={a.id} a={a} />)}
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-6">
          {p && (
            <Card>
              <CardHead title={p.name} sub="Your care plan" action={<Link to="/app/patient/care" className="text-sm font-semibold text-brand-700">Open</Link>} />
              <ul className="divide-y divide-line">
                {p.steps.slice(0, 4).map((s, i) => {
                  const Icon = kindIcon[s.kind];
                  const status = viewingDemo ? ["Today", "Recommended", "Recommended", "In 4 days"][i] : "Scheduled";
                  return (
                    <li key={s.label} className="flex items-center gap-3 px-5 py-3">
                      <Icon size={17} className="shrink-0" style={{ color: p.colour }} />
                      <span className="flex-1 text-sm font-medium">{s.label}</span>
                      <span className="text-xs font-semibold text-ink-mute">{status}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
          <Card>
            <CardHead title="Latest updates" />
            <ul className="divide-y divide-line">
              {notices.length === 0 && <li className="p-5 text-sm text-ink-mute">Updates from your doctors will show here.</li>}
              {notices.map((n) => (
                <li key={n.id} className="px-5 py-3">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-[13px] text-ink-soft">{n.body}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-mute">{channelLabel(n)} · {ago(n.at)}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="border-rose-200 bg-rose-50/60 p-5">
            <p className="flex items-center gap-2 font-bold text-rose-800"><Siren size={18} /> Feeling very unwell?</p>
            <p className="mt-1 text-sm text-rose-900/80">Chest pain, breathlessness, swelling with little urine, seizures or high fever on immune-suppressing medicine: call <b>999</b> or <b>112</b> now. Do not wait for your appointment.</p>
          </Card>
        </div>
      </div>
    </>
  );
}

export function PatientAppointments() {
  const { appts } = useMine();
  const { dispatch } = useStore();
  const [tab, setTab] = useState<"upcoming" | "past" | "other">("upcoming");
  const upcoming = appts.filter((a) => ACTIVE.includes(a.status));
  const past = appts.filter((a) => a.status === "completed").reverse();
  const other = appts.filter((a) => ["cancelled", "rescheduled", "reassigned", "declined"].includes(a.status)).reverse();
  const [fb, setFb] = useState<string>();
  const [fbText, setFbText] = useState("");

  return (
    <>
      <PageTitle title="Appointments" sub="Book, follow, reschedule or cancel." action={<Link to="/find-care" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"><CalendarPlus size={16} /> Book new</Link>} />
      <div role="tablist" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-canvas p-1 no-scrollbar">
        {([["upcoming", "Upcoming", upcoming.length], ["past", "Past", past.length], ["other", "Changed", other.length]] as const).map(([v, l, n]) => (
          <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={cx("whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition focus-ring", tab === v ? "bg-white text-ink shadow-sm" : "text-ink-mute hover:text-ink")}>
            {l}<span className="ml-1.5 rounded-full bg-brand-100 px-1.5 text-xs text-brand-800">{n}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-4">
        {tab === "upcoming" && (upcoming.length ? upcoming.map((a) => <AppointmentCard key={a.id} a={a} />) : <Card><Empty icon={<CalendarPlus />} title="Nothing booked" body="Find a specialist and book. They confirm, then you get the video link and reminders." /></Card>)}
        {tab === "past" && (past.length === 0 && <Card><Empty icon={<Clock />} title="No past visits yet" /></Card>)}
        {tab === "past" && past.map((a) => {
          const sp = byId(specialists, a.specialistId)!;
          return (
            <Card key={a.id} className="p-5">
              <div className="flex flex-wrap items-start gap-4">
                <Avatar name={sp.name} hue={sp.hue} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{sp.name}</p>
                  <p className="text-sm text-ink-mute">{a.reason} · {dateTime(a.at)}</p>
                </div>
                <div className="flex items-center gap-0.5" aria-label="Rate this visit">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => dispatch({ type: "rate", id: a.id, rating: n })} aria-label={`${n} stars`}>
                      <Star size={18} className={n <= (a.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-line"} />
                    </button>
                  ))}
                </div>
              </div>
              {a.notes && <div className="mt-4 rounded-xl bg-canvas p-4 text-sm"><p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-mute">Doctor's summary for you</p>{a.notes}</div>}
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-ink-soft">Activity log</summary>
                <div className="mt-3"><Timeline a={a} /></div>
              </details>
              {fb === a.id ? (
                <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); dispatch({ type: "feedback", about: sp.name, category: "Patient feedback", text: fbText }); setFb(undefined); setFbText(""); }}>
                  <textarea required value={fbText} onChange={(e) => setFbText(e.target.value)} className={inputCls} rows={3} placeholder="Tell us what went well or what went wrong" />
                  <div className="flex gap-2"><Button size="sm" type="submit">Send to the platform team</Button><Button size="sm" variant="ghost" type="button" onClick={() => setFb(undefined)}>Cancel</Button></div>
                </form>
              ) : (
                <button onClick={() => setFb(a.id)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"><MessageSquareWarning size={15} /> Give feedback or raise a complaint</button>
              )}
            </Card>
          );
        })}
        {tab === "other" && (other.length ? other.map((a) => {
          const sp = byId(specialists, a.specialistId)!;
          return (
            <Card key={a.id} className="p-5">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-bold">{sp.name}</p><Badge tone={statusMeta[a.status].tone}>{statusMeta[a.status].label}</Badge>
                <p className="w-full text-sm text-ink-mute sm:w-auto">{dateTime(a.at)}</p>
              </div>
              <div className="mt-4"><Timeline a={a} /></div>
            </Card>
          );
        }) : <Card><Empty icon={<Clock />} title="No changed appointments" /></Card>)}
      </div>
    </>
  );
}

// Like a student portal for your health: one record that grows with every visit.
export function PatientRecord() {
  const { state } = useStore();
  const [params] = useSearchParams();
  const t = params.get("tab");
  return (
    <>
      <PageTitle
        title="Health record"
        sub="Your visits, prescriptions and results, kept in one place. Specialists see it only after they confirm a booking with you."
        action={<Button variant="secondary" size="sm" onClick={() => downloadRecord(state, state.patientId)}><Download size={15} /> Download my record</Button>}
      />
      <PatientFile key={state.patientId} patientId={state.patientId} viewer="patient" initialTab={t === "rx" || t === "visits" || t === "tests" ? t : undefined} />
    </>
  );
}

export function PatientProfile() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const id = state.patientId;
  const p = patients[id];
  const mine = id === state.myPatientId;
  const k = p.kyc;
  const [conditions, setConditions] = useState<string[]>(p.conditions);
  const [other, setOther] = useState("");
  const [allergies, setAllergies] = useState((p.allergies ?? []).join(", "));
  const [meds, setMeds] = useState((p.medications ?? []).join("\n"));
  const [blood, setBlood] = useState(p.bloodGroup ?? "Not sure");
  const [em, setEm] = useState(p.emergency ?? { name: "", relation: "", phone: "" });
  const [del, setDel] = useState(false);

  const appts = state.appointments.filter((a) => a.patientId === id);
  const ids = useMemo(
    () => [...appts.map((a) => a.id), ...state.labOrders.filter((o) => o.patientId === id).map((o) => o.id), ...state.prescriptions.filter((r) => r.patientId === id).map((r) => r.id), id],
    [appts, state.labOrders, state.prescriptions, id],
  );
  const log = state.audit.filter((a) => ids.some((x) => a.resource.includes(x)));
  const consents = state.consents.filter((c) => c.patientId === id);

  function save() {
    dispatch({
      type: "profileUpdate", id,
      patch: { conditions: [...conditions, ...splitList(other)], allergies: splitList(allergies), medications: splitList(meds), bloodGroup: blood === "Not sure" ? undefined : blood, emergency: em.name ? em : undefined },
    });
    setOther("");
  }

  return (
    <>
      <PageTitle title="Profile and privacy" sub="Your identity details, health basics, and who can see your information." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHead title="Identity and ID check" action={<KycBadge status={k?.status} />} />
            <div className="p-5">
              <div className="flex items-center gap-4">
                <Avatar name={p.name} hue={(p.age * 37) % 360} size={56} />
                <div className="min-w-0"><p className="text-lg font-bold">{p.name}</p><p className="text-sm text-ink-mute">{p.phone}{p.email ? ` · ${p.email}` : ""}</p></div>
              </div>
              {k ? (
                <dl className="mt-5 grid grid-cols-[130px_1fr] gap-x-3 gap-y-2 text-sm">
                  {[
                    [k.idType, k.idMasked],
                    ["Date of birth", new Date(k.dob).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })],
                    ["Sex", k.sex],
                    ["Nationality", k.nationality],
                    ["Lives in", `${k.town}, ${k.county}`],
                    ["Messages in", k.language],
                    ["Submitted", date(k.submittedAt)],
                    ...(k.guardian ? [["Guardian", `${k.guardian.name} (${k.guardian.relation})`]] : []),
                  ].map(([a, b]) => <div key={a} className="contents"><dt className="text-ink-mute">{a}</dt><dd className="font-semibold">{b}</dd></div>)}
                </dl>
              ) : <p className="mt-4 text-sm text-ink-mute">No ID submitted.</p>}
              {k?.status === "pending" && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-[13px] text-amber-900">We are checking your ID, usually within 24 hours. You can book and see doctors meanwhile. (Demo: approve it from the Admin view, under Providers.)</p>}
              {k?.status === "verified" && <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-[13px] font-medium text-emerald-800"><ShieldCheck size={15} /> Verified. Doctors see a verified badge next to your name.</p>}
              <p className="mt-3 text-xs text-ink-mute">Only the last four digits of your ID number are kept.</p>
            </div>
          </Card>

          <Card>
            <CardHead title="Health basics" sub="Your doctors see these once they confirm a booking." />
            <form className="space-y-5 p-5" onSubmit={(e) => { e.preventDefault(); save(); }}>
              <div>
                <p className="mb-2 text-sm font-semibold">Long-term conditions</p>
                <div className="flex flex-wrap gap-2">
                  {[...new Set([...CONDITION_OPTIONS, ...conditions])].map((c) => {
                    const on = conditions.includes(c);
                    return <button key={c} type="button" aria-pressed={on} onClick={() => setConditions(on ? conditions.filter((x) => x !== c) : [...conditions, c])} className={cx("h-9 rounded-full border px-3 text-[13px] font-semibold focus-ring", on ? "border-brand-500 bg-brand-600 text-white" : "border-line text-ink-soft hover:border-brand-300")}>{c}</button>;
                  })}
                </div>
                <input className={cx(inputCls, "mt-3")} value={other} onChange={(e) => setOther(e.target.value)} placeholder="Add another (separate with commas)" aria-label="Other conditions" />
              </div>
              <Field label="Allergies" hint="Separate with commas."><input className={inputCls} value={allergies} onChange={(e) => setAllergies(e.target.value)} /></Field>
              <Field label="Medicines now" hint="One per line."><textarea className={inputCls} rows={3} value={meds} onChange={(e) => setMeds(e.target.value)} /></Field>
              <Field label="Blood group">
                <select className={inputCls} value={blood} onChange={(e) => setBlood(e.target.value)}>{BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}</select>
              </Field>
              <div className="space-y-3 rounded-2xl bg-canvas p-4">
                <p className="text-sm font-bold">Emergency contact</p>
                <input className={inputCls} placeholder="Name" aria-label="Emergency contact name" value={em.name} onChange={(e) => setEm({ ...em, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputCls} placeholder="Relationship" aria-label="Relationship" value={em.relation} onChange={(e) => setEm({ ...em, relation: e.target.value })} />
                  <input className={inputCls} placeholder="Mobile" aria-label="Emergency contact mobile" value={em.phone} onChange={(e) => setEm({ ...em, phone: e.target.value })} />
                </div>
              </div>
              <Button type="submit"><Check size={16} /> Save changes</Button>
            </form>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHead title="Who can see my information" sub="Changes take effect immediately and are logged." />
            <ul className="divide-y divide-line">
              {consents.map((c) => (
                <li key={c.party} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold">{c.party} {c.locked && <Lock size={13} className="text-ink-mute" />}</p>
                    <p className="text-[13px] text-ink-mute">{c.scope}</p>
                  </div>
                  <button role="switch" aria-checked={c.granted} aria-label={`Access for ${c.party}`} disabled={c.locked} onClick={() => dispatch({ type: "consent", party: c.party })} className={cx("relative h-6 w-11 shrink-0 rounded-full transition focus-ring disabled:opacity-60", c.granted ? "bg-brand-600" : "bg-slate-300")}>
                    <span className={cx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition", c.granted ? "left-[22px]" : "left-0.5")} />
                  </button>
                </li>
              ))}
              {consents.length === 0 && <li className="p-5 text-sm text-ink-mute">When you book a specialist and they confirm, they appear here and you can withdraw their access at any time.</li>}
            </ul>
            <p className="border-t border-line px-5 py-3 text-xs text-ink-mute">A specialist can open your file only after confirming a booking with you. Pharmacies, labs and patient organisations never get it by default.</p>
          </Card>

          <Card>
            <CardHead title="Access log" sub="Every time someone views or changes your records." />
            <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
              {log.length === 0 && <li className="p-5 text-sm text-ink-mute">No activity yet.</li>}
              {log.map((a) => (
                <li key={a.id} className="flex gap-3 px-5 py-3">
                  <Eye size={16} className="mt-0.5 shrink-0 text-ink-mute" />
                  <div><p className="text-sm"><b>{a.actor}</b> <span className="text-ink-mute">({a.role})</span></p><p className="text-[13px] text-ink-soft">{a.action}</p><p className="text-[11px] text-ink-mute">{dateTime(a.at)}</p></div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <p className="font-bold">Your data, your rights</p>
            <p className="mt-1 text-sm text-ink-soft">Under the Data Protection Act 2019 you can keep a copy of your data and ask for it to be deleted.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => downloadRecord(state, id)}><Download size={15} /> Download my record</Button>
              {mine && <Button variant="ghost" size="sm" onClick={() => setDel(true)}><Trash2 size={15} /> Delete my account</Button>}
              {state.myPatientId && id === state.myPatientId && <Button variant="ghost" size="sm" onClick={() => { dispatch({ type: "usePatient", id: DEMO }); navigate("/app/patient"); }}>View the demo patient</Button>}
              {state.myPatientId && id === DEMO && <Button variant="ghost" size="sm" onClick={() => { dispatch({ type: "usePatient", id: state.myPatientId! }); navigate("/app/patient"); }}>Back to my account</Button>}
            </div>
          </Card>
        </div>
      </div>
      <Modal open={del} onClose={() => setDel(false)} title="Delete your account?">
        <p className="text-sm text-ink-soft">This removes your profile, bookings, prescriptions and record from this device. It cannot be undone. Download your record first if you want a copy.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDel(false)}>Keep my account</Button>
          <Button variant="danger" onClick={() => { dispatch({ type: "deleteAccount", id }); setDel(false); navigate("/"); toast("Your account was deleted", "info"); }}>Delete everything</Button>
        </div>
      </Modal>
    </>
  );
}

export function PatientCare() {
  const { state, referrals, appts, labOrders } = useMine();
  const { dispatch } = useStore();
  const enrolled = pathways.filter((p) => enrolledOf(state).includes(p.id));
  const done = appts.filter((a) => a.status === "completed").length + labOrders.filter((o) => o.status === "result_ready").length;
  const demo = state.patientId === DEMO;
  const team = [...new Map(appts.filter((a) => !["cancelled", "declined", "rescheduled"].includes(a.status)).map((a) => [a.specialistId, byId(specialists, a.specialistId)!])).values()];

  return (
    <>
      <PageTitle title="My care plan" sub="Your pathway, referrals, care team and support." />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 space-y-6">
          {enrolled.length === 0 && (
            <Card className="p-6">
              <p className="font-bold">Choose a care pathway</p>
              <p className="mt-1 text-sm text-ink-soft">A pathway turns a long-term condition into a schedule of reviews, tests and follow-up that we remind you about. Pick the one that fits.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {pathways.map((p) => <button key={p.id} onClick={() => dispatch({ type: "enrol", pathway: p.id })} className="rounded-full border border-line px-3.5 py-2 text-sm font-semibold hover:border-brand-300">{p.short}</button>)}
              </div>
            </Card>
          )}
          {enrolled.map((p) => (
            <Card key={p.id}>
              <CardHead title={p.name} sub={`Led by ${p.lead} · coordinated by Wanjiku (care coordinator)`} />
              <div className="px-5 pt-4">
                <div className="flex items-center justify-between text-sm"><span className="font-semibold">This quarter</span><span className="text-ink-mute">{Math.min(done, p.steps.length)} of {p.steps.length} steps on track</span></div>
                <div className="mt-2"><Progress value={(Math.min(done, p.steps.length) / p.steps.length) * 100} /></div>
              </div>
              <ol className="mt-3 divide-y divide-line">
                {p.steps.map((s, i) => {
                  const Icon = kindIcon[s.kind];
                  const st = demo ? ([["Due today", "info"], ["Recommended", "info"], ["Recommended", "info"], ["Due in 4 days", "warn"], ["Booked in 19 days", "ok"], ["Next session Sat", "neutral"]][i] ?? ["Scheduled", "neutral"]) : ["Scheduled", "neutral"];
                  return (
                    <li key={s.label} className="flex items-start gap-3 px-5 py-3.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: `${p.colour}14`, color: p.colour }}><Icon size={17} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{s.label}</p>
                        <p className="text-[13px] text-ink-mute">{every(s.everyWeeks)} · {s.detail}</p>
                      </div>
                      <Badge tone={st[1] as "info"}>{st[0]}</Badge>
                    </li>
                  );
                })}
              </ol>
            </Card>
          ))}
          <Card>
            <CardHead title="Referrals" sub="Tracked from request to completed visit." />
            <ul className="divide-y divide-line">
              {referrals.length === 0 && <li className="p-5 text-sm text-ink-mute">If one specialist refers you to another, it is tracked here.</li>}
              {referrals.map((r) => {
                const to = r.toId ? byId(specialists, r.toId) : undefined;
                const steps = ["sent", "accepted", "booked", "completed"] as const;
                return (
                  <li key={r.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold">{r.toSpecialty}{to ? ` · ${to.name}` : ""}</p>
                      <Badge tone={r.status === "completed" ? "ok" : "info"}>{r.status}</Badge>
                    </div>
                    <p className="text-[13px] text-ink-mute">From {byId(specialists, r.fromId)?.name}: {r.reason}</p>
                    <div className="mt-2.5"><MiniSteps steps={steps.map((s) => ({ s, l: s[0].toUpperCase() + s.slice(1) }))} current={r.status} /></div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHead title="My care team" />
            <ul className="divide-y divide-line">
              {team.length === 0 && <li className="p-5 text-sm text-ink-mute">The specialists you book appear here.</li>}
              {team.map((sp) => (
                <li key={sp.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={sp.name} hue={sp.hue} size={36} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{sp.name}</p><p className="text-xs text-ink-mute">{sp.specialty}</p></div>
                  <Link to={`/specialists/${sp.id}`} aria-label={`View ${sp.name}`}><ChevronRight size={18} className="text-ink-mute" /></Link>
                </li>
              ))}
              <li className="flex items-center gap-3 px-5 py-3">
                <Avatar name="Wanjiku Coordinator" hue={30} size={36} />
                <div className="flex-1"><p className="text-sm font-semibold">Wanjiku N.</p><p className="text-xs text-ink-mute">Care coordinator · calls if anything slips</p></div>
              </li>
            </ul>
          </Card>
          <Card>
            <CardHead title="Support and learning" sub="From patient organisations" />
            <ul className="divide-y divide-line">
              {[
                { icon: Users, t: "Monthly peer session", s: "Last Saturday · Nairobi and online" },
                { icon: BookOpen, t: "Understanding your condition", s: "5 min read · approved by the clinical board" },
                { icon: HeartHandshake, t: "Living well with a long-term illness", s: "Video · Kiswahili and English" },
                { icon: CheckCircle2, t: "Questions to ask your doctor", s: "Checklist" },
              ].map((x) => (
                <li key={x.t} className="flex items-center gap-3 px-5 py-3">
                  <x.icon size={18} className="shrink-0 text-pink-600" />
                  <div><p className="text-sm font-semibold">{x.t}</p><p className="text-xs text-ink-mute">{x.s}</p></div>
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-5 py-3 text-xs text-ink-mute"><Lock size={12} className="mr-1 inline" />Patient organisations see your membership only, never your medical records.</p>
          </Card>
          <Card className="p-5">
            <p className="font-bold">Add another pathway</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pathways.map((p) => (
                <button key={p.id} onClick={() => dispatch({ type: "enrol", pathway: p.id })} className={cx("rounded-full border px-3 py-1.5 text-sm font-semibold", enrolledOf(state).includes(p.id) ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line")}>{p.short}</button>
              ))}
            </div>
          </Card>
          <FeedbackCard />
        </div>
      </div>
    </>
  );
}

function FeedbackCard() {
  const { dispatch } = useStore();
  const [sent, setSent] = useState(false);
  const [text, setText] = useState("");
  const [cat, setCat] = useState("General feedback");
  return (
    <Card className="p-5">
      <p className="font-bold">Tell us how we are doing</p>
      {sent ? <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Thank you. The platform team will reply within 2 working days.</p> : (
        <form className="mt-3 space-y-3" onSubmit={(e) => { e.preventDefault(); dispatch({ type: "feedback", about: "The platform", category: cat, text }); setSent(true); }}>
          <Field label="Topic">
            <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)}>
              {["General feedback", "Late start", "Booking or video link", "Prescription issue", "Billing or refund"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <textarea required className={inputCls} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your message" />
          <Button size="sm" type="submit">Send</Button>
        </form>
      )}
    </Card>
  );
}

