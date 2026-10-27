// Renders Dr. Afya alone, on a transparent background, for the landing page (public/img/hero-dr-afya.webp).
//   PW=<path to playwright> node hero-art.cjs <out png>
// Picks a moment where she is mid-wave with a closed smile and open eyes.
const path = require("path");
const { chromium } = require(process.env.PW || "playwright");

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 2 });
  await page.goto("file:///" + path.join(__dirname, "explainer.html").replace(/\\/g, "/") + "?hero");
  await page.evaluate(() => document.fonts.ready);
  const t = await page.evaluate(() => {
    for (let f = 36; f < 130; f++) {
      const t = f / TL.fps;
      const open = TL.env[f] === 0 && TL.env[f - 1] === 0 && TL.env[f + 1] === 0;
      const blinking = BLINKS.some((b) => t - b > -0.05 && t - b < 0.3);
      if (open && !blinking) return t;
    }
    return 3.1;
  });
  console.log("frame at", t.toFixed(2), "s");
  await page.evaluate((x) => window.frame(x), t);
  await page.screenshot({ path: process.argv[2], omitBackground: true, clip: { x: 0, y: 360, width: 720, height: 760 } });
  await browser.close();
})();
