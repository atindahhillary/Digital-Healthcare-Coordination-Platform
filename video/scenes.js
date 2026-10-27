// Scenes, captions, background and the frame(t) entry point. Times come from dist/data.js.
const S = TL.scenes;
const UI = document.getElementById("ui");
const TOTAL = TL.total;
const KEYS = ["Dr. Afya", "AfyaConnect", "phone number", "specialist", "verified", "booking request", "video link", "text message", "in the app", "health record", "prescription", "pharmacy", "Create your account", "any time", "confirming your booking", "two minutes", "ID", "One.", "Two.", "Three.", "Four.", "Five."];
const keyRe = new RegExp("(" + KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "g");

// ---------- background ----------
document.getElementById("bg").innerHTML = `
<svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EAF8FF"/><stop offset="1" stop-color="#BFE6F5"/></linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C5E4DE"/><stop offset="1" stop-color="#A9D3CB"/></linearGradient>
    <radialGradient id="sun" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <circle cx="110" cy="470" r="240" fill="#9FE9DC" opacity=".25"/>
  <circle cx="650" cy="1010" r="280" fill="#BFE6F5" opacity=".4"/>
  <circle cx="560" cy="150" r="200" fill="url(#sun)"/>
  <g id="bgwin">
    <rect x="474" y="372" width="214" height="318" rx="20" fill="url(#glass)" stroke="#fff" stroke-width="8"/>
    <path d="M 581 372 V 690 M 474 531 H 688" stroke="#fff" stroke-width="8"/>
    <rect x="462" y="684" width="238" height="20" rx="10" fill="#fff" opacity=".9"/>
    <path d="M 500 690 q 20 -90 90 -120 q -10 80 -90 120 z" fill="#8FD6C9" opacity=".7"/>
  </g>
  <rect x="0" y="1062" width="720" height="218" fill="url(#floor)"/>
  <rect x="0" y="1054" width="720" height="14" fill="#fff" opacity=".85"/>
  <g id="bgplant">
    <path d="M 568 1068 h 120 l -14 128 h -92 z" fill="#E07B4F"/>
    <path d="M 628 1070 q -80 -140 -110 -150 q 10 100 110 150 M 628 1070 q 60 -150 110 -150 q -10 110 -110 150 M 628 1070 q -10 -170 20 -230 q 40 100 -20 230" fill="#5DBB8F"/>
  </g>
</svg>`;
// parallax drift so the still parts of the frame are not dead
A(document.getElementById("bgwin"), [{ transform: "translateY(0)" }, { transform: "translateY(-6px)" }], 0, TOTAL, { easing: "linear" });
// the window only shows behind the big presenter (intro and outro); the cards cover it otherwise
{
  const o = (t, v) => ({ offset: Math.min(1, Math.max(0, t / TOTAL)), opacity: v });
  for (const id of ["bgwin", "bgplant"]) A(document.getElementById(id), [o(0, 1), o(S.register.start - 0.5, 1), o(S.register.start, 0), o(S.outro.start - 0.3, 0), o(S.outro.start + 0.3, 1), o(TOTAL, 1)], 0, TOTAL, { easing: "linear" });
}

// ---------- character ----------
const charbox = document.createElement("div");
charbox.style.cssText = "position:absolute;left:0;top:0;width:600px;height:1000px;transform-origin:0 0;";
charbox.innerHTML = characterSVG();
document.getElementById("charwrap").append(charbox);
const BIG = { x: 60, y: 372, s: 1 }, SMALL = { x: -22, y: 744, s: 0.7 };
const tf = (p) => `translate(${p.x}px, ${p.y}px) scale(${p.s})`;
{
  const k = (t, p) => ({ offset: Math.min(1, t / TOTAL), transform: tf(p), easing: "cubic-bezier(.5,0,.2,1)" });
  A(charbox, [
    k(0, BIG), k(S.register.start - 0.55, BIG), k(S.register.start + 0.15, SMALL),
    k(S.nav.end + 0.1, SMALL), k(S.outro.start + 0.4, BIG), k(TOTAL, BIG),
  ], 0, TOTAL, { easing: "linear" });
}
rigArms(TOTAL);
const gazeAt = (t) => (t > S.register.start && t < S.nav.end + 0.2 ? (Math.sin(t * 0.75) > -0.35 ? 0.85 : 0.1) : 0);

// ---------- scene shells ----------
function scene(name, chipHtml, keepAtEnd = false) {
  const s = S[name];
  const box = el(`<div class="scene" id="s-${name}"></div>`);
  UI.append(box);
  const t0 = s.start - 0.3;
  A(box, [{ opacity: 0 }, { opacity: 1 }], t0, 0.3, { easing: "ease" });
  if (!keepAtEnd) A(box, [{ opacity: 1 }, { opacity: 0 }], s.end + 0.3, 0.3, { easing: "ease", fill: "forwards" });
  if (chipHtml) { const c = el(`<div class="chip"><span>${chipHtml}</span></div>`); box.append(c); pop(c, t0 + 0.1, { y: -18 }); }
  return box;
}
const card = (box, x, y, w, h, html) => { const c = el(`<div class="card" style="left:${x}px;top:${y}px;width:${w}px;${h ? `height:${h}px;` : ""}">${html}</div>`); box.append(c); return c; };
const step = (n) => `<i>${n}</i>`;

// ---------- 0 intro ----------
{
  const box = scene("intro", `${icon("heart-pulse", 26)} Meet Dr. Afya`);
  const tiles = [
    ["calendar-days", "Book a specialist", 24, 410, 0.32], ["video", "Video visits", 24, 566, 0.5],
    ["file-text", "Health record", 496, 410, 0.68], ["pill", "Prescription reminders", 496, 566, 0.84],
  ];
  for (const [ic, label, x, y, f] of tiles) {
    const b = el(`<div class="card" style="left:${x}px;top:${y}px;width:200px;height:134px;padding:16px;border-radius:28px;text-align:center"><div style="width:52px;height:52px;margin:0 auto 8px;border-radius:50%;background:#E4F8F4;color:#0A7F73;display:grid;place-items:center">${icon(ic, 28)}</div><div style="font-size:22px;font-weight:800;line-height:1.12;letter-spacing:-.01em">${label}</div></div>`);
    box.append(b);
    pop(b, T("b", f), { x: x < 300 ? -30 : 30, y: 10 });
  }
}

// ---------- 1 register ----------
{
  const box = scene("register", `${step(1)} Register`);
  const c = card(box, 40, 326, 640, 0, `
    <div class="row" style="margin-bottom:14px"><div style="width:50px;height:50px;border-radius:16px;background:#E4F8F4;color:#0A7F73;display:grid;place-items:center">${icon("id-card", 28)}</div><div class="h">Create your account</div></div>
    <div class="field"><span class="lab" style="width:150px">Name</span><span class="val"><span class="type" id="t1">Grace Wambui</span></span></div>
    <div class="field"><span class="lab" style="width:150px">Phone</span><span class="val"><span class="type" id="t2">+254 712 345 678</span></span></div>
    <div class="field"><span class="lab" style="width:150px">ID number</span><span class="val"><span class="type" id="t3">•••••• 5678</span></span></div>
    <div style="position:relative;height:72px;margin-top:16px">
      <div class="btn" id="b1" style="position:absolute;inset:0">${icon("shield-check", 30, 2.4)} Verify my ID</div>
      <div class="btn" id="b2" style="position:absolute;inset:0;background:linear-gradient(180deg,#22B573,#0F8F55);box-shadow:0 10px 22px rgba(15,143,85,.35)">${icon("circle-check", 30, 2.4)} ID verified</div>
    </div>`);
  pop(c, T("c", 0.02));
  const q = (id) => c.querySelector("#" + id);
  typed(q("t1"), T("c", 0.2), 0.8);
  typed(q("t2"), T("c", 0.34), 1.0);
  typed(q("t3"), T("c", 0.5), 0.7);
  const tp = T("c", 0.72);
  tap(box, 360, 640, tp);
  A(q("b1"), [{ transform: "scale(1)" }, { transform: "scale(.95)" }, { transform: "scale(1)" }], tp, 0.25, { easing: "ease-in-out" });
  A(q("b1"), [{ opacity: 1 }, { opacity: 0 }], tp + 0.3, 0.2, { easing: "ease", fill: "forwards" });
  A(q("b2"), [{ opacity: 0 }, { opacity: 0 }], 0, tp + 0.3, { fill: "both" });
  A(q("b2"), [{ opacity: 0, transform: "scale(.9)" }, { opacity: 1, transform: "scale(1)" }], tp + 0.3, 0.35, { easing: ease.pop, fill: "forwards" });
  const safe = el(`<div class="bubble notif" style="left:392px;top:790px;width:300px"><div class="row" style="gap:12px;align-items:flex-start"><span style="color:#0A7F73;margin-top:2px">${icon("lock", 30)}</span><span>Your full ID number is never stored.</span></div></div>`);
  box.append(safe);
  pop(safe, T("c", 0.88), { x: 30, y: 10 });
}

// ---------- 2 book ----------
{
  const box = scene("book", `${step(2)} Book`);
  const a = card(box, 40, 322, 640, 166, `
    <div class="row" style="align-items:flex-start;gap:20px"><div class="avatar">AO</div>
      <div style="flex:1"><div class="h" style="font-size:30px">Dr. Amina Odhiambo</div><div class="mute" style="font-size:23px;margin-top:6px">Rheumatology · Upper Hill</div>
      <div class="row" style="gap:10px;margin-top:12px;flex-wrap:nowrap"><span class="tag ok" style="padding:6px 14px;font-size:20px">${icon("badge-check", 20, 2.6)} Verified</span><span class="tag teal" style="padding:6px 14px;font-size:20px">${icon("clock", 20, 2.6)} 97% on time</span></div></div></div>`);
  pop(a, T("d", 0.03));
  const b = card(box, 40, 504, 640, 214, `
    <div class="lab">Pick a time</div>
    <div class="row" style="gap:12px;margin-top:10px;flex-wrap:nowrap" id="slots"><div class="slot" id="sl1">Thu 10:30</div><div class="slot">Fri 14:00</div><div class="slot">Mon 09:00</div></div>
    <div style="position:relative;height:66px;margin-top:16px">
      <div class="btn" id="rq1" style="position:absolute;inset:0;height:66px">${icon("calendar-check", 30, 2.4)} Request booking</div>
      <div class="btn" id="rq2" style="position:absolute;inset:0;height:66px;background:linear-gradient(180deg,#22B573,#0F8F55);box-shadow:0 10px 22px rgba(15,143,85,.35)">${icon("circle-check", 30, 2.4)} Request sent</div>
    </div>`);
  pop(b, T("d", 0.3));
  const sl = b.querySelector("#sl1");
  const ts = T("d", 0.52);
  tap(box, 130, 590, ts);
  A(sl, [{ background: "#fff", borderColor: "#E1EAF0", color: "#0B1B2B" }, { background: "#0A7F73", borderColor: "#0A7F73", color: "#fff" }], ts, 0.25, { easing: "ease" });
  const tr = T("d", 0.84);
  tap(box, 360, 668, tr);
  A(b.querySelector("#rq1"), [{ opacity: 1 }, { opacity: 0 }], tr + 0.1, 0.2, { easing: "ease", fill: "forwards" });
  A(b.querySelector("#rq2"), [{ opacity: 0 }, { opacity: 0 }], 0, tr + 0.1, { fill: "both" });
  A(b.querySelector("#rq2"), [{ opacity: 0, transform: "scale(.92)" }, { opacity: 1, transform: "scale(1)" }], tr + 0.1, 0.35, { easing: ease.pop, fill: "forwards" });
}

// ---------- 3 confirm ----------
{
  const box = scene("confirm", `${step(3)} Confirm`);
  const c = card(box, 40, 326, 640, 0, `
    <div class="row" style="gap:18px"><div class="avatar" style="width:76px;height:76px;font-size:28px">AO</div><div style="flex:1"><div class="h" style="font-size:29px">Dr. Amina confirmed</div><div class="mute" style="font-size:23px;margin-top:4px">Thu 10:30 · Video visit</div></div><span class="tag ok" id="cf">${icon("check", 22, 3)} Confirmed</span></div>
    <div class="lab" style="margin-top:20px">Video link</div>
    <div class="field" id="lk" style="gap:12px;height:66px"><span style="color:#0A7F73">${icon("link-2", 30)}</span><span class="val" style="font-size:21px">afyaconnect-ke.vercel.app/room/4f2-9a1c</span></div>
    <div class="row" id="rm" style="margin-top:20px;gap:14px"><span style="color:#E07B1F">${icon("bell-ring", 32)}</span><span style="font-size:25px;font-weight:700;line-height:1.25">Reminders go to you and Dr. Amina</span></div>`);
  pop(c, T("e", 0.02));
  pop(c.querySelector("#cf"), T("e", 0.22), { y: 0, scale: 0.6 });
  pop(c.querySelector("#lk"), T("e", 0.4), { y: 14 });
  pop(c.querySelector("#rm"), T("e", 0.55), { y: 14 });
  const sms = el(`<div class="bubble sms" style="left:380px;top:770px;width:312px;font-size:23px;overflow-wrap:anywhere"><div class="lab" style="font-size:18px;margin-bottom:6px">Text message</div><b>AfyaConnect:</b> Visit with Dr. Amina confirmed, Thu 10:30. Join: afyaconnect-ke.vercel.app/room/4f2-9a1c</div>`);
  const nt = el(`<div class="bubble notif" style="left:380px;top:1036px;width:312px"><div class="row" style="gap:12px;align-items:flex-start"><span style="color:#E07B1F;margin-top:2px">${icon("bell-ring", 30)}</span><span><b style="color:#0B1B2B">In the app</b><br>Your visit starts in 2 hours</span></div></div>`);
  box.append(sms, nt);
  pop(sms, T("e", 0.62), { x: 30, y: 10 });
  pop(nt, T("e", 0.84), { x: 30, y: 10 });
}

// ---------- 4 record ----------
{
  const box = scene("record", `${step(4)} Your record`);
  const c = card(box, 40, 326, 640, 0, `
    <div class="row" style="margin-bottom:14px"><div style="width:50px;height:50px;border-radius:16px;background:#E4F8F4;color:#0A7F73;display:grid;place-items:center">${icon("file-text", 28)}</div><div class="h">Health record</div><span class="tag teal" style="margin-left:auto">Updated today</span></div>
    <div id="r1" style="border-top:2px solid #EEF3F6;padding-top:14px"><div class="lab" style="font-size:19px">Visit summary · Dr. Amina</div><div style="font-size:25px;line-height:1.3;font-weight:600;margin-top:6px">Joint pain improved. Keep taking your medicine. Kidney tests before the next visit.</div></div>
    <div id="r2" class="row" style="border-top:2px solid #EEF3F6;margin-top:14px;padding-top:14px"><span style="color:#E07B1F">${icon("pill", 32)}</span><div style="flex:1;font-size:26px;font-weight:800">Prescription RX-4K7QZ2</div><span class="tag warn" style="font-size:19px;padding:6px 14px">New</span></div>`);
  pop(c, T("f", 0.04));
  pop(c.querySelector("#r1"), T("f", 0.38), { y: 14 });
  pop(c.querySelector("#r2"), T("f", 0.7), { y: 14 });
  const k = el(`<div class="card" style="left:380px;top:770px;width:312px;padding:24px">
    <div class="row" style="gap:12px"><div style="width:48px;height:48px;border-radius:50%;background:#E4F8F4;color:#0A7F73;display:grid;place-items:center;flex:none">${icon("lock", 26)}</div><div class="h" style="font-size:26px">Your file, your rules</div></div>
    <div class="row" style="margin-top:16px;gap:14px;flex-wrap:nowrap"><div style="flex:1;font-size:23px;font-weight:700;line-height:1.2">Doctors with a confirmed booking</div>
      <div id="tg" style="position:relative;width:84px;height:48px;border-radius:24px;flex:none;background:#0A7F73"><div id="kn" style="position:absolute;top:5px;left:41px;width:38px;height:38px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div></div></div>
    <div class="row" style="margin-top:16px;gap:10px;font-size:21px;color:#6B7C93;font-weight:600;align-items:flex-start;flex-wrap:nowrap"><span style="margin-top:1px">${icon("search", 22)}</span><span>See who opened your file, and when</span></div></div>`);
  box.append(k);
  pop(k, T("g", 0.14), { x: 30, y: 10 });
  const tg = T("g", 0.78);
  tap(box, 640, 880, tg);
  A(k.querySelector("#tg"), [{ background: "#0A7F73" }, { background: "#B8C4CF" }], tg, 0.3, { easing: "ease" });
  A(k.querySelector("#kn"), [{ left: "41px" }, { left: "5px" }], tg, 0.3, { easing: "ease" });
}

// ---------- 5 pharmacy ----------
{
  const box = scene("pharmacy", `${step(5)} Prescription`);
  const rows = [["Tumaini Pharmacy", "Kasarani"], ["AfyaPlus Chemists", "Nyali"], ["Lakeview Pharmacy", "Kisumu"]]
    .map(([n, a], i) => `<div class="row pr" id="pr${i}" style="border:2px solid #E1EAF0;border-radius:20px;padding:0 20px;height:66px;margin-top:10px;gap:14px"><span class="rd" style="width:28px;height:28px;border-radius:50%;border:3px solid #B8C4CF;flex:none;display:grid;place-items:center"></span><span style="font-size:27px;font-weight:800;flex:1">${n}</span><span class="mute" style="font-size:22px">${a}</span></div>`).join("");
  const c = card(box, 40, 326, 640, 0, `
    <div class="row"><span style="color:#E07B1F">${icon("pill", 34)}</span><div class="h" style="font-size:25px;flex:1;white-space:nowrap">Prescription RX-4K7QZ2</div><span class="tag warn" id="pw" style="font-size:19px;padding:6px 14px">Choose pharmacy</span><span class="tag ok" id="pd" style="font-size:19px;padding:6px 14px;position:absolute;right:30px;top:32px">${icon("check", 20, 3)} Chosen</span></div>
    <div class="lab" style="margin-top:14px">Where would you like to collect it?</div>${rows}`);
  pop(c, T("h", 0.04));
  const ts = T("h", 0.72);
  tap(box, 300, 497, ts);
  const row0 = c.querySelector("#pr0");
  A(row0, [{ background: "#fff", borderColor: "#E1EAF0" }, { background: "#E4F8F4", borderColor: "#0A7F73" }], ts, 0.3, { easing: "ease" });
  const rd = row0.querySelector(".rd");
  A(rd, [{ background: "#fff", borderColor: "#B8C4CF", boxShadow: "inset 0 0 0 0 #0A7F73" }, { background: "#0A7F73", borderColor: "#0A7F73", boxShadow: "inset 0 0 0 5px #fff" }], ts, 0.3, { easing: "ease" });
  A(c.querySelector("#pw"), [{ opacity: 1 }, { opacity: 0 }], ts + 0.1, 0.2, { easing: "ease", fill: "forwards" });
  A(c.querySelector("#pd"), [{ opacity: 0 }, { opacity: 0 }], 0, ts + 0.1, { fill: "both" });
  A(c.querySelector("#pd"), [{ opacity: 0, transform: "scale(.7)" }, { opacity: 1, transform: "scale(1)" }], ts + 0.1, 0.35, { easing: ease.pop, fill: "forwards" });
  const rem = [["1 hour later", 0.12], ["Next day", 0.28], ["3 days later", 0.44]];
  rem.forEach(([label, f], i) => {
    const n = el(`<div class="bubble notif" style="left:392px;top:${770 + i * 104}px;width:300px;padding:16px 22px"><div class="row" style="gap:12px;flex-wrap:nowrap"><span style="color:#E07B1F">${icon("bell-ring", 28)}</span><span><b style="color:#0B1B2B">Reminder</b><br><span class="mute" style="font-size:22px">${label}</span></span></div></div>`);
    box.append(n);
    pop(n, T("h", f), { x: 30, y: 10 });
    A(n, [{ opacity: 1 }, { opacity: 0.3 }], ts + 0.2, 0.3, { easing: "ease", fill: "forwards" });
  });
  const done = el(`<div class="bubble" style="left:392px;top:1086px;width:300px;background:#E4F8EE;color:#0F7A4B;font-weight:800;font-size:25px;padding:16px 22px"><div class="row" style="gap:12px;flex-wrap:nowrap">${icon("circle-check", 30, 2.6)}<span>Reminders stop</span></div></div>`);
  box.append(done);
  pop(done, ts + 0.3, { x: 30, y: 10 });
}

// ---------- 6 navigate ----------
{
  const box = scene("nav", `${icon("smartphone", 24)} Find your way`);
  const tabs = [["house", "Home"], ["calendar-days", "Appointments"], ["file-text", "Health record"], ["heart-handshake", "My care plan"], ["user-round", "Profile"]];
  const heads = [
    ["Home", "Your next visit, one tap away"], ["Appointments", "Book, join and look back at visits"],
    ["Health record", "Summaries and prescriptions in one place"], ["My care plan", "Tests and follow-ups, step by step"],
  ];
  const c = card(box, 40, 326, 640, 386, `<div id="heads" style="position:relative;height:148px"></div>
    <div style="height:18px;border-radius:9px;background:#EEF3F6;width:86%"></div><div style="height:18px;border-radius:9px;background:#EEF3F6;width:64%;margin-top:12px"></div><div style="height:18px;border-radius:9px;background:#EEF3F6;width:74%;margin-top:12px"></div>
    <div id="bar" style="position:absolute;left:16px;right:16px;bottom:16px;height:112px;border-radius:28px;background:#F4F9FB;border:1.5px solid #E1EAF0;display:flex"></div>`);
  pop(c, T("i", 0.02));
  const hx = c.querySelector("#heads");
  const bar = c.querySelector("#bar");
  const when = [0.43, 0.52, 0.68, 0.84];
  tabs.forEach(([ic, label], i) => {
    const tcell = el(`<div style="flex:1;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#6B7C93"><div class="pill" style="position:absolute;inset:8px 4px;border-radius:20px;background:#0A7F73;opacity:0"></div><div class="cc" style="position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:19px;font-weight:800;line-height:1.05;text-align:center">${icon(ic, 34)}<span>${label}</span></div></div>`);
    bar.append(tcell);
    if (i < 4) {
      const t0 = T("i", when[i]);
      const t1 = i < 3 ? T("i", when[i + 1]) : T("i", 1) + 0.6;
      A(tcell.querySelector(".pill"), [{ opacity: 0 }, { opacity: 1 }], t0, 0.25, { easing: "ease" });
      A(tcell.querySelector(".cc"), [{ color: "#6B7C93" }, { color: "#fff" }], t0, 0.25, { easing: "ease", fill: "both" });
      if (i < 3) {
        A(tcell.querySelector(".pill"), [{ opacity: 1 }, { opacity: 0 }], t1, 0.25, { easing: "ease", fill: "forwards" });
        A(tcell.querySelector(".cc"), [{ color: "#fff" }, { color: "#6B7C93" }], t1, 0.25, { easing: "ease", fill: "forwards" });
      }
      const h = el(`<div style="position:absolute;inset:0;opacity:0"><div class="h" style="font-size:38px">${heads[i][0]}</div><div class="mute" style="font-size:25px;margin-top:8px;line-height:1.25">${heads[i][1]}</div></div>`);
      hx.append(h);
      A(h, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "translateY(0)" }], t0, 0.3, { easing: ease.out });
      if (i < 3) A(h, [{ opacity: 1 }, { opacity: 0 }], t1, 0.2, { easing: "ease", fill: "forwards" });
    }
  });
  tap(box, 200, 650, T("i", 0.5));
}

// ---------- 7 outro ----------
{
  const box = scene("outro", `${icon("sparkles", 24)} Your care, in one place`, true);
  const cta = el(`<div class="cta btn" style="top:262px;height:88px;font-size:36px;border-radius:30px;opacity:0">Create your account ${icon("pointer", 34, 2.4)}</div>`);
  box.append(cta);
  pop(cta, T("j", 0.12), { y: 20 });
  A(cta, [{ scale: 1 }, { scale: 1.045 }], T("j", 0.3), 0.7, { easing: "ease-in-out", iterations: 8, direction: "alternate", fill: "none" });
  tap(box, 470, 306, T("j", 0.36));
}

// ---------- captions ----------
for (const l of TL.lines) {
  for (const ch of l.chunks) {
    const html = ch.text.replace(/</g, "&lt;").replace(keyRe, "<b>$1</b>");
    const n = el(`<div class="capc"><div class="capp">${html}</div></div>`);
    document.getElementById("cap").append(n);
    const p = n.firstElementChild;
    A(n, [{ opacity: 0 }, { opacity: 1 }], ch.start - 0.04, 0.08, { easing: "linear" });
    A(n, [{ opacity: 1 }, { opacity: 0 }], ch.end - 0.02, 0.1, { easing: "linear", fill: "forwards" });
    A(p, [{ transform: "scale(.9)" }, { transform: "scale(1)" }], ch.start - 0.04, 0.22, { easing: ease.pop });
  }
}

// ---------- progress ----------
{
  const prog = document.getElementById("prog");
  for (const [name, s] of Object.entries(S)) {
    const seg = el(`<i><b></b></i>`);
    prog.append(seg);
    A(seg.firstElementChild, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], s.start - 0.3, s.end - s.start + 0.6, { easing: "linear" });
  }
}

window.frame = (t) => {
  for (const a of anims) a.currentTime = t * 1000;
  characterFrame(t, gazeAt(t));
};

// explainer.html?hero shows only the character on a transparent page, for the landing page picture (see hero-art.cjs)
if (/[?&]hero\b/.test(location.search)) {
  for (const id of ["bg", "ui", "hud"]) document.getElementById(id).style.display = "none";
  for (const e of [document.documentElement, document.body, document.getElementById("stage")]) e.style.background = "transparent";
}
