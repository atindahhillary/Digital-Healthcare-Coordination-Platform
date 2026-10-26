import { Check, FlaskConical, Pause, Pill, Play, RefreshCw, Stethoscope, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cx } from "../lib/format";

// The four services shown as one connected journey. The flow plays itself:
// each step ticks through what happens behind the scenes, then hands over to
// the next provider. Pauses on hover, off screen, or when motion is reduced.

const steps = [
  {
    to: "/find-care", img: "/img/svc-specialist.webp", icon: Stethoscope, short: "Find", t: "Find a specialist", b: "Verified doctors, real on-time records",
    sub: ["Search “lupus” near you", "Compare fees and on-time %", "Dr Amina chosen"],
  },
  {
    to: "/find-care?mode=virtual", img: "/img/svc-consult.webp", icon: Video, short: "Consult", t: "Book a consultation", b: "Video or in person, at a time that suits you",
    sub: ["Slot picked, paid by M-Pesa", "Doctor confirms readiness", "Consultation done, tests ordered"],
  },
  {
    to: "/app/patient/records", img: "/img/svc-lab.webp", icon: FlaskConical, short: "Test", t: "Lab tests", b: "Home sample collection, results to your phone",
    sub: ["Order arrives at the lab", "Sample collected at home", "Results sent to you and your doctor"],
  },
  {
    to: "/app/patient/records", img: "/img/svc-pharmacy.webp", icon: Pill, short: "Medicines", t: "Pharmacy", b: "E-prescriptions, refills and delivery",
    sub: ["E-prescription received", "Pharmacist verifies stock", "Delivered to your door"],
  },
];

const TICKS_PER_STEP = 4; // three sub-steps plus a beat to read the last one
const TICK_MS = 1100;

export default function CareFlow() {
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [tick, setTick] = useState(reduce ? TICKS_PER_STEP * steps.length - 1 : 0);
  const [playing, setPlaying] = useState(!reduce);
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || hover || !visible) return;
    const t = setInterval(() => {
      if (document.hidden) return;
      setTick((x) => (x + 1) % (TICKS_PER_STEP * steps.length));
    }, TICK_MS);
    return () => clearInterval(t);
  }, [playing, hover, visible]);

  const active = Math.floor(tick / TICKS_PER_STEP);
  const sub = tick % TICKS_PER_STEP; // 0..3: number of sub-steps completed in the active step
  const finished = active === steps.length - 1 && sub === TICKS_PER_STEP - 1;
  const fill = ((active + sub / (TICKS_PER_STEP - 1)) / (steps.length - 1)) * 100;
  const go = (i: number) => setTick(i * TICKS_PER_STEP);

  return (
    <div ref={ref} className="mt-6" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-700">How your care flows</p>
        <button onClick={() => setPlaying(!playing)} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-xs font-semibold text-ink-soft hover:text-ink" aria-label={playing ? "Pause the flow" : "Play the flow"}>
          {playing ? <Pause size={13} /> : <Play size={13} />} {playing ? "Pause" : "Play"}
        </button>
      </div>

      {/* Track */}
      <div className="relative mt-4 px-4 sm:px-[12.5%]">
        <div className="absolute left-[calc(1rem+18px)] right-[calc(1rem+18px)] top-[18px] h-1 rounded-full bg-line sm:left-[calc(12.5%+18px)] sm:right-[calc(12.5%+18px)]">
          <div className="relative h-full rounded-full bg-gradient-to-r from-brand-500 to-sky2-500 transition-[width] duration-1000 ease-linear" style={{ width: `${Math.min(100, fill)}%` }}>
            <span className="absolute -right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-sky2-500 shadow-[0_0_0_6px_rgba(47,124,246,0.18)]" />
          </div>
        </div>
        <ol className="relative flex justify-between">
          {steps.map((s, i) => {
            const done = i < active || (i === active && sub === TICKS_PER_STEP - 1);
            const on = i === active;
            return (
              <li key={s.t} className="flex w-9 flex-col items-center">
                <button
                  onClick={() => go(i)}
                  aria-label={`Step ${i + 1}: ${s.t}`}
                  aria-current={on ? "step" : undefined}
                  className={cx(
                    "grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-bold transition-all duration-300",
                    done ? "border-brand-500 bg-brand-500 text-white" : on ? "scale-110 border-brand-500 bg-white text-brand-700 animate-pulse-soft" : "border-line bg-white text-ink-mute",
                  )}
                >
                  {done ? <Check size={16} strokeWidth={3} /> : i + 1}
                </button>
                <span className={cx("mt-1.5 whitespace-nowrap text-[11px] font-semibold sm:text-xs", on ? "text-brand-700" : "text-ink-mute")}>{s.short}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className={cx("mx-auto mt-3 flex h-8 w-fit items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all duration-500", finished ? "bg-emerald-50 text-emerald-800 opacity-100" : "opacity-0")} aria-hidden={!finished}>
        <RefreshCw size={13} /> Next review auto-booked in 12 weeks. The loop starts again.
      </div>

      {/* Cards */}
      <div className="mt-2 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {steps.map((s, i) => {
          const on = i === active;
          const past = i < active;
          const doneCount = past ? 3 : on ? sub : 0;
          return (
            <Link
              key={s.t}
              to={s.to}
              onMouseEnter={() => go(i)}
              className={cx(
                "group relative flex flex-col overflow-hidden rounded-3xl border bg-white p-2 transition-all duration-500 focus-ring",
                on ? "-translate-y-1 border-brand-300 shadow-lift ring-2 ring-brand-500/70" : "border-line shadow-card",
                !on && !past && "opacity-80",
              )}
            >
              <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-canvas">
                <img src={s.img} alt="" loading="lazy" decoding="async" className={cx("h-full w-full object-cover transition duration-700", on ? "scale-105" : "scale-100 group-hover:scale-105", !on && !past && "grayscale-[35%]")} />
                <span className={cx("absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm", on ? "bg-brand-600 text-white" : past ? "bg-white text-brand-700" : "bg-white/90 text-ink-mute")}>
                  {past ? "✓ Done" : `Step ${i + 1}`}
                </span>
                {on && (
                  <span key={`${i}-${sub}`} className="absolute inset-x-2 bottom-2 flex items-center gap-1.5 rounded-xl bg-ink/80 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur animate-pop sm:text-xs">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    <span className="line-clamp-2 leading-tight">{s.sub[Math.min(sub, 2)]}</span>
                  </span>
                )}
              </span>
              <span className="flex flex-1 flex-col px-2 pb-2 pt-3">
                <s.icon size={20} className={on || past ? "text-brand-600" : "text-ink-mute"} />
                <span className="mt-1.5 block font-bold leading-tight text-ink sm:text-lg">{s.t}</span>
                <span className="mt-1 block text-[13px] leading-snug text-ink-mute">{s.b}</span>
                <ul className="mt-3 hidden space-y-1.5 sm:block">
                  {s.sub.map((x, j) => {
                    const ok = j < doneCount;
                    const now = on && j === sub;
                    return (
                      <li key={x} className={cx("flex items-center gap-2 text-[13px] transition-colors duration-300", ok ? "text-ink" : now ? "font-semibold text-brand-700" : "text-ink-mute/70")}>
                        <span className={cx("grid h-4 w-4 shrink-0 place-items-center rounded-full transition-all duration-300", ok ? "bg-brand-500 text-white" : now ? "border-2 border-brand-500" : "border border-line")}>
                          {ok && <Check size={10} strokeWidth={3.5} />}
                        </span>
                        {x}
                      </li>
                    );
                  })}
                </ul>
                <span className="mt-auto block pt-3">
                  <span className="block h-1 overflow-hidden rounded-full bg-canvas">
                    <span className="block h-full rounded-full bg-brand-500 transition-[width] duration-1000 ease-linear" style={{ width: `${(doneCount / 3) * 100}%` }} />
                  </span>
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
