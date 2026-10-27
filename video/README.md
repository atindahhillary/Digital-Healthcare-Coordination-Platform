# Dr. Afya explainer video

The landing page video is made from code, so changing the story means editing text and re-rendering, not re-shooting.

- `script.json`: the narration, one line per sentence, tagged by scene.
- `synthesize-edge.cjs`: current narration, in the Kenyan English voice Asilia at +10% speed, through the `edge-tts` Python package (Microsoft's online voice service; install it in a virtual environment). The text is sent to Microsoft. Unofficial service, so move to Azure Speech before a commercial launch.
- `synthesize.ps1`: the earlier offline alternative, the built-in Windows voice (Zira).
- `build-audio.cjs`: trims and mixes the lines, builds caption timings, a lip-sync envelope and the icon set (`dist/data.js`).
- `explainer.html`, `stage.css`, `lib.js`, `character.js`, `scenes.js`: the animated scenes and the character. Every animation is seeked by time, so frames render exactly.
- `render.cjs`: renders every frame with Playwright (Edge), or single stills for review.

## Rebuild

```bash
node video/synthesize-edge.cjs <edge-tts exe> <audio dir> en-KE-AsiliaNeural +10%
node video/build-audio.cjs <audio dir>
PW=<path to playwright> node video/render.cjs stills <dir> 3 13 26      # look at a few moments first
PW=<path to playwright> node video/render.cjs frames <frames dir> 4
ffmpeg -framerate 30 -i <frames dir>/f%05d.jpg -i video/dist/narration.wav -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k -shortest public/video/afyaconnect-explainer-v3-720.mp4
```

Give a new cut a new file name (`-v3-`) and point `src/components/ExplainerVideo.tsx` at it. The files are cached by name,
so a new name is how installed apps get the new video.

The character, Dr. Afya, is original. She wears a fully buttoned white coat over a collared blouse, with a stethoscope and an ID badge.
