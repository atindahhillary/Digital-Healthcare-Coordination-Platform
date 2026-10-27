import { BadgeCheck, CalendarClock, ClipboardList, FlaskConical, HeartPulse, Lock, Phone, Pill, ShieldAlert, ShieldCheck, Stethoscope, TriangleAlert } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { byId, specialists } from "../data/seed";
import { FEATURES } from "../lib/features";
import { cx, date, dateTime } from "../lib/format";
import { fileAccess, patients, rxReminderState, useStore, type State } from "../store/store";
import { Timeline } from "./Appointment";
import { PrescriptionCard } from "./Prescriptions";
import { labSteps, MiniSteps } from "./Steps";
import { Avatar, Badge, Card, CardHead, Empty, Modal, Tabs } from "./ui";

const LIVE = ["requested", "confirmed", "ready", "delayed", "recovery", "in_consult"];

type Tab = "overview" | "visits" | "rx" | "tests";

export function KycBadge({ status }: { status?: "pending" | "verified" }) {
  if (status === "verified") return <Badge tone="ok"><BadgeCheck size={12} /> ID verified</Badge>;
  if (status === "pending") return <Badge tone="warn">ID in review</Badge>;
  return <Badge tone="neutral">ID not submitted</Badge>;
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-mute">{icon} {label}</p>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}

// Everything about one patient, in one place. The patient sees all of it; a specialist sees it once a booking is confirmed.
export function PatientFile({ patientId, viewer, initialTab }: { patientId: string; viewer: "patient" | "specialist"; initialTab?: Tab }) {
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>(initialTab ?? "overview");
  const p = patients[patientId];
  if (!p) return <Empty icon={<ShieldAlert />} title="Record not found" />;

  const appts = state.appointments.filter((a) => a.patientId === patientId);
  const upcoming = appts.filter((a) => LIVE.includes(a.status)).sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const visits = appts.filter((a) => a.status === "completed").sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const rx = state.prescriptions.filter((r) => r.patientId === patientId).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const results = state.labOrders.filter((o) => o.patientId === patientId && o.results);
  const inProgress = FEATURES.lab ? state.labOrders.filter((o) => o.patientId === patientId && !o.results) : [];
  const advised = appts.filter((a) => a.testsAdvised?.length).sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const waiting = rx.filter((r) => r.status === "issued");
  const next = upcoming[0];
  const nextSp = next && byId(specialists, next.specialistId);
  const patientView = viewer === "patient";

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-brand-50 to-sky2-50/60 p-5">
          <Avatar name={p.name} hue={(p.age * 37) % 360} size={64} />
          <div className="min-w-0 flex-1">
            <h2 className="flex flex-wrap items-center gap-2 text-xl font-extrabold tracking-tight">{p.name} <KycBadge status={p.kyc?.status} /></h2>
            <p className="text-sm text-ink-soft">{p.age} years{p.kyc?.sex && p.kyc.sex !== "Prefer not to say" ? ` · ${p.kyc.sex}` : ""} · {p.county}</p>
            {patientView && <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-mute"><Phone size={12} /> {p.phone}</p>}
          </div>
          {p.bloodGroup && <div className="rounded-2xl bg-white px-4 py-2 text-center shadow-sm"><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-mute">Blood</p><p className="text-xl font-extrabold text-rose-600">{p.bloodGroup}</p></div>}
        </div>
      </Card>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        items={[
          { value: "overview", label: "Overview" },
          { value: "visits", label: "Visits", count: visits.length },
          { value: "rx", label: "Prescriptions", count: waiting.length || undefined },
          { value: "tests", label: "Tests & results" },
        ]}
      />

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Fact icon={<HeartPulse size={14} />} label="Conditions">
              {p.conditions.length ? <div className="flex flex-wrap gap-1.5">{p.conditions.map((c) => <Badge key={c} tone="brand">{c}</Badge>)}</div> : <p className="text-ink-mute">None recorded</p>}
            </Fact>
            <Fact icon={<TriangleAlert size={14} />} label="Allergies">
              {p.allergies?.length ? <div className="flex flex-wrap gap-1.5">{p.allergies.map((c) => <Badge key={c} tone="bad">{c}</Badge>)}</div> : <p className="text-ink-mute">None recorded</p>}
            </Fact>
            <Fact icon={<Pill size={14} />} label="Medicines now">
              {p.medications?.length ? <ul className="space-y-1">{p.medications.map((m) => <li key={m}>{m}</li>)}</ul> : <p className="text-ink-mute">None recorded</p>}
            </Fact>
            <Fact icon={<Phone size={14} />} label="Emergency contact">
              {p.emergency ? <p><b>{p.emergency.name}</b> <span className="text-ink-mute">({p.emergency.relation})</span><br /><span className="text-ink-soft">{p.emergency.phone}</span></p> : <p className="text-ink-mute">Not added</p>}
            </Fact>
          </div>

          {patientView && p.insurance && (
            <p className="rounded-2xl border border-line bg-white px-4 py-3 text-sm"><b>Health cover:</b> {p.insurance.scheme} {p.insurance.number}</p>
          )}

          {patientView && (waiting.length > 0 || (advised.length > 0 && !FEATURES.lab)) && (
            <Card className="border-amber-200 bg-amber-50/50 p-4">
              <p className="flex items-center gap-2 font-bold text-amber-900"><ClipboardList size={16} /> Open items</p>
              <ul className="mt-2 space-y-1.5 text-sm text-amber-900">
                {waiting.map((r) => <li key={r.id}>• Prescription <span className="font-mono">{r.code}</span> is waiting for you to choose a pharmacy. <button className="font-semibold underline" onClick={() => setTab("rx")}>Open</button></li>)}
                {advised[0] && !FEATURES.lab && <li>• Tests recommended on {date(advised[0].at)}: {advised[0].testsAdvised!.join(", ")}. <button className="font-semibold underline" onClick={() => setTab("tests")}>Details</button></li>}
              </ul>
            </Card>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-mute"><CalendarClock size={14} /> {patientView ? "Next visit" : "Upcoming visits"}</p>
              {next && nextSp ? (
                <div className="mt-2 flex items-center gap-3">
                  <Avatar name={nextSp.name} hue={nextSp.hue} size={40} />
                  <div className="min-w-0"><p className="truncate font-bold">{nextSp.name}</p><p className="text-sm text-ink-mute">{dateTime(next.at)} · {next.mode === "virtual" ? "Video" : nextSp.town}</p></div>
                </div>
              ) : <p className="mt-2 text-sm text-ink-mute">Nothing booked.{patientView && <> <Link to="/find-care" className="font-semibold text-brand-700 underline">Find a specialist</Link></>}</p>}
            </Card>
            <Card className="p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-mute"><Stethoscope size={14} /> Last visit</p>
              {visits[0] ? (
                <div className="mt-2 text-sm"><p className="font-bold">{byId(specialists, visits[0].specialistId)?.name}</p><p className="text-ink-mute">{date(visits[0].at)} · {visits[0].reason}</p>{visits[0].notes && <p className="mt-1.5 line-clamp-3 text-ink-soft">{visits[0].notes}</p>}</div>
              ) : <p className="mt-2 text-sm text-ink-mute">No completed visits yet.</p>}
            </Card>
          </div>
        </div>
      )}

      {tab === "visits" && (
        <div className="space-y-3">
          {visits.length === 0 && <Card><Empty icon={<Stethoscope />} title="No visits yet" body="After each consultation, the doctor's summary and follow-up plan are added here." /></Card>}
          {visits.map((a) => {
            const sp = byId(specialists, a.specialistId)!;
            return (
              <Card key={a.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar name={sp.name} hue={sp.hue} size={44} />
                  <div className="min-w-0 flex-1"><p className="font-bold">{sp.name}</p><p className="text-sm text-ink-mute">{sp.specialty} · {dateTime(a.at)} · {a.mode === "virtual" ? "Video" : "In person"}</p></div>
                  {a.followUpWeeks && <Badge tone="info">Follow-up in {a.followUpWeeks} weeks</Badge>}
                </div>
                <p className="mt-3 text-sm font-semibold">{a.reason}</p>
                {a.notes ? <p className="mt-1 rounded-xl bg-canvas p-3 text-sm text-ink-soft">{a.notes}</p> : <p className="mt-1 text-sm text-ink-mute">No summary written.</p>}
                {a.testsAdvised && a.testsAdvised.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm"><FlaskConical size={14} className="text-violet-600" /><span className="text-ink-mute">Tests recommended:</span>{a.testsAdvised.map((t) => <Badge key={t}>{t}</Badge>)}</div>}
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-ink-soft">Activity log</summary>
                  <div className="mt-3"><Timeline a={a} /></div>
                </details>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "rx" && (
        <div className="space-y-3">
          {rx.length === 0 && <Card><Empty icon={<Pill />} title="No prescriptions yet" body="When a specialist prescribes, you get a code and reminders until you choose a pharmacy." /></Card>}
          {rx.map((r) => <PrescriptionCard key={r.id} rx={r} mine={patientView} />)}
          {!patientView && rx.some((r) => rxReminderState(r)) && <p className="text-xs text-ink-mute">The patient is being reminded to choose a pharmacy for open prescriptions.</p>}
        </div>
      )}

      {tab === "tests" && (
        <div className="space-y-3">
          {advised.length > 0 && (
            <Card>
              <CardHead title="Tests recommended" sub={FEATURES.lab ? undefined : "Take these at any accredited lab. Digital lab booking and results arrive in a later phase."} />
              <ul className="divide-y divide-line">
                {advised.map((a) => (
                  <li key={a.id} className="px-5 py-3 text-sm">
                    <p className="font-semibold">{byId(specialists, a.specialistId)?.name} · {date(a.at)}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">{a.testsAdvised!.map((t) => <Badge key={t} tone="info">{t}</Badge>)}</div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {inProgress.map((o) => (
            <Card key={o.id} className="p-5"><p className="font-bold">{o.tests.join(" · ")}</p><div className="mt-3"><MiniSteps steps={labSteps} current={o.status} /></div></Card>
          ))}
          {results.map((o) => (
            <Card key={o.id}>
              <CardHead title={o.tests.join(" · ")} sub={`${byId(specialists, o.specialistId)?.name} · ${date(o.createdAt)}`} action={<Badge tone="ok">Results in</Badge>} />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead><tr className="text-left text-xs uppercase tracking-wide text-ink-mute"><th className="px-5 py-2.5">Test</th><th className="px-5 py-2.5">Result</th><th className="px-5 py-2.5">Normal</th></tr></thead>
                  <tbody>
                    {o.results!.map((r) => (
                      <tr key={r.test} className="border-t border-line">
                        <td className="px-5 py-2.5 font-medium">{r.test}</td>
                        <td className="px-5 py-2.5"><span className={cx("font-bold", r.flag === "high" ? "text-rose-700" : r.flag === "low" ? "text-amber-700" : "text-ink")}>{r.value}</span> <span className="text-ink-mute">{r.unit}</span>{r.flag && <Badge tone={r.flag === "high" ? "bad" : "warn"} className="ml-2">{r.flag}</Badge>}</td>
                        <td className="px-5 py-2.5 text-ink-mute">{r.range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
          {advised.length === 0 && results.length === 0 && inProgress.length === 0 && <Card><Empty icon={<FlaskConical />} title="No tests yet" body="Recommended tests and their results will appear here." /></Card>}
        </div>
      )}
    </div>
  );
}

// What a specialist gets after confirming a booking. Every open is logged to the patient's access log.
export function PatientFileModal({ patientId, specialistId, onClose }: { patientId: string; specialistId: string; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const access = fileAccess(state, specialistId, patientId);
  const p = patients[patientId];
  useEffect(() => {
    if (access === "granted") dispatch({ type: "openFile", specialistId, patientId });
  }, [access, specialistId, patientId, dispatch]);

  return (
    <Modal open onClose={onClose} title={access === "granted" ? `Patient file: ${p?.name}` : "Patient file"} wide>
      {access === "granted" ? (
        <div className="space-y-4">
          <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-900"><ShieldCheck size={16} className="mt-0.5 shrink-0" /> Open to you because you confirmed a booking with this patient. They can withdraw access at any time, and every view is logged.</p>
          <PatientFile patientId={patientId} viewer="specialist" />
        </div>
      ) : (
        <div className="py-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-canvas text-ink-mute"><Lock size={26} /></span>
          <p className="mt-4 text-lg font-bold">{access === "pending" ? "Opens when you confirm the booking" : access === "restricted" ? "The patient has not shared their file with you" : "No confirmed booking with this patient"}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
            {access === "pending" ? "Until then you can see only their name, age and reason for the visit. Confirming shares the video link, sets reminders for you both and opens their file." : access === "restricted" ? "They chose to keep their history private. Ask them to enable sharing in their privacy settings." : "A patient's file is available to you only for patients with a confirmed booking."}
          </p>
        </div>
      )}
    </Modal>
  );
}

export function downloadRecord(state: State, patientId: string) {
  const p = patients[patientId];
  const data = {
    exportedAt: new Date().toISOString(),
    note: "Your AfyaConnect health record. You have the right to keep a copy of your data.",
    profile: p,
    visits: state.appointments.filter((a) => a.patientId === patientId && a.status === "completed").map((a) => ({ date: a.at, doctor: byId(specialists, a.specialistId)?.name, reason: a.reason, summary: a.notes, followUpWeeks: a.followUpWeeks, testsRecommended: a.testsAdvised })),
    prescriptions: state.prescriptions.filter((r) => r.patientId === patientId).map((r) => ({ code: r.code, issued: r.createdAt, status: r.status, items: r.items.map((i) => ({ medicine: i.drug, dose: i.dose, quantity: i.qty })) })),
    results: state.labOrders.filter((o) => o.patientId === patientId && o.results).map((o) => ({ date: o.releasedAt, tests: o.tests, results: o.results })),
    consents: state.consents.filter((c) => c.patientId === patientId),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "afyaconnect-health-record.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

