import { ArrowLeft, ArrowRight, BadgeCheck, Camera, Check, CheckCircle2, ChevronDown, Info, Lock, Phone, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../../components/PublicLayout";
import { toast } from "../../components/Toaster";
import { Button, Field, inputCls } from "../../components/ui";
import { ALL_COUNTIES } from "../../data/seed";
import { cx } from "../../lib/format";
import { ageFromDob, BLOOD_GROUPS, CONDITION_OPTIONS, ID_TYPES, maskId, maskPhone, normalisePhone, splitList, validateId } from "../../lib/kyc";
import { patients, useStore, type Kyc, type PatientProfile } from "../../store/store";

interface Form {
  name: string; phone: string; email: string;
  dob: string; sex: Kyc["sex"] | ""; idType: Kyc["idType"]; idNumber: string; nationality: string; county: string; town: string; language: string;
  guardianName: string; guardianRelation: string; guardianPhone: string;
  conditions: string[]; otherCondition: string; allergies: string; medications: string; bloodGroup: string; insurance: "SHA" | "Private" | "None"; insuranceNumber: string;
  emName: string; emRelation: string; emPhone: string;
  terms: boolean; reminders: boolean; share: boolean; research: boolean;
}

const blank: Form = {
  name: "", phone: "", email: "", dob: "", sex: "", idType: "National ID", idNumber: "", nationality: "Kenyan", county: "", town: "", language: "English and Kiswahili",
  guardianName: "", guardianRelation: "", guardianPhone: "",
  conditions: [], otherCondition: "", allergies: "", medications: "", bloodGroup: "Not sure", insurance: "SHA", insuranceNumber: "",
  emName: "", emRelation: "", emPhone: "",
  terms: false, reminders: true, share: true, research: false,
};

const STEPS = [
  { t: "Your account", s: "Name and phone number" },
  { t: "Verify your identity", s: "Details from your ID" },
  { t: "Health basics", s: "What your doctor should know" },
  { t: "Privacy and consent", s: "You stay in control" },
];

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

function Seg<T extends string>({ value, onChange, options, label }: { value: T | ""; onChange: (v: T) => void; options: readonly T[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)} className={cx("h-11 rounded-xl border px-4 text-sm font-semibold focus-ring", value === o ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line bg-white text-ink-soft hover:border-brand-300")}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Check2({ checked, onChange, children, required }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; required?: boolean }) {
  return (
    <label className={cx("flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-sm", checked ? "border-brand-300 bg-brand-50/60" : "border-line bg-white")}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600" />
      <span className="leading-snug text-ink">{children}{required && <span className="ml-1 text-xs font-semibold text-rose-600">Required</span>}</span>
    </label>
  );
}

function PhotoPick({ label, hint, file, onFile, capture, error }: { label: string; hint: string; file: File | null; onFile: (f: File | null) => void; capture: "environment" | "user"; error?: string }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!file) return setUrl(undefined);
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-ink">{label}</p>
      <label className={cx("flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition hover:border-brand-400 hover:bg-brand-50/40", error ? "border-rose-300" : file ? "border-brand-300 bg-brand-50/40" : "border-line")}>
        <input type="file" accept="image/*" capture={capture} className="sr-only" onChange={(e) => onFile(e.target.files?.[0] ?? null)} aria-label={label} />
        {url ? <img src={url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" /> : <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-canvas text-ink-mute"><Camera size={24} /></span>}
        <span className="min-w-0 text-sm">
          <span className="block truncate font-semibold text-ink">{file ? file.name : "Take a photo or choose a file"}</span>
          <span className="block text-ink-mute">{file ? "Tap to replace" : hint}</span>
        </span>
      </label>
      {error && <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
}

export default function Register() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>(blank);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [otp, setOtp] = useState({ sent: false, code: "", entered: "", verified: false, error: "" });
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [done, setDone] = useState<string>();
  const [again, setAgain] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    if (errs[k as string]) setErrs((e) => ({ ...e, [k]: "" }));
  };
  const age = f.dob ? ageFromDob(f.dob) : -1;
  const minor = age >= 0 && age < 18;
  const today = new Date().toISOString().slice(0, 10);
  const mine = state.myPatientId ? patients[state.myPatientId] : undefined;

  function sendCode() {
    const p = normalisePhone(f.phone);
    if (!p) return setErrs((e) => ({ ...e, phone: "Enter a valid Kenyan mobile number, for example 0712 345 678" }));
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setOtp({ sent: true, code, entered: "", verified: false, error: "" });
    setErrs((e) => ({ ...e, phone: "" }));
    toast(`Demo SMS to ${maskPhone(p)}: your code is ${code}`, "info", "otp");
  }
  function checkCode(v: string) {
    const entered = v.replace(/\D/g, "").slice(0, 6);
    setOtp((o) => ({ ...o, entered, error: "", verified: entered.length === 6 && entered === o.code }));
    if (entered.length === 6 && entered !== otp.code) setOtp((o) => ({ ...o, entered, error: "That code does not match. Check the SMS and try again." }));
  }

  function validate(s: number): Record<string, string> {
    const e: Record<string, string> = {};
    if (s === 0) {
      const tokens = f.name.trim().split(/\s+/);
      if (tokens.length < 2 || f.name.trim().length < 5) e.name = "Enter your full name as it appears on your ID";
      if (!normalisePhone(f.phone)) e.phone = "Enter a valid Kenyan mobile number, for example 0712 345 678";
      else if (!otp.verified) e.otp = "Verify your number with the code we text you";
      if (f.email.trim() && !isEmail(f.email.trim())) e.email = "Check the email address";
    }
    if (s === 1) {
      if (!f.dob || age < 0 || age > 120 || f.dob > today) e.dob = "Enter a valid date of birth";
      if (!f.sex) e.sex = "Choose one";
      const idErr = validateId(f.idType, f.idNumber);
      if (idErr) e.idNumber = idErr;
      if (!f.county) e.county = "Choose your county";
      if (!f.town.trim()) e.town = "Enter your town or estate";
      if (!f.nationality.trim()) e.nationality = "Enter your nationality";
      if (!idFile) e.idFile = "Add a clear photo of your ID (front)";
      if (minor) {
        if (f.guardianName.trim().length < 4) e.guardianName = "Enter the parent or guardian's full name";
        if (!f.guardianRelation.trim()) e.guardianRelation = "Enter the relationship";
        if (!normalisePhone(f.guardianPhone)) e.guardianPhone = "Enter a valid mobile number";
      }
    }
    if (s === 2) {
      if (f.emName.trim().length < 3) e.emName = "Enter a name";
      if (!f.emRelation.trim()) e.emRelation = "Enter the relationship";
      if (!normalisePhone(f.emPhone)) e.emPhone = "Enter a valid mobile number";
    }
    if (s === 3) {
      if (!f.terms) e.terms = "Please accept to continue";
      if (!f.reminders) e.reminders = "Reminders are how we keep your care on track";
    }
    return e;
  }

  function next() {
    const e = validate(step);
    setErrs(e);
    if (Object.keys(e).length) {
      setTimeout(() => document.querySelector<HTMLElement>('[role="alert"]')?.scrollIntoView({ block: "center", behavior: "smooth" }), 30);
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      setTimeout(() => top.current?.scrollIntoView({ block: "start" }), 30);
    } else submit();
  }

  function submit() {
    const phone = normalisePhone(f.phone)!;
    const nowIso = new Date().toISOString();
    const id = `pt-me-${Date.now().toString(36)}`;
    const profile: PatientProfile = {
      name: f.name.trim().replace(/\s+/g, " "),
      age,
      county: `${f.county} (${f.town.trim()})`,
      phone: maskPhone(phone),
      email: f.email.trim() || undefined,
      conditions: [...f.conditions, ...splitList(f.otherCondition)],
      allergies: splitList(f.allergies),
      medications: splitList(f.medications),
      bloodGroup: f.bloodGroup === "Not sure" ? undefined : f.bloodGroup,
      emergency: { name: f.emName.trim(), relation: f.emRelation.trim(), phone: maskPhone(normalisePhone(f.emPhone)!) },
      insurance: f.insurance === "None" ? undefined : { scheme: f.insurance, number: f.insuranceNumber.trim() ? maskId(f.insuranceNumber) : "not given" },
      registered: true,
      createdAt: nowIso,
      consentAt: nowIso,
      consentVersion: "2026-10",
      shareWithBookedSpecialists: f.share,
      // Only the last four digits of the ID number are kept in this preview.
      kyc: {
        status: "pending", idType: f.idType, idMasked: maskId(f.idNumber), dob: f.dob, sex: f.sex as Kyc["sex"], nationality: f.nationality.trim(), county: f.county, town: f.town.trim(),
        language: f.language, submittedAt: nowIso, idDoc: idFile?.name, selfie: selfie?.name,
        guardian: minor ? { name: f.guardianName.trim(), relation: f.guardianRelation.trim(), phone: maskPhone(normalisePhone(f.guardianPhone)!) } : undefined,
      },
    };
    dispatch({ type: "register", id, profile });
    setDone(profile.name);
    setTimeout(() => top.current?.scrollIntoView({ block: "start" }), 30);
  }

  const first = (done ?? f.name).split(" ")[0];

  if (mine && !again && !done) {
    return (
      <Shell step={-1}>
        <div className="mx-auto max-w-lg rounded-3xl border border-line bg-white p-6 text-center shadow-card sm:p-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-700"><BadgeCheck size={28} /></span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">You are already registered</h1>
          <p className="mt-2 text-ink-soft">{mine.name} · ID check: {mine.kyc?.status === "verified" ? "verified" : "in review"}. Your account lives on this device.</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => { dispatch({ type: "usePatient", id: state.myPatientId! }); navigate("/app/patient"); }}>Open my dashboard <ArrowRight size={18} /></Button>
            <Button size="lg" variant="secondary" onClick={() => setAgain(true)}>Register another person</Button>
          </div>
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell step={STEPS.length}>
        <div ref={top} className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={34} /></span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome, {first}. You are in.</h1>
          <p className="mt-2 text-ink-soft">Your account is ready and your details are saved. Here is what happens next.</p>
          <ol className="mt-6 space-y-3">
            {[
              ["Book your first specialist", "Pick a time. The doctor confirms, then you both get the video link and reminders by SMS and in the app."],
              ["We check your ID", "Usually within 24 hours. You can book while we do. A verified badge appears on your profile."],
              ["Your health record starts here", "Every visit summary and prescription is added to your record, like a student portal for your health."],
            ].map(([t, b], i) => (
              <li key={t} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
                <span><b className="block text-[15px]">{t}</b><span className="text-sm text-ink-soft">{b}</span></span>
              </li>
            ))}
          </ol>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Button size="lg" onClick={() => navigate("/find-care")}>Book a specialist <ArrowRight size={18} /></Button>
            <Button size="lg" variant="secondary" onClick={() => navigate("/app/patient")}>Go to my dashboard</Button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell step={step}>
      <div ref={top} className="scroll-mt-24" />
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <ol className="space-y-1">
            {STEPS.map((s, i) => (
              <li key={s.t} className={cx("flex items-start gap-3 rounded-2xl p-3", i === step && "bg-white shadow-card")}>
                <span className={cx("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold", i < step ? "bg-brand-600 text-white" : i === step ? "border-2 border-brand-600 text-brand-700" : "border border-line text-ink-mute")}>{i < step ? <Check size={15} strokeWidth={3} /> : i + 1}</span>
                <span><b className={cx("block text-sm", i > step && "text-ink-mute")}>{s.t}</b><span className="text-xs text-ink-mute">{s.s}</span></span>
              </li>
            ))}
          </ol>
          <div className="mt-6 space-y-3 rounded-2xl bg-brand-900 p-4 text-sm text-white/85">
            <p className="flex items-center gap-2 font-bold text-white"><ShieldCheck size={16} /> Why we ask</p>
            <p>Your ID confirms you are you, so doctors can trust who they are treating. We keep only what care needs.</p>
            <p className="flex items-center gap-2 text-xs text-white/70"><Lock size={13} /> Doctors see your file only after they confirm your booking.</p>
          </div>
        </aside>

        <div className="pb-28 sm:pb-0">
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-sky2-100 bg-sky2-50 p-3.5 text-[13px] leading-snug text-sky2-700">
            <Info size={17} className="mt-0.5 shrink-0" />
            <p><b>Preview mode.</b> Your details are saved only on this device while the secure national-standard database is being finished. Please use test details for now. No SMS is really sent.</p>
          </div>

          <div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Step {step + 1} of {STEPS.length}</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{STEPS[step].t}</h1>

            {step === 0 && (
              <div className="mt-6 space-y-5">
                <Field label="Full name" hint="As it appears on your ID." error={errs.name}>
                  <input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" placeholder="e.g. Wanjiru Njoroge" aria-invalid={!!errs.name} />
                </Field>
                <div>
                  <Field label="Mobile number" hint="We text you a code, and use this number for reminders." error={errs.phone}>
                    <div className="flex gap-2">
                      <span className="grid h-[46px] shrink-0 place-items-center rounded-xl border border-line bg-canvas px-3 text-sm font-semibold text-ink-soft">KE +254</span>
                      <input className={inputCls} value={f.phone} onChange={(e) => { set("phone", e.target.value); setOtp({ sent: false, code: "", entered: "", verified: false, error: "" }); }} type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" aria-invalid={!!errs.phone} />
                    </div>
                  </Field>
                  {!otp.verified && <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={sendCode}><Phone size={15} /> {otp.sent ? "Send a new code" : "Text me a code"}</Button>}
                </div>
                {otp.sent && (
                  <div className="rounded-2xl bg-canvas p-4">
                    <Field label="6-digit code" error={otp.error || errs.otp}>
                      <input className={cx(inputCls, "text-center font-mono text-xl tracking-[0.5em]")} value={otp.entered} onChange={(e) => checkCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" />
                    </Field>
                    {otp.verified ? (
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} /> Number verified</p>
                    ) : (
                      <p className="mt-2 text-xs text-ink-mute">Preview: the code appears in the notice at the top of the screen.</p>
                    )}
                  </div>
                )}
                {!otp.sent && errs.otp && <p role="alert" className="text-xs font-semibold text-rose-600">{errs.otp}</p>}
                <Field label="Email" optional error={errs.email}>
                  <input className={inputCls} value={f.email} onChange={(e) => set("email", e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" />
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Date of birth" error={errs.dob}>
                    <input className={inputCls} type="date" max={today} value={f.dob} onChange={(e) => set("dob", e.target.value)} autoComplete="bday" aria-invalid={!!errs.dob} />
                  </Field>
                  <div>
                    <p className="mb-1.5 text-sm font-semibold text-ink">Sex</p>
                    <Seg<Kyc["sex"]> label="Sex" value={f.sex} onChange={(v) => set("sex", v)} options={["Female", "Male", "Prefer not to say"]} />
                    {errs.sex && <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{errs.sex}</p>}
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="ID type">
                    <div className="relative">
                      <select className={cx(inputCls, "appearance-none pr-9")} value={f.idType} onChange={(e) => set("idType", e.target.value as Kyc["idType"])}>
                        {ID_TYPES.filter((t) => t !== "Birth certificate" || minor || f.idType === t).map((t) => <option key={t}>{t}</option>)}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute" />
                    </div>
                  </Field>
                  <Field label="ID number" error={errs.idNumber} hint="We keep only the last 4 digits in this preview.">
                    <input className={inputCls} value={f.idNumber} onChange={(e) => set("idNumber", e.target.value)} inputMode={f.idType === "Passport" ? "text" : "numeric"} autoComplete="off" aria-invalid={!!errs.idNumber} />
                  </Field>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="County" error={errs.county}>
                    <div className="relative">
                      <select className={cx(inputCls, "appearance-none pr-9")} value={f.county} onChange={(e) => set("county", e.target.value)} aria-invalid={!!errs.county}>
                        <option value="">Choose county</option>
                        {ALL_COUNTIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute" />
                    </div>
                  </Field>
                  <Field label="Town or estate" error={errs.town}>
                    <input className={inputCls} value={f.town} onChange={(e) => set("town", e.target.value)} autoComplete="address-level2" placeholder="e.g. Kasarani" aria-invalid={!!errs.town} />
                  </Field>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Nationality" error={errs.nationality}>
                    <input className={inputCls} value={f.nationality} onChange={(e) => set("nationality", e.target.value)} />
                  </Field>
                  <Field label="Language for messages">
                    <div className="relative">
                      <select className={cx(inputCls, "appearance-none pr-9")} value={f.language} onChange={(e) => set("language", e.target.value)}>
                        {["English and Kiswahili", "English", "Kiswahili"].map((l) => <option key={l}>{l}</option>)}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute" />
                    </div>
                  </Field>
                </div>
                <PhotoPick label="Photo of your ID (front)" hint="Make sure the text is clear and not cut off." file={idFile} onFile={(x) => { setIdFile(x); if (x) setErrs((e) => ({ ...e, idFile: "" })); }} capture="environment" error={errs.idFile} />
                <PhotoPick label="Selfie (optional)" hint="Helps us match the photo on your ID faster." file={selfie} onFile={setSelfie} capture="user" />
                {minor && (
                  <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                    <p className="text-sm font-bold text-amber-900">Under 18: a parent or guardian is needed</p>
                    <Field label="Parent or guardian's full name" error={errs.guardianName}><input className={inputCls} value={f.guardianName} onChange={(e) => set("guardianName", e.target.value)} /></Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Relationship" error={errs.guardianRelation}><input className={inputCls} value={f.guardianRelation} onChange={(e) => set("guardianRelation", e.target.value)} placeholder="e.g. Mother" /></Field>
                      <Field label="Their mobile number" error={errs.guardianPhone}><input className={inputCls} type="tel" inputMode="tel" value={f.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} /></Field>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="mt-6 space-y-5">
                <div>
                  <p className="mb-2 text-sm font-semibold text-ink">Long-term conditions <span className="font-medium text-ink-mute">(choose any)</span></p>
                  <div className="flex flex-wrap gap-2">
                    {CONDITION_OPTIONS.map((c) => {
                      const on = f.conditions.includes(c);
                      return (
                        <button key={c} type="button" aria-pressed={on} onClick={() => set("conditions", on ? f.conditions.filter((x) => x !== c) : [...f.conditions, c])} className={cx("h-10 rounded-full border px-3.5 text-sm font-semibold focus-ring", on ? "border-brand-500 bg-brand-600 text-white" : "border-line bg-white text-ink-soft hover:border-brand-300")}>
                          {on && <Check size={13} strokeWidth={3} className="mr-1 inline" />}{c}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Field label="Anything else?" optional hint="Separate with commas.">
                  <input className={inputCls} value={f.otherCondition} onChange={(e) => set("otherCondition", e.target.value)} placeholder="e.g. migraine, eczema" />
                </Field>
                <Field label="Allergies" optional hint="Medicines, foods or anything that has caused a reaction. Separate with commas.">
                  <input className={inputCls} value={f.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder="e.g. penicillin" />
                </Field>
                <Field label="Medicines you take now" optional hint="One per line or separated by commas.">
                  <textarea className={inputCls} rows={3} value={f.medications} onChange={(e) => set("medications", e.target.value)} placeholder="e.g. Metformin 500 mg twice daily" />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Blood group">
                    <div className="relative">
                      <select className={cx(inputCls, "appearance-none pr-9")} value={f.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>
                        {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute" />
                    </div>
                  </Field>
                  <div>
                    <p className="mb-1.5 text-sm font-semibold text-ink">Health cover</p>
                    <Seg<Form["insurance"]> label="Health cover" value={f.insurance} onChange={(v) => set("insurance", v)} options={["SHA", "Private", "None"]} />
                  </div>
                </div>
                {f.insurance !== "None" && (
                  <Field label={f.insurance === "SHA" ? "SHA member number" : "Policy or member number"} optional>
                    <input className={inputCls} value={f.insuranceNumber} onChange={(e) => set("insuranceNumber", e.target.value)} autoComplete="off" />
                  </Field>
                )}
                <div className="space-y-4 rounded-2xl bg-canvas p-4">
                  <p className="text-sm font-bold">Emergency contact</p>
                  <Field label="Full name" error={errs.emName}><input className={inputCls} value={f.emName} onChange={(e) => set("emName", e.target.value)} autoComplete="off" /></Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Relationship" error={errs.emRelation}><input className={inputCls} value={f.emRelation} onChange={(e) => set("emRelation", e.target.value)} placeholder="e.g. Brother" /></Field>
                    <Field label="Mobile number" error={errs.emPhone}><input className={inputCls} type="tel" inputMode="tel" value={f.emPhone} onChange={(e) => set("emPhone", e.target.value)} /></Field>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl bg-canvas p-4 text-sm">
                  <p className="font-bold">Check your details</p>
                  <dl className="mt-3 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5">
                    {[
                      ["Name", f.name.trim()],
                      ["Phone", normalisePhone(f.phone) ? maskPhone(normalisePhone(f.phone)!) : ""],
                      ["Born", f.dob ? `${new Date(f.dob).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })} (${age})` : ""],
                      [f.idType, maskId(f.idNumber || "0000")],
                      ["Where you live", `${f.town.trim()}, ${f.county}`],
                      ["Conditions", [...f.conditions, ...splitList(f.otherCondition)].join(", ") || "None added"],
                      ["Emergency contact", `${f.emName.trim()} (${f.emRelation.trim()})`],
                    ].map(([k, v]) => (
                      <div key={k} className="contents"><dt className="text-ink-mute">{k}</dt><dd className="font-semibold">{v}</dd></div>
                    ))}
                  </dl>
                  <div className="mt-3 flex gap-3 text-xs">
                    <button type="button" onClick={() => setStep(1)} className="font-semibold text-brand-700 hover:underline">Edit identity</button>
                    <button type="button" onClick={() => setStep(2)} className="font-semibold text-brand-700 hover:underline">Edit health basics</button>
                  </div>
                </div>

                <details className="group rounded-2xl border border-line p-4 text-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-bold">What we collect, why, and your rights <ChevronDown size={16} className="transition group-open:rotate-180" /></summary>
                  <ul className="mt-3 space-y-2 text-ink-soft">
                    <li><b className="text-ink">Identity</b> so doctors can be sure who they treat, and to keep your records safe.</li>
                    <li><b className="text-ink">Health basics</b> so you do not repeat your history at every visit.</li>
                    <li><b className="text-ink">Who sees it:</b> a specialist opens your file only after they confirm a booking with you, and you can withdraw that at any time. Pharmacies, labs and support groups never get your records by default.</li>
                    <li><b className="text-ink">Your rights</b> under the Data Protection Act 2019: see, correct, download and delete your data, and complain to the Office of the Data Protection Commissioner.</li>
                  </ul>
                </details>

                <div className="space-y-3">
                  <Check2 checked={f.terms} onChange={(v) => set("terms", v)} required>I agree to the Terms of Use and have read the Privacy Notice.</Check2>
                  {errs.terms && <p role="alert" className="-mt-1 text-xs font-semibold text-rose-600">{errs.terms}</p>}
                  <Check2 checked={f.reminders} onChange={(v) => set("reminders", v)} required>Send me appointment, video link and prescription reminders by SMS and in the app.</Check2>
                  {errs.reminders && <p role="alert" className="-mt-1 text-xs font-semibold text-rose-600">{errs.reminders}</p>}
                  <Check2 checked={f.share} onChange={(v) => set("share", v)}>Let a specialist open my health file once they confirm my booking. I can withdraw this at any time.</Check2>
                  <Check2 checked={f.research} onChange={(v) => set("research", v)}>Use my information without my name to help improve the service. (Optional)</Check2>
                </div>
              </div>
            )}

            <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-line bg-white/95 p-3 backdrop-blur sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
              <Button type="button" variant="ghost" onClick={() => (step === 0 ? navigate("/") : setStep(step - 1))}><ArrowLeft size={16} /> {step === 0 ? "Cancel" : "Back"}</Button>
              <Button type="button" size="lg" onClick={next} className="flex-1 sm:flex-none">{step === STEPS.length - 1 ? "Create my account" : "Continue"} <ArrowRight size={18} /></Button>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-ink-mute">Need a hand? <Link to="/contact" className="font-semibold text-brand-700 hover:underline">We can register you over the phone</Link>.</p>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ step, children }: { step: number; children: ReactNode }) {
  const pct = step < 0 ? 0 : Math.min(100, ((step + 1) / (STEPS.length + 1)) * 100);
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between">
          <Link to="/" aria-label="Home" className="rounded-lg focus-ring"><Logo /></Link>
          <p className="text-sm text-ink-mute"><span className="hidden sm:inline">Have an account? </span><Link to="/app/patient" className="font-semibold text-brand-700 hover:underline">Open dashboard</Link></p>
        </div>
        {step >= 0 && <div className="h-1 bg-line"><div className="h-full bg-gradient-to-r from-brand-500 to-sky2-500 transition-all duration-500" style={{ width: `${pct}%` }} /></div>}
      </header>
      <main className="container-x py-8 sm:py-12">{children}</main>
    </div>
  );
}
