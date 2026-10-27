import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Assistant from "./components/Assistant";
import { InstallBanner, NetworkStatus } from "./components/Network";
import PublicLayout from "./components/PublicLayout";
import Toaster from "./components/Toaster";
import { FEATURES } from "./lib/features";
import { PatientAppointments, PatientCare, PatientHome, PatientProfile, PatientRecord } from "./pages/app/patient";
import Blueprint from "./pages/public/Blueprint";
import Contact from "./pages/public/Contact";
import FindCare from "./pages/public/FindCare";
import Home from "./pages/public/Home";
import Partners from "./pages/public/Partners";
import Pathways from "./pages/public/Pathways";
import ProviderProfile from "./pages/public/ProviderProfile";
import Trust from "./pages/public/Trust";

// Portals with charts, and the focused pages, load on demand so the public site stays light on mobile data.
const admin = () => import("./pages/app/admin");
const AdminHome = lazy(() => admin().then((m) => ({ default: m.AdminHome })));
const AdminReliability = lazy(() => admin().then((m) => ({ default: m.AdminReliability })));
const AdminProviders = lazy(() => admin().then((m) => ({ default: m.AdminProviders })));
const AdminSettings = lazy(() => admin().then((m) => ({ default: m.AdminSettings })));
const AdminAudit = lazy(() => admin().then((m) => ({ default: m.AdminAudit })));
const specialist = () => import("./pages/app/specialist");
const SpecialistHome = lazy(() => specialist().then((m) => ({ default: m.SpecialistHome })));
const SpecialistPerformance = lazy(() => specialist().then((m) => ({ default: m.SpecialistPerformance })));
const LabPortal = lazy(() => import("./pages/app/lab"));
const PharmacyPortal = lazy(() => import("./pages/app/pharmacy"));
const OrgPortal = lazy(() => import("./pages/app/org"));
const ComingSoon = lazy(() => import("./pages/app/ComingSoon"));
const register = () => import("./pages/public/Register");
const Register = lazy(register);
const Room = lazy(() => import("./pages/Room"));

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

// Warm the live portals in the background once the first page is up, so switching
// roles never waits on the network. Modules that are switched off are not fetched.
function usePrefetch() {
  useEffect(() => {
    const jobs = [admin, specialist, register, () => import("./pages/app/org")];
    if (FEATURES.lab) jobs.push(() => import("./pages/app/lab"));
    if (FEATURES.pharmacy) jobs.push(() => import("./pages/app/pharmacy"));
    const go = () => jobs.forEach((f) => f().catch(() => {}));
    const w = window as Window & { requestIdleCallback?: (f: () => void) => void };
    if (w.requestIdleCallback) w.requestIdleCallback(go);
    else setTimeout(go, 1500);
  }, []);
}

export default function App() {
  usePrefetch();
  const { pathname } = useLocation();
  const focus = /^\/(register|room)(\/|$)/.test(pathname); // full-screen flows keep the bottom of the screen clear
  return (
    <>
      <ScrollTop />
      <NetworkStatus />
      <Toaster />
      {!focus && <Assistant />}
      {!focus && <InstallBanner />}
      <Suspense fallback={<div className="grid min-h-[50vh] place-items-center text-sm text-ink-mute">Loading…</div>}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="find-care" element={<FindCare />} />
            <Route path="specialists/:id" element={<ProviderProfile />} />
            <Route path="care-pathways" element={<Pathways />} />
            <Route path="trust" element={<Trust />} />
            <Route path="partners" element={<Partners />} />
            <Route path="contact" element={<Contact />} />
            <Route path="blueprint" element={<Blueprint />} />
          </Route>
          <Route path="register" element={<Register />} />
          <Route path="room/:code" element={<Room />} />
          <Route path="app" element={<AppLayout />}>
            <Route index element={<Navigate to="patient" replace />} />
            <Route path="patient" element={<PatientHome />} />
            <Route path="patient/appointments" element={<PatientAppointments />} />
            <Route path="patient/record" element={<PatientRecord />} />
            <Route path="patient/records" element={<Navigate to="/app/patient/record" replace />} />
            <Route path="patient/care" element={<PatientCare />} />
            <Route path="patient/profile" element={<PatientProfile />} />
            <Route path="specialist" element={<SpecialistHome />} />
            <Route path="specialist/performance" element={<SpecialistPerformance />} />
            <Route path="lab" element={FEATURES.lab ? <LabPortal /> : <ComingSoon module="lab" />} />
            <Route path="pharmacy" element={FEATURES.pharmacy ? <PharmacyPortal /> : <ComingSoon module="pharmacy" />} />
            <Route path="org" element={<OrgPortal />} />
            <Route path="admin" element={<AdminHome />} />
            <Route path="admin/reliability" element={<AdminReliability />} />
            <Route path="admin/providers" element={<AdminProviders />} />
            <Route path="admin/settings" element={<AdminSettings />} />
            <Route path="admin/audit" element={<AdminAudit />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
