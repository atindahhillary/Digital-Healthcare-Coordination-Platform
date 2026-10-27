import {
  Activity, ArrowRight, BadgeCheck, Bell, Brain, CheckCircle2, Eye, FileText, FlaskConical, Globe2, HeartHandshake, HeartPulse, LayoutDashboard,
  Languages, Lock, Phone, Pill, Search, ShieldCheck, Smartphone, Stethoscope, Users, Wifi,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookingModal, SpecialistCard } from "../../components/Booking";
import CareFlow from "../../components/CareFlow";
import ExplainerVideo from "../../components/ExplainerVideo";
import Simulator from "../../components/Simulator";
import { Avatar } from "../../components/ui";
import { pathways, specialists, type Specialist } from "../../data/seed";
import { useStore } from "../../store/store";

const specialtyChips = [
  { s: "Rheumatology", icon: HeartHandshake, c: "bg-violet-600" },
  { s: "Nephrology", icon: FlaskConical, c: "bg-sky2-600" },
  { s: "Cardiology", icon: HeartPulse, c: "bg-rose-500" },
  { s: "Endocrinology", icon: Activity, c: "bg-orange-500" },
  { s: "Psychiatry", icon: Brain, c: "bg-brand-600" },
  { s: "Ophthalmology", icon: Eye, c: "bg-amber-500" },
];

function HelpTiles() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <section className="container-x relative -mt-6 pb-6 sm:-mt-10">
      <div className="rounded-[28px] border border-line bg-gradient-to-b from-white to-brand-50/50 p-4 shadow-lift sm:p-8">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">How can we help you today?</h2>
        <form onSubmit={(e) => { e.preventDefault(); navigate(`/find-care${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`); }} className="relative mt-4">
          <label htmlFor="home-search" className="sr-only">Search doctors or specialties</label>
          <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input id="home-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Doctor, condition or specialty" className="h-14 w-full rounded-2xl border border-line bg-white pl-12 pr-28 text-[15px] shadow-sm focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100" />
          <button type="submit" className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">Search</button>
        </form>
        <div className="-mx-4 mt-4 flex gap-2.5 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
          {specialtyChips.map((x) => (
            <Link key={x.s} to={`/find-care?specialty=${x.s}`} className="flex shrink-0 items-center gap-2 rounded-2xl border border-line bg-white py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-ink shadow-sm hover:border-brand-300">
              <span className={`grid h-8 w-8 place-items-center rounded-xl text-white ${x.c}`}><x.icon size={16} /></span>
              {x.s}
            </Link>
          ))}
        </div>
        <CareFlow />
      </div>
    </section>
  );
}

const portals = [
  { icon: Smartphone, title: "Patients", body: "Register with your ID, book, join by video link, keep your health record and get prescription reminders.", to: "/app/patient", tint: "bg-brand-50 text-brand-700" },
  { icon: Stethoscope, title: "Specialists & clinics", body: "Confirm bookings, share the video link, open the patient file once confirmed, write summaries and prescriptions.", to: "/app/specialist", tint: "bg-sky2-50 text-sky2-600" },
  { icon: FlaskConical, title: "Laboratories", body: "Orders from specialists, home collection and secure results. Opens once the specialist journey is perfected.", to: "/app/lab", tint: "bg-violet-50 text-violet-700", soon: true },
  { icon: Pill, title: "Pharmacies", body: "Receive the prescription your patient chose, confirm stock, deliver and manage refills.", to: "/app/pharmacy", tint: "bg-orange-50 text-orange-700", soon: true },
  { icon: Users, title: "Patient organisations", body: "Share approved education and support groups. Never see medical records.", to: "/app/org", tint: "bg-pink-50 text-pink-700" },
  { icon: LayoutDashboard, title: "Platform operations", body: "Verify providers and patient IDs, set service rules, monitor delays and resolve complaints.", to: "/app/admin", tint: "bg-slate-100 text-slate-700" },
];

const pillars = [
  { icon: Search, t: "Find the right specialist", b: "Verified doctors, clear prices and an on-time record you can see before you book." },
  { icon: FileText, t: "Share your history once", b: "One health record that follows you. Doctors open it only after they confirm your booking." },
  { icon: FlaskConical, t: "Access local tests", b: "Doctors recommend tests now. Booking and results inside the app arrive with the lab phase.", soon: true },
  { icon: Users, t: "Coordinate your clinicians", b: "Referrals tracked, one care plan, and a coordinator who calls if anything slips." },
  { icon: Bell, t: "Know what to do next", b: "Reminders for visits, prescriptions and follow-up, by SMS and in the app." },
];

export default function HowItWorks() {
  const [book, setBook] = useState<Specialist>();
  const { state } = useStore();
  const registered = !!state.myPatientId;
  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-[#06302f] text-white">
        {/* Layered background: clinic photo, colour wash, glows, faint grid and a heartbeat line. */}
        <div className="absolute inset-0 -z-10" aria-hidden>
          <img src="/img/hero-clinic.webp" alt="" fetchPriority="high" decoding="async" className="h-full w-full scale-105 object-cover opacity-60 blur-[1.5px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#04403c]/90 via-brand-800/70 to-sky2-700/75" />
          <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-sky2-500/30 blur-3xl" />
          <div className="absolute inset-0 grid-bg-light [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" />
          <svg className="absolute inset-x-0 bottom-16 h-24 w-full text-white/15" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path className="ecg-line" d="M0 60 H380 L410 60 L430 20 L455 95 L480 40 L495 60 H760 L785 60 L800 35 L820 80 L835 60 H1200" fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white/0" />
        </div>
        {/* On a phone the order is headline, video, buttons; on a wide screen the text sits left and the video right. */}
        <div className="container-x relative grid gap-x-14 gap-y-8 pb-24 pt-12 sm:pb-28 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:pb-32 lg:pt-24">
          <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold text-brand-100 ring-1 ring-white/20 backdrop-blur">
              <HeartHandshake size={15} /> Chronic-care coordination for Kenya
            </p>
            <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-[-0.035em] text-white sm:text-6xl">
              How <span className="bg-gradient-to-r from-brand-200 to-[#9ee7ff] bg-clip-text text-transparent">AfyaConnect</span> works.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:mt-5 sm:text-lg">
              Meet a verified specialist, keep your history in one place and always know your next step. Watch Dr. Afya show you how.
            </p>
          </div>
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
            <ExplainerVideo />
          </div>
          <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
            <div className="flex flex-wrap gap-3">
              <Link to={registered ? "/app/patient" : "/register"} className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-brand-800 shadow-lg shadow-black/10 hover:bg-brand-50 focus-ring">
                {registered ? "Open my account" : "Create your account"} <ArrowRight size={18} />
              </Link>
              <Link to="/find-care" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 font-semibold text-white backdrop-blur hover:bg-white/20 focus-ring">
                Find a specialist
              </Link>
            </div>
            <p className="mt-3 text-sm text-white/70">Just looking? <Link to="/app/patient" className="font-semibold text-white underline underline-offset-2">Try the demo patient</Link></p>
            <div className="mt-7 flex items-center gap-3">
              <div className="flex -space-x-3">
                {specialists.slice(0, 5).map((s) => <Avatar key={s.id} name={s.name} size={40} />)}
              </div>
              <p className="text-sm leading-snug text-white/75"><b className="text-white">Verified specialists</b><br />across 8 counties, on video or in person</p>
            </div>
          </div>
        </div>
      </section>

      <HelpTiles />

      {/* NOT JUST A DIRECTORY */}
      <section className="container-x py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Not just a directory</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Most directories help you find a doctor. We help you through the whole journey.</h2>
          <p className="mt-4 text-lg text-ink-soft">A long-term condition means many clinicians, many tests and a lot to remember. We keep it in one place and tell you what to do next.</p>
        </div>
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {pillars.map((x, i) => (
            <li key={x.t} className="relative rounded-2xl border border-line bg-white p-5 shadow-card">
              <span className="absolute right-4 top-4 text-xs font-bold text-ink-mute">0{i + 1}</span>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><x.icon size={20} /></span>
              <p className="mt-4 flex flex-wrap items-center gap-2 font-bold leading-snug">{x.t}{"soon" in x && x.soon && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase leading-none text-white">Soon</span>}</p>
              <p className="mt-1.5 text-sm text-ink-soft">{x.b}</p>
            </li>
          ))}
        </ol>
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

      {/* HEALTH RECORD */}
      <section className="bg-canvas py-20">
        <div className="container-x grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Your data, in order</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">A health record that works like a student portal</h2>
            <p className="mt-4 text-lg text-ink-soft">Every visit, summary and prescription is added automatically. Look back whenever you need to. A new doctor sees it only after they confirm a booking with you, and you can turn their access off at any time.</p>
            <ul className="mt-6 space-y-3 text-[15px]">
              {["Visit history with each doctor's summary", "Prescriptions with a code, and reminders until you choose a pharmacy", "Tests your doctor recommends, and their results", "A log of everyone who has opened your file"].map((x) => (
                <li key={x} className="flex gap-3"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-white"><CheckCircle2 size={13} /></span>{x}</li>
              ))}
            </ul>
            <Link to="/app/patient/record" className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700 focus-ring">See the record <ArrowRight size={18} /></Link>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-100 to-sky2-100 blur-xl" aria-hidden />
            <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-lift">
              <div className="flex items-center gap-3 bg-gradient-to-r from-brand-50 to-sky2-50 p-4">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">GW</span>
                <div className="min-w-0 flex-1"><p className="font-bold">Grace Wambui</p><p className="text-xs text-ink-mute">34 years · Nairobi</p></div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><BadgeCheck size={12} /> ID verified</span>
              </div>
              <div className="flex gap-1 border-b border-line px-3 pt-2 text-sm font-semibold">
                {["Overview", "Visits", "Prescriptions"].map((t, i) => <span key={t} className={`rounded-t-lg px-3 py-2 ${i === 1 ? "border-b-2 border-brand-600 text-brand-700" : "text-ink-mute"}`}>{t}</span>)}
              </div>
              <ul className="divide-y divide-line">
                <li className="p-4">
                  <div className="flex items-center gap-3"><Avatar name="Amina Odhiambo" size={36} /><div className="min-w-0 flex-1"><p className="text-sm font-bold">Dr. Amina Odhiambo</p><p className="text-xs text-ink-mute">Rheumatology · 3-month lupus review</p></div><span className="rounded-full bg-sky2-50 px-2 py-0.5 text-[11px] font-bold text-sky2-700">Follow-up in 12 wks</span></div>
                  <p className="mt-2.5 rounded-xl bg-canvas p-3 text-[13px] text-ink-soft">Joint pain improved. Continue hydroxychloroquine and prednisolone. Kidney panel and blood count before the next review.</p>
                </li>
                <li className="flex items-center gap-3 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-700"><Pill size={17} /></span>
                  <div className="min-w-0 flex-1"><p className="text-sm font-bold">Prescription RX-4K7QZ2</p><p className="text-xs text-ink-mute">Choose a pharmacy · reminder 2 of 4 sent</p></div>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">Action needed</span>
                </li>
                <li className="flex items-center gap-3 p-4 text-[13px] text-ink-soft"><Lock size={15} className="shrink-0 text-brand-600" /> Dr. Njeri Mwangi opened this file on 12 Aug, after confirming a booking.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PORTALS */}
      <section className="py-20">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Built in phases</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Patient and specialist first, made solid. The rest follows.</h2>
            </div>
            <Link to="/app/patient" className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline">Open the demo <ArrowRight size={16} /></Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {portals.map((p) => (
              <Link key={p.title} to={p.to} className="group rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift focus-ring">
                <span className="flex items-start justify-between gap-2">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl ${p.tint}${"soon" in p && p.soon ? " opacity-60" : ""}`}><p.icon size={22} /></span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${"soon" in p && p.soon ? "bg-ink text-white" : "bg-emerald-50 text-emerald-700"}`}>{"soon" in p && p.soon ? "Opening later" : "Live in demo"}</span>
                </span>
                <p className="mt-4 text-lg font-bold">{p.title}</p>
                <p className="mt-1.5 text-[15px] text-ink-soft">{p.body}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">{"soon" in p && p.soon ? "See what is coming" : "Explore portal"} <ArrowRight size={15} className="transition group-hover:translate-x-0.5" /></p>
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
            <h3 className="mt-4 text-2xl font-extrabold">Specialists and clinics</h3>
            <p className="mt-2 max-w-md text-white/80">Join a network that sends you verified patients with their history ready, and handles reminders and payment. Labs and pharmacies join in later phases.</p>
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
