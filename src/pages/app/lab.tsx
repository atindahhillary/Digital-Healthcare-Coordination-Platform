import { ClipboardList, FlaskConical, Home, Lock, Timer, Upload } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, CardHead, PageTitle, Stat, Tabs } from "../../components/ui";
import { byId, labs, specialists } from "../../data/seed";
import { ago, dateTime, kes } from "../../lib/format";
import { patients, useStore, type LabStatus } from "../../store/store";
import { labSteps, MiniSteps } from "./patient";

const next: Partial<Record<LabStatus, { to: LabStatus; label: string }>> = {
  requested: { to: "booked", label: "Book collection" },
  booked: { to: "sample_collected", label: "Mark sample collected" },
  sample_collected: { to: "processing", label: "Start processing" },
};

export default function LabPortal() {
  const { state, dispatch } = useStore();
  const lab = byId(labs, state.labId)!;
  const [tab, setTab] = useState<"queue" | "done" | "prices">("queue");
  const orders = state.labOrders.filter((o) => o.labId === lab.id);
  const open = orders.filter((o) => o.status !== "result_ready");
  const done = orders.filter((o) => o.status === "result_ready");
  const name = (code: string) => lab.tests.find((t) => t.code === code)?.name ?? code;

  return (
    <>
      <PageTitle title="Laboratory portal" sub={`${lab.name} · ${lab.accreditation}`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<ClipboardList size={20} />} label="Open requests" value={open.length} />
        <Stat icon={<Home size={20} />} tone="sky" label="Home collections" value={open.filter((o) => o.collection === "home").length} />
        <Stat icon={<Timer size={20} />} tone="amber" label="Median turnaround" value="21 h" sub="Agreed: 48 h" />
        <Stat icon={<FlaskConical size={20} />} tone="violet" label="Released (30 d)" value={done.length + 184} />
      </div>
      <div className="mt-6">
        <Tabs value={tab} onChange={setTab} items={[{ value: "queue", label: "Work queue", count: open.length }, { value: "done", label: "Released" }, { value: "prices", label: "Services & prices" }]} />
      </div>
      <div className="mt-5 space-y-4">
        {tab === "queue" && open.map((o) => {
          const pt = patients[o.patientId];
          const n = next[o.status];
          return (
            <Card key={o.id}>
              <div className="flex flex-wrap items-start gap-3 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{pt.name}</p>
                    <Badge tone={o.collection === "home" ? "info" : "neutral"}>{o.collection === "home" ? "Home collection" : "Walk-in"}</Badge>
                    <span className="text-xs text-ink-mute">#{o.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-mute">Ordered by {byId(specialists, o.specialistId)?.name} · {ago(o.createdAt)}{o.scheduledFor ? ` · collection ${dateTime(o.scheduledFor)}` : ""}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{o.tests.map((t) => <Badge key={t} tone="neutral">{name(t)}</Badge>)}</div>
                </div>
                <div className="flex gap-2">
                  {n && <Button size="sm" onClick={() => dispatch({ type: "labStatus", id: o.id, status: n.to })}>{n.label}</Button>}
                  {o.status === "processing" && <Button size="sm" onClick={() => dispatch({ type: "labRelease", id: o.id })}><Upload size={15} /> Upload & release results</Button>}
                </div>
              </div>
              <div className="border-t border-line px-5 py-4"><MiniSteps steps={labSteps} current={o.status} /></div>
            </Card>
          );
        })}
        {tab === "queue" && open.length === 0 && <Card className="p-8 text-center text-ink-mute">Queue clear.</Card>}
        {tab === "done" && (
          <Card>
            <ul className="divide-y divide-line">
              {done.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-sm">
                  <span className="font-semibold">{patients[o.patientId].name}</span>
                  <span className="flex-1 text-ink-mute">{o.tests.join(", ")}</span>
                  <Badge tone="ok"><Lock size={11} /> Sent encrypted to patient & {byId(specialists, o.specialistId)?.name}</Badge>
                  <span className="text-ink-mute">{o.releasedAt && dateTime(o.releasedAt)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {tab === "prices" && (
          <Card>
            <CardHead title="Listed services" sub="Prices agreed with the platform and shown to patients before they book." />
            <ul className="divide-y divide-line">
              {lab.tests.map((t) => (
                <li key={t.code} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <span className="w-16 font-mono text-xs text-ink-mute">{t.code}</span>
                  <span className="flex-1 font-medium">{t.name}</span>
                  <span className="text-ink-mute">{t.tat}</span>
                  <span className="w-24 text-right font-bold">{kes(t.price)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
