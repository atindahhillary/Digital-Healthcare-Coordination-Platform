import { Check, FileLock2, KeyRound, Lock, Minus, ScrollText, ServerCog, ShieldAlert, UserCheck } from "lucide-react";
import { Card } from "../../components/ui";

const roles = ["Patient", "Treating specialist", "Laboratory", "Pharmacy", "Care coordinator", "Patient organisation", "Platform admin"];
const data: [string, (0 | 1 | 2)[]][] = [
  // 2 = full, 1 = limited/scoped, 0 = none
  ["Profile & contact details", [2, 1, 1, 1, 1, 1, 1]],
  ["Appointments", [2, 2, 0, 0, 2, 0, 1]],
  ["Consultation notes", [2, 2, 0, 0, 0, 0, 0]],
  ["Lab orders & results", [2, 2, 1, 0, 0, 0, 0]],
  ["Prescriptions", [2, 2, 0, 1, 0, 0, 0]],
  ["Referrals", [2, 2, 0, 0, 1, 0, 0]],
  ["Audit log of who viewed my data", [2, 0, 0, 0, 0, 0, 1]],
];

const laws = [
  { t: "Data Protection Act, 2019", b: "Health data is sensitive personal data. The platform registers with the ODPC as a data controller, runs a Data Protection Impact Assessment before go-live, records lawful basis and consent, honours access, correction and deletion requests, and notifies the ODPC of qualifying breaches within 72 hours." },
  { t: "Digital Health Act, 2023 and its 2025 regulations", b: "Sets national rules for e-health services, health information management and data exchange, overseen by the Digital Health Agency. The design assumes registration as an e-health service and future connection to the national health information exchange using its standards." },
  { t: "Health Act, 2017", b: "Patient confidentiality. Information is shared only with people directly involved in care, or with the patient's consent." },
  { t: "Professional regulators", b: "Specialists are checked against the KMPDC register and facilities offering virtual care need KMPDC approval. Pharmacies are verified with the Pharmacy and Poisons Board and laboratories with KMLTTB. Credentials are re-checked on expiry." },
];

export default function Trust() {
  return (
    <div className="bg-canvas pb-20">
      <section className="bg-ink text-white">
        <div className="container-x py-14">
          <p className="text-sm font-bold uppercase tracking-wider text-brand-300">Trust & privacy</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">Your health information belongs to you</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/70">Privacy and security are part of the design from the first screen. You decide who sees what, and you can see every time someone opens your record.</p>
        </div>
      </section>

      <section className="container-x -mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: UserCheck, t: "Consent you control", b: "Grant and withdraw access per provider, per data type." },
          { icon: KeyRound, t: "Role-based access", b: "Each portal sees only what its role needs. Enforced on the server." },
          { icon: Lock, t: "Encrypted everywhere", b: "TLS in transit, AES-256 at rest, extra encryption for notes and results." },
          { icon: ScrollText, t: "Full audit trail", b: "Every view, edit and share is logged and visible to you." },
        ].map((x) => (
          <Card key={x.t} className="p-5">
            <x.icon className="text-brand-600" size={22} />
            <p className="mt-3 font-bold">{x.t}</p>
            <p className="mt-1 text-sm text-ink-soft">{x.b}</p>
          </Card>
        ))}
      </section>

      <section className="container-x mt-12">
        <h2 className="text-2xl font-extrabold tracking-tight">Who can see what</h2>
        <p className="mt-1 text-ink-soft">Default access. Patients can narrow it further. Patient organisations never receive medical records.</p>
        <Card className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/60 text-left">
                <th className="px-4 py-3 font-semibold">Data</th>
                {roles.map((r) => <th key={r} className="px-3 py-3 text-center font-semibold">{r}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map(([label, row]) => (
                <tr key={label} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{label}</td>
                  {row.map((v, i) => (
                    <td key={i} className="px-3 py-3 text-center">
                      {v === 2 ? <Check size={18} className="mx-auto text-emerald-600" aria-label="Full" /> : v === 1 ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">Scoped</span> : <Minus size={18} className="mx-auto text-ink-mute/50" aria-label="None" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="mt-2 text-xs text-ink-mute">Scoped: a laboratory sees only the orders and results it handles; a pharmacy sees only prescriptions sent to it; admins see operational data, not clinical content, unless investigating a complaint under a logged, time-limited break-glass process.</p>
      </section>

      <section className="container-x mt-12 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Kenyan law we design to</h2>
          <div className="mt-5 space-y-3">
            {laws.map((l) => (
              <Card key={l.t} className="p-5">
                <p className="font-bold">{l.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{l.b}</p>
              </Card>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-mute">The legal and clinical operating model, including data residency for health records, must be confirmed with Kenyan counsel and the regulators before live services launch.</p>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Security controls</h2>
          <Card className="mt-5 divide-y divide-line">
            {[
              { icon: KeyRound, t: "Authentication", b: "Phone OTP for patients, MFA for providers and admins, session timeouts on shared devices." },
              { icon: FileLock2, t: "Encryption", b: "TLS 1.2+ in transit; AES-256 at rest; field-level encryption for clinical notes, results and prescriptions; keys in a managed KMS." },
              { icon: ServerCog, t: "Backup & recovery", b: "Encrypted daily backups with point-in-time recovery, tested restores every quarter, documented recovery targets." },
              { icon: ScrollText, t: "Retention & deletion", b: "Retention schedule per record type, patient deletion requests handled within the statutory period, legal holds respected." },
              { icon: ShieldAlert, t: "Incident response", b: "24/7 alerting, a written response plan, ODPC and patient notification steps, and post-incident reviews." },
              { icon: Lock, t: "Secure exchange", b: "Results and prescriptions move as signed, encrypted messages to named recipients only, never by open email." },
            ].map((x) => (
              <div key={x.t} className="flex gap-4 p-5">
                <x.icon size={20} className="mt-0.5 shrink-0 text-brand-600" />
                <div>
                  <p className="font-bold">{x.t}</p>
                  <p className="text-sm text-ink-soft">{x.b}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </section>
    </div>
  );
}
