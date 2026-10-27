import {
  Activity, BarChart3, Bell, Building2, CalendarDays, ClipboardList, FileText, FlaskConical, HeartHandshake, Home, LayoutDashboard,
  Pill, RotateCcw, ScrollText, Settings, ShieldCheck, Stethoscope, UserRound, Users, type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { byId, labs, pharmacies, specialists } from "../data/seed";
import { FEATURES } from "../lib/features";
import { ago, channelLabel, cx } from "../lib/format";
import { patients, useStore, type Role } from "../store/store";
import { InstallButton } from "./Network";
import { Logo } from "./PublicLayout";
import { Avatar } from "./ui";

const roles: { role: Role; label: string; icon: LucideIcon; soon?: boolean; nav: { to: string; label: string; icon: LucideIcon }[] }[] = [
  { role: "patient", label: "Patient", icon: Home, nav: [
    { to: "/app/patient", label: "Home", icon: Home },
    { to: "/app/patient/appointments", label: "Appointments", icon: CalendarDays },
    { to: "/app/patient/record", label: "Health record", icon: FileText },
    { to: "/app/patient/care", label: "My care plan", icon: HeartHandshake },
    { to: "/app/patient/profile", label: "Profile", icon: UserRound },
  ] },
  { role: "specialist", label: "Specialist", icon: Stethoscope, nav: [
    { to: "/app/specialist", label: "Today", icon: ClipboardList },
    { to: "/app/specialist/performance", label: "Performance", icon: BarChart3 },
  ] },
  { role: "lab", label: "Laboratory", icon: FlaskConical, soon: !FEATURES.lab, nav: [{ to: "/app/lab", label: "Requests & results", icon: FlaskConical }] },
  { role: "pharmacy", label: "Pharmacy", icon: Pill, soon: !FEATURES.pharmacy, nav: [{ to: "/app/pharmacy", label: "Prescriptions", icon: Pill }] },
  { role: "org", label: "Patient org", icon: Users, nav: [{ to: "/app/org", label: "Community", icon: Users }] },
  { role: "admin", label: "Admin", icon: LayoutDashboard, nav: [
    { to: "/app/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/app/admin/reliability", label: "Reliability", icon: Activity },
    { to: "/app/admin/providers", label: "Providers", icon: Building2 },
    { to: "/app/admin/settings", label: "Rules & pathways", icon: Settings },
    { to: "/app/admin/audit", label: "Audit & complaints", icon: ScrollText },
  ] },
];

const shortLabel: Record<string, string> = { "My care plan": "Care plan", "Health record": "Record", "Rules & pathways": "Rules", "Audit & complaints": "Audit" };

function identity(role: Role, s: ReturnType<typeof useStore>["state"]) {
  switch (role) {
    case "patient": {
      const p = patients[s.patientId];
      return { name: p.name, sub: s.patientId === "pt-grace" ? "Demo patient · Lupus pathway" : `Patient · ID ${p.kyc?.status === "verified" ? "verified" : "in review"}`, hue: 330 };
    }
    case "specialist": { const sp = byId(specialists, s.specialistId)!; return { name: sp.name, sub: sp.title, hue: sp.hue }; }
    case "lab": return { name: byId(labs, s.labId)!.name, sub: "Laboratory partner", hue: 220 };
    case "pharmacy": return { name: byId(pharmacies, s.pharmacyId)!.name, sub: "Pharmacy partner", hue: 140 };
    case "org": return { name: "Lupus Warriors Support Network", sub: "Patient organisation", hue: 280 };
    case "admin": return { name: "Operations Desk", sub: "Platform administrator", hue: 200 };
  }
}

export default function AppLayout() {
  const { state, dispatch } = useStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const current = (pathname.split("/")[2] as Role) || "patient";
  const role = roles.find((r) => r.role === current) ?? roles[0];
  const me = identity(role.role, state);
  const [bell, setBell] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.role !== role.role) dispatch({ type: "role", role: role.role });
  }, [role.role, state.role, dispatch]);

  useEffect(() => {
    const close = (e: MouseEvent) => bellRef.current && !bellRef.current.contains(e.target as Node) && setBell(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const notices = state.notices.filter((n) => n.to === role.role && (role.role !== "patient" || n.patientId === state.patientId) && (role.role !== "specialist" || !n.specialistId || n.specialistId === state.specialistId));
  const unread = notices.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white lg:flex">
        <Link to="/" className="flex h-16 items-center px-5 focus-ring">
          <Logo />
        </Link>
        <div className="px-3">
          <p className="px-2 pb-2 pt-3 text-[11px] font-bold uppercase tracking-wider text-ink-mute">View the platform as</p>
          <div className="grid grid-cols-3 gap-1.5">
            {roles.map((r) => (
              <button
                key={r.role}
                onClick={() => navigate(r.nav[0].to)}
                className={cx("relative flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition focus-ring", r.role === role.role ? "bg-brand-600 text-white shadow-sm" : r.soon ? "bg-canvas text-ink-mute hover:bg-canvas" : "bg-canvas text-ink-soft hover:bg-brand-50 hover:text-brand-700")}
              >
                <r.icon size={16} className={r.soon && r.role !== role.role ? "opacity-50" : undefined} />
                {r.label}
                {r.soon && <span className="absolute -right-1 -top-1 rounded-full bg-ink px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-white">Soon</span>}
              </button>
            ))}
          </div>
        </div>
        <nav className="mt-5 flex-1 space-y-0.5 px-3" aria-label={`${role.label} navigation`}>
          {role.nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end
              className={({ isActive }) => cx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition focus-ring", isActive ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-canvas hover:text-ink")}
            >
              <n.icon size={18} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="m-3 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white">
          <p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={16} /> Demo environment</p>
          <p className="mt-1 text-xs text-white/80">Fictional demo doctors. Actions in one portal show up in the others.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {state.myPatientId && (
              <button onClick={() => { dispatch({ type: "usePatient", id: state.patientId === state.myPatientId ? "pt-grace" : state.myPatientId! }); navigate("/app/patient"); }} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50 focus-ring">
                <UserRound size={13} /> {state.patientId === state.myPatientId ? "View demo patient" : "Back to my account"}
              </button>
            )}
            <button onClick={() => dispatch({ type: "reset" })} className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/25 focus-ring">
              <RotateCcw size={13} /> Reset demo data
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Link to="/" className="lg:hidden" aria-label="Home">
                <svg width="32" height="32" viewBox="0 0 64 64" aria-hidden><rect width="64" height="64" rx="16" fill="#0A7F73" /><path d="M20 22a8 8 0 0 1 12 0 8 8 0 0 1 12 0c4 4 3 10-1 14L32 47 21 36c-4-4-5-10-1-14z" fill="none" stroke="#fff" strokeWidth="4" strokeLinejoin="round" /></svg>
              </Link>
              <label className="lg:hidden">
                <span className="sr-only">View as</span>
                <select value={role.role} onChange={(e) => navigate(roles.find((r) => r.role === e.target.value)!.nav[0].to)} className="h-10 rounded-xl border border-line bg-white px-2.5 text-sm font-semibold text-ink">
                  {roles.map((r) => <option key={r.role} value={r.role}>View as: {r.label}{r.soon ? " (soon)" : ""}</option>)}
                </select>
              </label>
              <p className="hidden truncate text-sm text-ink-mute lg:block">
                {new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <InstallButton />
              <div className="relative" ref={bellRef}>
                <button onClick={() => setBell(!bell)} className="relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-ink-soft hover:text-ink focus-ring" aria-label={`Notifications, ${unread} unread`}>
                  <Bell size={18} />
                  {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">{unread}</span>}
                </button>
                {bell && (
                  <div className="absolute right-0 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-line bg-white shadow-lift animate-rise">
                    <div className="flex items-center justify-between border-b border-line px-4 py-3">
                      <p className="font-semibold">Notifications</p>
                      <button onClick={() => dispatch({ type: "readAll", role: role.role })} className="text-xs font-semibold text-brand-700 hover:underline">Mark all read</button>
                    </div>
                    <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto">
                      {notices.length === 0 && <li className="p-6 text-center text-sm text-ink-mute">Nothing yet.</li>}
                      {notices.slice(0, 12).map((n) => (
                        <li key={n.id} className={cx("flex gap-3 px-4 py-3", !n.read && "bg-brand-50/50")}>
                          <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", { ok: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-rose-500", info: "bg-sky2-500" }[n.tone ?? "info"])} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink">{n.title}</p>
                            <p className="text-[13px] text-ink-soft">{n.body}</p>
                            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-ink-mute">{channelLabel(n)} · {ago(n.at)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-1 sm:pr-3">
                <Avatar name={me.name} hue={me.hue} size={36} />
                <div className="hidden leading-tight sm:block">
                  <p className="max-w-[200px] truncate text-sm font-semibold">{me.name}</p>
                  <p className="text-xs text-ink-mute">{me.sub}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 pb-40 pt-6 sm:px-6 lg:pb-12">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      {role.nav.length > 1 && (
        <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 lg:hidden" aria-label="Section">
          <div className="flex items-center gap-1 rounded-full border border-line bg-white/95 p-1.5 shadow-lift backdrop-blur">
            {role.nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end
                aria-label={n.label}
                className={({ isActive }) => cx("flex h-12 min-w-0 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all", isActive ? "flex-[2.2] bg-brand-600 px-3 text-white shadow-sm" : "flex-1 text-ink-mute hover:text-ink")}
              >
                {({ isActive }) => (
                  <>
                    <n.icon size={20} className="shrink-0" />
                    {isActive && <span className="truncate">{shortLabel[n.label] ?? n.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
