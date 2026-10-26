import { Download, MoreVertical, PlusSquare, Share, WifiOff, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "./Toaster";

type Conn = { effectiveType?: string; saveData?: boolean; addEventListener?: (e: string, f: () => void) => void };
const conn = () => (navigator as Navigator & { connection?: Conn }).connection;
const isSlow = () => {
  const c = conn();
  return !!c && (c.saveData === true || ["slow-2g", "2g"].includes(c.effectiveType ?? ""));
};

// Offline banner plus "lite mode" on slow or data-saver connections:
// lite mode turns off animations and blur so taps respond immediately.
export function NetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [slow, setSlow] = useState(isSlow);

  useEffect(() => {
    const on = () => { setOnline(true); toast("Back online", "ok", "net"); };
    const off = () => { setOnline(false); toast("You are offline. The app keeps working", "warn", "net"); };
    const change = () => setSlow(isSlow());
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    conn()?.addEventListener?.("change", change);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("lite", slow || !online);
  }, [slow, online]);

  if (online && !slow) return null;
  return (
    <div role="status" className={online ? "bg-amber-50 text-amber-900" : "bg-ink text-white"}>
      <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-[13px] font-medium">
        {online ? <Zap size={14} className="shrink-0" /> : <WifiOff size={14} className="shrink-0" />}
        {online ? "Slow connection: lite mode is on to save data." : "You are offline. Everything still works and your changes are saved on this device."}
      </p>
    </div>
  );
}

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferred: PromptEvent | undefined;
const subs = new Set<() => void>();
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e as PromptEvent;
  subs.forEach((f) => f());
});

const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isMobile = () => /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || isIOS();

function useInstall() {
  const [, force] = useState(0);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    subs.add(f);
    window.addEventListener("appinstalled", f);
    return () => {
      subs.delete(f);
      window.removeEventListener("appinstalled", f);
    };
  }, []);
  // Chrome/Edge/Android give a real prompt; iPhone and other mobile browsers get instructions.
  const available = !isStandalone() && (!!deferred || isMobile());
  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = undefined;
      force((x) => x + 1);
      if (outcome === "accepted") toast("Installing. Look for it on your home screen", "ok");
    } else setHelp(true);
  };
  return { available, install, help, closeHelp: () => setHelp(false) };
}

function InstallHelp({ onClose }: { onClose: () => void }) {
  const ios = isIOS();
  const steps = ios
    ? [<>Tap the <b>Share</b> button <Share size={15} className="inline align-[-2px]" /> at the bottom of Safari.</>, <>Scroll down and tap <b>Add to Home Screen</b> <PlusSquare size={15} className="inline align-[-2px]" />.</>, <>Tap <b>Add</b>. The app opens from your home screen and works offline.</>]
    : [<>Open your browser menu <MoreVertical size={15} className="inline align-[-2px]" /> (top right).</>, <>Tap <b>Install app</b> or <b>Add to Home screen</b>.</>, <>Confirm. The app opens from your home screen and works offline.</>];
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/50 p-3 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal aria-label="Install the app" onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-lift animate-pop">
        <div className="flex items-center gap-3">
          <img src="/icon-maskable.svg" alt="" className="h-12 w-12 rounded-2xl" />
          <div className="flex-1">
            <p className="font-bold">Install on your phone</p>
            <p className="text-sm text-ink-mute">{ios ? "iPhone and iPad (Safari)" : "Android and other browsers"}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-mute hover:bg-canvas" aria-label="Close"><X size={18} /></button>
        </div>
        <ol className="mt-4 space-y-3">
          {steps.map((st, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-snug"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span><span className="pt-0.5">{st}</span></li>
          ))}
        </ol>
        <button onClick={onClose} className="mt-5 h-11 w-full rounded-xl bg-brand-600 font-semibold text-white hover:bg-brand-700">Got it</button>
      </div>
    </div>
  );
}

export function InstallButton({ className = "" }: { className?: string }) {
  const { available, install, help, closeHelp } = useInstall();
  if (!available) return null;
  return (
    <>
      <button onClick={install} aria-label="Install app" className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-xl border border-brand-200 bg-brand-50 px-2.5 text-sm font-semibold text-brand-800 hover:border-brand-300 focus-ring sm:px-3 ${className}`}>
        <Download size={16} /> <span className="hidden sm:inline">Install app</span>
      </button>
      {help && <InstallHelp onClose={closeHelp} />}
    </>
  );
}

const DISMISS_KEY = "install-banner-dismissed";

// One-time banner on phones, so the install option is obvious without hunting for it.
export function InstallBanner() {
  const inApp = useLocation().pathname.startsWith("/app");
  const { available, install, help, closeHelp } = useInstall();
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(t);
  }, []);
  const dismiss = () => {
    setHidden(true);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
  };
  if (!available || hidden || !ready || !isMobile()) return help ? <InstallHelp onClose={closeHelp} /> : null;
  return (
    <>
      <div className={`fixed left-3 right-20 z-[62] ${inApp ? "bottom-[5.75rem]" : "bottom-5"} flex items-center gap-3 rounded-2xl bg-ink p-3 text-white shadow-lift animate-pop sm:hidden`} role="region" aria-label="Install the app">
        <img src="/icon-maskable.svg" alt="" className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight">Get the app</p>
          <p className="text-xs leading-tight text-white/70">Works offline, even on 2G</p>
        </div>
        <button onClick={install} className="h-9 rounded-xl bg-brand-500 px-3 text-sm font-bold">Install</button>
        <button onClick={dismiss} className="p-1 text-white/60" aria-label="Dismiss"><X size={16} /></button>
      </div>
      {help && <InstallHelp onClose={closeHelp} />}
    </>
  );
}
