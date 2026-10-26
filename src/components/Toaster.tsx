import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cx } from "../lib/format";

type Tone = "ok" | "warn" | "info";
interface Toast {
  id: number;
  key: string;
  text: string;
  tone: Tone;
}

let seq = 0;
const listeners = new Set<(t: Toast) => void>();

// Fire-and-forget confirmation shown the instant an action is taken.
// Toasts with the same key replace each other (e.g. a slider being dragged).
export function toast(text: string, tone: Tone = "ok", key = text) {
  const t = { id: ++seq, key, text, tone };
  listeners.forEach((l) => l(t));
}

const icons = { ok: CheckCircle2, warn: AlertTriangle, info: Info };

export default function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const add = (t: Toast) => {
      setItems((xs) => [...xs.filter((x) => x.key !== t.key), t].slice(-3));
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), 3200);
    };
    listeners.add(add);
    return () => void listeners.delete(add);
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-36 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-24 lg:items-end lg:pr-6">
      {items.map((t) => {
        const Icon = icons[t.tone];
        return (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-lift animate-pop">
            <Icon size={18} className={cx("mt-0.5 shrink-0", { ok: "text-emerald-300", warn: "text-amber-300", info: "text-sky-300" }[t.tone])} />
            <p className="flex-1 font-medium leading-snug">{t.text}</p>
            <button onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))} className="text-white/60 hover:text-white" aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
