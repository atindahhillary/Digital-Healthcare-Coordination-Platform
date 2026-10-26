import { HelpCircle, MessageCircle, PhoneCall, Siren } from "lucide-react";
import { useState } from "react";
import { Button, Card, Field, inputCls } from "../../components/ui";

const faqs = [
  ["What if my doctor is late?", "If the delay is short we tell you the new start time. If it passes 20 minutes, or the doctor does not confirm, you choose: wait, see another verified specialist, reschedule for free, or get a full refund."],
  ["Is this for emergencies?", "No. For an emergency call 999 or 112, or go to the nearest emergency unit."],
  ["Who can see my results?", "You and the doctor who ordered the test. Anyone else needs your consent, which you can change at any time in Records & privacy."],
  ["I do not have a smartphone.", "Every important update also comes by SMS, and our coordinators can book for you over the phone."],
  ["How do I pay?", "M-Pesa at booking. Insurance and SHA claims are planned for a later phase."],
];

export default function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <div className="bg-canvas pb-20">
      <section className="border-b border-line bg-white">
        <div className="container-x py-14">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Help and assisted booking</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-soft">Prefer to talk to a person? A care coordinator can find a specialist, book, and follow up for you.</p>
        </div>
      </section>
      <section className="container-x mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <Card className="border-rose-200 bg-rose-50 p-5">
            <p className="flex items-center gap-2 font-bold text-rose-800"><Siren size={18} /> Emergency?</p>
            <p className="mt-1 text-sm text-rose-900/80">Call <a href="tel:999" className="font-bold underline">999</a> or <a href="tel:112" className="font-bold underline">112</a>, or Kenya Red Cross on <a href="tel:1199" className="font-bold underline">1199</a>. Do not use this platform for emergencies.</p>
          </Card>
          <Card className="p-6">
            <p className="flex items-center gap-2 text-lg font-bold"><PhoneCall size={20} className="text-brand-600" /> Request a callback</p>
            {sent ? (
              <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-emerald-800">Thanks. In the live service a coordinator would call you within 30 minutes during opening hours. (Demo: nothing was sent.)</p>
            ) : (
              <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
                <Field label="Your name"><input required className={inputCls} /></Field>
                <Field label="Phone number" hint="We only use this to call you back."><input required inputMode="tel" className={inputCls} placeholder="07XX XXX XXX" /></Field>
                <Field label="Preferred language">
                  <select className={inputCls}><option>English</option><option>Kiswahili</option></select>
                </Field>
                <Field label="How can we help?"><textarea rows={3} className={inputCls} /></Field>
                <Button type="submit" className="w-full">Call me back (demo)</Button>
              </form>
            )}
          </Card>
          <Card className="flex gap-4 p-5">
            <MessageCircle className="mt-0.5 shrink-0 text-brand-600" />
            <div><p className="font-bold">WhatsApp and SMS</p><p className="text-sm text-ink-soft">Reply to any of our messages to reach a coordinator. Opening hours and numbers are confirmed at launch.</p></div>
          </Card>
        </div>
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><HelpCircle className="text-brand-600" /> Common questions</h2>
          <div className="mt-5 space-y-3">
            {faqs.map(([q, a]) => (
              <details key={q} className="group rounded-2xl border border-line bg-white p-5 shadow-card">
                <summary className="cursor-pointer list-none font-bold marker:hidden">{q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
