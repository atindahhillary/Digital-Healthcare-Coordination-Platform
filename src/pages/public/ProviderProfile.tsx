import { ArrowLeft, BadgeCheck, Building2, Clock, Languages, MapPin, ShieldCheck, Star, Timer, Video } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { BookingModal, nextSlot } from "../../components/Booking";
import { Avatar, Badge, Button, Card } from "../../components/ui";
import { byId, specialists } from "../../data/seed";
import { date, kes, time } from "../../lib/format";

export default function ProviderProfile() {
  const { id } = useParams();
  const sp = byId(specialists, id);
  const [open, setOpen] = useState(false);
  if (!sp) return <Navigate to="/find-care" replace />;
  const slot = nextSlot(sp);
  return (
    <div className="bg-canvas pb-16">
      <div className="container-x py-6">
        <Link to="/find-care" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"><ArrowLeft size={16} /> All specialists</Link>
      </div>
      <div className="container-x grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-start gap-5">
              <Avatar name={sp.name} hue={sp.hue} size={88} />
              <div className="min-w-0 flex-1">
                <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold tracking-tight">{sp.name} {sp.verified ? <Badge tone="brand"><BadgeCheck size={13} /> Verified</Badge> : <Badge tone="warn">Verification pending</Badge>}</h1>
                <p className="text-ink-soft">{sp.title} · {sp.years} years' experience</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-soft">
                  <span className="inline-flex items-center gap-1.5"><Building2 size={15} /> {sp.clinic}</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin size={15} /> {sp.town}, {sp.county}</span>
                  <span className="inline-flex items-center gap-1.5"><Languages size={15} /> {sp.languages.join(", ")}</span>
                </div>
              </div>
            </div>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">{sp.bio}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {sp.conditions.map((c) => <Badge key={c}>{c}</Badge>)}
            </div>
          </Card>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Timer, l: "Started on time", v: `${sp.punctuality}%`, s: "last 90 days" },
              { icon: Clock, l: "Average wait", v: `${sp.avgWait} min`, s: "after booked time" },
              { icon: Star, l: "Patient rating", v: sp.rating.toFixed(1), s: `${sp.reviews} verified reviews` },
            ].map((x) => (
              <Card key={x.l} className="p-5">
                <x.icon size={20} className="text-brand-600" />
                <p className="mt-3 text-2xl font-extrabold">{x.v}</p>
                <p className="text-sm font-semibold">{x.l}</p>
                <p className="text-xs text-ink-mute">{x.s}</p>
              </Card>
            ))}
          </div>
          <Card className="p-6">
            <h2 className="font-bold">Credentials</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-brand-600" /> Practising licence checked against the regulator's register ({sp.regNo})</li>
              <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-brand-600" /> Specialist registration and professional indemnity on file</li>
              <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-brand-600" /> Re-verified every year and when a licence expires</li>
            </ul>
          </Card>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <p className="text-sm font-semibold text-ink-mute">Consultation fees</p>
            <div className="mt-3 space-y-2">
              {sp.modes.includes("virtual") && <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><Video size={16} className="text-brand-600" /> Video</span><b>{kes(sp.virtualFee)}</b></p>}
              {sp.modes.includes("physical") && <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><MapPin size={16} className="text-brand-600" /> In person</span><b>{kes(sp.fee)}</b></p>}
            </div>
            {slot && <p className="mt-4 rounded-xl bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-800">Next available: {date(slot)}, {time(slot)}</p>}
            <Button className="mt-4 w-full" size="lg" disabled={!sp.verified} onClick={() => setOpen(true)}>{sp.verified ? "Book appointment" : "Not yet bookable"}</Button>
            <p className="mt-3 text-center text-xs text-ink-mute">No booking fee. Free cancellation up to 12 h before.</p>
          </Card>
        </aside>
      </div>
      <BookingModal sp={sp} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
