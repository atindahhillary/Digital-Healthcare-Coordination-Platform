import { ArrowRight, LogIn, Menu, Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import ExplainerVideo from "../../components/ExplainerVideo";
import { Logo, nav } from "../../components/PublicLayout";
import { useStore } from "../../store/store";

const ART = "/img/hero-dr-afya-v1.webp";

// The first page does one job: get a person to care. A headline, one line, two big buttons.
// Everything else lives under "How it works" and the menu.
export default function Home() {
  const { state } = useStore();
  const registered = !!state.myPatientId;
  const [menu, setMenu] = useState(false);
  const [watch, setWatch] = useState(false);

  useEffect(() => {
    if (!watch && !menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setWatch(false); setMenu(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [watch, menu]);

  return (
    <div className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-gradient-to-b from-brand-500 via-brand-700 to-[#06302f] text-white lg:flex-row lg:items-center">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -left-24 top-24 h-80 w-80 rounded-full bg-brand-300/30 blur-3xl" />
        <div className="absolute -right-24 bottom-1/3 h-96 w-96 rounded-full bg-sky2-400/25 blur-3xl" />
      </div>

      <header className="absolute inset-x-3 top-3 z-30 mx-auto max-w-3xl lg:max-w-6xl">
        <div className="flex h-16 items-center justify-between rounded-3xl bg-white px-3 text-ink shadow-lift">
          <button type="button" onClick={() => setMenu(!menu)} aria-label="Menu" aria-expanded={menu} className="grid h-11 w-11 place-items-center rounded-xl text-brand-700 focus-ring">
            {menu ? <X size={24} /> : <Menu size={26} />}
          </button>
          <Link to="/" aria-label="AfyaConnect home" className="rounded-lg focus-ring"><Logo /></Link>
          <Link to="/app/patient" className="inline-flex h-11 items-center gap-1.5 whitespace-nowrap rounded-xl px-2 text-[15px] font-bold text-brand-700 focus-ring">
            {registered ? "My account" : "Sign in"} <LogIn size={18} />
          </Link>
        </div>
        {menu && (
          <nav aria-label="Menu" className="mt-2 rounded-3xl bg-white p-2 text-ink shadow-lift">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} className="block rounded-2xl px-4 py-3 text-[17px] font-semibold hover:bg-canvas focus-ring">{n.label}</NavLink>
            ))}
            <Link to="/app/patient" className="block rounded-2xl px-4 py-3 text-[17px] font-semibold text-brand-700 hover:bg-canvas focus-ring">Open the demo platform</Link>
          </nav>
        )}
      </header>

      <div className="relative z-0 flex flex-1 items-end justify-center pt-20 lg:order-2 lg:w-1/2 lg:self-stretch lg:pt-16">
        <img
          src={ART}
          alt="Dr. Afya, your AfyaConnect guide, waving hello"
          width={1080}
          height={1140}
          fetchPriority="high"
          decoding="async"
          className="h-[min(38svh,380px)] w-auto lg:h-[min(86svh,820px)]"
        />
      </div>

      <div className="relative z-10 -mt-10 rounded-t-[2rem] bg-[#052c2a] px-5 pb-20 pt-8 shadow-[0_-18px_40px_rgba(0,0,0,.18)] sm:pb-12 lg:order-1 lg:mt-0 lg:w-1/2 lg:rounded-none lg:bg-transparent lg:px-16 lg:pb-0 lg:pt-16 lg:shadow-none">
        <div className="mx-auto max-w-xl lg:mx-0">
          <h1 className="text-[32px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
            Care that <span className="bg-gradient-to-r from-brand-200 to-[#9ee7ff] bg-clip-text text-transparent">shows up</span>, every time you need it.
          </h1>
          <p className="mt-3 text-lg leading-snug text-white/80 sm:text-xl">See a verified specialist by video or in person, across Kenya.</p>
          <div className="mt-6 grid gap-3 sm:max-w-sm">
            <Link to={registered ? "/find-care" : "/register"} className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-lg font-bold text-brand-800 shadow-lg shadow-black/15 hover:bg-brand-50 focus-ring">
              {registered ? "Book a specialist" : "Get care now"} <ArrowRight size={20} />
            </Link>
            <Link to={registered ? "/app/patient" : "/find-care"} className="inline-flex h-14 items-center justify-center rounded-2xl border-2 border-white/70 px-6 text-lg font-bold text-white hover:bg-white/10 focus-ring">
              {registered ? "Open my account" : "Find a specialist"}
            </Link>
          </div>
          <button type="button" onClick={() => setWatch(true)} className="mt-5 inline-flex items-center gap-2.5 rounded-lg py-1 text-base font-semibold text-white/90 hover:text-white focus-ring">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 ring-1 ring-white/30"><Play size={14} fill="currentColor" className="ml-0.5" /></span>
            Watch how it works (1 min)
          </button>
        </div>
      </div>

      {watch && (
        <div role="dialog" aria-modal="true" aria-label="How AfyaConnect works" className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/75 p-4" onClick={() => setWatch(false)}>
          <div className="relative w-full max-w-[340px]" onClick={(e) => e.stopPropagation()}>
            <button type="button" autoFocus onClick={() => setWatch(false)} aria-label="Close the video" className="absolute -top-12 right-0 grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-lg focus-ring">
              <X size={20} />
            </button>
            <ExplainerVideo />
          </div>
        </div>
      )}
    </div>
  );
}
