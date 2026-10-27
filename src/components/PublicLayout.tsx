import { Menu, Phone, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { cx } from "../lib/format";
import { useStore } from "../store/store";
import { InstallButton } from "./Network";

export function Logo({ light }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="16" fill="#0A7F73" />
        <path d="M20 22a8 8 0 0 1 12 0 8 8 0 0 1 12 0c4 4 3 10-1 14L32 47 21 36c-4-4-5-10-1-14z" fill="none" stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
        <path d="M18 33h8l3-5 4 9 3-4h10" fill="none" stroke="#9FE9DC" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={cx("whitespace-nowrap text-[17px] font-extrabold tracking-tight", light ? "text-white" : "text-ink")}>
        Afya<span className={light ? "text-brand-200" : "text-brand-600"}>Connect</span>
      </span>
    </span>
  );
}

const nav = [
  { to: "/find-care", label: "Find care" },
  { to: "/care-pathways", label: "Care pathways" },
  { to: "/partners", label: "For providers" },
  { to: "/trust", label: "Trust & privacy" },
  { to: "/blueprint", label: "Blueprint" },
  { to: "/contact", label: "Help" },
];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { state } = useStore();
  const registered = !!state.myPatientId;
  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-ink text-[13px] text-white/85">
        <div className="container-x flex items-center justify-end gap-3 py-2">
          <Link to="/contact" className="flex items-center gap-1.5 font-medium hover:text-white">
            <Phone size={13} /> Need help booking? We can call you
          </Link>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-white/85 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <Link to="/" className="focus-ring rounded-lg" aria-label="Home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 xl:flex" aria-label="Main">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => cx("whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition focus-ring", isActive ? "text-brand-700" : "text-ink-soft hover:text-ink")}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <InstallButton />
            {!registered && (
              <Link to="/app/patient" className="hidden h-10 items-center whitespace-nowrap rounded-xl px-3 text-sm font-semibold text-ink-soft hover:text-ink sm:inline-flex focus-ring">
                Sign in
              </Link>
            )}
            <Link to={registered ? "/app/patient" : "/register"} className="inline-flex h-10 items-center whitespace-nowrap rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-ring">
              <span className="sm:hidden">{registered ? "Account" : "Join"}</span>
              <span className="hidden sm:inline">{registered ? "My account" : "Create account"}</span>
            </Link>
            <button className="grid h-10 w-10 place-items-center rounded-xl border border-line xl:hidden focus-ring" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-line bg-white xl:hidden" aria-label="Mobile">
            <div className="container-x grid gap-1 py-3">
              {nav.map((n) => (
                <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 font-semibold text-ink hover:bg-canvas">
                  {n.label}
                </NavLink>
              ))}
              <NavLink to={registered ? "/app/patient" : "/register"} onClick={() => setOpen(false)} className="rounded-xl bg-brand-50 px-3 py-3 font-semibold text-brand-800">
                {registered ? "Open my account" : "Create your account"}
              </NavLink>
              <NavLink to="/app/patient" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 font-semibold text-brand-700 hover:bg-canvas">
                Open the demo platform
              </NavLink>
            </div>
          </nav>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-ink text-white/75">
        <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-sm text-sm leading-relaxed">Healthcare services connected around the patient, with reliability and continuity at the centre. Starting with chronic care in Kenya.</p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10">
              <ShieldCheck size={14} className="text-brand-300" /> Built to the Data Protection Act 2019 and Digital Health Act 2023
            </p>
          </div>
          {[
            { h: "Patients", l: [["Create an account", "/register"], ["Find a specialist", "/find-care"], ["Care pathways", "/care-pathways"], ["Help & assisted booking", "/contact"]] },
            { h: "Providers", l: [["Join the network", "/partners"], ["Specialist portal", "/app/specialist"], ["Laboratory portal (soon)", "/app/lab"], ["Pharmacy portal (soon)", "/app/pharmacy"]] },
            { h: "Platform", l: [["Trust & privacy", "/trust"], ["Blueprint & roadmap", "/blueprint"], ["Admin console", "/app/admin"], ["Patient organisations", "/app/org"]] },
          ].map((c) => (
            <div key={c.h}>
              <p className="text-sm font-semibold text-white">{c.h}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {c.l.map(([label, to]) => (
                  <li key={to}>
                    <Link to={to} className="hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10">
          <div className="container-x flex flex-wrap justify-between gap-2 py-5 text-xs text-white/50">
            <p>© {new Date().getFullYear()} AfyaConnect. Clickable prototype: all providers and demo patients are fictional. Photos from Unsplash show models, not the named doctors.</p>
            <p>Emergency: 999 / 112 · Kenya Red Cross: 1199</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
