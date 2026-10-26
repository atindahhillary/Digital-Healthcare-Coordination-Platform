import { AlertTriangle, Bike, CheckCircle2, PackageCheck, Pill, RefreshCw, ShieldCheck, Store } from "lucide-react";
import { Badge, Button, Card, PageTitle, Stat } from "../../components/ui";
import { byId, pharmacies, specialists } from "../../data/seed";
import { ago, cx, kes } from "../../lib/format";
import { patients, useStore } from "../../store/store";
import { MiniSteps, rxSteps } from "./patient";

export default function PharmacyPortal() {
  const { state, dispatch } = useStore();
  const ph = byId(pharmacies, state.pharmacyId)!;
  const list = state.prescriptions.filter((p) => p.pharmacyId === ph.id);
  const open = list.filter((p) => p.status !== "delivered");

  return (
    <>
      <PageTitle title="Pharmacy portal" sub={`${ph.name} · delivers to ${ph.areas.join(", ")} · ${ph.hours}`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Pill size={20} />} label="Open orders" value={open.length} />
        <Stat icon={<RefreshCw size={20} />} tone="sky" label="Refill requests" value={open.filter((p) => p.isRefill).length} />
        <Stat icon={<AlertTriangle size={20} />} tone="amber" label="Stock issues" value={open.filter((p) => p.items.some((i) => i.available === false) || p.status === "issue").length} />
        <Stat icon={<Bike size={20} />} tone="violet" label="Out for delivery" value={open.filter((p) => p.status === "out_for_delivery").length} />
      </div>
      <div className="mt-6 space-y-4">
        {list.map((p) => {
          const pt = patients[p.patientId];
          const missing = p.items.some((i) => i.available === false);
          const unpriced = p.items.some((i) => i.available !== false && !i.price);
          return (
            <Card key={p.id} className={cx(p.status === "delivered" && "opacity-70")}>
              <div className="flex flex-wrap items-start gap-3 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{pt.name}</p>
                    {p.isRefill && <Badge tone="info"><RefreshCw size={11} /> Refill</Badge>}
                    <Badge tone={p.delivery ? "brand" : "neutral"}>{p.delivery ? "Delivery" : "Collection"}</Badge>
                    {p.status === "issue" && <Badge tone="warn">Patient notified of issue</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-mute">E-prescription from {byId(specialists, p.specialistId)?.name} · signed, verified source · {ago(p.createdAt)}</p>
                </div>
              </div>
              <ul className="divide-y divide-line border-t border-line">
                {p.items.map((it, idx) => (
                  <li key={it.drug} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                    <span className="min-w-0 flex-1"><b>{it.drug}</b> <span className="text-ink-mute">· {it.dose} · ×{it.qty}</span></span>
                    {p.status !== "delivered" && p.status !== "out_for_delivery" ? (
                      <>
                        <label className="flex items-center gap-1.5 text-xs font-semibold">
                          <input type="checkbox" className="accent-brand-600" checked={it.available !== false} onChange={(e) => dispatch({ type: "rxStock", id: p.id, index: idx, available: e.target.checked })} /> In stock
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          <span className="text-ink-mute">KES</span>
                          <input type="number" aria-label={`Price for ${it.drug}`} defaultValue={it.price} onBlur={(e) => dispatch({ type: "rxStock", id: p.id, index: idx, available: it.available !== false, price: +e.target.value || undefined })} className="w-20 rounded-lg border border-line px-2 py-1 text-right" />
                        </label>
                      </>
                    ) : <span className="font-semibold">{it.price ? kes(it.price) : ""}</span>}
                  </li>
                ))}
              </ul>
              <div className="space-y-3 border-t border-line p-5">
                <MiniSteps steps={rxSteps} current={p.status === "issue" ? "verified" : p.status} />
                <div className="flex flex-wrap gap-2">
                  {p.status === "received" && <Button size="sm" onClick={() => dispatch({ type: "rxStatus", id: p.id, status: "verified" })}><ShieldCheck size={15} /> Pharmacist verified</Button>}
                  {(p.status === "verified" || p.status === "issue") && <Button size="sm" disabled={missing || unpriced} onClick={() => dispatch({ type: "rxStatus", id: p.id, status: "ready" })}><PackageCheck size={15} /> Confirm stock & price, pack</Button>}
                  {(p.status === "verified" || p.status === "received") && missing && <Button size="sm" variant="warn" onClick={() => dispatch({ type: "rxStatus", id: p.id, status: "issue", issue: `${p.items.filter((i) => i.available === false).map((i) => i.drug).join(", ")} is out of stock. We are sourcing it from a partner pharmacy and will update you within 2 hours.` })}><AlertTriangle size={15} /> Tell patient about stock issue</Button>}
                  {p.status === "ready" && (p.delivery ? <Button size="sm" onClick={() => dispatch({ type: "rxStatus", id: p.id, status: "out_for_delivery" })}><Bike size={15} /> Dispatch rider</Button> : <Button size="sm" onClick={() => dispatch({ type: "rxStatus", id: p.id, status: "delivered" })}><Store size={15} /> Collected by patient</Button>)}
                  {p.status === "out_for_delivery" && <Button size="sm" onClick={() => dispatch({ type: "rxStatus", id: p.id, status: "delivered" })}><CheckCircle2 size={15} /> Mark delivered</Button>}
                  {(unpriced && p.status === "verified") && <span className="self-center text-xs text-ink-mute">Add prices to continue.</span>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
