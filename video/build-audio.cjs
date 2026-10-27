// Builds narration.wav, the timeline (line and caption timings, lip-sync envelope) and the icon map.
// Usage: node build-audio.cjs <dir with one wav per script line>
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const FPS = 30;
const audioDir = process.argv[2];
const dist = path.join(__dirname, "dist");
fs.mkdirSync(dist, { recursive: true });
const script = JSON.parse(fs.readFileSync(path.join(__dirname, "script.json"), "utf8"));

const ff = (args) => cp.execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], { maxBuffer: 1 << 28 });
const probe = (f) => parseFloat(cp.execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());

// 1. trim the silence the voice leaves at both ends of every line
const trim = "silenceremove=start_periods=1:start_silence=0.04:start_threshold=-46dB,areverse,silenceremove=start_periods=1:start_silence=0.06:start_threshold=-46dB,areverse";
const files = script.lines.map((l) => {
  const out = path.join(dist, `line-${l.id}.wav`);
  ff(["-i", path.join(audioDir, `${l.id}.wav`), "-af", trim, out]);
  return out;
});

// 2. lay the lines out on a timeline
let t = 0.7;
let prevScene = null;
const lines = script.lines.map((l, i) => {
  if (prevScene !== null) t += l.scene === prevScene ? 0.3 : 0.6;
  const d = probe(files[i]);
  const row = { ...l, start: +t.toFixed(3), end: +(t + d).toFixed(3), dur: +d.toFixed(3) };
  t += d;
  prevScene = l.scene;
  return row;
});
const total = +(t + 1.6).toFixed(3);

// 3. captions: short chunks, timed by letter count inside each line
const chunkOf = (text) => {
  const words = text.split(/\s+/);
  const chunks = [];
  let cur = [];
  for (const w of words) {
    cur.push(w);
    const hard = /[.?!]$/.test(w) && w !== "Dr.";
    const soft = /,$/.test(w) && cur.length >= 3;
    if (cur.length >= 6 || hard || soft) { chunks.push(cur.join(" ")); cur = []; }
  }
  if (cur.length) chunks.push(cur.join(" "));
  // do not leave one-word orphans (step numbers such as "One." stay on their own)
  const keep = new Set(["One.", "Two.", "Three.", "Four.", "Five.", "Ready?"]);
  const merged = [];
  for (const c of chunks) {
    if (merged.length && c.split(" ").length === 1 && !keep.has(c)) merged[merged.length - 1] += " " + c;
    else merged.push(c);
  }
  return merged;
};
for (const l of lines) {
  const cs = chunkOf(l.text);
  const w = cs.map((c) => c.replace(/\s/g, "").length);
  const sum = w.reduce((a, b) => a + b, 0);
  let at = l.start;
  l.chunks = cs.map((c, i) => {
    const d = (l.dur * w[i]) / sum;
    const row = { text: c, start: +at.toFixed(3), end: +(at + d).toFixed(3) };
    at += d;
    return row;
  });
}

// 4. mix the narration
const inputs = files.flatMap((f) => ["-i", f]);
const delays = lines.map((l, i) => `[${i}:a]adelay=${Math.round(l.start * 1000)}:all=1[a${i}]`).join(";");
const mix = lines.map((_, i) => `[a${i}]`).join("") + `amix=inputs=${lines.length}:normalize=0,apad=whole_dur=${total},atrim=0:${total},loudnorm=I=-16:TP=-1.5:LRA=7,aresample=44100[out]`;
ff([...inputs, "-filter_complex", `${delays};${mix}`, "-map", "[out]", "-ac", "1", path.join(dist, "narration.wav")]);

// 5. lip-sync envelope, one value per video frame
const pcm = cp.execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", path.join(dist, "narration.wav"), "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], { maxBuffer: 1 << 28 });
const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
const nFrames = Math.ceil(total * FPS);
const per = 16000 / FPS;
const rms = [];
for (let f = 0; f < nFrames; f++) {
  const a = Math.max(0, Math.floor((f - 0.5) * per));
  const b = Math.min(samples.length, Math.floor((f + 1.5) * per));
  let s = 0;
  for (let i = a; i < b; i++) s += samples[i] * samples[i];
  rms.push(b > a ? Math.sqrt(s / (b - a)) : 0);
}
const sorted = rms.filter((x) => x > 200).sort((x, y) => x - y);
const p90 = sorted[Math.floor(sorted.length * 0.9)] || 1;
let prev = 0;
const env = rms.map((x) => {
  let v = Math.min(1, x / p90);
  if (v < 0.07) v = 0;
  v = v > prev ? v * 0.85 + prev * 0.15 : v * 0.55 + prev * 0.45;
  prev = v;
  return +v.toFixed(3);
});

// 6. scenes
const scenes = {};
for (const l of lines) {
  const s = (scenes[l.scene] ||= { start: l.start, end: l.end, lines: [] });
  s.end = l.end;
  s.lines.push(l.id);
}

// 7. icons from lucide (the same set the site uses)
const iconDir = path.join(__dirname, "..", "node_modules", "lucide-react", "dist", "esm", "icons");
const iconNames = ["calendar-days", "video", "shield-check", "pill", "bell-ring", "bell", "file-text", "house", "heart-handshake", "user-round", "check", "lock", "search", "smartphone", "message-square", "badge-check", "stethoscope", "clock", "link-2", "id-card", "phone", "calendar-check", "circle-check", "map-pin", "star", "pointer", "heart-pulse", "sparkles", "truck"];
const ICONS = {};
for (const n of iconNames) {
  const f = path.join(iconDir, `${n}.js`);
  if (!fs.existsSync(f)) { console.log("missing icon", n); continue; }
  const src = fs.readFileSync(f, "utf8");
  const m = src.match(/createLucideIcon\("[^"]+", (\[[\s\S]*?\])\);\n/);
  if (!m) { console.log("cannot parse icon", n); continue; }
  const node = new Function(`return ${m[1]}`)();
  ICONS[n] = node.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== "key").map(([k, v]) => `${k}="${v}"`).join(" ")}/>`).join("");
}

const TL = { fps: FPS, total, lines, scenes, env };
fs.writeFileSync(path.join(dist, "data.js"), `window.TL = ${JSON.stringify(TL)};\nwindow.ICONS = ${JSON.stringify(ICONS)};\n`);
fs.writeFileSync(path.join(dist, "timeline.json"), JSON.stringify({ ...TL, env: undefined }, null, 2));
console.log("total", total, "s,", nFrames, "frames; icons", Object.keys(ICONS).length);
for (const l of lines) console.log(l.id, l.start.toFixed(2), l.end.toFixed(2), l.chunks.map((c) => c.text).join(" | "));
