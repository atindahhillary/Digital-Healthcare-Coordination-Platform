// Narration in a natural Kenyan English neural voice, via the edge-tts Python package (Microsoft Edge's online voice service).
// The narration text is sent to Microsoft's servers. Run once, then build-audio.cjs picks up the wav files.
//   node synthesize-edge.cjs <path to edge-tts executable> <out dir> [voice] [rate, e.g. +5%]
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const [, , exe, out, voice = "en-KE-AsiliaNeural", rate = "+0%"] = process.argv;
if (!exe || !out) { console.error("usage: node synthesize-edge.cjs <edge-tts exe> <out dir> [voice] [rate]"); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const script = JSON.parse(fs.readFileSync(path.join(__dirname, "script.json"), "utf8"));

for (const l of script.lines) {
  const mp3 = path.join(out, `${l.id}.mp3`);
  execFileSync(exe, ["--voice", voice, `--rate=${rate}`, "--text", l.text, "--write-media", mp3], { stdio: ["ignore", "ignore", "inherit"] });
  // build-audio.cjs reads 24 kHz mono wav files
  execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", mp3, "-ar", "24000", "-ac", "1", path.join(out, `${l.id}.wav`)]);
  const d = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).toString().trim();
  console.log(l.id, Number(d).toFixed(2) + "s", l.text);
}
