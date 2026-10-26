import {
  ArrowRight, BookOpen, CalendarPlus, CheckCircle2, ChevronRight, Clock, Eye, FlaskConical, HeartHandshake, Lock, MessageSquareWarning,
  Pill, Send, Siren, Sparkles, Star, Truck, Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppointmentCard, statusMeta, Timeline } from "../../components/Appointment";
import { Avatar, Badge, Button, Card, CardHead, Empty, Field, inputCls, PageTitle, Progress, Tabs } from "../../components/ui";
import { byId, labs, pathways, pharmacies, specialists } from "../../data/seed";
import { ago, cx, date, dateTime, kes } from "../../lib/format";
import { patients, useStore, type LabStatus, type Prescription, type RxStatus } from "../../store/store";
import { every, kindIcon } from "../public/Pathways";

const ACTIVE = ["confirmed", "ready", "delayed", "recovery", "in_consult"];

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

export const labSteps: { s: LabStatus; l: string }[] = [
  { s: "requested", l: "Ordered" },
  { s: "booked", l: "Collection booked" },
  { s: "sample_collected", l: "Collected" },
  { s: "processing", l: "Processing" },
  { s: "result_ready", l: "Results" },
];
export const rxSteps: { s: RxStatus; l: string }[] = [
  { s: "received", l: "Received" },
  { s: "verified", l: "Verified" },
  { s: "ready", l: "Packed" },
  { s: "out_for_delivery", l: "On the way" },
  { s: "delivered", l: "Delivered" },
];

export function MiniSteps<T extends string>({ steps, current }: { steps: { s: T; l: string }[]; current: T }) {
  const idx = steps.findIndex((x) => x.s === current);
  return (
    <ol className="flex gap-1.5">
      {steps.map((x, i) => (
        <li key={x.s} className="min-w-0 flex-1">
          <div className={cx("h-1.5 rounded-full", i <= idx ? "bg-brand-500" : "bg-line")} />
          <p className={cx("mt-1 truncate text-[10px] font-semibold sm:text-[11px]", i <= idx ? "text-brand-700" : "text-ink-mute")}>{x.l}</p>
        </li>
      ))}
    </ol>
  );
}

function RefillCard({ p }: { p: Prescription }) {
  const { dispatch } = useStore();
  const days = p.nextRefill ? Math.ceil((+new Date(p.nextRefill) - Date.now()) / 86400000) : undefined;
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
        {days !== undefined && <Badge tone={days <= 5 ? "warn" : "neutral"}>Due in {days} d</Badge>}
      </div>
      {p.nextRefill ? (
        <Button className="mt-4 w-full" variant="secondary" onClick={() => dispatch({ type: "refill", id: p.id })} disabled={p.refillsLeft < 1}><Send size={15} /> Request refill ({p.refillsLeft} left)</Button>
      ) : (
        <div className="mt-4"><MiniSteps steps={rxSteps} current={p.status === "issue" ? "verified" : p.status} /></div>
      )}
    </Card>
  );
}

export function PatientHome() {
  const { state, me, appts, labOrders, rx } = useMine();
  const active = appts.filter((a) => ACTIVE.includes(a.status));
  const next = active[0];
  const notices = state.notices.filter((n) => n.to === "patient" && n.patientId === state.patientId).slice(0, 5);
  const refill = rx.find((p) => p.nextRefill) ?? rx[0];
  const openLab = labOrders.find((o) => o.status !== "result_ready");
  const p = pathways.find((x) => x.id === state.enrolledPathways[0]);

  return (
    <>
      <PageTitle title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${me.name.split(" ")[0]}`} sub="Here is everything happening in your care today." />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {next ? <AppointmentCard a={next} focus /> : (
            <Card><Empty icon={<CalendarPlus />} title="No upcoming appointments" body="Book your next review from the directory." /></Card>
          )}
          {next && next.status === "confirmed" && (
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
            {openLab ? (
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-700"><FlaskConical size={20} /></span>
                  <div>
                    <p className="font-bold">Lab tests in progress</p>
                    <p className="text-sm text-ink-mute">{openLab.tests.join(", ")} · {byId(labs, openLab.labId)?.name}</p>
                  </div>
                </div>
                <div className="mt-4"><MiniSteps steps={labSteps} current={openLab.status} /></div>
              </Card>
            ) : (
              <Card className="p-5"><p className="font-bold">All results are in</p><Link to="/app/patient/records" className="mt-2 inline-flex text-sm font-semibold text-brand-700">View results</Link></Card>
            )}
          </div>
          {active.length > 1 && (
            <div className="space-y-3">
              <h2 className="font-bold">Also coming up</h2>
              {active.slice(1, 3).map((a) => <AppointmentCard key={a.id} a={a} />)}
            </div>
          )}
        </div>
        <div className="space-y-6">
          {p && (
            <Card>
              <CardHead title={p.name} sub="Your care plan" action={<Link to="/app/patient/care" className="text-sm font-semibold text-brand-700">Open</Link>} />
              <ul className="divide-y divide-line">
                {p.steps.slice(0, 4).map((s, i) => {
                  const Icon = kindIcon[s.kind];
                  const status = ["Today", "Processing", "Processing", "In 4 days"][i];
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
              {notices.map((n) => (
                <li key={n.id} className="px-5 py-3">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-[13px] text-ink-soft">{n.body}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-mute">{n.channel} · {ago(n.at)}</p>
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
  const other = appts.filter((a) => ["cancelled", "rescheduled", "reassigned"].includes(a.status)).reverse();
  const [fb, setFb] = useState<string>();
  const [fbText, setFbText] = useState("");

  return (
    <>
      <PageTitle title="Appointments" sub="Book, follow, reschedule or cancel." action={<Link to="/find-care" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"><CalendarPlus size={16} /> Book new</Link>} />
      <Tabs value={tab} onChange={setTab} items={[{ value: "upcoming", label: "Upcoming", count: upcoming.length }, { value: "past", label: "Past", count: past.length }, { value: "other", label: "Changed", count: other.length }]} />
      <div className="mt-5 space-y-4">
        {tab === "upcoming" && (upcoming.length ? upcoming.map((a) => <AppointmentCard key={a.id} a={a} />) : <Card><Empty icon={<CalendarPlus />} title="Nothing booked" /></Card>)}
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

export function PatientRecords() {
  const { state, labOrders, rx, appts } = useMine();
  const { dispatch } = useStore();
  const [tab, setTab] = useState<"results" | "rx" | "privacy">("results");
  const ids = useMemo(() => new Set([...appts.map((a) => a.id), ...labOrders.map((o) => o.id), ...rx.map((p) => p.id), "Consent", `Patient ${state.patientId}`]), [appts, labOrders, rx, state.patientId]);
  const myAudit = state.audit.filter((a) => [...ids].some((id) => a.resource.includes(id)));

  return (
    <>
      <PageTitle title="Records & privacy" sub="Your results, prescriptions and who can see them." />
      <Tabs value={tab} onChange={setTab} items={[{ value: "results", label: "Lab results" }, { value: "rx", label: "Prescriptions" }, { value: "privacy", label: "Consent & access log" }]} />
      <div className="mt-5 space-y-4">
        {tab === "results" && labOrders.map((o) => (
          <Card key={o.id}>
            <CardHead
              title={o.tests.join(" · ")}
              sub={`${byId(labs, o.labId)?.name} · ordered by ${byId(specialists, o.specialistId)?.name} · ${date(o.createdAt)}`}
              action={<Badge tone={o.status === "result_ready" ? "ok" : "info"}>{labSteps.find((x) => x.s === o.status)?.l}</Badge>}
            />
            {o.results ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead><tr className="text-left text-xs uppercase tracking-wide text-ink-mute"><th className="px-5 py-2.5">Test</th><th className="px-5 py-2.5">Result</th><th className="px-5 py-2.5">Normal range</th></tr></thead>
                  <tbody>
                    {o.results.map((r) => (
                      <tr key={r.test} className="border-t border-line">
                        <td className="px-5 py-2.5 font-medium">{r.test}</td>
                        <td className="px-5 py-2.5">
                          <span className={cx("font-bold", r.flag === "high" ? "text-rose-700" : r.flag === "low" ? "text-amber-700" : "text-ink")}>{r.value}</span> <span className="text-ink-mute">{r.unit}</span>
                          {r.flag && <Badge tone={r.flag === "high" ? "bad" : "warn"} className="ml-2">{r.flag}</Badge>}
                        </td>
                        <td className="px-5 py-2.5 text-ink-mute">{r.range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-line px-5 py-3 text-xs text-ink-mute">Released {o.releasedAt && dateTime(o.releasedAt)}. Your doctor will explain what these mean for you at your next review.</p>
              </div>
            ) : (
              <div className="p-5"><MiniSteps steps={labSteps} current={o.status} /></div>
            )}
          </Card>
        ))}
        {tab === "rx" && rx.map((p) => (
          <Card key={p.id}>
            <CardHead title={`${p.isRefill ? "Refill" : "Prescription"} · ${byId(pharmacies, p.pharmacyId)?.name}`} sub={`From ${byId(specialists, p.specialistId)?.name} · ${date(p.createdAt)}`} action={p.status === "issue" ? <Badge tone="warn">Needs attention</Badge> : <Badge tone={p.status === "delivered" ? "ok" : "info"}>{rxSteps.find((x) => x.s === p.status)?.l}</Badge>} />
            <ul className="divide-y divide-line">
              {p.items.map((i) => (
                <li key={i.drug} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                  <span><b>{i.drug}</b> <span className="text-ink-mute">· {i.dose} · ×{i.qty}</span></span>
                  <span className="text-ink-soft">{i.available === false ? <Badge tone="warn">Out of stock</Badge> : i.price ? kes(i.price) : "Price pending"}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-line p-5">
              {p.issue && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{p.issue}</p>}
              <MiniSteps steps={rxSteps} current={p.status === "issue" ? "verified" : p.status} />
              {p.nextRefill && <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "refill", id: p.id })}><Truck size={15} /> Request refill · due {date(p.nextRefill)}</Button>}
            </div>
          </Card>
        ))}
        {tab === "privacy" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHead title="Who can see my information" sub="Changes take effect immediately and are logged." />
              <ul className="divide-y divide-line">
                {state.consents.map((c) => (
                  <li key={c.party} className="flex items-start gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-semibold">{c.party} {c.locked && <Lock size={13} className="text-ink-mute" />}</p>
                      <p className="text-[13px] text-ink-mute">{c.scope}</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={c.granted}
                      aria-label={`Access for ${c.party}`}
                      disabled={c.locked}
                      onClick={() => dispatch({ type: "consent", party: c.party })}
                      className={cx("relative h-6 w-11 shrink-0 rounded-full transition focus-ring disabled:opacity-60", c.granted ? "bg-brand-600" : "bg-slate-300")}
                    >
                      <span className={cx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition", c.granted ? "left-[22px]" : "left-0.5")} />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <CardHead title="Access log" sub="Every time someone views or changes your records." />
              <ul className="max-h-[480px] divide-y divide-line overflow-y-auto">
                {myAudit.map((a) => (
                  <li key={a.id} className="flex gap-3 px-5 py-3">
                    <Eye size={16} className="mt-0.5 shrink-0 text-ink-mute" />
                    <div>
                      <p className="text-sm"><b>{a.actor}</b> <span className="text-ink-mute">({a.role})</span></p>
                      <p className="text-[13px] text-ink-soft">{a.action}</p>
                      <p className="text-[11px] text-ink-mute">{dateTime(a.at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

export function PatientCare() {
  const { state, referrals, appts, labOrders } = useMine();
  const { dispatch } = useStore();
  const enrolled = pathways.filter((p) => state.enrolledPathways.includes(p.id));
  const done = appts.filter((a) => a.status === "completed").length + labOrders.filter((o) => o.status === "result_ready").length;

  return (
    <>
      <PageTitle title="My care plan" sub="Your pathway, referrals, care team and support." />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
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
                  const st = [["Due today", "info"], ["Results processing", "info"], ["Results processing", "info"], ["Due in 4 days", "warn"], ["Booked in 19 days", "ok"], ["Next session Sat", "neutral"]][i] ?? ["Scheduled", "neutral"];
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
        <div className="space-y-6">
          <Card>
            <CardHead title="My care team" />
            <ul className="divide-y divide-line">
              {["sp-amina", "sp-njeri", "sp-wairimu"].map((id) => {
                const sp = byId(specialists, id)!;
                return (
                  <li key={id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={sp.name} hue={sp.hue} size={36} />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{sp.name}</p><p className="text-xs text-ink-mute">{sp.specialty}</p></div>
                    <Link to={`/specialists/${id}`} aria-label={`View ${sp.name}`}><ChevronRight size={18} className="text-ink-mute" /></Link>
                  </li>
                );
              })}
              <li className="flex items-center gap-3 px-5 py-3">
                <Avatar name="Wanjiku Coordinator" hue={30} size={36} />
                <div className="flex-1"><p className="text-sm font-semibold">Wanjiku N.</p><p className="text-xs text-ink-mute">Care coordinator · calls if anything slips</p></div>
              </li>
            </ul>
          </Card>
          <Card>
            <CardHead title="Support & learning" sub="From Lupus Warriors Support Network" />
            <ul className="divide-y divide-line">
              {[
                { icon: Users, t: "Monthly peer session", s: "Last Saturday · Nairobi & online" },
                { icon: BookOpen, t: "Lupus and your kidneys", s: "5 min read · approved by clinical board" },
                { icon: HeartHandshake, t: "Living well with fatigue", s: "Video · Kiswahili & English" },
                { icon: CheckCircle2, t: "Sun protection on a budget", s: "Checklist" },
              ].map((x) => (
                <li key={x.t} className="flex items-center gap-3 px-5 py-3">
                  <x.icon size={18} className="shrink-0 text-pink-600" />
                  <div><p className="text-sm font-semibold">{x.t}</p><p className="text-xs text-ink-mute">{x.s}</p></div>
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-5 py-3 text-xs text-ink-mute"><Lock size={12} className="mr-1 inline" />The support network sees your membership only, never your medical records.</p>
          </Card>
          <Card className="p-5">
            <p className="font-bold">Add another pathway</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pathways.map((p) => (
                <button key={p.id} onClick={() => dispatch({ type: "enrol", pathway: p.id })} className={cx("rounded-full border px-3 py-1.5 text-sm font-semibold", state.enrolledPathways.includes(p.id) ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line")}>{p.short}</button>
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
        <form className="mt-3 space-y-3" onSubmit={(e) => { e.preventDefault(); dispatch({ type: "feedback", about: "Unganisha Care", category: cat, text }); setSent(true); }}>
          <Field label="Topic">
            <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)}>
              {["General feedback", "Late start", "Result delay", "Medicine issue", "Billing or refund"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <textarea required className={inputCls} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your message" />
          <Button size="sm" type="submit">Send</Button>
        </form>
      )}
    </Card>
  );
}
