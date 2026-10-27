# Dr. Afya explainer video

The landing page video is made from code, so changing the story means editing text and re-rendering, not re-shooting.

- `script.json`: the narration, one line per sentence, tagged by scene.
- `synthesize.ps1`: turns each line into a wav with the built-in Windows voice (Zira).
- `build-audio.cjs`: trims and mixes the lines, builds caption timings, a lip-sync envelope and the icon set (`dist/data.js`).
- `explainer.html`, `stage.css`, `lib.js`, `character.js`, `scenes.js`: the animated scenes and the character. Every animation is seeked by time, so frames render exactly.
- `render.cjs`: renders every frame with Playwright (Edge), or single stills for review.

## Rebuild

```bash
powershell -NoProfile -File video/synthesize.ps1 -Out <audio dir>
node video/build-audio.cjs <audio dir>
PW=<path to playwright> node video/render.cjs stills <dir> 3 13 26      # look at a few moments first
PW=<path to playwright> node video/render.cjs frames <frames dir> 4
ffmpeg -framerate 30 -i <frames dir>/f%05d.jpg -i video/dist/narration.wav -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k -shortest public/video/afyaconnect-explainer-v2-720.mp4
```

Give a new cut a new file name (`-v2-`) and point `src/components/ExplainerVideo.tsx` at it. The files are cached by name,
so a new name is how installed apps get the new video.

The character, Dr. Afya, is original. She wears a fully buttoned white coat over a collared blouse, with a stethoscope and an ID badge.
