import { X } from "lucide-react";
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx, initials } from "../lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "warn";

export function Button({ variant = "primary", size = "md", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  const v: Record<Variant, string> = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
    secondary: "bg-white text-ink border border-line hover:border-brand-300 hover:bg-brand-50",
    ghost: "text-ink-soft hover:bg-canvas hover:text-ink",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    warn: "bg-amber-500 text-white hover:bg-amber-600",
  };
  const s = { sm: "h-9 px-3 text-sm", md: "h-11 px-4 text-sm", lg: "h-12 px-6 text-base" }[size];
  return <button {...p} className={cx("inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-50 disabled:pointer-events-none focus-ring", v[variant], s, className)} />;
}

export function Card({ className, children, ...p }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...p} className={cx("min-w-0 rounded-2xl border border-line bg-white shadow-card", className)}>
      {children}
    </div>
  );
}

export function CardHead({ title, action, sub }: { title: ReactNode; action?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
        {sub && <p className="mt-0.5 text-sm text-ink-mute">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

const tones = {
  ok: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  warn: "bg-amber-50 text-amber-800 ring-amber-600/20",
  bad: "bg-rose-50 text-rose-700 ring-rose-600/15",
  info: "bg-sky2-50 text-sky2-700 ring-sky2-600/15",
  neutral: "bg-slate-100 text-slate-700 ring-slate-500/10",
  brand: "bg-brand-50 text-brand-700 ring-brand-600/15",
};
export type Tone = keyof typeof tones;

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", tones[tone], className)}>{children}</span>;
}

export function Avatar({ name, hue = 168, size = 40 }: { name: string; hue?: number; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(135deg, hsl(${hue} 60% 45%), hsl(${(hue + 40) % 360} 65% 38%))` }}
    >
      {initials(name)}
    </span>
  );
}

export function Stat({ label, value, sub, icon, tone = "brand" }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; tone?: "brand" | "sky" | "amber" | "rose" | "violet" }) {
  const t = { brand: "bg-brand-50 text-brand-700", sky: "bg-sky2-50 text-sky2-600", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-600", violet: "bg-violet-50 text-violet-700" }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        {icon && <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-xl", t)}>{icon}</span>}
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-mute">{label}</p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-ink">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-ink-mute">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal aria-label={title} onClick={(e) => e.stopPropagation()} className={cx("max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-lift sm:rounded-3xl animate-rise", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-5 py-4 backdrop-blur">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-mute hover:bg-canvas focus-ring" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ icon, title, body }: { icon: ReactNode; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-canvas text-ink-mute">{icon}</span>
      <p className="mt-3 font-semibold text-ink">{title}</p>
      {body && <p className="mt-1 max-w-xs text-sm text-ink-mute">{body}</p>}
    </div>
  );
}

export function PageTitle({ title, sub, action }: { title: string; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{title}</h1>
        {sub && <p className="mt-1 text-ink-mute">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; count?: number }[] }) {
  return (
    <div role="tablist" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-canvas p-1 no-scrollbar">
      {items.map((i) => (
        <button
          key={i.value}
          role="tab"
          aria-selected={value === i.value}
          onClick={() => onChange(i.value)}
          className={cx("whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition focus-ring", value === i.value ? "bg-white text-ink shadow-sm" : "text-ink-mute hover:text-ink")}
        >
          {i.label}
          {i.count !== undefined && <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 text-xs text-brand-800">{i.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-mute">{hint}</span>}
    </label>
  );
}

export const inputCls = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-mute/70 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100";

export function Progress({ value, tone = "brand" }: { value: number; tone?: "brand" | "amber" | "rose" }) {
  const c = { brand: "bg-brand-500", amber: "bg-amber-500", rose: "bg-rose-500" }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
      <div className={cx("h-full rounded-full transition-all", c)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
