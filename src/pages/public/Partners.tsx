import { ArrowRight, BadgeCheck, BarChart3, CalendarCheck2, FlaskConical, Pill, Stethoscope, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Field, inputCls } from "../../components/ui";

const types = [
  { icon: Stethoscope, t: "Specialists & clinics", b: ["Patients who need ongoing specialist care", "Your schedule, your fees", "Notes, orders and prescriptions in one place", "Paid reliably, no chasing"], to: "/app/specialist" },
  { icon: FlaskConical, t: "Laboratories", b: ["Authorised orders arrive digitally", "Home-collection bookings", "Secure result release to patient and doctor", "Agreed price list"], to: "/app/lab" },
  { icon: Pill, t: "Pharmacies", b: ["E-prescriptions ready to verify", "Recurring refills from chronic patients", "Delivery coordination", "Stock alerts to patients handled for you"], to: "/app/pharmacy" },
  { icon: Users, t: "Patient organisations", b: ["Share approved education", "Publish support-group sessions", "Signpost members to verified services", "No access to medical records, by design"], to: "/app/org" },
];

export default function Partners() {
  const [sent, setSent] = useState(false);
  return (
    <div className="bg-canvas pb-20">
      <section className="border-b border-line bg-white">
        <div className="container-x py-14">
          <p className="text-sm font-bold uppercase tracking-wider text-brand-700">For providers & partners</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">Join a network patients can rely on</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-soft">We bring you patients who need continuing care and handle the coordination around them. In return we ask for one thing: show up when you said you would.</p>
        </div>
      </section>
      <section className="container-x mt-10 grid gap-4 md:grid-cols-2">
        {types.map((x) => (
          <Card key={x.t} className="p-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><x.icon size={22} /></span>
            <p className="mt-4 text-lg font-bold">{x.t}</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              {x.b.map((b) => <li key={b} className="flex gap-2"><BadgeCheck size={16} className="mt-0.5 shrink-0 text-brand-600" />{b}</li>)}
            </ul>
            <Link to={x.to} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">Preview the portal <ArrowRight size={15} /></Link>
          </Card>
        ))}
      </section>
      <section className="container-x mt-12 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Our service standards</h2>
          <div className="mt-5 space-y-3">
            {[
              { icon: CalendarCheck2, t: "Confirm readiness", b: "Tap “ready” in the hour before each consultation, or report a delay." },
              { icon: BarChart3, t: "Punctuality is public", b: "On-time rate and average wait show on your profile and drive your ranking." },
              { icon: FlaskConical, t: "Agreed turnaround", b: "Labs and pharmacies commit to turnaround and stock-confirmation times." },
              { icon: BadgeCheck, t: "Verified once, re-checked yearly", b: "Licences and registrations are checked before your first booking." },
            ].map((x) => (
              <Card key={x.t} className="flex gap-4 p-5">
                <x.icon size={20} className="mt-0.5 shrink-0 text-brand-600" />
                <div><p className="font-bold">{x.t}</p><p className="text-sm text-ink-soft">{x.b}</p></div>
              </Card>
            ))}
          </div>
        </div>
        <Card className="p-6">
          <h2 className="text-xl font-extrabold">Express interest</h2>
          {sent ? (
            <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-emerald-800">Thank you. In the live platform the partnerships team would contact you within two working days. (Demo: nothing was sent.)</p>
          ) : (
            <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
              <Field label="Organisation or practice name"><input required className={inputCls} /></Field>
              <Field label="Type">
                <select className={inputCls}>{types.map((t) => <option key={t.t}>{t.t}</option>)}</select>
              </Field>
              <Field label="County"><input className={inputCls} placeholder="e.g. Nakuru" /></Field>
              <Field label="Work email"><input type="email" required className={inputCls} /></Field>
              <Button type="submit" className="w-full">Send (demo)</Button>
            </form>
          )}
        </Card>
      </section>
    </div>
  );
}
