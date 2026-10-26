import { ArrowUp, Bot, CalendarClock, MessageCircle, Phone, Siren, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { byId, pathways, SPECIALTIES, specialists } from "../data/seed";
import { cx, dateTime, kes } from "../lib/format";
import { useStore, type State } from "../store/store";
import { nextSlot } from "./Booking";
import { Avatar } from "./ui";

// Rule-based care assistant. It runs entirely on the device (works offline,
// sends nothing to an AI service) and never gives medical advice: symptoms are
// routed to emergency services, a specialist or a human coordinator.

type Lang = "en" | "sw";
interface Msg {
  id: number;
  from: "bot" | "me";
  text?: string;
  card?: ReactNode;
  chips?: string[];
}

const T = {
  hello: {
    en: "Hi, I'm your care assistant. I can check your appointments, results and refills, find a specialist, or connect you to a person.",
    sw: "Habari, mimi ni msaidizi wako wa huduma. Naweza kuangalia miadi, majibu ya vipimo na dawa zako, kukutafutia daktari, au kukuunganisha na mtu.",
  },
  menu: {
    en: ["My next appointment", "Find a specialist", "Lab results", "Refill my medicine", "My doctor is late", "Talk to a person", "Kiswahili"],
    sw: ["Miadi yangu ijayo", "Tafuta daktari", "Majibu ya vipimo", "Ongeza dawa", "Daktari amechelewa", "Ongea na mtu", "English"],
  },
  emergency: {
    en: "This sounds like it could be an emergency. Please call 999 or 112 now, or go to the nearest emergency unit. Do not wait for an appointment.",
    sw: "Hii inaweza kuwa dharura. Tafadhali piga 999 au 112 sasa, au nenda kituo cha dharura kilicho karibu. Usisubiri miadi.",
  },
  noAdvice: {
    en: "I can't give medical advice, but I can get you to someone who can. For new or worsening symptoms, book your specialist or ask a coordinator to call you.",
    sw: "Siwezi kutoa ushauri wa kitabibu, lakini naweza kukuunganisha na anayeweza. Kwa dalili mpya au zinazozidi, weka miadi na daktari au omba mratibu akupigie.",
  },
  unknown: {
    en: "Sorry, I didn't catch that. Try one of these:",
    sw: "Samahani, sijaelewa. Jaribu mojawapo ya haya:",
  },
  human: {
    en: "A care coordinator can call you back, usually within 30 minutes during opening hours.",
    sw: "Mratibu wa huduma anaweza kukupigia, kwa kawaida ndani ya dakika 30 wakati wa saa za kazi.",
  },
  callback: { en: "Done. Wanjiku, your coordinator, will call you shortly. (Demo)", sw: "Sawa. Wanjiku, mratibu wako, atakupigia hivi karibuni. (Majaribio)" },
  noAppt: { en: "You have no upcoming appointments. Want to book one?", sw: "Huna miadi ijayo. Ungependa kuweka miadi?" },
  late: {
    en: "If your doctor is running late you will get an SMS straight away. Up to 20 minutes, we tell you the new time. Longer than that, you choose: wait, see another verified specialist, reschedule free, or get a full refund.",
    sw: "Daktari akichelewa utapata SMS mara moja. Hadi dakika 20 tunakupa muda mpya. Zaidi ya hapo unachagua: kusubiri, kumwona daktari mwingine, kubadilisha muda bila malipo, au kurudishiwa pesa zote.",
  },
  refillDone: { en: "Refill requested. Your pharmacy will confirm stock and price shortly.", sw: "Ombi la dawa limetumwa. Duka la dawa litathibitisha hivi karibuni." },
  privacy: {
    en: "Only you and the doctors you choose can see your notes and results. Labs and pharmacies see only what they handle. Patient groups never see medical records. You can change this any time in Records & privacy.",
    sw: "Ni wewe na madaktari unaowachagua tu wanaoona maelezo na majibu yako. Maabara na maduka ya dawa huona tu wanachoshughulikia. Vikundi vya wagonjwa haviwezi kuona rekodi za matibabu.",
  },
  pay: {
    en: "You pay by M-Pesa when you book, with no booking fee. Cancel at least 12 hours ahead for a full refund. Insurance and SHA claims are coming in a later phase.",
    sw: "Unalipa kwa M-Pesa unapoweka miadi, bila ada ya ziada. Ghairi saa 12 kabla ili urudishiwe pesa zote. Bima na SHA zitaongezwa baadaye.",
  },
  switched: { en: "Sawa! Nitaendelea kwa Kiswahili.", sw: "Okay, I'll continue in English." },
};

const EMERGENCY = /(chest pain|can'?t breathe|cannot breathe|difficulty breathing|unconscious|fainted|seizure|\bfits?\b|stroke|heavy bleeding|suicid|kill myself|overdose|collapsed|dharura|kifua kinauma|siwezi kupumua|kuzimia|degedege)/;
const SYMPTOM = /(pain|fever|rash|swelling|swollen|headache|tired|vomit|dizzy|cough|symptom|homa|maumivu|uvimbe|kichwa|kutapika|should i take|dose|side effect)/;

function match(text: string) {
  const t = text.toLowerCase();
  if (EMERGENCY.test(t)) return "emergency";
  if (/kiswahili|swahili/.test(t)) return "sw";
  if (/^english$|in english/.test(t)) return "en";
  if (/late|delay|chelew|not showing|no show|hajafika/.test(t)) return "late";
  if (/next appointment|my appointment|when is|miadi yangu|miadi ijayo|upcoming/.test(t)) return "next";
  if (/refill|medicine|medication|drug|pharmacy|ongeza dawa|dawa/.test(t)) return "refill";
  if (/result|lab|test|kipimo|vipimo|majibu/.test(t)) return "results";
  if (/cancel|reschedul|change.*time|ghairi|badilisha/.test(t)) return "change";
  if (/person|human|coordinator|call me|callback|agent|ongea na mtu|mratibu|nipigie/.test(t)) return "human";
  if (/privacy|who can see|data|consent|faragha|siri/.test(t)) return "privacy";
  if (/pay|m-?pesa|price|cost|fee|sha|insurance|bima|bei|lipa/.test(t)) return "pay";
  if (/book|find|specialist|doctor|daktari|tafuta|weka miadi/.test(t) || SPECIALTIES.some((s) => t.includes(s.toLowerCase()))) return "find";
  if (/lupus|diabetes|hypertension|blood pressure|kidney|pathway|care plan|kisukari|shinikizo|figo/.test(t)) return "pathway";
  if (SYMPTOM.test(t)) return "symptom";
  if (/^(hi|hello|hey|habari|jambo|mambo|niaje|help|msaada|menu)\b/.test(t)) return "hello";
  if (/thank|asante/.test(t)) return "thanks";
  return "unknown";
}

function nextAppt(s: State) {
  return s.appointments
    .filter((a) => a.patientId === s.patientId && ["confirmed", "ready", "delayed", "recovery", "in_consult"].includes(a.status))
    .sort((a, b) => +new Date(a.at) - +new Date(b.at))[0];
}

export default function Assistant() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const idRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const push = (m: Omit<Msg, "id">) => setMsgs((xs) => [...xs, { ...m, id: ++idRef.current }]);
  const go = (to: string) => { navigate(to); if (window.innerWidth < 640) setOpen(false); };

  useEffect(() => {
    if (open && msgs.length === 0) push({ from: "bot", text: T.hello[lang], chips: T.menu[lang] });
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [msgs, typing]);

  function reply(intent: string, raw: string, l: Lang) {
    const menu = T.menu[l];
    switch (intent) {
      case "emergency":
        return push({
          from: "bot",
          card: (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-900">
              <p className="flex items-center gap-2 font-bold"><Siren size={16} /> {l === "sw" ? "Dharura" : "Emergency"}</p>
              <p className="mt-1">{T.emergency[l]}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href="tel:999" className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white">Call 999</a>
                <a href="tel:112" className="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white">Call 112</a>
                <a href="tel:1199" className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 font-semibold">Red Cross 1199</a>
              </div>
            </div>
          ),
        });
      case "sw":
      case "en": {
        const nl = intent as Lang;
        setLang(nl);
        return push({ from: "bot", text: T.switched[nl === "sw" ? "en" : "sw"], chips: T.menu[nl] });
      }
      case "hello":
        return push({ from: "bot", text: T.hello[l], chips: menu });
      case "thanks":
        return push({ from: "bot", text: l === "sw" ? "Karibu! Kuna kingine?" : "You're welcome. Anything else?", chips: menu.slice(0, 4) });
      case "next": {
        const a = nextAppt(state);
        if (!a) return push({ from: "bot", text: T.noAppt[l], chips: [menu[1]] });
        const sp = byId(specialists, a.specialistId)!;
        const status = { confirmed: l === "sw" ? "Imethibitishwa" : "Confirmed", ready: l === "sw" ? "Daktari yuko tayari" : "Doctor is ready", delayed: l === "sw" ? "Amechelewa kidogo" : "Running late", recovery: l === "sw" ? "Chagua hatua inayofuata" : "Action needed: choose an option", in_consult: l === "sw" ? "Mashauriano yanaendelea" : "In consultation" }[a.status as "confirmed"];
        return push({
          from: "bot",
          card: (
            <div className="rounded-2xl border border-line bg-white p-3.5 text-sm">
              <div className="flex items-center gap-3">
                <Avatar name={sp.name} hue={sp.hue} size={36} />
                <div className="min-w-0"><p className="truncate font-bold">{sp.name}</p><p className="text-xs text-ink-mute">{a.reason}</p></div>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-ink-soft"><CalendarClock size={14} /> {dateTime(a.at)} · {a.mode === "virtual" ? "Video" : sp.town}</p>
              <p className={cx("mt-1 font-semibold", a.status === "recovery" ? "text-rose-700" : a.status === "ready" ? "text-emerald-700" : "text-ink")}>{status}</p>
              <button onClick={() => go("/app/patient")} className="mt-3 w-full rounded-lg bg-brand-600 py-2 font-semibold text-white">{l === "sw" ? "Fungua miadi" : "Open appointment"}</button>
            </div>
          ),
        });
      }
      case "late": {
        const a = nextAppt(state);
        push({ from: "bot", text: T.late[l] });
        if (a?.status === "recovery") push({ from: "bot", text: l === "sw" ? "Miadi yako ya leo inahitaji uamuzi wako sasa." : "Your appointment today needs your choice right now.", chips: [menu[0]] });
        else if (a?.status === "delayed") push({ from: "bot", text: l === "sw" ? `Daktari wako amechelewa dakika ${a.delayMin}.` : `Your doctor is running ${a.delayMin} minutes late. You can still reschedule free.`, chips: [menu[0]] });
        return;
      }
      case "find": {
        const t = raw.toLowerCase();
        const spec = SPECIALTIES.find((s) => t.includes(s.toLowerCase()) || t.includes(s.toLowerCase().slice(0, 6)));
        const cond = /lupus/.test(t) ? "Lupus" : /diabet|kisukari/.test(t) ? "diabetes" : /kidney|figo/.test(t) ? "kidney" : /pressure|hypert|shinikizo/.test(t) ? "Hypertension" : undefined;
        const list = specialists
          .filter((s) => s.verified)
          .filter((s) => (!spec || s.specialty === spec) && (!cond || s.conditions.some((c) => c.toLowerCase().includes(cond.toLowerCase()))))
          .sort((a, b) => b.punctuality - a.punctuality)
          .slice(0, 3);
        if (!spec && !cond) return push({ from: "bot", text: l === "sw" ? "Unahitaji daktari wa aina gani?" : "Which kind of specialist do you need?", chips: ["Rheumatology", "Nephrology", "Endocrinology", "Cardiology", "Psychiatry"] });
        if (!list.length) return push({ from: "bot", text: l === "sw" ? "Sijapata daktari. Jaribu orodha kamili." : "No match yet. Try the full directory.", chips: [menu[1]] });
        push({ from: "bot", text: l === "sw" ? "Hawa ndio wanaofika kwa wakati zaidi:" : "Here are the most punctual matches:" });
        return push({
          from: "bot",
          card: (
            <div className="space-y-2">
              {list.map((s) => {
                const slot = nextSlot(s);
                return (
                  <button key={s.id} onClick={() => go(`/specialists/${s.id}`)} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-3 text-left text-sm hover:border-brand-300">
                    <Avatar name={s.name} hue={s.hue} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{s.name}</span>
                      <span className="block text-xs text-ink-mute">{s.specialty} · {s.punctuality}% on time · from {kes(Math.min(s.fee, s.virtualFee || s.fee))}</span>
                      {slot && <span className="block text-xs text-brand-700">Next: {dateTime(slot)}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          ),
        });
      }
      case "refill": {
        const rx = state.prescriptions.find((p) => p.patientId === state.patientId && p.nextRefill);
        const open = state.prescriptions.find((p) => p.patientId === state.patientId && p.status !== "delivered");
        if (!rx && open) return push({ from: "bot", text: l === "sw" ? `Oda yako ya ${open.items[0].drug} inashughulikiwa.` : `Your ${open.items.map((i) => i.drug).join(", ")} order is in progress (${open.status.replace(/_/g, " ")}).`, chips: [menu[5]] });
        if (!rx) return push({ from: "bot", text: l === "sw" ? "Huna dawa ya kuongeza sasa." : "You have no refills due right now." });
        return push({
          from: "bot",
          card: (
            <div className="rounded-2xl border border-line bg-white p-3.5 text-sm">
              <p className="font-bold">{rx.items.map((i) => i.drug).join(", ")}</p>
              <p className="text-xs text-ink-mute">{l === "sw" ? "Inahitajika" : "Due"} {dateTime(rx.nextRefill!)} · {rx.refillsLeft} {l === "sw" ? "zimebaki" : "refills left"}</p>
              <button
                onClick={() => { dispatch({ type: "refill", id: rx.id }); push({ from: "bot", text: T.refillDone[l] }); }}
                className="mt-3 w-full rounded-lg bg-brand-600 py-2 font-semibold text-white"
              >
                {l === "sw" ? "Omba dawa sasa" : "Request refill now"}
              </button>
            </div>
          ),
        });
      }
      case "results": {
        const orders = state.labOrders.filter((o) => o.patientId === state.patientId);
        const pending = orders.find((o) => o.status !== "result_ready");
        const done = orders.find((o) => o.status === "result_ready");
        const lines = [
          pending && (l === "sw" ? `${pending.tests.join(", ")}: bado yanashughulikiwa (${pending.status.replace(/_/g, " ")}). Tutakutumia SMS yakiwa tayari.` : `${pending.tests.join(", ")}: still ${pending.status.replace(/_/g, " ")}. We'll SMS you when they're ready.`),
          done && (l === "sw" ? `Majibu ya mwisho yalitoka ${dateTime(done.releasedAt!)}.` : `Your last results were released ${dateTime(done.releasedAt!)}${done.results?.some((r) => r.flag) ? ". Some values are flagged for your doctor to discuss with you" : ""}.`),
        ].filter(Boolean) as string[];
        push({ from: "bot", text: lines.join(" ") || (l === "sw" ? "Hakuna vipimo." : "No lab orders yet.") });
        return push({ from: "bot", card: <button onClick={() => go("/app/patient/records")} className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold">{l === "sw" ? "Fungua majibu" : "Open my results"}</button> });
      }
      case "change":
        return push({ from: "bot", text: l === "sw" ? "Fungua miadi yako na ubonyeze 'Reschedule' au 'Cancel'. Kughairi saa 12 kabla ni bure." : `Open the appointment and tap Reschedule or Cancel. Cancelling ${state.rules.freeCancelHours} h or more ahead is free.`, chips: [menu[0]] });
      case "human":
        return push({
          from: "bot",
          text: T.human[l],
          card: (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => push({ from: "bot", text: T.callback[l] })} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white"><Phone size={14} /> {l === "sw" ? "Nipigie" : "Call me back"}</button>
              <button onClick={() => go("/contact")} className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold">{l === "sw" ? "Ukurasa wa msaada" : "Help page"}</button>
            </div>
          ),
        });
      case "privacy":
        return push({ from: "bot", text: T.privacy[l], chips: [l === "sw" ? "Ongea na mtu" : "Talk to a person"] });
      case "pay":
        return push({ from: "bot", text: T.pay[l] });
      case "pathway": {
        const t = raw.toLowerCase();
        const p = pathways.find((x) => t.includes(x.short.toLowerCase().split(" ")[0])) ?? (/kisukari/.test(t) ? pathways[1] : /figo/.test(t) ? pathways[3] : /shinikizo|pressure/.test(t) ? pathways[2] : pathways[0]);
        return push({
          from: "bot",
          card: (
            <div className="rounded-2xl border border-line bg-white p-3.5 text-sm">
              <p className="font-bold">{p.name}</p>
              <p className="mt-1 text-ink-soft">{p.summary}</p>
              <ul className="mt-2 space-y-0.5 text-xs text-ink-soft">{p.steps.map((s) => <li key={s.label}>• {s.label}</li>)}</ul>
              <p className="mt-2 text-xs font-semibold text-rose-700">{l === "sw" ? "Dalili za hatari: piga 999" : "Get urgent help for"}: {p.redFlags[0].toLowerCase()}…</p>
              <button onClick={() => go("/care-pathways")} className="mt-3 w-full rounded-lg border border-line py-2 font-semibold">{l === "sw" ? "Soma zaidi" : "See the full pathway"}</button>
            </div>
          ),
        });
      }
      case "symptom":
        return push({ from: "bot", text: T.noAdvice[l], chips: [menu[5], menu[1], l === "sw" ? "Dharura" : "It's an emergency"] });
      default:
        return push({ from: "bot", text: T.unknown[l], chips: menu.slice(0, 6) });
    }
  }

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    setInput("");
    push({ from: "me", text: t });
    const intent = t === "It's an emergency" || t === "Dharura" ? "emergency" : match(t);
    // Emergencies answer instantly; everything else gets a brief "typing" beat.
    if (intent === "emergency") return reply(intent, t, lang);
    setTyping(true);
    setTimeout(() => { setTyping(false); reply(intent, t, lang); }, 280);
  }

  const lastChips = [...msgs].reverse().find((m) => m.chips)?.chips;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close assistant" : "Open care assistant"}
        aria-expanded={open}
        className={cx("fixed bottom-20 right-4 z-[65] grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-lift hover:bg-brand-700 focus-ring lg:bottom-6 lg:right-6", !open && "animate-pulse-soft")}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
      {open && (
        <section
          role="dialog"
          aria-label="Care assistant"
          className="fixed inset-x-2 bottom-36 top-16 z-[64] flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-lift animate-pop sm:inset-x-auto sm:right-6 sm:top-auto sm:h-[600px] sm:max-h-[calc(100vh-8rem)] sm:w-[380px] lg:bottom-24"
        >
          <header className="flex items-center gap-3 bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15"><Bot size={18} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight">{lang === "sw" ? "Msaidizi wa huduma" : "Care assistant"}</p>
              <p className="text-xs text-white/80">{lang === "sw" ? "Inafanya kazi hata bila mtandao" : "Works offline · not for emergencies"}</p>
            </div>
            <button onClick={() => send(lang === "sw" ? "English" : "Kiswahili")} className="rounded-lg bg-white/15 px-2 py-1 text-xs font-bold hover:bg-white/25">{lang === "sw" ? "EN" : "SW"}</button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto bg-canvas px-3 py-4" aria-live="polite">
            {msgs.map((m) => (
              <div key={m.id} className={cx("flex", m.from === "me" ? "justify-end" : "justify-start")}>
                <div className={cx("max-w-[88%] space-y-2", m.from === "me" && "text-right")}>
                  {m.text && <p className={cx("inline-block rounded-2xl px-3.5 py-2.5 text-left text-sm leading-snug", m.from === "me" ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-white text-ink shadow-card")}>{m.text}</p>}
                  {m.card}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-1 rounded-2xl bg-white px-3.5 py-3 shadow-card" style={{ width: 56 }} aria-label="Assistant is typing">
                {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-mute" style={{ animationDelay: `${i * 120}ms` }} />)}
              </div>
            )}
            <div ref={endRef} />
          </div>
          {lastChips && (
            <div className="flex gap-2 overflow-x-auto border-t border-line bg-white px-3 py-2 no-scrollbar">
              {lastChips.map((c) => (
                <button key={c} onClick={() => send(c)} className="whitespace-nowrap rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-100">{c}</button>
              ))}
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-line bg-white p-2.5">
            <label className="sr-only" htmlFor="assistant-input">Message</label>
            <input
              id="assistant-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === "sw" ? "Andika ujumbe…" : "Ask about appointments, results, refills…"}
              className="h-11 flex-1 rounded-xl border border-line bg-canvas px-3.5 text-[15px] focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
              autoComplete="off"
            />
            <button type="submit" disabled={!input.trim()} className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white disabled:opacity-40" aria-label="Send"><ArrowUp size={18} /></button>
          </form>
        </section>
      )}
    </>
  );
}
