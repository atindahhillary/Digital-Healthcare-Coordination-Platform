import { BellRing, CheckCircle2, MapPin, Pill, Printer, Store, Truck } from "lucide-react";
import { useState } from "react";
import { byId, pharmacies, specialists } from "../data/seed";
import { FEATURES } from "../lib/features";
import { cx, date, dateTime, ago, kes } from "../lib/format";
import { patients, rxReminderState, useStore, type Prescription } from "../store/store";
import { MiniSteps, rxHeldSteps, rxSteps } from "./Steps";
import { Badge, Button, Modal } from "./ui";

export const rxStatusLabel: Record<Prescription["status"], { label: string; tone: "ok" | "warn" | "info" | "neutral" }> = {
  issued: { label: "Choose a pharmacy", tone: "warn" },
  shared: { label: "Shared, ready to collect", tone: "info" },
  collected: { label: "Collected", tone: "ok" },
  received: { label: "Received", tone: "info" },
  verified: { label: "Verified", tone: "info" },
  ready: { label: "Ready", tone: "info" },
  out_for_delivery: { label: "On the way", tone: "info" },
  delivered: { label: "Delivered", tone: "ok" },
  issue: { label: "Needs attention", tone: "warn" },
};

// The patient decides where to fill a prescription. Direct hand-off to pharmacies comes with the pharmacy phase.
export function PharmacyPicker({ rx, open, onClose }: { rx: Prescription; open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const home = patients[state.patientId]?.county ?? "";
  const list = [...pharmacies].sort((a, b) => Number(home.includes(b.county)) - Number(home.includes(a.county)));
  return (
    <Modal open={open} onClose={onClose} title="Where do you want to fill it?">
      <p className="text-sm text-ink-soft">Choose any pharmacy that suits you. {FEATURES.pharmacy ? "They receive the prescription straight away." : <>Direct hand-off to pharmacies arrives in a later phase, so for now you show prescription code <b className="font-mono text-ink">{rx.code}</b> at the counter.</>}</p>
      <ul className="mt-4 space-y-2">
        {list.map((p) => (
          <li key={p.id}>
            <button onClick={() => { dispatch({ type: "rxShare", id: rx.id, pharmacyId: p.id }); onClose(); }} className="flex w-full items-start gap-3 rounded-2xl border border-line bg-white p-3.5 text-left hover:border-brand-300 hover:bg-brand-50/40 focus-ring">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-700"><Store size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{p.name}</span>
                <span className="flex flex-wrap items-center gap-x-3 text-[13px] text-ink-mute"><span className="inline-flex items-center gap-1"><MapPin size={12} /> {p.county}</span><span>{p.hours}</span></span>
              </span>
              {p.delivery && <Badge tone="brand"><Truck size={11} /> Delivers</Badge>}
            </button>
          </li>
        ))}
        <li>
          <button onClick={() => { dispatch({ type: "rxShare", id: rx.id, pharmacyId: "other" }); onClose(); }} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line p-3.5 text-left text-sm font-semibold text-ink-soft hover:border-brand-300 focus-ring">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-canvas text-ink-mute"><Pill size={18} /></span>
            Another pharmacy of my choice
          </button>
        </li>
      </ul>
    </Modal>
  );
}

// Print-friendly prescription (the browser's "Save as PDF" gives a file to share).
export function PrescriptionSheet({ rx, open, onClose }: { rx: Prescription; open: boolean; onClose: () => void }) {
  const sp = byId(specialists, rx.specialistId);
  const pt = patients[rx.patientId];
  return (
    <Modal open={open} onClose={onClose} title="Prescription">
      <div className="print-area rounded-2xl border border-line bg-white p-5 text-[15px]">
        <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-lg font-extrabold tracking-tight">AfyaConnect e-prescription</p>
            <p className="text-xs text-ink-mute">Preview document. Fictional doctor and patient.</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-bold">{rx.code}</p>
            <p className="text-xs text-ink-mute">Issued {date(rx.createdAt)}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-ink-mute">Prescriber</dt><dd className="font-semibold">{sp?.name}</dd><dd className="text-ink-mute">{sp?.title}, reg. {sp?.regNo}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-ink-mute">Patient</dt><dd className="font-semibold">{pt?.name}</dd><dd className="text-ink-mute">{pt?.age} years · {pt?.kyc?.sex ?? ""}</dd></div>
        </dl>
        <table className="mt-5 w-full text-sm">
          <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-mute"><th className="py-2">Medicine</th><th className="py-2">How to take</th><th className="py-2 text-right">Qty</th></tr></thead>
          <tbody>
            {rx.items.map((i) => <tr key={i.drug} className="border-b border-line"><td className="py-2.5 font-semibold">{i.drug}</td><td className="py-2.5">{i.dose}</td><td className="py-2.5 text-right">{i.qty}</td></tr>)}
          </tbody>
        </table>
        <p className="mt-5 text-xs text-ink-mute">Valid for 30 days from the date of issue. {rx.refillsLeft > 0 ? `${rx.refillsLeft} refills remaining.` : ""} A pharmacist verifies this prescription before dispensing.</p>
      </div>
      <div className="mt-4 flex justify-end gap-2 print:hidden">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <Button onClick={() => window.print()}><Printer size={16} /> Print or save as PDF</Button>
      </div>
    </Modal>
  );
}

export function PrescriptionCard({ rx, mine = true }: { rx: Prescription; mine?: boolean }) {
  const { dispatch } = useStore();
  const [pick, setPick] = useState(false);
  const [sheet, setSheet] = useState(false);
  const sp = byId(specialists, rx.specialistId);
  const ph = rx.pharmacyId === "other" ? { name: "your pharmacy" } : byId(pharmacies, rx.pharmacyId);
  const rem = rxReminderState(rx);
  const meta = rxStatusLabel[rx.status];
  const held = !FEATURES.pharmacy && ["issued", "shared", "collected"].includes(rx.status);

  return (
    <div className={cx("rounded-2xl border bg-white shadow-card", rx.status === "issued" && mine ? "border-amber-300" : "border-line")}>
      <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4 sm:px-5">
        <div>
          <p className="flex flex-wrap items-center gap-2 font-bold">{rx.isRefill ? "Refill" : "Prescription"} <span className="font-mono text-[13px] text-ink-mute">{rx.code}</span></p>
          <p className="text-sm text-ink-mute">{sp?.name} · {date(rx.createdAt)}</p>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {rx.items.map((i) => (
          <li key={i.drug} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm sm:px-5">
            <span><b>{i.drug}</b> <span className="text-ink-mute">· {i.dose} · ×{i.qty}</span></span>
            {!held && (i.available === false ? <Badge tone="warn">Out of stock</Badge> : i.price ? <span className="text-ink-soft">{kes(i.price)}</span> : null)}
          </li>
        ))}
      </ul>
      <div className="space-y-3 px-4 py-4 sm:px-5">
        {held ? <MiniSteps steps={rxHeldSteps} current={rx.status} /> : rx.status !== "issue" && <MiniSteps steps={rxSteps} current={rx.status === "collected" ? "delivered" : rx.status} />}

        {rx.status === "issued" && rem && mine && (
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">
            <BellRing size={16} className="mt-0.5 shrink-0" />
            <p>
              <b>Waiting for you to choose a pharmacy.</b>{" "}
              {rem.sent > 0 ? `Reminder ${rem.sent} of ${rem.total} sent by SMS and in the app. ` : "We will remind you by SMS and in the app. "}
              {rem.nextAt ? `Next reminder ${ago(rem.nextAt)}.` : "We keep reminding you weekly until it is done."}
            </p>
          </div>
        )}
        {rx.status === "shared" && mine && (
          <p className="rounded-xl bg-sky2-50 px-3 py-2.5 text-[13px] text-sky2-700">Shared with <b>{ph?.name ?? "your pharmacy"}</b>{rx.sharedAt ? ` ${ago(rx.sharedAt)}` : ""}. Show code <b className="font-mono">{rx.code}</b> at the counter or print the prescription.</p>
        )}
        {rx.status === "collected" && <p className="flex items-center gap-2 text-[13px] font-semibold text-emerald-700"><CheckCircle2 size={15} /> You have collected this. {rx.nextRefill ? `Next refill due ${dateTime(rx.nextRefill)}.` : ""}</p>}

        <div className="flex flex-wrap gap-2">
          {mine && rx.status === "issued" && <Button size="sm" onClick={() => setPick(true)}><Store size={15} /> Choose pharmacy</Button>}
          {mine && rx.status === "shared" && <Button size="sm" onClick={() => dispatch({ type: "rxCollect", id: rx.id })}><CheckCircle2 size={15} /> I have collected it</Button>}
          {mine && rx.status === "shared" && <Button size="sm" variant="secondary" onClick={() => setPick(true)}>Change pharmacy</Button>}
          <Button size="sm" variant="secondary" onClick={() => setSheet(true)}><Printer size={15} /> {mine ? "Print or save" : "View sheet"}</Button>
        </div>
      </div>
      {pick && <PharmacyPicker rx={rx} open onClose={() => setPick(false)} />}
      {sheet && <PrescriptionSheet rx={rx} open onClose={() => setSheet(false)} />}
    </div>
  );
}
