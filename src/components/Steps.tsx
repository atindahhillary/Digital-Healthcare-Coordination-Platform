import { cx } from "../lib/format";
import type { LabStatus, RxStatus } from "../store/store";

export const labSteps: { s: LabStatus; l: string }[] = [
  { s: "requested", l: "Ordered" },
  { s: "booked", l: "Collection booked" },
  { s: "sample_collected", l: "Collected" },
  { s: "processing", l: "Processing" },
  { s: "result_ready", l: "Results" },
];

export const rxSteps: { s: RxStatus; l: string }[] = [
  { s: "received", l: "Received" },
  { s: "verified", l: "Verified" },
  { s: "ready", l: "Packed" },
  { s: "out_for_delivery", l: "On the way" },
  { s: "delivered", l: "Delivered" },
];

// What the patient sees while pharmacies are not yet connected: they hold the prescription.
export const rxHeldSteps: { s: RxStatus; l: string }[] = [
  { s: "issued", l: "Issued" },
  { s: "shared", l: "Pharmacy chosen" },
  { s: "collected", l: "Collected" },
];

export function MiniSteps<T extends string>({ steps, current }: { steps: { s: T; l: string }[]; current: T }) {
  const idx = steps.findIndex((x) => x.s === current);
  return (
    <ol className="flex gap-1.5">
      {steps.map((x, i) => (
        <li key={x.s} className="min-w-0 flex-1">
          <div className={cx("h-1.5 rounded-full", i <= idx ? "bg-brand-500" : "bg-line")} />
          <p className={cx("mt-1 truncate text-[10px] font-semibold sm:text-[11px]", i <= idx ? "text-brand-700" : "text-ink-mute")}>{x.l}</p>
        </li>
      ))}
    </ol>
  );
}
