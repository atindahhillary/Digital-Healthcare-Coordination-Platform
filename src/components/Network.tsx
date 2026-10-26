import { Download, WifiOff, Zap } from "lucide-react";
import { useEffect, useState } from "react";
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

export function InstallButton({ className = "" }: { className?: string }) {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    subs.add(f);
    return () => void subs.delete(f);
  }, []);
  if (!deferred) return null;
  return (
    <button
      onClick={async () => {
        await deferred?.prompt();
        deferred = undefined;
        force((x) => x + 1);
      }}
      className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink hover:border-brand-300 focus-ring ${className}`}
    >
      <Download size={15} /> Install app
    </button>
  );
}
