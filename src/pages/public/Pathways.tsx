import { AlertTriangle, BookOpen, CalendarClock, FlaskConical, Pill, ScanEye, Stethoscope, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Card } from "../../components/ui";
import { pathways, type PathwayStep } from "../../data/seed";
import { cx } from "../../lib/format";

export const kindIcon: Record<PathwayStep["kind"], typeof Pill> = { consult: Stethoscope, lab: FlaskConical, medication: Pill, screening: ScanEye, education: BookOpen };

export const every = (w: number) => (w === 4 ? "Monthly" : w === 12 ? "Every 3 months" : w === 52 ? "Yearly" : `Every ${w} weeks`);

export default function Pathways() {
  const [id, setId] = useState(pathways[0].id);
  const p = pathways.find((x) => x.id === id)!;
  return (
    <div className="bg-canvas pb-20">
      <section className="border-b border-line bg-white">
        <div className="container-x py-12">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Care pathways</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">A pathway turns a long-term condition into a schedule of coordinated steps: reviews, tests, medicines, screening and support. The platform reminds, books and tracks each one.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {pathways.map((x) => (
              <button key={x.id} onClick={() => setId(x.id)} className={cx("rounded-full border px-4 py-2 text-sm font-semibold focus-ring", x.id === id ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/30")}>
                {x.short}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="container-x mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="p-6">
          <span className="inline-block h-1.5 w-12 rounded-full" style={{ background: p.colour }} />
          <h2 className="mt-4 text-2xl font-extrabold">{p.name}</h2>
          <p className="mt-2 text-ink-soft">{p.summary}</p>
          <ol className="mt-6 space-y-3">
            {p.steps.map((s) => {
              const Icon = kindIcon[s.kind];
              return (
                <li key={s.label} className="flex items-start gap-4 rounded-2xl border border-line p-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: `${p.colour}14`, color: p.colour }}><Icon size={20} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold">{s.label}</p>
                      <Badge tone="neutral"><CalendarClock size={12} /> {every(s.everyWeeks)}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-soft">{s.detail}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-5 text-xs text-ink-mute">Illustrative schedule for the prototype. Final pathways are set and signed off by the clinical advisory board and the treating specialist, who can adjust them per patient.</p>
        </Card>
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="flex items-center gap-2 font-bold"><Users size={18} className="text-brand-600" /> Care team</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              {p.team.map((t) => <li key={t}>• {t}</li>)}
            </ul>
          </Card>
          <Card className="border-rose-200 bg-rose-50/60 p-6">
            <h3 className="flex items-center gap-2 font-bold text-rose-800"><AlertTriangle size={18} /> Get urgent help if you notice</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-rose-900/80">
              {p.redFlags.map((t) => <li key={t}>• {t}</li>)}
            </ul>
            <p className="mt-4 text-sm font-semibold text-rose-800">Call 999 or 112, or go to the nearest emergency unit. Do not wait for an appointment.</p>
          </Card>
          <Link to="/find-care" className="block rounded-2xl bg-brand-600 p-5 text-center font-semibold text-white hover:bg-brand-700">Start this pathway with a specialist</Link>
        </div>
      </section>
    </div>
  );
}
