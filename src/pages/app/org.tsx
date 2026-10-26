import { BookOpen, CalendarDays, Lock, Megaphone, Route, ShieldOff, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, CardHead, inputCls, PageTitle, Stat } from "../../components/ui";
import { pathways, patientOrgs } from "../../data/seed";

export default function OrgPortal() {
  const org = patientOrgs[0];
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [denied, setDenied] = useState(false);
  const lupus = pathways.find((p) => p.id === "lupus")!;

  return (
    <>
      <PageTitle title="Patient organisation portal" sub={`${org.name} · ${org.focus}`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Users size={20} />} label="Members on platform" value={org.members} />
        <Stat icon={<CalendarDays size={20} />} tone="sky" label="Upcoming sessions" value={3} />
        <Stat icon={<BookOpen size={20} />} tone="violet" label="Approved resources" value={14} />
        <Stat icon={<Route size={20} />} tone="amber" label="Members signposted (30 d)" value={86} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHead title="Support-group sessions" action={<Button size="sm" variant="secondary">New session</Button>} />
            <ul className="divide-y divide-line">
              {[
                ["Monthly peer meeting", "Last Saturday · Nairobi + online", "Published"],
                ["Newly diagnosed circle", "Wed 6pm · online", "Published"],
                ["Caregivers' evening", "Next month · Kisumu", "Draft"],
              ].map(([t, w, s]) => (
                <li key={t} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <div className="flex-1"><p className="text-sm font-semibold">{t}</p><p className="text-xs text-ink-mute">{w}</p></div>
                  <Badge tone={s === "Published" ? "ok" : "neutral"}>{s}</Badge>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHead title="Education resources" sub="Health content is reviewed by the clinical board before it is published." />
            <ul className="divide-y divide-line">
              {[
                ["Lupus and your kidneys", "Approved"],
                ["Living well with fatigue (Kiswahili)", "Approved"],
                ["Pregnancy planning with lupus", "In clinical review"],
                ["Sun protection on a budget", "Approved"],
              ].map(([t, s]) => (
                <li key={t} className="flex items-center gap-3 px-5 py-3.5">
                  <BookOpen size={17} className="text-pink-600" />
                  <span className="flex-1 text-sm font-medium">{t}</span>
                  <Badge tone={s === "Approved" ? "ok" : "warn"}>{s}</Badge>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHead title="Message members" sub="Sent through approved channels only. Members can opt out." />
            <div className="space-y-3 p-5">
              <textarea className={inputCls} rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="e.g. Reminder: monthly meeting this Saturday at 10am" />
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" disabled={!msg.trim()} onClick={() => { setSent([msg, ...sent]); setMsg(""); }}><Megaphone size={15} /> Send to {org.members} members (demo)</Button>
                <span className="text-xs text-ink-mute">No clinical content in broadcasts.</span>
              </div>
              {sent.map((s, i) => <p key={i} className="rounded-xl bg-canvas px-3 py-2 text-sm">Sent: “{s}”</p>)}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="border-slate-300 p-5">
            <p className="flex items-center gap-2 font-bold"><ShieldOff size={18} className="text-slate-600" /> Medical records</p>
            <p className="mt-1 text-sm text-ink-soft">Patient organisations do not receive members' confidential medical records. This is enforced by the platform, not just by policy.</p>
            <Button size="sm" variant="secondary" className="mt-3" onClick={() => setDenied(true)}><Lock size={14} /> Try opening a member's record</Button>
            {denied && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">Access denied: no clinical scope for this role. The attempt was written to the audit log.</p>}
          </Card>
          <Card>
            <CardHead title="Signpost members to care" />
            <div className="space-y-2 p-5 text-sm">
              <p className="text-ink-soft">Share links to verified services. Members book themselves; you never see the booking.</p>
              <Link to="/find-care" className="block rounded-xl border border-line px-3 py-2.5 font-semibold hover:bg-canvas">Rheumatologists on the network →</Link>
              <Link to="/care-pathways" className="block rounded-xl border border-line px-3 py-2.5 font-semibold hover:bg-canvas">{lupus.name} →</Link>
              <Link to="/contact" className="block rounded-xl border border-line px-3 py-2.5 font-semibold hover:bg-canvas">Assisted booking for members →</Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
