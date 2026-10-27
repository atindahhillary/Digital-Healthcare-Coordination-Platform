// Dr. Afya: an original character, drawn in SVG and rigged for the explainer.
// Dress: fully buttoned white coat, collared blouse, stethoscope, ID badge, trousers and closed shoes.
// Local coordinate space is 600 x 1000; the figure is centred on x = 300.

const SK = { base: "#8F5B3D", light: "#B07553", dark: "#76472E", line: "#5E3822" };

// An open hand: palm, four fingers fanned slightly, and a thumb.
function openHand(sx, sy, thumbX, thumbRot) {
  const fingers = [[-24, 36, -13], [-8, 46, -4], [9, 42, 4], [24, 32, 13]];
  const f = fingers.map(([dx, len, rot]) => `<rect x="${sx + dx - 8}" y="${sy + 340}" width="16" height="${len + 28}" rx="8" fill="url(#gSkinV)" stroke="${SK.dark}" stroke-width="1.5" transform="rotate(${rot} ${sx + dx} ${sy + 346})"/>`).join("");
  return `
      <ellipse cx="${thumbX}" cy="${sy + 340}" rx="14" ry="30" fill="${SK.base}" stroke="${SK.dark}" stroke-width="1.5" transform="rotate(${thumbRot * 2.2} ${thumbX} ${sy + 330})"/>
      ${f}
      <ellipse cx="${sx}" cy="${sy + 342}" rx="35" ry="30" fill="url(#gSkinV)"/>`;
}

function armSVG(side) {
  const sx = side === "L" ? 150 : 450;
  const sy = 440;
  const thumbX = side === "L" ? sx + 31 : sx - 31;
  const thumbRot = side === "L" ? -24 : 24;
  return `
  <g id="arm${side}" style="transform-origin:${sx}px ${sy}px">
    <path d="M ${sx - 44} ${sy - 18} Q ${sx - 44} ${sy - 46} ${sx} ${sy - 46} Q ${sx + 44} ${sy - 46} ${sx + 44} ${sy - 18} L ${sx + 41} ${sy + 176} L ${sx - 41} ${sy + 176} Z" fill="url(#gSleeve)" stroke="#C9D6E0" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M ${sx - 6} ${sy - 30} Q ${sx - 12} ${sy + 60} ${sx - 10} ${sy + 170}" fill="none" stroke="#DCE6EE" stroke-width="2.5" stroke-linecap="round"/>
    <g id="fore${side}" style="transform-origin:${sx}px ${sy + 170}px">
      <path d="M ${sx - 40} ${sy + 160} L ${sx + 40} ${sy + 160} L ${sx + 37} ${sy + 300} L ${sx - 37} ${sy + 300} Z" fill="url(#gSleeve)" stroke="#C9D6E0" stroke-width="2.5" stroke-linejoin="round"/>
      <ellipse cx="${sx}" cy="${sy + 170}" rx="42" ry="22" fill="url(#gSleeve)"/>
      <path d="M ${sx - 34} ${sy + 296} L ${sx + 34} ${sy + 296} L ${sx + 32} ${sy + 322} L ${sx - 32} ${sy + 322} Z" fill="#0F9485" stroke="#0A7F73" stroke-width="2"/>
      ${side === "R" ? openHand(sx, sy, thumbX, thumbRot) : `
      <ellipse cx="${thumbX}" cy="${sy + 340}" rx="14" ry="29" fill="${SK.base}" transform="rotate(${thumbRot} ${thumbX} ${sy + 340})"/>
      <ellipse cx="${sx}" cy="${sy + 352}" rx="35" ry="41" fill="url(#gSkinV)"/>
      <path d="M ${sx - 16} ${sy + 374} L ${sx - 16} ${sy + 388} M ${sx} ${sy + 376} L ${sx} ${sy + 391} M ${sx + 16} ${sy + 374} L ${sx + 16} ${sy + 388}" stroke="${SK.line}" stroke-width="3" stroke-linecap="round" opacity=".45"/>`}
    </g>
  </g>`;
}

function characterSVG() {
  return `
<svg id="char" viewBox="0 0 600 1000" width="600" height="1000" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
<defs>
  <radialGradient id="gSkin" cx="42%" cy="36%" r="78%"><stop offset="0" stop-color="${SK.light}"/><stop offset=".58" stop-color="${SK.base}"/><stop offset="1" stop-color="${SK.dark}"/></radialGradient>
  <linearGradient id="gSkinV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9C6646"/><stop offset="1" stop-color="#7B4B31"/></linearGradient>
  <linearGradient id="gCoat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D3DFE8"/><stop offset=".2" stop-color="#FFFFFF"/><stop offset=".8" stop-color="#FFFFFF"/><stop offset="1" stop-color="#CCD9E3"/></linearGradient>
  <linearGradient id="gSleeve" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D9E4EC"/><stop offset=".3" stop-color="#FFFFFF"/><stop offset=".75" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D3DFE8"/></linearGradient>
  <radialGradient id="gHair" cx="38%" cy="28%" r="85%"><stop offset="0" stop-color="#43302A"/><stop offset=".6" stop-color="#21160F"/><stop offset="1" stop-color="#120B09"/></radialGradient>
  <linearGradient id="gMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4F7FA"/><stop offset=".5" stop-color="#B9C4CE"/><stop offset="1" stop-color="#7E8C99"/></linearGradient>
  <linearGradient id="gNavy" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#182F4E"/><stop offset=".5" stop-color="#244770"/><stop offset="1" stop-color="#182F4E"/></linearGradient>
  <clipPath id="mouthClip"><path id="mouthClipPath" d=""/></clipPath>
</defs>

<ellipse cx="300" cy="996" rx="210" ry="22" fill="rgba(6,48,47,.16)"/>

<g id="cBody" style="transform-origin:300px 700px">
  <!-- hair behind the head: a neat bun -->
  <circle cx="300" cy="86" r="68" fill="url(#gHair)"/>
  <path d="M 262 74 q 14 -26 40 -20 M 290 104 q 24 -8 40 -34 M 326 60 q 18 10 20 32" fill="none" stroke="#5A4238" stroke-width="3.5" stroke-linecap="round" opacity=".55"/>

  <!-- trousers and shoes -->
  <path d="M 186 880 L 296 880 L 290 972 L 196 972 Z" fill="url(#gNavy)"/>
  <path d="M 304 880 L 414 880 L 404 972 L 310 972 Z" fill="url(#gNavy)"/>
  <path d="M 178 966 Q 176 1000 236 1000 Q 296 1000 296 976 L 296 966 Z" fill="#1A1D24"/>
  <path d="M 304 966 L 304 976 Q 304 1000 364 1000 Q 424 1000 422 966 Z" fill="#1A1D24"/>

  <!-- white coat -->
  <path d="M 255 368 C 215 376 160 386 140 424 C 126 450 126 520 124 610 L 114 906 C 190 930 410 930 486 906 L 476 610 C 474 520 474 450 460 424 C 440 386 385 376 345 368 Z" fill="url(#gCoat)" stroke="#C9D6E0" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M 300 560 L 300 912" stroke="#D3DEE7" stroke-width="3"/>
  <path d="M 196 906 C 200 800 190 700 196 620 M 404 906 C 400 800 410 700 404 620" fill="none" stroke="#E3EBF1" stroke-width="3" stroke-linecap="round"/>

  <!-- blouse under the coat, closed at the neck -->
  <path d="M 258 372 L 342 372 L 300 566 Z" fill="#0F9485"/>
  <path d="M 300 372 L 300 566" stroke="#0A7F73" stroke-width="3"/>
  <circle cx="300" cy="440" r="6" fill="#E9F7F4"/><circle cx="300" cy="500" r="6" fill="#E9F7F4"/>

  <!-- coat lapels -->
  <path d="M 258 372 L 220 396 L 252 430 L 290 458 L 300 566 L 262 470 Z" fill="#FFFFFF" stroke="#C9D6E0" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M 342 372 L 380 396 L 348 430 L 310 458 L 300 566 L 338 470 Z" fill="#FFFFFF" stroke="#C9D6E0" stroke-width="2.5" stroke-linejoin="round"/>

  <!-- coat buttons -->
  <g fill="#EEF3F7" stroke="#B5C2CD" stroke-width="2.5">
    <circle cx="300" cy="604" r="10"/><circle cx="300" cy="694" r="10"/><circle cx="300" cy="784" r="10"/>
  </g>

  <!-- pockets -->
  <path d="M 156 700 L 250 700 L 252 770 Q 204 778 158 770 Z" fill="none" stroke="#C9D6E0" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M 350 700 L 444 700 L 442 770 Q 396 778 348 770 Z" fill="none" stroke="#C9D6E0" stroke-width="2.5" stroke-linejoin="round"/>
  <!-- breast pocket with pen -->
  <path d="M 348 500 L 428 500 L 426 566 Q 388 574 350 566 Z" fill="#FFFFFF" stroke="#C9D6E0" stroke-width="2.5" stroke-linejoin="round"/>
  <rect x="378" y="470" width="9" height="62" rx="4.5" fill="#2F6DB5"/><rect x="378" y="470" width="9" height="14" rx="4" fill="#1E4F88"/>
  <rect x="394" y="480" width="8" height="52" rx="4" fill="#C9402F"/>

  <!-- ID badge -->
  <g id="badge">
    <path d="M 214 474 L 214 504" stroke="#7E8C99" stroke-width="4" stroke-linecap="round"/>
    <rect x="186" y="498" width="86" height="116" rx="12" fill="#FFFFFF" stroke="#B5C2CD" stroke-width="2.5"/>
    <path d="M 186 510 Q 186 498 198 498 L 260 498 Q 272 498 272 510 L 272 526 L 186 526 Z" fill="#0A7F73"/>
    <path d="M 205 513 h 14 M 212 506 v 14" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    <circle cx="229" cy="560" r="17" fill="url(#gSkin)"/>
    <path d="M 212 566 Q 214 540 229 540 Q 244 540 246 566 Q 229 548 212 566 Z" fill="#21160F"/>
    <rect x="200" y="586" width="58" height="6" rx="3" fill="#0B1B2B" opacity=".75"/>
    <rect x="208" y="598" width="42" height="5" rx="2.5" fill="#6B7C93" opacity=".6"/>
  </g>

  <!-- stethoscope draped around the neck -->
  <g id="steth">
    <path d="M 254 378 C 230 468 258 556 300 580 C 342 556 370 468 346 378" fill="none" stroke="#1D2630" stroke-width="11" stroke-linecap="round"/>
    <path d="M 254 378 C 230 468 258 556 300 580 C 342 556 370 468 346 378" fill="none" stroke="#47566A" stroke-width="3" stroke-linecap="round" transform="translate(-2 -1)"/>
    <path d="M 300 580 L 300 612" stroke="#1D2630" stroke-width="9" stroke-linecap="round"/>
    <circle cx="300" cy="632" r="24" fill="url(#gMetal)" stroke="#6D7B88" stroke-width="3"/>
    <circle cx="300" cy="632" r="12" fill="#CBD5DD" stroke="#7E8C99" stroke-width="2.5"/>
  </g>

  <!-- tablet held at the waist -->
  <g id="tablet" transform="rotate(-5 335 668)">
    <rect x="248" y="598" width="178" height="132" rx="18" fill="#17283A"/>
    <rect x="258" y="608" width="158" height="112" rx="10" fill="#EAF8F6"/>
    <rect x="258" y="608" width="158" height="34" rx="10" fill="#0A7F73"/>
    <path d="M 276 625 h 22 M 287 614 v 22" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <rect x="310" y="620" width="84" height="9" rx="4.5" fill="#fff" opacity=".8"/>
    <rect x="272" y="660" width="120" height="9" rx="4.5" fill="#9FE9DC"/>
    <rect x="272" y="680" width="90" height="9" rx="4.5" fill="#CFF5EE"/>
    <rect x="272" y="700" width="104" height="9" rx="4.5" fill="#CFF5EE"/>
  </g>

  ${armSVG("L")}
  ${armSVG("R")}

  <!-- neck, collar -->
  <path d="M 268 322 L 332 322 L 334 392 Q 300 416 266 392 Z" fill="url(#gSkinV)"/>
  <path d="M 268 372 Q 300 404 332 372 L 332 392 Q 300 416 268 392 Z" fill="#6B4129" opacity=".35"/>
  <path d="M 258 372 L 296 408 L 274 424 L 246 392 Z" fill="#12A595" stroke="#0A7F73" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M 342 372 L 304 408 L 326 424 L 354 392 Z" fill="#12A595" stroke="#0A7F73" stroke-width="2.5" stroke-linejoin="round"/>
</g>

<!-- head -->
<g id="cHead" style="transform-origin:300px 360px">
  <path d="M 200 236 C 200 150 250 118 300 118 C 350 118 400 150 400 236 C 400 306 352 354 300 354 C 248 354 200 306 200 236 Z" fill="url(#gSkin)"/>
  <ellipse cx="198" cy="246" rx="17" ry="29" fill="${SK.base}"/><ellipse cx="402" cy="246" rx="17" ry="29" fill="${SK.base}"/>
  <ellipse cx="199" cy="248" rx="8" ry="16" fill="${SK.dark}" opacity=".55"/><ellipse cx="401" cy="248" rx="8" ry="16" fill="${SK.dark}" opacity=".55"/>
  <circle cx="198" cy="276" r="6" fill="#E6B84A"/><circle cx="402" cy="276" r="6" fill="#E6B84A"/>
  <path d="M 200 236 C 200 150 250 118 300 118 C 350 118 400 150 400 236 C 400 306 352 354 300 354 C 248 354 200 306 200 236 Z" fill="none"/>

  <!-- hair front -->
  <path d="M 194 236 C 186 140 244 98 300 98 C 356 98 414 140 406 236 C 394 194 374 170 342 162 C 318 156 282 156 258 162 C 226 170 206 194 194 236 Z" fill="url(#gHair)"/>
  <path d="M 232 150 q 26 -26 64 -26 M 304 124 q 40 0 72 34" fill="none" stroke="#5A4238" stroke-width="3.5" stroke-linecap="round" opacity=".5"/>
  <ellipse cx="300" cy="128" rx="54" ry="11" fill="#0A7F73"/><ellipse cx="300" cy="125" rx="54" ry="8" fill="#12A595"/>

  <!-- eyebrows -->
  <path id="browL" d="M 222 210 Q 252 190 284 206" fill="none" stroke="#1B120E" stroke-width="9" stroke-linecap="round" style="transform-origin:253px 205px"/>
  <path id="browR" d="M 316 206 Q 348 190 378 210" fill="none" stroke="#1B120E" stroke-width="9" stroke-linecap="round" style="transform-origin:347px 205px"/>

  <!-- eyes -->
  <g id="eyeL" style="transform-origin:254px 246px">
    <ellipse cx="254" cy="246" rx="26" ry="28" fill="#fff"/>
    <g id="irisL"><circle cx="254" cy="248" r="18" fill="#4A2C1D"/><circle cx="254" cy="248" r="10" fill="#120A07"/><circle cx="261" cy="240" r="5.5" fill="#fff"/><circle cx="248" cy="256" r="2.8" fill="#fff" opacity=".8"/></g>
    <path d="M 227 242 Q 254 212 281 242" fill="none" stroke="#1B120E" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M 228 240 q -9 0 -13 -9" fill="none" stroke="#1B120E" stroke-width="4.5" stroke-linecap="round"/>
  </g>
  <g id="eyeR" style="transform-origin:346px 246px">
    <ellipse cx="346" cy="246" rx="26" ry="28" fill="#fff"/>
    <g id="irisR"><circle cx="346" cy="248" r="18" fill="#4A2C1D"/><circle cx="346" cy="248" r="10" fill="#120A07"/><circle cx="353" cy="240" r="5.5" fill="#fff"/><circle cx="340" cy="256" r="2.8" fill="#fff" opacity=".8"/></g>
    <path d="M 319 242 Q 346 212 373 242" fill="none" stroke="#1B120E" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M 372 240 q 9 0 13 -9" fill="none" stroke="#1B120E" stroke-width="4.5" stroke-linecap="round"/>
  </g>

  <!-- nose and cheeks -->
  <path d="M 289 286 Q 300 297 311 286" fill="none" stroke="#5E3822" stroke-width="4.5" stroke-linecap="round" opacity=".75"/>
  <ellipse cx="300" cy="276" rx="9" ry="6" fill="#C48A67" opacity=".55"/>
  <ellipse cx="236" cy="292" rx="22" ry="13" fill="#E0725F" opacity=".26"/><ellipse cx="364" cy="292" rx="22" ry="13" fill="#E0725F" opacity=".26"/>

  <!-- mouth (path set every frame from the narration) -->
  <g id="mouth" transform="translate(300 320)">
    <path id="mouthInner" d="" fill="#5B1A22"/>
    <g clip-path="url(#mouthClip)"><rect id="teeth" x="-40" y="-12" width="80" height="14" rx="4" fill="#fff"/><ellipse id="tongue" cx="0" cy="20" rx="17" ry="9" fill="#D9707A"/></g>
    <path id="mouthLip" d="" fill="none" stroke="#8A3A33" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round"/>
    <path id="mouthSmile" d="M -36 -5 Q 0 17 36 -5" fill="none" stroke="#8A3A33" stroke-width="6" stroke-linecap="round"/>
  </g>
</g>
</svg>`;
}

// blink moments (seconds)
const BLINKS = [];
for (let t = 1.9; t < TL.total; t += 3.1 + (Math.round(t * 7) % 3) * 0.45) BLINKS.push(+t.toFixed(2));

function lipSync(t) {
  const f = Math.min(TL.env.length - 1, Math.max(0, Math.round(t * TL.fps)));
  const m = TL.env[f] || 0;
  const v = Math.sin(f * 0.83) * 0.5 + 0.5;
  const open = Math.pow(m, 0.85);
  const q = (id) => document.getElementById(id);
  if (open < 0.07) {
    q("mouthInner").setAttribute("d", "");
    q("mouthClipPath").setAttribute("d", "");
    q("mouthLip").setAttribute("d", "");
    q("mouthSmile").style.opacity = 1;
    q("teeth").style.opacity = 0; q("tongue").style.opacity = 0;
    return;
  }
  const w = 34 - 7 * open + 6 * v * open;
  const cy = -5;
  const dn = 6 + 36 * open;
  const d = `M ${-w} ${cy} Q ${-w * 0.5} ${-10 - 2 * open} 0 -8 Q ${w * 0.5} ${-10 - 2 * open} ${w} ${cy} Q ${w * 0.88} ${cy + dn} 0 ${cy + dn + 3} Q ${-w * 0.88} ${cy + dn} ${-w} ${cy} Z`;
  q("mouthInner").setAttribute("d", d);
  q("mouthClipPath").setAttribute("d", d);
  q("mouthLip").setAttribute("d", d);
  q("mouthSmile").style.opacity = 0;
  q("teeth").style.opacity = 1; q("tongue").style.opacity = 1;
  q("tongue").setAttribute("cy", String(cy + dn * 0.72));
}

function characterFrame(t, gaze) {
  lipSync(t);
  const f = Math.round(t * TL.fps);
  const m = TL.env[Math.min(TL.env.length - 1, f)] || 0;
  const q = (id) => document.getElementById(id);
  // head: gentle sway, nod on emphasis
  const sway = Math.sin(t * 1.3) * 1.6 + Math.sin(t * 0.5) * 1.2;
  const nod = m * 2.2;
  q("cHead").style.transform = `translateY(${(m * 2.4 + Math.sin(t * 2.1) * 1.2).toFixed(2)}px) rotate(${(sway + nod * 0.3).toFixed(2)}deg)`;
  q("cBody").style.transform = `scale(1, ${(1 + Math.sin(t * 1.9) * 0.004).toFixed(4)})`;
  // blink
  let b = 1;
  for (const s of BLINKS) { const d = t - s; if (d > 0 && d < 0.2) b = 1 - Math.sin((d / 0.2) * Math.PI) * 0.93; }
  q("eyeL").style.transform = `scaleY(${b.toFixed(3)})`;
  q("eyeR").style.transform = `scaleY(${b.toFixed(3)})`;
  // eyebrows lift while speaking up
  const lift = (m > 0.55 ? -5 : 0) + Math.sin(t * 0.9) * 0.8;
  q("browL").style.transform = `translateY(${lift.toFixed(2)}px)`;
  q("browR").style.transform = `translateY(${lift.toFixed(2)}px)`;
  // gaze: -1 left .. 1 right
  const gx = (gaze * 6).toFixed(2), gy = (Math.abs(gaze) * 1.5).toFixed(2);
  q("irisL").style.transform = `translate(${gx}px, ${gy}px)`;
  q("irisR").style.transform = `translate(${gx}px, ${gy}px)`;
}

// The right arm (viewer's right) waves and gestures; the left arm holds the tablet.
// Angles are sampled for every video frame, so the motion is exact when frames are rendered one by one.
function rigArms(total) {
  const sc = TL.scenes;
  const N = Math.ceil(total * TL.fps);
  const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const mix = (a, b, k) => a + (b - a) * k;
  const g0 = sc.outro.start + 1.9;
  const pose = (t) => {
    const m = TL.env[Math.min(TL.env.length - 1, Math.round(t * TL.fps))] || 0;
    const rest = [-8, 6];
    const wv = [-62, -128 + 12 * Math.sin(t * 7.5)];
    const tk = [-32 + 2 * Math.sin(t * 1.7), -148 + 8 * Math.sin(t * 2.3) - 9 * m];
    let p = rest;
    let k = ss(0.5, 0.95, t);
    p = [mix(p[0], wv[0], k), mix(p[1], wv[1], k)];
    k = ss(4.2, 5.0, t);
    p = [mix(p[0], tk[0], k), mix(p[1], tk[1], k)];
    k = ss(g0 - 0.5, g0, t);
    p = [mix(p[0], wv[0], k), mix(p[1], wv[1], k)];
    return p;
  };
  const up = [], fo = [], upL = [], foL = [];
  for (let i = 0; i <= N; i++) {
    const t = i / TL.fps, off = i / N;
    const [u, f] = pose(t);
    up.push({ offset: off, transform: `rotate(${u.toFixed(2)}deg)` });
    fo.push({ offset: off, transform: `rotate(${f.toFixed(2)}deg)` });
    upL.push({ offset: off, transform: `rotate(${(10 + Math.sin(t * 1.1) * 1.2).toFixed(2)}deg)` });
    foL.push({ offset: off, transform: `rotate(${(-90 + Math.sin(t * 1.4) * 2).toFixed(2)}deg)` });
  }
  const play = (id, frames) => A(document.getElementById(id), frames, 0, total, { easing: "linear" });
  play("armR", up); play("foreR", fo); play("armL", upL); play("foreL", foL);
}
