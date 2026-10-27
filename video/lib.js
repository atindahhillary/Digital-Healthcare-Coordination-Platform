// Small helpers. Every animation is a paused Web Animation that frame(t) seeks, so rendering is exact.
const TL = window.TL, ICONS = window.ICONS;
const anims = [];
const el = (html) => { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; };
const A = (node, frames, start, dur, o = {}) => {
  const a = node.animate(frames, { delay: Math.max(0, start * 1000), duration: Math.max(1, dur * 1000), fill: o.fill || "both", easing: o.easing || "cubic-bezier(.2,.8,.2,1)", iterations: o.iterations || 1, direction: o.direction || "normal" });
  a.pause();
  anims.push(a);
  return a;
};
const L = (id) => TL.lines.find((l) => l.id === id);
const T = (id, frac = 0) => L(id).start + L(id).dur * frac;
const icon = (name, size = 30, stroke = 2.3, color = "currentColor") =>
  `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;
const ease = { pop: "cubic-bezier(.2,.9,.3,1.18)", out: "cubic-bezier(.2,.8,.2,1)", io: "cubic-bezier(.45,0,.25,1)" };

// appear at `at`; optionally leave at `out`
function pop(node, at, o = {}) {
  const { dur = 0.45, out = null, y = 30, scale = 0.94, x = 0 } = o;
  A(node, [{ opacity: 0, transform: `translate(${x}px, ${y}px) scale(${scale})` }, { opacity: 1, transform: "translate(0,0) scale(1)" }], at, dur, { easing: ease.pop });
  if (out != null) A(node, [{ opacity: 1 }, { opacity: 0 }], out, 0.3, { easing: "ease", fill: "forwards" });
}
function fade(node, at, dur = 0.3, to = 1) { A(node, [{ opacity: to ? 0 : 1 }, { opacity: to ? 1 : 0 }], at, dur, { easing: "ease" }); }
// typed text: a clipped span that widens in steps
function typed(node, at, dur) {
  const n = Math.max(4, node.textContent.length);
  A(node, [{ clipPath: "inset(-4px 100% -4px 0)" }, { clipPath: "inset(-4px -6px -4px 0)" }], at, dur, { easing: `steps(${n}, end)` });
}
// a finger taps (x, y) at time `at`
function tap(parent, x, y, at) {
  const r = el(`<div class="ripple" style="left:${x}px;top:${y}px"></div>`);
  const f = el(`<div class="finger" style="left:${x}px;top:${y}px">${icon("pointer", 64, 1.8, "#0B1B2B").replace('stroke="#0B1B2B"', 'stroke="#0B1B2B" fill="#fff"')}</div>`);
  parent.append(r, f);
  A(f, [{ opacity: 0, transform: "translate(70px, 110px)" }, { opacity: 1, transform: "translate(0,0)", offset: 0.7 }, { opacity: 1, transform: "translate(0,0) scale(.88)" }], at - 0.55, 0.55, { easing: "ease-out", fill: "both" });
  A(f, [{ opacity: 1, transform: "translate(0,0) scale(.88)" }, { opacity: 0, transform: "translate(40px, 70px) scale(1)" }], at, 0.5, { easing: "ease-in", fill: "forwards" });
  // the ripple is invisible by default (CSS) and only plays after the tap, so no fill before it starts
  A(r, [{ opacity: 0.9, transform: "scale(.2)" }, { opacity: 0, transform: "scale(1.5)" }], at, 0.55, { easing: "ease-out", fill: "forwards" });
}
