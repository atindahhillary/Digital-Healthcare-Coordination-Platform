// Renders explainer.html frame by frame with Playwright (Edge).
//   PW=<path to playwright> node render.cjs stills <outDir> <t1> <t2> ...     one PNG per time (seconds)
//   PW=<path to playwright> node render.cjs frames <outDir> [workers]          every frame as JPEG, for ffmpeg
const path = require("path");
const fs = require("fs");
const { chromium } = require(process.env.PW || "playwright");

const [, , mode, outDir, ...rest] = process.argv;
const url = "file:///" + path.join(__dirname, "explainer.html").replace(/\\/g, "/");

async function open(browser) {
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.log("console error:", m.text()); });
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  return page;
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge" });
  if (mode === "stills") {
    const page = await open(browser);
    for (const t of rest.map(Number)) {
      await page.evaluate((x) => window.frame(x), t);
      await page.screenshot({ path: path.join(outDir, `t${String(t).replace(".", "_")}.png`) });
    }
  } else {
    const workers = Number(rest[0] || 4);
    const pages = await Promise.all(Array.from({ length: workers }, () => open(browser)));
    const { total, fps } = await pages[0].evaluate(() => ({ total: window.TL.total, fps: window.TL.fps }));
    const N = Math.ceil(total * fps);
    let next = 0;
    const t0 = Date.now();
    await Promise.all(pages.map(async (page) => {
      for (;;) {
        const f = next++;
        if (f >= N) break;
        await page.evaluate((x) => window.frame(x), f / fps);
        await page.screenshot({ path: path.join(outDir, `f${String(f).padStart(5, "0")}.jpg`), type: "jpeg", quality: 92 });
        if (f % 200 === 0) console.log("frame", f, "/", N, Math.round((Date.now() - t0) / 1000) + "s");
      }
    }));
    console.log("done", N, "frames in", Math.round((Date.now() - t0) / 1000) + "s");
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
