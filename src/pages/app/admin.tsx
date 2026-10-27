import { Activity, AlarmClock, BadgeCheck, CalendarCheck2, CircleDollarSign, FileCheck2, MessageSquareWarning, ShieldAlert, Timer, UserX, XCircle } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { statusMeta } from "../../components/Appointment";
import { Avatar, Badge, Button, Card, CardHead, Empty, PageTitle, Progress, Stat, Tabs } from "../../components/ui";
import { byId, pathways, specialists } from "../../data/seed";
import { ago, cx, dateTime, kes } from "../../lib/format";
import { patients, useStore, type Incident, type Rules } from "../../store/store";

const kindLabel: Record<Incident["kind"], string> = { delay: "Delay", provider_no_show: "Provider no-show", late_cancellation: "Late cancellation", patient_no_show: "Patient no-show" };

const weekly = Array.from({ length: 8 }, (_, i) => ({ w: `W${i + 1}`, bookings: 180 + i * 34 + (i % 3) * 12, delays: 14 - i + (i % 2) * 3, recoveries: Math.max(1, 6 - Math.floor(i / 2)) }));

export function AdminHome() {
  const { state } = useStore();
  const recovering = state.appointments.filter((a) => a.status === "recovery");
  const providerNoShows = state.incidents.filter((i) => i.kind === "provider_no_show").length;
  const ranked = [...specialists].sort((a, b) => b.punctuality - a.punctuality);
  const resolved = state.complaints.filter((c) => c.status === "resolved").length;

  return (
    <>
      <PageTitle title="Operations overview" sub="Bookings, reliability and service quality across the network." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<CalendarCheck2 size={20} />} label="Bookings this week" value="418" sub="+12% vs last week" />
        <Stat icon={<Timer size={20} />} tone="sky" label="On-time starts" value="94.6%" sub="Target ≥ 95%" />
        <Stat icon={<AlarmClock size={20} />} tone="amber" label="Avg wait after booked time" value="8.4 min" />
        <Stat icon={<UserX size={20} />} tone="rose" label="Provider no-shows (30 d)" value={providerNoShows} sub="All recovered" />
      </div>

      {recovering.length > 0 && (
        <Card className="mt-6 border-rose-200">
          <CardHead title={<span className="flex items-center gap-2 text-rose-700"><ShieldAlert size={18} /> Live service recovery</span>} sub="Patients currently choosing an option. A coordinator is assigned to each." />
          <ul className="divide-y divide-line">
            {recovering.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-sm">
                <span className="font-semibold">{patients[a.patientId].name}</span>
                <span className="flex-1 text-ink-mute">{a.recovery?.reason}</span>
                <Badge tone="bad">Awaiting patient</Badge>
                <span className="text-ink-mute">{ago(a.timeline[a.timeline.length - 1].at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHead title="Bookings, delays and recoveries" sub="Last 8 weeks" />
          <div className="h-72 p-4">
            <ResponsiveContainer>
              <BarChart data={weekly} margin={{ left: -15, right: 5, top: 10 }}>
                <CartesianGrid stroke="#E3EAF2" vertical={false} />
                <XAxis dataKey="w" tick={{ fontSize: 12, fill: "#6B7C93" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="l" tick={{ fontSize: 12, fill: "#6B7C93" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 12, fill: "#6B7C93" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E3EAF2" }} cursor={{ fill: "#F5F8FB" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="l" dataKey="bookings" name="Bookings" fill="#2DBBA8" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="r" dataKey="delays" name="Delays" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="r" dataKey="recoveries" name="Recoveries" fill="#F43F5E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHead title="Punctuality league" sub="Below 90% triggers a provider review" />
          <ul className="divide-y divide-line">
            {ranked.map((sp) => (
              <li key={sp.id} className="flex items-center gap-3 px-5 py-2.5">
                <Avatar name={sp.name} hue={sp.hue} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{sp.name}</p>
                  <Progress value={(sp.punctuality - 80) * 5} tone={sp.punctuality >= 95 ? "brand" : sp.punctuality >= 90 ? "amber" : "rose"} />
                </div>
                <span className={cx("w-10 text-right text-sm font-bold", sp.punctuality < 90 && "text-rose-600")}>{sp.punctuality}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<CircleDollarSign size={20} />} label="Gross bookings (month)" value={kes(1_642_500)} />
        <Stat icon={<CircleDollarSign size={20} />} tone="rose" label="Refunds issued (month)" value={kes(38_400)} sub="2.3% of gross" />
        <Stat icon={<Activity size={20} />} tone="sky" label="Service completion" value="97.8%" sub="Booked care that happened" />
        <Stat icon={<MessageSquareWarning size={20} />} tone="violet" label="Complaints resolved" value={`${resolved}/${state.complaints.length}`} sub="Median 26 h" />
      </div>
    </>
  );
}

export function AdminReliability() {
  const { state } = useStore();
  const [kind, setKind] = useState<"all" | Incident["kind"]>("all");
  const list = state.incidents.filter((i) => kind === "all" || i.kind === kind);
  const counts = (k: Incident["kind"]) => state.incidents.filter((i) => i.kind === k).length;
  const live = state.appointments.filter((a) => ["confirmed", "ready", "delayed", "recovery", "in_consult"].includes(a.status) && new Date(a.at).toDateString() === new Date().toDateString());

  return (
    <>
      <PageTitle title="Appointment reliability" sub="Every delay, cancellation and no-show, and how it was resolved." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<AlarmClock size={20} />} tone="amber" label="Delays" value={counts("delay")} />
        <Stat icon={<UserX size={20} />} tone="rose" label="Provider no-shows" value={counts("provider_no_show")} />
        <Stat icon={<XCircle size={20} />} tone="violet" label="Late cancellations" value={counts("late_cancellation")} />
        <Stat icon={<UserX size={20} />} tone="sky" label="Patient no-shows" value={counts("patient_no_show")} />
      </div>
      <Card className="mt-6">
        <CardHead title="Today's live board" sub="Status of every consultation happening today" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-ink-mute"><th className="px-5 py-2.5">Time</th><th className="px-5 py-2.5">Specialist</th><th className="px-5 py-2.5">Patient</th><th className="px-5 py-2.5">Mode</th><th className="px-5 py-2.5">Status</th></tr></thead>
            <tbody>
              {live.map((a) => (
                <tr key={a.id} className="border-t border-line">
                  <td className="px-5 py-2.5 font-semibold">{new Date(a.at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-5 py-2.5">{byId(specialists, a.specialistId)?.name}</td>
                  <td className="px-5 py-2.5">{patients[a.patientId].name}</td>
                  <td className="px-5 py-2.5 capitalize">{a.mode}</td>
                  <td className="px-5 py-2.5"><Badge tone={statusMeta[a.status].tone}>{statusMeta[a.status].label}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {live.length === 0 && <Empty icon={<Activity />} title="No live consultations" />}
        </div>
      </Card>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold">Incident log</h2>
        <Tabs value={kind} onChange={setKind} items={[{ value: "all", label: "All" }, ...(["delay", "provider_no_show", "late_cancellation", "patient_no_show"] as const).map((k) => ({ value: k, label: kindLabel[k] }))]} />
      </div>
      <Card className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-mute"><th className="px-5 py-3">When</th><th className="px-5 py-3">Provider</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Minutes</th><th className="px-5 py-3">Resolution</th><th className="px-5 py-3">State</th></tr></thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0">
                <td className="px-5 py-2.5 text-ink-mute">{dateTime(i.at)}</td>
                <td className="px-5 py-2.5 font-medium">{byId(specialists, i.specialistId)?.name}</td>
                <td className="px-5 py-2.5"><Badge tone={i.kind === "provider_no_show" ? "bad" : i.kind === "delay" ? "warn" : "neutral"}>{kindLabel[i.kind]}</Badge></td>
                <td className="px-5 py-2.5">{i.minutes ?? "–"}</td>
                <td className="px-5 py-2.5">{i.resolution}</td>
                <td className="px-5 py-2.5"><Badge tone={i.open ? "bad" : "ok"}>{i.open ? "Open" : "Closed"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

export function AdminProviders() {
  const { state, dispatch } = useStore();
  return (
    <>
      <PageTitle title="Providers & verification" sub="Nobody takes a booking until their licence and registration are checked." />
      <h2 className="mb-1 font-bold">Verification queue</h2>
      <p className="mb-3 text-sm text-ink-mute">Providers and patient ID checks. Approving a patient ID shows them a verified badge and tells doctors their identity was checked.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {state.verification.map((v) => (
          <Card key={v.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{v.name}</p>
                <p className="text-sm text-ink-mute">{v.type} · {v.regulator} {v.regNo} · submitted {ago(v.submitted)}</p>
              </div>
              <Badge tone={v.status === "approved" ? "ok" : v.status === "rejected" ? "bad" : "warn"}>{v.status}</Badge>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {v.docs.map((d) => <li key={d} className="flex items-center gap-2"><FileCheck2 size={15} className="text-brand-600" />{d}</li>)}
              <li className="flex items-center gap-2 text-ink-mute"><BadgeCheck size={15} /> Register lookup with {v.regulator}: match (demo)</li>
            </ul>
            {v.status === "pending" && (
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => dispatch({ type: "verify", id: v.id, status: "approved" })}>{v.type === "Patient ID" ? "Approve ID" : "Approve"}</Button>
                <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "verify", id: v.id, status: "rejected" })}>{v.type === "Patient ID" ? "Ask for a clearer photo" : "Request more information"}</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
      <Card className="mt-6 overflow-x-auto">
        <CardHead title="Specialists" />
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-ink-mute"><th className="px-5 py-2.5">Name</th><th className="px-5 py-2.5">Specialty</th><th className="px-5 py-2.5">County</th><th className="px-5 py-2.5">On time</th><th className="px-5 py-2.5">Rating</th><th className="px-5 py-2.5">Status</th></tr></thead>
          <tbody>
            {specialists.map((sp) => {
              const v = state.verification.find((x) => x.specialistId === sp.id);
              const ok = v ? v.status === "approved" : sp.verified;
              return (
                <tr key={sp.id} className="border-t border-line">
                  <td className="px-5 py-2.5 font-medium">{sp.name}</td>
                  <td className="px-5 py-2.5">{sp.specialty}</td>
                  <td className="px-5 py-2.5">{sp.county}</td>
                  <td className="px-5 py-2.5">{sp.punctuality}%</td>
                  <td className="px-5 py-2.5">{sp.rating}</td>
                  <td className="px-5 py-2.5"><Badge tone={ok ? "ok" : "warn"}>{ok ? "Verified" : "Pending"}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}

const ruleFields: { k: keyof Rules; label: string; hint: string; min: number; max: number; unit: string }[] = [
  { k: "readinessWindowMin", label: "Readiness check opens", hint: "How long before the consult the specialist must confirm", min: 15, max: 120, unit: "min before" },
  { k: "graceMin", label: "Grace period", hint: "Delays up to this are normal and only notified", min: 0, max: 20, unit: "min" },
  { k: "recoveryAfterMin", label: "Start service recovery after", hint: "Delays longer than this offer the patient options", min: 10, max: 60, unit: "min" },
  { k: "freeCancelHours", label: "Free cancellation until", hint: "Patient cancellations before this get a full refund", min: 1, max: 48, unit: "h before" },
  { k: "maxAltSearchHours", label: "Alternative specialist search window", hint: "How far ahead to look for a replacement", min: 1, max: 24, unit: "h" },
];

export function AdminSettings() {
  const { state, dispatch } = useStore();
  const [sel, setSel] = useState(pathways[0].id);
  const p = pathways.find((x) => x.id === sel)!;
  return (
    <>
      <PageTitle title="Rules & pathways" sub="Service standards and care pathways are configuration, not code." />
      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHead title="Appointment service rules" sub="Changes apply to new events immediately and are audit-logged." />
          <div className="space-y-6 p-5">
            {ruleFields.map((f) => (
              <label key={f.k} className="block">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold">{f.label}</span>
                  <span className="text-sm font-bold text-brand-700">{state.rules[f.k] as number} {f.unit}</span>
                </div>
                <input type="range" min={f.min} max={f.max} value={state.rules[f.k] as number} onChange={(e) => dispatch({ type: "rules", rules: { [f.k]: +e.target.value } })} className="mt-2 w-full accent-brand-600" />
                <span className="text-xs text-ink-mute">{f.hint}</span>
              </label>
            ))}
            <p className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800">Emergency escalation is separate and cannot be configured here. Red-flag symptoms always route to 999 / 112.</p>
          </div>
        </Card>
        <Card>
          <CardHead title="Care pathway definitions" sub="Add a condition by adding a definition. No rebuild needed." />
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              {pathways.map((x) => <button key={x.id} onClick={() => setSel(x.id)} className={cx("rounded-full border px-3 py-1.5 text-sm font-semibold", sel === x.id ? "border-ink bg-ink text-white" : "border-line")}>{x.short}</button>)}
            </div>
            <pre className="mt-4 max-h-[380px] overflow-auto rounded-xl bg-[#0b1620] p-4 text-[12px] leading-relaxed text-emerald-200">
{JSON.stringify({ id: p.id, name: p.name, lead: p.lead, steps: p.steps.map((s) => ({ step: s.label, type: s.kind, every_weeks: s.everyWeeks })), red_flags: p.redFlags, clinical_signoff: "required", review_date: "12 months" }, null, 2)}
            </pre>
          </div>
        </Card>
      </div>
    </>
  );
}

export function AdminAudit() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<"complaints" | "audit">("complaints");
  return (
    <>
      <PageTitle title="Audit & complaints" sub="Who did what, when. And every complaint through to resolution." />
      <Tabs value={tab} onChange={setTab} items={[{ value: "complaints", label: "Complaints", count: state.complaints.filter((c) => c.status !== "resolved").length }, { value: "audit", label: "Audit log" }]} />
      <div className="mt-5">
        {tab === "complaints" && (
          <div className="space-y-3">
            {state.complaints.map((c) => (
              <Card key={c.id} className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{c.category}</p>
                  <Badge tone={c.status === "resolved" ? "ok" : c.status === "investigating" ? "info" : "warn"}>{c.status}</Badge>
                  <span className="ml-auto text-xs text-ink-mute">{ago(c.at)}</span>
                </div>
                <p className="mt-1 text-sm text-ink-mute">{c.patient} about {c.about}</p>
                <p className="mt-2 text-sm">“{c.text}”</p>
                {c.refund && <p className="mt-2 text-sm text-emerald-700">Refund issued: {kes(c.refund)}</p>}
                {c.status !== "resolved" && (
                  <div className="mt-3 flex gap-2">
                    {c.status === "new" && <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "complaint", id: c.id, status: "investigating" })}>Start investigation</Button>}
                    <Button size="sm" onClick={() => dispatch({ type: "complaint", id: c.id, status: "resolved" })}>Mark resolved</Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
        {tab === "audit" && (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-mute"><th className="px-5 py-3">Time</th><th className="px-5 py-3">Actor</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Resource</th></tr></thead>
              <tbody>
                {state.audit.map((a) => (
                  <tr key={a.id} className="border-b border-line last:border-0">
                    <td className="whitespace-nowrap px-5 py-2.5 text-ink-mute">{dateTime(a.at)}</td>
                    <td className="px-5 py-2.5 font-medium">{a.actor}</td>
                    <td className="px-5 py-2.5">{a.role}</td>
                    <td className="px-5 py-2.5">{a.action}</td>
                    <td className="px-5 py-2.5 font-mono text-xs text-ink-mute">{a.resource}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </>
  );
}
