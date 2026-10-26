import { Search, SlidersHorizontal, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { BookingModal, SpecialistCard } from "../../components/Booking";
import { Empty, inputCls } from "../../components/ui";
import { COUNTIES, SPECIALTIES, specialists, type Specialist } from "../../data/seed";
import { cx } from "../../lib/format";

export default function FindCare() {
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState("");
  const [county, setCounty] = useState("");
  const [virtualOnly, setVirtualOnly] = useState(false);
  const [sort, setSort] = useState<"punctuality" | "fee" | "rating">("punctuality");
  const [book, setBook] = useState<Specialist>();

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return specialists
      .filter((s) => !spec || s.specialty === spec)
      .filter((s) => !county || s.county === county || (virtualOnly && s.modes.includes("virtual")))
      .filter((s) => !virtualOnly || s.modes.includes("virtual"))
      .filter((s) => !term || [s.name, s.specialty, s.town, s.clinic, ...s.conditions].join(" ").toLowerCase().includes(term))
      .sort((a, b) => (sort === "fee" ? a.fee - b.fee : sort === "rating" ? b.rating - a.rating : b.punctuality - a.punctuality));
  }, [q, spec, county, virtualOnly, sort]);

  return (
    <div className="bg-canvas">
      <section className="border-b border-line bg-white">
        <div className="container-x py-10 sm:py-14">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Find a specialist</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">Clear prices, real availability and each doctor's on-time record. Video consultations reach you anywhere in Kenya.</p>
          <div className="mt-6 grid gap-3 rounded-2xl border border-line bg-white p-3 shadow-card md:grid-cols-[1.5fr_1fr_1fr_auto]">
            <label className="relative">
              <span className="sr-only">Search</span>
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
              <input className={cx(inputCls, "pl-10")} placeholder="Condition, doctor or clinic (e.g. lupus)" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <label>
              <span className="sr-only">Specialty</span>
              <select className={inputCls} value={spec} onChange={(e) => setSpec(e.target.value)}>
                <option value="">All specialties</option>
                {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">County</span>
              <select className={inputCls} value={county} onChange={(e) => setCounty(e.target.value)}>
                <option value="">All counties</option>
                {COUNTIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <button onClick={() => setVirtualOnly(!virtualOnly)} aria-pressed={virtualOnly} className={cx("inline-flex h-[46px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold focus-ring", virtualOnly ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line")}>
              <Video size={16} /> Video only
            </button>
          </div>
        </div>
      </section>
      <section className="container-x py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-mute"><b className="text-ink">{list.length}</b> specialists</p>
          <label className="flex items-center gap-2 text-sm">
            <SlidersHorizontal size={15} className="text-ink-mute" />
            <span className="text-ink-mute">Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-lg border border-line bg-white px-2 py-1.5 font-semibold">
              <option value="punctuality">Most punctual</option>
              <option value="rating">Highest rated</option>
              <option value="fee">Lowest fee</option>
            </select>
          </label>
        </div>
        {list.length === 0 ? (
          <Empty icon={<Search />} title="No specialists match" body="Try another county or turn on video consultations." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((sp) => <SpecialistCard key={sp.id} sp={sp} onBook={() => setBook(sp)} />)}
          </div>
        )}
      </section>
      {book && <BookingModal sp={book} open onClose={() => setBook(undefined)} />}
    </div>
  );
}
