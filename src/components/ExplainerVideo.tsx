import { Play, Volume2, VolumeX, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// A short vertical explainer with Dr. Afya. It is a plain MP4, so it plays everywhere and costs no JavaScript.
// Kind to slow connections: a lighter file on 3G or data saver, no autoplay on 2G or data saver,
// and a plain-text fallback if the video cannot load.
const SRC = { full: "/video/afyaconnect-explainer-v1-720.mp4", light: "/video/afyaconnect-explainer-v1-480.mp4" };
const POSTER = "/img/explainer-poster-v1.webp";
const CAPTIONS = "/video/afyaconnect-explainer-v1.vtt";

const STEPS = [
  "Register with your phone number and ID.",
  "Choose a verified specialist and send a booking request.",
  "Your doctor confirms. You both get the video link, with reminders by text and in the app.",
  "Your visit summary and prescription go into your health record. Doctors open it only after confirming your booking.",
  "We keep reminding you until you choose your pharmacy.",
];

type Conn = { effectiveType?: string; saveData?: boolean };
const conn = () => (navigator as Navigator & { connection?: Conn }).connection;
const onSlowLink = () => { const c = conn(); return !!c && (c.saveData === true || ["slow-2g", "2g", "3g"].includes(c.effectiveType ?? "")); };
const tooSlowToAutoplay = () => { const c = conn(); return !!c && (c.saveData === true || ["slow-2g", "2g"].includes(c.effectiveType ?? "")); };

export default function ExplainerVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const pausedByViewer = useRef(false);
  const cached = useRef(false);
  const [src] = useState(() => (onSlowLink() ? SRC.light : SRC.full));
  const [autoplay] = useState(() => !tooSlowToAutoplay() && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);

  // Play, muted, while at least half of it is on screen; pause when scrolled away.
  useEffect(() => {
    const v = video.current, box = frame.current;
    if (!v || !box || !autoplay) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio >= 0.5) { if (!pausedByViewer.current) void v.play().catch(() => undefined); }
      else v.pause();
    }, { threshold: [0, 0.5] });
    io.observe(box);
    return () => io.disconnect();
  }, [autoplay]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) { pausedByViewer.current = false; void v.play().catch(() => setFailed(true)); }
    else { pausedByViewer.current = true; v.pause(); }
  };
  const toggleSound = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted && v.paused) { pausedByViewer.current = false; void v.play().catch(() => undefined); }
  };
  // Once it has played smoothly, ask for the same file again with the full-file request the service worker
  // can store, so the installed app can replay it offline. It is already in the browser cache, so this costs no data.
  const keepForOffline = () => {
    if (cached.current || !navigator.onLine || onSlowLink()) return;
    cached.current = true;
    fetch(src, { cache: "force-cache" }).catch(() => undefined);
  };

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="rounded-[2.4rem] bg-ink p-2.5 shadow-2xl shadow-black/40 ring-1 ring-white/10">
        <div ref={frame} className="relative aspect-[9/16] overflow-hidden rounded-[1.9rem] bg-[#d4f2ec]">
          <video
            ref={video}
            src={src}
            poster={POSTER}
            muted
            loop
            playsInline
            preload={autoplay ? "auto" : "none"}
            aria-label="Dr. Afya explains how AfyaConnect works: register, book a specialist, get a confirmed video link with reminders, keep your health record, and choose your pharmacy."
            className="h-full w-full cursor-pointer object-cover"
            onClick={toggle}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
            onCanPlayThrough={keepForOffline}
            onError={() => setFailed(true)}
          >
            <track kind="captions" srcLang="en" label="English" src={CAPTIONS} />
          </video>

          {!playing && !failed && (
            <button type="button" onClick={toggle} aria-label="Play the explainer video" className="absolute inset-0 grid place-items-center bg-ink/10 focus-ring">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-brand-700 shadow-lg"><Play size={26} fill="currentColor" className="ml-1" /></span>
            </button>
          )}

          {!failed && (
            <button
              type="button"
              onClick={toggleSound}
              aria-label={muted ? "Turn the sound on" : "Turn the sound off"}
              aria-pressed={!muted}
              className="absolute bottom-4 left-3 inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur focus-ring"
            >
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              {muted ? "Sound on" : "Sound off"}
            </button>
          )}

          <div className="absolute inset-x-0 bottom-0 h-1 bg-ink/15" aria-hidden>
            <div className="h-full origin-left bg-brand-500" style={{ transform: `scaleX(${progress})` }} />
          </div>

          {failed && (
            <div className="absolute inset-0 overflow-y-auto bg-white p-5 text-ink">
              <p className="flex items-center gap-2 text-sm font-bold text-brand-700"><WifiOff size={16} /> The video needs a connection</p>
              <p className="mt-2 text-lg font-extrabold leading-tight">How AfyaConnect works</p>
              <ol className="mt-3 space-y-2.5 text-[14px] leading-snug text-ink-soft">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex gap-2.5"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>{s}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-white/85">Meet Dr. Afya: how it works in under a minute</p>
    </div>
  );
}
