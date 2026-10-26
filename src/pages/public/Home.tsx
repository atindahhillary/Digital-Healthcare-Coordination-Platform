import {
  ArrowRight, BadgeCheck, Bell, CalendarCheck2, CheckCircle2, FlaskConical, Globe2, HeartHandshake, LayoutDashboard, Languages, Phone,
  Pill, ShieldCheck, Smartphone, Stethoscope, Users, Video, Wifi,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BookingModal, SpecialistCard } from "../../components/Booking";
import Simulator from "../../components/Simulator";
import { Avatar } from "../../components/ui";
import { pathways, specialists, type Specialist } from "../../data/seed";

function HeroPhone() {
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="absolute -left-16 top-20 hidden w-56 rounded-2xl bg-white p-3.5 shadow-lift ring-1 ring-line animate-rise sm:block" style={{ animationDelay: ".3s", animationFillMode: "backwards" }}>
        <p className="flex items-center gap-2 text-[13px] font-bold text-ink"><FlaskConical size={15} className="text-violet-600" /> Results ready</p>
        <p className="mt-1 text-xs text-ink-mute">Kidney panel shared with you and Dr Amina.</p>
      </div>
      <div className="absolute -right-12 bottom-24 hidden w-52 rounded-2xl bg-white p-3.5 shadow-lift ring-1 ring-line animate-rise sm:block" style={{ animationDelay: ".5s", animationFillMode: "backwards" }}>
        <p className="flex items-center gap-2 text-[13px] font-bold text-ink"><Pill size={15} className="text-orange-600" /> Refill on the way</p>
        <p className="mt-1 text-xs text-ink-mute">Rider arriving 2:40 pm, Kasarani.</p>
      </div>
      <div className="rounded-[2.6rem] bg-ink p-3 shadow-2xl">
        <div className="overflow-hidden rounded-[2.1rem] bg-canvas">
          <div className="flex justify-between px-6 pb-1 pt-3 text-[11px] font-semibold">
            <span>10:28</span><span className="h-5 w-20 rounded-full bg-ink" /><span>4G</span>
          </div>
          <div className="space-y-3 p-4">
            <div>
              <p className="text-xs text-ink-mute">Good morning,</p>
              <p className="text-lg font-bold">Grace</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-line">
              <div className="flex items-center gap-3">
                <Avatar name="Amina Odhiambo" hue={168} size={42} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">Dr. Amina Odhiambo</p>
                  <p className="text-xs text-ink-mute">Rheumatology · 10:30 · Video</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1">
                {[1, 1, 1, 1, 0].map((on, i) => <span key={i} className={`h-1.5 rounded-full ${on ? "bg-brand-500" : "bg-line"}`} />)}
              </div>
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><CheckCircle2 size={14} /> Your doctor is ready</p>
              <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white"><Video size={15} /> Join consultation</button>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-line">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-mute">Lupus care plan</p>
              {[["Kidney panel", "Done"], ["Rheumatology review", "Today"], ["Eye screening", "In 19 days"]].map(([a, b]) => (
                <div key={a} className="mt-2 flex items-center justify-between text-[13px]">
                  <span className="font-medium">{a}</span><span className="text-ink-mute">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const portals = [
  { icon: Smartphone, title: "Patients", body: "Find, book, join and follow up. Results, refills, referrals and reminders in one place.", to: "/app/patient", tint: "bg-brand-50 text-brand-700" },
  { icon: Stethoscope, title: "Specialists & clinics", body: "Schedules, readiness check, notes, e-prescriptions, lab orders and referrals.", to: "/app/specialist", tint: "bg-sky2-50 text-sky2-600" },
  { icon: FlaskConical, title: "Laboratories", body: "Receive authorised orders, schedule home collection and release results securely.", to: "/app/lab", tint: "bg-violet-50 text-violet-700" },
  { icon: Pill, title: "Pharmacies", body: "Verify e-prescriptions, confirm stock and price, deliver and manage refills.", to: "/app/pharmacy", tint: "bg-orange-50 text-orange-700" },
  { icon: Users, title: "Patient organisations", body: "Share approved education and support groups. Never see medical records.", to: "/app/org", tint: "bg-pink-50 text-pink-700" },
  { icon: LayoutDashboard, title: "Platform operations", body: "Verify providers, set service rules, monitor delays and resolve complaints.", to: "/app/admin", tint: "bg-slate-100 text-slate-700" },
];

export default function Home() {
  const [book, setBook] = useState<Specialist>();
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-white">
        <div className="absolute inset-0 grid-bg [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
        <div className="container-x relative grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100">
              <HeartHandshake size={15} /> Chronic-care coordination for Kenya
            </p>
            <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink sm:text-6xl">
              Care that <span className="bg-gradient-to-r from-brand-600 to-sky2-600 bg-clip-text text-transparent">shows up</span>, every time you need it.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              We connect you with verified specialists, laboratories, pharmacies and patient organisations, and then makes sure the care you booked actually happens. If a doctor is late, you are told early and offered a real next step.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/find-care" className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 font-semibold text-white shadow-sm hover:bg-brand-700 focus-ring">
                Find a specialist <ArrowRight size={18} />
              </Link>
              <Link to="/app/patient" className="inline-flex h-12 items-center gap-2 rounded-xl border border-line bg-white px-6 font-semibold text-ink hover:border-brand-300 focus-ring">
                Try the live demo
              </Link>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-line pt-6">
              {[["60 min", "readiness check before every consult"], ["20 min", "max delay before recovery kicks in"], ["0", "patients left without a next step"]].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{v}</dt>
                  <dd className="mt-1 text-[13px] leading-snug text-ink-mute">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroPhone />
        </div>
      </section>

      {/* PROBLEM */}
      <section className="container-x py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Not another booking site</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Living with a chronic condition means juggling five providers who never talk to each other.</h2>
            <p className="mt-4 text-lg text-ink-soft">A person living with lupus may need a rheumatologist, regular kidney tests, monthly medicines, an eye check and peer support. Today each one is booked, paid for and chased separately. We coordinate the whole journey.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: CalendarCheck2, t: "Appointments that are actively managed", b: "Readiness checks, delay alerts and automatic recovery, not just a calendar entry." },
              { icon: FlaskConical, t: "Tests ordered and tracked", b: "Orders go straight to the lab. Home collection. Results go to you and your doctor." },
              { icon: Pill, t: "Medicines that arrive", b: "E-prescriptions verified by a pharmacist, stock confirmed, refills reminded." },
              { icon: Bell, t: "Follow-up that never slips", b: "Your care pathway schedules the next review and the next test for you." },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-line bg-white p-5 shadow-card">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><x.icon size={20} /></span>
                <p className="mt-3 font-bold">{x.t}</p>
                <p className="mt-1 text-sm text-ink-soft">{x.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RELIABILITY */}
      <section id="reliability" className="bg-ink py-20 text-white">
        <div className="container-x">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-300">The reliability engine</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">What happens when a specialist runs late?</h2>
            <p className="mt-4 text-lg text-white/70">Pick a scenario. This is the predefined service-recovery process every appointment runs through. Emergencies are never treated as delays: they get separate escalation instructions.</p>
          </div>
          <div className="mt-10">
            <Simulator />
          </div>
        </div>
      </section>

      {/* JOURNEY */}
      <section className="container-x py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-brand-700">One connected journey</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Grace's lupus care, coordinated</h2>
          <p className="mt-4 text-lg text-ink-soft">Every handover between providers is tracked, consented and visible to Grace.</p>
        </div>
        <ol className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            { icon: Stethoscope, t: "Rheumatology review", b: "Video consult, on time", c: "text-brand-700 bg-brand-50" },
            { icon: FlaskConical, t: "Kidney panel", b: "Ordered in-consult, collected at home", c: "text-violet-700 bg-violet-50" },
            { icon: Bell, t: "Results released", b: "To Grace and her doctor only", c: "text-sky2-600 bg-sky2-50" },
            { icon: Pill, t: "Refill delivered", b: "Pharmacist-verified e-prescription", c: "text-orange-700 bg-orange-50" },
            { icon: Users, t: "Support group", b: "Monthly session, no record access", c: "text-pink-700 bg-pink-50" },
            { icon: CalendarCheck2, t: "Next review set", b: "Auto-scheduled in 12 weeks", c: "text-emerald-700 bg-emerald-50" },
          ].map((s, i) => (
            <li key={s.t} className="relative rounded-2xl border border-line bg-white p-5 shadow-card">
              <span className="absolute right-4 top-4 text-xs font-bold text-ink-mute">0{i + 1}</span>
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${s.c}`}><s.icon size={20} /></span>
              <p className="mt-4 font-bold leading-snug">{s.t}</p>
              <p className="mt-1 text-sm text-ink-mute">{s.b}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* PORTALS */}
      <section className="bg-canvas py-20">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Six portals, one platform</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Everyone in the care network, on the same page</h2>
            </div>
            <Link to="/app/patient" className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline">Open the demo <ArrowRight size={16} /></Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {portals.map((p) => (
              <Link key={p.title} to={p.to} className="group rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift focus-ring">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${p.tint}`}><p.icon size={22} /></span>
                <p className="mt-4 text-lg font-bold">{p.title}</p>
                <p className="mt-1.5 text-[15px] text-ink-soft">{p.body}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">Explore portal <ArrowRight size={15} className="transition group-hover:translate-x-0.5" /></p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SPECIALISTS */}
      <section className="container-x py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Verified specialists</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">See punctuality before you book</h2>
            <p className="mt-3 max-w-xl text-ink-soft">Every specialist's licence is checked before they can take bookings. Their real on-time record is public.</p>
          </div>
          <Link to="/find-care" className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline">All specialists <ArrowRight size={16} /></Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specialists.slice(0, 3).map((sp) => <SpecialistCard key={sp.id} sp={sp} onBook={() => setBook(sp)} />)}
        </div>
        {book && <BookingModal sp={book} open={!!book} onClose={() => setBook(undefined)} />}
      </section>

      {/* PATHWAYS */}
      <section className="bg-gradient-to-b from-white to-brand-50/60 py-20">
        <div className="container-x">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Care pathways</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Built for repeat care, condition by condition</h2>
            <p className="mt-3 text-ink-soft">Pathways are configuration, not code. New conditions can be added without rebuilding the platform.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pathways.map((p) => (
              <Link key={p.id} to="/care-pathways" className="rounded-2xl border border-line bg-white p-5 shadow-card hover:shadow-lift focus-ring">
                <span className="inline-block h-1.5 w-10 rounded-full" style={{ background: p.colour }} />
                <p className="mt-4 font-bold">{p.short}</p>
                <p className="mt-1 text-sm text-ink-soft">{p.summary}</p>
                <p className="mt-3 text-xs font-semibold text-ink-mute">{p.steps.length} coordinated steps · led by {p.lead}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* INCLUSION */}
      <section className="container-x py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Designed for everyone</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Works on an ordinary phone and an ordinary connection</h2>
            <p className="mt-4 text-lg text-ink-soft">Not everyone has a smartphone or data bundles, so we meet patients where they are.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Wifi, t: "Light on data", b: "Fast on 3G. Video drops to audio when the network is weak." },
              { icon: Smartphone, t: "SMS for every critical step", b: "Reminders, readiness and delays reach any phone." },
              { icon: Phone, t: "Assisted booking", b: "Call or request a callback and a coordinator books for you." },
              { icon: Languages, t: "English and Kiswahili", b: "Plain language, large readable text, screen-reader friendly." },
            ].map((x) => (
              <div key={x.t} className="flex gap-3 rounded-2xl border border-line p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky2-50 text-sky2-600"><x.icon size={19} /></span>
                <div>
                  <p className="font-bold">{x.t}</p>
                  <p className="text-sm text-ink-soft">{x.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x pb-20">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white sm:p-10">
            <BadgeCheck size={28} className="text-brand-200" />
            <h3 className="mt-4 text-2xl font-extrabold">Specialists, labs and pharmacies</h3>
            <p className="mt-2 max-w-md text-white/80">Join a network that sends you the right patients, with orders, consent and payment already handled.</p>
            <Link to="/partners" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 font-semibold text-brand-800 hover:bg-brand-50">Partner with us <ArrowRight size={16} /></Link>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-ink p-8 text-white sm:p-10">
            <ShieldCheck size={28} className="text-brand-300" />
            <h3 className="mt-4 text-2xl font-extrabold">Privacy by design</h3>
            <p className="mt-2 max-w-md text-white/70">Role-based access, patient-controlled consent and a full audit trail, built to Kenya's Data Protection Act and Digital Health Act.</p>
            <Link to="/trust" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-5 font-semibold ring-1 ring-white/20 hover:bg-white/20"><Globe2 size={16} /> How we protect data</Link>
          </div>
        </div>
      </section>
    </>
  );
}
