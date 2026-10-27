import { ArrowRight, Check, FlaskConical, Lock, Pill } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui";

const copy = {
  lab: {
    icon: FlaskConical,
    title: "Laboratory portal",
    who: "Laboratories",
    tint: "bg-violet-50 text-violet-700",
    now: "For now, specialists recommend tests and the patient takes them at any accredited lab. The recommendation sits in the patient's health record.",
    next: ["Orders arrive at the lab straight from the specialist", "Home sample collection and status tracking", "Results released securely to the patient and their doctor", "Agreed price list shown before booking"],
  },
  pharmacy: {
    icon: Pill,
    title: "Pharmacy portal",
    who: "Pharmacies",
    tint: "bg-orange-50 text-orange-700",
    now: "For now, the patient receives a prescription code, keeps getting reminders, and chooses the pharmacy they prefer. They show the code or a printed copy at the counter.",
    next: ["The patient's chosen pharmacy receives the prescription digitally", "Pharmacist verification and stock and price confirmation", "Delivery or collection updates, and refill requests", "Alerts if something is out of stock"],
  },
} as const;

export default function ComingSoon({ module }: { module: keyof typeof copy }) {
  const c = copy[module];
  return (
    <div className="mx-auto max-w-2xl">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-ink to-brand-900 p-6 text-white sm:p-8">
          <span className={`grid h-14 w-14 place-items-center rounded-2xl ${c.tint}`}><c.icon size={26} /></span>
          <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-white/20"><Lock size={12} /> Opens in a later phase</p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{c.title}</h1>
          <p className="mt-2 text-white/75">We are building one thing at a time and making it solid first: the patient and specialist journey. {c.who} join once that is perfect.</p>
        </div>
        <div className="space-y-6 p-6 sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-mute">How it works today</p>
            <p className="mt-1 text-[15px] text-ink-soft">{c.now}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-mute">What this portal adds</p>
            <ul className="mt-2 space-y-2">
              {c.next.map((n) => <li key={n} className="flex gap-2.5 text-[15px]"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700"><Check size={12} strokeWidth={3} /></span>{n}</li>)}
            </ul>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to="/app/specialist" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">See the specialist side <ArrowRight size={16} /></Link>
            <Link to="/partners" className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-5 text-sm font-semibold hover:border-brand-300">Join the waitlist</Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
