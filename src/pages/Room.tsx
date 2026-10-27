import { CheckCircle2, Clock, Lock, Mic, MicOff, Video, VideoOff, Wifi } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { VideoRoom } from "../components/Appointment";
import { Logo } from "../components/PublicLayout";
import { Avatar, Button } from "../components/ui";
import { byId, specialists } from "../data/seed";
import { cx, dateTime, minutesUntil } from "../lib/format";
import { patients, useStore, type Appointment } from "../store/store";

// The page the video link opens. A pre-join lobby, then the call.
export default function Room() {
  const { code = "" } = useParams();
  const { state } = useStore();
  const navigate = useNavigate();
  const found = state.appointments.find((x) => x.joinCode === code);
  const [joined, setJoined] = useState(false);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const asDoctor = state.role === "specialist";

  // A link opened on a device that does not hold the booking still lands in a working demo room.
  const a: Appointment = found ?? {
    id: "demo-room", patientId: state.patientId, specialistId: "sp-amina", at: new Date().toISOString(), mode: "virtual", fee: 0, reason: "Demo room", status: "confirmed", joinCode: code, timeline: [],
  };
  const sp = byId(specialists, a.specialistId)!;
  const patient = patients[a.patientId];
  const mins = minutesUntil(a.at);
  const early = !!found && mins > 15;
  const home = asDoctor ? "/app/specialist" : "/app/patient";

  if (joined) return <VideoRoom a={a} asDoctor={asDoctor} onClose={() => { setJoined(false); navigate(home); }} />;

  const checks = [
    { ok: true, t: "Camera", s: cam ? "Ready" : "Off" },
    { ok: true, t: "Microphone", s: mic ? "Ready" : "Muted" },
    { ok: true, t: "Connection", s: "Good. Audio-only is available if it drops" },
  ];

  return (
    <div className="min-h-screen bg-[#0b1620] text-white">
      <header className="container-x flex h-16 items-center justify-between">
        <Link to="/" aria-label="Home"><Logo light /></Link>
        <p className="flex items-center gap-1.5 text-xs text-white/60"><Lock size={13} /> Encrypted</p>
      </header>
      <main className="container-x grid min-h-[calc(100vh-4rem)] place-items-center pb-10">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 text-ink shadow-lift">
          <div className="flex items-center gap-4">
            <Avatar name={asDoctor ? patient.name : sp.name} hue={sp.hue} size={64} />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Video consultation</p>
              <h1 className="truncate text-xl font-extrabold tracking-tight">{asDoctor ? patient.name : sp.name}</h1>
              <p className="text-sm text-ink-mute">{found ? dateTime(a.at) : "Demo room"} · <span className="font-mono">{code}</span></p>
            </div>
          </div>

          <div className="relative mt-5 grid aspect-video place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 to-ink text-white/60">
            {cam ? <Avatar name={asDoctor ? sp.name : patient.name} hue={200} size={72} /> : <VideoOff size={28} />}
            <p className="absolute bottom-2 left-3 text-xs font-semibold text-white/80">You</p>
          </div>
          <div className="mt-3 flex justify-center gap-3">
            <button onClick={() => setMic(!mic)} aria-pressed={!mic} aria-label={mic ? "Mute microphone" : "Unmute microphone"} className={cx("grid h-12 w-12 place-items-center rounded-full border", mic ? "border-line bg-white" : "border-ink bg-ink text-white")}>{mic ? <Mic size={18} /> : <MicOff size={18} />}</button>
            <button onClick={() => setCam(!cam)} aria-pressed={!cam} aria-label={cam ? "Turn camera off" : "Turn camera on"} className={cx("grid h-12 w-12 place-items-center rounded-full border", cam ? "border-line bg-white" : "border-ink bg-ink text-white")}>{cam ? <Video size={18} /> : <VideoOff size={18} />}</button>
          </div>

          <ul className="mt-5 space-y-2 rounded-2xl bg-canvas p-4 text-sm">
            {checks.map((c) => (
              <li key={c.t} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-600" /><b>{c.t}</b><span className="text-ink-mute">{c.s}</span></li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-mute"><Wifi size={13} /> Weak signal? You can switch to audio only inside the call.</p>

          {early ? (
            <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              <p className="flex items-center gap-2 font-bold"><Clock size={16} /> The room opens 15 minutes before your visit</p>
              <p className="mt-1">Starts in {mins < 120 ? `${mins} minutes` : mins < 2880 ? `${Math.round(mins / 60)} hours` : `${Math.round(mins / 1440)} days`}. We will remind you by SMS and in the app.</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => setJoined(true)}>Preview the room (demo)</Button>
            </div>
          ) : (
            <Button size="lg" className="mt-5 w-full" onClick={() => setJoined(true)}><Video size={18} /> Join now</Button>
          )}
          {!found && <p className="mt-3 text-center text-xs text-ink-mute">This link belongs to a booking made on another device, so this is a demo room.</p>}
          <p className="mt-4 text-center text-sm"><Link to={home} className="font-semibold text-brand-700 hover:underline">Back to my dashboard</Link></p>
        </div>
      </main>
    </div>
  );
}
