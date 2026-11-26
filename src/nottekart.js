/*
  Nøttekart v0.2 — "skoleatlas fra 1965"
  ---------------------------------------
  Bruk i Webflow:
    <div data-nottekart data-nk-start="mandel"></div>
    <script src=".../dist/nottekart.min.js" defer></script>

  Valgfrie attributter på div-en:
    data-nk-start    id for nøtta som er valgt ved start
    data-nk-scroll   globusen roterer når man scroller (GSAP + ScrollTrigger)
    data-nk-assets   egen mappe for bilder (ellers: ../assets/ ved siden av scriptet)

  JavaScript-API:
    Nottekart.instances[0].goTo("cashew")
    window.addEventListener("nottekart:select", e => e.detail.id)

  Print stack (art direction §2): papir → lys (kun vann) → flat plate → blekk → raster → korn.
*/

import { geoOrthographic, geoPath, geoGraticule10, geoDistance, geoInterpolate } from "d3-geo";
import { feature } from "topojson-client";
import land110 from "world-atlas/land-110m.json";
import data from "./notter.json";
import fjord from "./oslofjord.json";
import css from "./nottekart.css";

// Inks: [base, darker] per family, from the Nøttanrop palette ramps.
const INK = {
  orange: ["#ff7a2a", "#cc6121"], red: ["#e23c2e", "#b43024"], green: ["#bee6db", "#4c5c57"],
  pistasj: ["#b8be6e", "#4a4c2c"], matcha: ["#7fa233", "#334114"], jordbaer: ["#e2506e", "#5a202c"],
  mango: ["#ffb02e", "#664612"], solbaer: ["#7a2e68", "#31122a"], brown: ["#5a3a1c", "#24170b"],
  camel: ["#c49a6c", "#5a3a1c"],
};
const KEY = "#1b1108"; // brown-darkest, the key ink. Never #000.
const STEMPEL = {
  ekte: "Ekte nøtt",
  bedrager: "Ikke nøtt",
  omstridt: "Omstridt",
  ingrediens: "Ingrediens",
};

const SVGNS = "http://www.w3.org/2000/svg";
const S = 600; // viewBox size
const R0 = S / 2 - 16; // globe radius; the rest is room for the dusk glow
const RH = S / 2 - 2; // outer edge of the glow
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const land = feature(land110, land110.objects.land);
const graticule = geoGraticule10();
const HOME = [data.hjem.lon, data.hjem.lat];
const scriptSrc = document.currentScript && document.currentScript.src;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const fmtKm = (n) => n.toLocaleString("nb-NO");
// Pins are an assumed point in the country, so distances are rounded and marked as approximate.
const approxKm = (n) => `≈ ${fmtKm(Math.round(n / 100) * 100)} km`;
// Ingredients that have a drawing in assets/ (nan-ill-<id>-160.webp): shown as a specimen plate on the card.
const ART = new Set(["mandel", "hasselnott", "cashew", "kokos", "pistasj", "kakao", "matcha", "jordbaer",
  "rorsukker", "kakaosmor", "olivenolje", "salt"]);
const fmtCoord = (lat, lon) =>
  `${Math.abs(lat).toFixed(0)}°${lat >= 0 ? "N" : "S"} ${Math.abs(lon).toFixed(0)}°${lon >= 0 ? "Ø" : "V"}`;

function el(tag, attrs = {}, parent, ns) {
  const n = ns ? document.createElementNS(ns, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}
const svg = (tag, attrs, parent) => el(tag, attrs, parent, SVGNS);

function injectCSS() {
  if (document.getElementById("nk-css")) return;
  const s = el("style", { id: "nk-css" });
  s.textContent = css;
  document.head.appendChild(s);
}

// Risograph grain, made once as a tiny bitmap (cheaper than a live SVG noise filter while dragging).
let grainURL;
function grain() {
  if (grainURL) return grainURL;
  const c = document.createElement("canvas");
  c.width = c.height = 160;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return (grainURL = c.toDataURL());
}

// Rubber-stamp ink: mostly solid, with speckles and a few starved patches where the stamp didn't touch.
let stampURL;
function stampInk() {
  if (stampURL) return stampURL;
  const w = 140, h = 70, c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(w, h);
  const blots = Array.from({ length: 5 }, () => [Math.random() * w, Math.random() * h, 6 + Math.random() * 12]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    let a = Math.random() < 0.13 ? 0.4 : 0.96;
    for (const [bx, by, br] of blots) if ((x - bx) ** 2 + (y - by) ** 2 < br * br) a *= 0.72;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 0;
    img.data[i + 3] = a * 255;
  }
  ctx.putImageData(img, 0, 0);
  return (stampURL = c.toDataURL());
}

// The Oslofjord inset: real coastline (Natural Earth 1:10m), Nesodden's tooth between the two arms, the siren on Vinterbro.
function inset(parent, cls) {
  const f = el("figure", { class: `nk-inset ${cls}`, "aria-hidden": "true" }, parent);
  el("figcaption", {}, f).textContent = "Hjemme · Oslofjorden";
  const s = svg("svg", { viewBox: `0 0 ${fjord.w} ${fjord.h}` }, f);
  svg("rect", { width: fjord.w, height: fjord.h, class: "nk-in-land" }, s);
  svg("path", { d: fjord.land, class: "nk-in-water", "fill-rule": "evenodd", transform: "translate(1.6 1.2)" }, s);
  svg("path", { d: fjord.land, class: "nk-in-ink", "fill-rule": "evenodd" }, s);
  svg("image", { href: grain(), width: fjord.w, height: fjord.h, preserveAspectRatio: "none", class: "nk-grain" }, s);
  const { oslo, nesodden, vinterbro } = fjord.steder;
  const label = (t, [x, y], dx, dy, anchor = "start") =>
    (svg("text", { x: x + dx, y: y + dy, "text-anchor": anchor, class: "nk-in-label" }, s).textContent = t);
  svg("circle", { cx: oslo[0], cy: oslo[1], r: 2.6, class: "nk-in-dot" }, s);
  label("Oslo", oslo, 6, 3);
  label("Nesodden", nesodden, 0, 0, "middle");
  const home = svg("g", { class: "nk-home nk-in-home", transform: `translate(${vinterbro[0]} ${vinterbro[1]}) scale(0.8)` }, s);
  const rays = svg("g", { class: "nk-rays" }, home);
  [[-12, -10, -16, -15], [0, -14, 0, -21], [12, -10, 16, -15]].forEach(([x1, y1, x2, y2]) => svg("line", { x1, y1, x2, y2 }, rays));
  svg("path", { d: "M-7 1 A7 7 0 0 1 7 1 Z", fill: "#e23c2e", stroke: KEY, "stroke-width": 1.6 }, home);
  svg("rect", { x: -9, y: 1, width: 18, height: 4, rx: 1, fill: "#5a3a1c", stroke: KEY, "stroke-width": 1.4 }, home);
  label("Vinterbro", vinterbro, 0, 18, "middle");
  svg("text", { x: fjord.w - 10, y: 18, "text-anchor": "end", class: "nk-in-label nk-in-north" }, s).textContent = "N ↑";
  return f;
}

class Nottekart {
  constructor(root, assets) {
    this.root = root;
    this.assets = root.dataset.nkAssets || assets;
    this.rotation = [-20, -40, 0];
    this.projection = geoOrthographic().scale(R0).translate([S / 2, S / 2]).clipAngle(90).precision(0.4);
    this.path = geoPath(this.projection);
    this.flight = null;
    this.idle = true;
    this.build();
    this.render();
    this.select(root.dataset.nkStart || "mandel", { animate: false });
    this.startIdleSpin();
    if (root.hasAttribute("data-nk-scroll")) this.bindScroll();
  }

  build() {
    const r = this.root;
    r.classList.add("nk");
    r.innerHTML = "";
    const uid = "nk" + Math.random().toString(36).slice(2, 7);

    // ---- globe -----------------------------------------------------------
    const stage = el("div", { class: "nk-stage" }, r);
    const orb = el("div", { class: "nk-orb" }, stage);
    this.svg = svg("svg", {
      class: "nk-globe", viewBox: `0 0 ${S} ${S}`, role: "img",
      "aria-label": "Jordklode tegnet som et gammelt skoleatlas. Den viser hvor nøttene kommer fra, og ruten hjem til Oslofjorden. Dra for å snu den, eller velg en nøtt i listen.",
    }, orb);
    // atlas furniture: the title cartouche (top left) and the home inset (bottom right), as in a 1965 school atlas
    el("div", { class: "nk-cartouche", "aria-hidden": "true" }, orb).innerHTML =
      `<b>Nøtteverden</b><span>Skoleatlas for nøtt-nød</span><span>Utgave 2026 · Målestokk 1 : ∞</span>`;
    this.insets = [inset(orb, "nk-inset-stage")];
    const defs = svg("defs", {}, this.svg);

    // light: grainy gradient, water only, lit from upper left (dusk sun)
    const water = svg("radialGradient", { id: `${uid}-w`, cx: "0.34", cy: "0.3", r: "0.8" }, defs);
    [["0", "#f2faf7"], ["0.42", "#d1ede5"], ["0.78", "#bee6db"], ["1", "#98b8af"]].forEach(([o, c]) =>
      svg("stop", { offset: o, "stop-color": c }, water));

    // halftone: 45° dot screen, faded in toward the shadow side (lower right)
    const dots = svg("pattern", { id: `${uid}-d`, width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
    svg("circle", { cx: 3, cy: 3, r: 1.45, fill: KEY }, dots);
    const fade = svg("radialGradient", { id: `${uid}-f`, cx: "0.34", cy: "0.3", r: "0.85" }, defs);
    [["0", "#000"], ["0.5", "#000"], ["0.8", "#555"], ["1", "#fff"]].forEach(([o, c]) =>
      svg("stop", { offset: o, "stop-color": c }, fade));
    const mask = svg("mask", { id: `${uid}-m` }, defs);
    svg("rect", { width: S, height: S, fill: `url(#${uid}-f)` }, mask);
    // dusk: a grainy glow on the sunlit edge only (upper left), orange → red → a breath of plum
    const glow = svg("radialGradient", { id: `${uid}-g`, cx: S / 2, cy: S / 2, r: RH, gradientUnits: "userSpaceOnUse" }, defs);
    [[R0 / RH - 0.01, "#ffa169", 0], [R0 / RH, "#ffa169", 1], [R0 / RH + (1 - R0 / RH) * 0.45, "#ea766c", 0.75], [1, "#a26d95", 0]].forEach(([o, c, a]) =>
      svg("stop", { offset: o, "stop-color": c, "stop-opacity": a }, glow));
    const lit = svg("linearGradient", { id: `${uid}-l`, x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
    [["0", "#fff"], ["0.35", "#fff"], ["0.6", "#000"]].forEach(([o, c]) => svg("stop", { offset: o, "stop-color": c }, lit));
    const litMask = svg("mask", { id: `${uid}-lm` }, defs);
    svg("rect", { width: S, height: S, fill: `url(#${uid}-l)` }, litMask);
    const haloClip = svg("clipPath", { id: `${uid}-h` }, defs);
    svg("circle", { cx: S / 2, cy: S / 2, r: RH }, haloClip);
    const clip = svg("clipPath", { id: `${uid}-c` }, defs);
    this.clipSphere = svg("path", {}, clip);

    svg("circle", { cx: S / 2, cy: S / 2, r: RH, fill: `url(#${uid}-g)`, mask: `url(#${uid}-lm)`, class: "nk-glow" }, this.svg);
    this.gWater = svg("path", { class: "nk-water", fill: `url(#${uid}-w)` }, this.svg);
    this.gGrat = svg("path", { class: "nk-grat" }, this.svg);
    this.gPlate = svg("path", { class: "nk-plate", transform: "translate(2.2 1.6)" }, this.svg); // misregistered plate
    this.gInk = svg("path", { class: "nk-ink" }, this.svg);
    svg("rect", { width: S, height: S, fill: `url(#${uid}-d)`, mask: `url(#${uid}-m)`, "clip-path": `url(#${uid}-c)`, class: "nk-halftone" }, this.svg);
    this.gRouteUnder = svg("path", { class: "nk-route-under" }, this.svg);
    this.gRoute = svg("path", { class: "nk-route" }, this.svg);
    this.gMarks = svg("g", {}, this.svg);
    this.gSource = svg("g", { class: "nk-source" }, this.svg); // where OUR batch comes from, when it differs from the origin
    svg("rect", { x: -6, y: -6, width: 12, height: 12, transform: "rotate(45)", fill: "#fbf7f3", stroke: KEY, "stroke-width": 2 }, this.gSource);
    svg("circle", { r: 2.4, fill: "#cc6121" }, this.gSource);
    this.gHome = svg("g", { class: "nk-home" }, this.svg);
    this.gHero = svg("g", { class: "nk-hero" }, this.svg);
    this.gRim = svg("path", { class: "nk-rim" }, this.svg);
    svg("image", { href: grain(), width: S, height: S, preserveAspectRatio: "none", class: "nk-grain", "clip-path": `url(#${uid}-c)` }, this.svg);
    // the glow gets its own grain, only where the glow is (lit side), so the shadow side stays clean paper
    const gg = svg("g", { mask: `url(#${uid}-lm)`, "clip-path": `url(#${uid}-h)`, class: "nk-glow-grain" }, this.svg);
    svg("image", { href: grain(), width: S, height: S, preserveAspectRatio: "none", class: "nk-grain" }, gg);

    // markers: lid stickers (accent ring) for what's in our jars, small ink dots for the rest
    this.marks = data.notter.map((n) => {
      const [base] = INK[n.farge] || INK.camel;
      const ours = n.produkter.length > 0;
      const g = svg("g", { class: `nk-mark ${ours ? "is-ours" : ""}`, "aria-hidden": "true" }, this.gMarks);
      svg("circle", { class: "nk-pulse", r: 11, fill: base }, g);
      if (ours) {
        svg("circle", { r: 8.5, fill: "#fbf7f3", stroke: base, "stroke-width": 4.5 }, g);
        svg("circle", { r: 11, fill: "none", stroke: KEY, "stroke-width": 1.6 }, g);
      } else {
        svg("circle", { r: 5, fill: base, stroke: KEY, "stroke-width": 1.6 }, g);
      }
      g.addEventListener("click", () => this.select(n.id));
      return { n, g };
    });

    // home: the siren from the logo, on the kitchen by the Oslofjord (Vinterbro)
    const rays = svg("g", { class: "nk-rays" }, this.gHome);
    [[-12, -10, -16, -15], [0, -14, 0, -21], [12, -10, 16, -15]].forEach(([x1, y1, x2, y2]) =>
      svg("line", { x1, y1, x2, y2 }, rays));
    svg("path", { d: "M-7 1 A7 7 0 0 1 7 1 Z", fill: "#e23c2e", stroke: KEY, "stroke-width": 1.6 }, this.gHome);
    svg("rect", { x: -9, y: 1, width: 18, height: 4, rx: 1, fill: "#5a3a1c", stroke: KEY, "stroke-width": 1.4 }, this.gHome);

    // Helt nøtta, paws cupped forward. The ingredient he carries is swapped per selection.
    // Paw position measured on the 360px source: (337, 111) → (112, 37) at 120px wide.
    this.hero = svg("image", {
      href: `${this.assets}nan-ill-heltnotta-flyr-tom-360.webp`,
      width: 120, height: 82, x: -60, y: -48, class: "nk-hero-img",
    }, this.gHero);
    this.cargo = svg("image", { width: 30, height: 30, x: 37, y: -38, class: "nk-cargo" }, this.gHero);

    const legend = el("p", { class: "nk-legend", "aria-hidden": "true" }, stage);
    legend.innerHTML = `<span><i class="nk-lg-ours"></i>I glassene våre</span><span><i class="nk-lg-rest"></i>Resten av nøtteverden</span><span><i class="nk-lg-route"></i>Utrykning til Oslofjorden</span><span><i class="nk-lg-dist"></i>Bare avstand</span><span><i class="nk-lg-src"></i>Våre kommer herfra</span>`;
    el("p", { class: "nk-hint", "aria-hidden": "true" }, stage).textContent = "Dra for å snu kloden";

    // ---- panel -----------------------------------------------------------
    const panel = el("div", { class: "nk-panel" }, r);
    const nav = el("nav", { class: "nk-nav", "aria-label": "Velg nøtt" }, panel);
    this.buttons = [];
    for (const [title, list] of [
      ["I glassene våre", data.notter.filter((n) => n.produkter.length && !n.glass)],
      ["Resten av glasset", data.notter.filter((n) => n.glass)],
      ["Resten av nøtteverden (og noen bedragere)", data.notter.filter((n) => !n.produkter.length)],
    ]) {
      el("p", { class: "nk-label" }, nav).textContent = title;
      const ul = el("ul", {}, nav);
      for (const n of list) {
        const b = el("button", { type: "button", class: "nk-chip", "aria-pressed": "false" }, el("li", {}, ul));
        b.style.setProperty("--nk-c", (INK[n.farge] || INK.camel)[0]);
        b.textContent = n.navn;
        b.addEventListener("click", () => this.select(n.id));
        this.buttons.push({ n, b });
      }
    }
    this.card = el("article", { class: "nk-card", "aria-live": "polite" }, panel);
    // on phones the globe stays pinned at the top, so the key moves under the card
    this.insets.push(inset(panel, "nk-inset-panel"));
    el("p", { class: "nk-legend nk-legend-panel", "aria-hidden": "true" }, panel).innerHTML = legend.innerHTML;
    r.style.setProperty("--nk-stamp-ink", `url(${stampInk()})`);

    // ---- drag to rotate --------------------------------------------------
    let last = null;
    this.svg.addEventListener("pointerdown", (e) => {
      this.dragging = true; this.idle = false; this.userTook = true; last = [e.clientX, e.clientY];
      this.svg.setPointerCapture(e.pointerId);
      r.classList.add("nk-touched");
      cancelAnimationFrame(this.rotRaf);
    });
    this.svg.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      const k = 180 / (this.svg.getBoundingClientRect().width || S);
      const [x, y] = last; last = [e.clientX, e.clientY];
      const [l, p] = this.rotation;
      this.setRotation([l + (e.clientX - x) * k, Math.max(-80, Math.min(80, p - (e.clientY - y) * k))]);
    });
    const end = () => { this.dragging = false; };
    this.svg.addEventListener("pointerup", end);
    this.svg.addEventListener("pointercancel", end);
  }

  setRotation([l, p]) { this.rotation = [l, p, 0]; this.render(); }

  // project a point; null if it's on the far side of the globe
  pt(lonlat) {
    const c = [-this.rotation[0], -this.rotation[1]];
    return geoDistance(lonlat, c) < Math.PI / 2 - 0.04 ? this.projection(lonlat) : null;
  }

  place(g, lonlat) {
    const p = this.pt(lonlat);
    g.style.display = p ? "" : "none";
    if (p) g.setAttribute("transform", `translate(${p[0].toFixed(1)},${p[1].toFixed(1)})`);
    return p;
  }

  render() {
    this.projection.rotate(this.rotation);
    const sphere = this.path({ type: "Sphere" });
    this.gWater.setAttribute("d", sphere);
    this.gRim.setAttribute("d", sphere);
    this.clipSphere.setAttribute("d", sphere);
    this.gGrat.setAttribute("d", this.path(graticule));
    const l = this.path(land);
    this.gPlate.setAttribute("d", l);
    this.gInk.setAttribute("d", l);
    for (const { n, g } of this.marks) this.place(g, [n.opphav.lon, n.opphav.lat]);
    this.place(this.gHome, HOME);
    if (this.sourceAt) this.place(this.gSource, this.sourceAt); else this.gSource.style.display = "none";
    this.renderFlight();
  }

  renderFlight() {
    const f = this.flight;
    if (!f) { this.gRoute.removeAttribute("d"); this.gRouteUnder.removeAttribute("d"); this.gHero.style.display = "none"; return; }
    const N = 80, k = Math.max(1, Math.round(f.t * N));
    const coords = [];
    for (let i = 0; i <= k; i++) coords.push(f.interp((i / k) * f.t));
    const d = this.path({ type: "LineString", coordinates: coords });
    this.gRoute.setAttribute("d", d || "");
    this.gRouteUnder.setAttribute("d", d || "");

    // the hero rides the front of the line, nose pointing along the route
    const show = f.flying && f.t > 0.02 && f.t < 0.98;
    const here = show && this.pt(f.interp(f.t));
    const ahead = here && this.pt(f.interp(Math.min(1, f.t + 0.02)));
    if (!here || !ahead) { this.gHero.style.display = "none"; return; }
    const dx = ahead[0] - here[0], dy = ahead[1] - here[1];
    let ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    const flip = dx < 0;
    if (flip) ang -= 180;
    ang = Math.max(-22, Math.min(22, ang)); // keep him level-ish; he's a squirrel, not a rocket
    this.gHero.style.display = "";
    this.gHero.setAttribute("transform",
      `translate(${here[0].toFixed(1)},${here[1].toFixed(1)}) rotate(${ang.toFixed(1)}) scale(${flip ? -1 : 1},1)`);
  }

  rotateTo([lon, lat], ms = 900) {
    return new Promise((done) => {
      const from = this.rotation.slice(0, 2);
      let toL = -lon;
      const toP = Math.max(-70, Math.min(70, -lat));
      while (toL - from[0] > 180) toL -= 360;
      while (toL - from[0] < -180) toL += 360;
      cancelAnimationFrame(this.rotRaf);
      if (reduceMotion() || ms === 0) { this.setRotation([toL, toP]); return done(); }
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / ms), e = ease(t);
        this.setRotation([from[0] + (toL - from[0]) * e, from[1] + (toP - from[1]) * e]);
        if (t < 1) this.rotRaf = requestAnimationFrame(step); else done();
      };
      this.rotRaf = requestAnimationFrame(step);
    });
  }

  async select(id, { animate = true } = {}) {
    const n = data.notter.find((x) => x.id === id);
    if (!n) return;
    if (animate) this.userTook = true;
    const token = (this.token = {});
    this.selected = n;
    if (animate) this.idle = false;
    for (const { n: m, g } of this.marks) g.classList.toggle("is-active", m.id === id);
    for (const { n: m, b } of this.buttons) b.setAttribute("aria-pressed", String(m.id === id));
    const [accent] = INK[n.farge] || INK.camel;
    this.root.style.setProperty("--nk-accent", accent);

    const src = n.vaare || n.opphav;
    this.sourceAt = n.vaare && (n.vaare.lat !== n.opphav.lat || n.vaare.lon !== n.opphav.lon) ? [n.vaare.lon, n.vaare.lat] : null;
    const from = [src.lon, src.lat];
    const interp = geoInterpolate(from, HOME);
    const km = Math.round(geoDistance(from, HOME) * 6371);
    this.renderCard(n, km);
    if (animate) this.register();
    this.root.dispatchEvent(new CustomEvent("nottekart:select", { bubbles: true, detail: { id, km } }));

    // frame the trip: centre between origin and home, unless it's half the planet away
    const far = geoDistance(from, HOME) > 2.2;
    const centre = far ? geoInterpolate(from, HOME)(0.2) : interp(0.5);
    const ours = n.produkter.length > 0; // only what's in our jars gets an utrykning (and a hero)
    this.flight = { interp, t: 0, flying: false, ours };
    this.gRoute.classList.toggle("is-distance", !ours);
    if (ours) this.cargo.setAttribute("href", `${this.assets}nan-ill-${n.id}-160.webp`);
    this.gRouteUnder.classList.toggle("is-distance", !ours);
    const still = !animate || reduceMotion();
    await this.rotateTo(centre, still ? 0 : 900);
    if (token !== this.token) return;
    if (still) { this.flight.t = 1; this.render(); return; }

    // the flight
    const dur = ours ? Math.min(3200, 1400 + km / 6) : 900;
    const t0 = performance.now();
    this.flight.flying = ours;
    const step = (now) => {
      if (token !== this.token) return;
      const t = Math.min(1, (now - t0) / dur);
      this.flight.t = ease(t);
      this.render();
      if (t < 1) requestAnimationFrame(step);
      else { this.flight.flying = false; this.render(); if (ours) this.alarm(); }
    };
    requestAnimationFrame(step);
  }

  // For tools (the carousel): draw a route from any point home, with any cargo, frozen at flight progress t.
  async showRoute(from, cargoHref, t = 1) {
    this.token = {}; this.userTook = true; this.idle = false;
    for (const { g } of this.marks) g.classList.remove("is-active");
    const interp = geoInterpolate(from, HOME);
    this.sourceAt = from;
    this.flight = { interp, t, flying: t < 1, ours: true };
    this.gRoute.classList.remove("is-distance");
    this.gRouteUnder.classList.remove("is-distance");
    if (cargoHref) this.cargo.setAttribute("href", cargoHref);
    const far = geoDistance(from, HOME) > 2.2;
    await this.rotateTo(far ? geoInterpolate(from, HOME)(0.2) : interp(0.5), 0);
    this.render();
  }

  alarm() {
    for (const h of [this.gHome, ...this.insets.map((f) => f.querySelector(".nk-in-home"))]) {
      h.classList.remove("is-alarm");
      void h.getBBox();
      h.classList.add("is-alarm");
    }
  }

  // "The print registers itself": the colour plate starts out of register and slides into place.
  register() {
    if (reduceMotion()) return;
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / 520), k = 1 - ease(t);
      this.gPlate.setAttribute("transform", `translate(${(2.2 + 10 * k).toFixed(2)} ${(1.6 + 7 * k).toFixed(2)})`);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    this.card.classList.remove("nk-reg");
    void this.card.offsetWidth;
    this.card.classList.add("nk-reg");
  }

  goTo(id) { this.select(id); }

  renderCard(n, km) {
    const c = this.card;
    const nr = String(this.buttons.findIndex((x) => x.n === n) + 1).padStart(2, "0"); // follows the chip order
    const total = String(data.notter.length).padStart(2, "0");
    c.innerHTML = "";
    c.dataset.stempel = n.stempel;

    const top = el("div", { class: "nk-card-top" }, c);
    el("span", { class: "nk-tag" }, top).textContent = `${n.produkter.length ? "Utrykning" : "Oppslag"} nr. ${nr}/${total}`;
    el("span", { class: "nk-tag nk-tag-ghost" }, top).textContent = fmtCoord(n.opphav.lat, n.opphav.lon);

    const stamp = el("p", { class: `nk-stamp nk-stamp-${n.stempel}` }, c);
    stamp.textContent = STEMPEL[n.stempel] || "";

    const head = el("div", { class: "nk-head" }, c);
    const name = el("div", { class: "nk-name" }, head);
    el("h3", { class: "nk-title" }, name).textContent = n.navn;
    el("p", { class: "nk-latin" }, name).textContent = n.opphav.sted ? `${n.latin} · ${n.opphav.sted}` : n.latin;
    if (ART.has(n.id)) {
      const plate = el("figure", { class: "nk-plate-fig" }, head);
      el("img", { src: `${this.assets}nan-ill-${n.id}-160.webp`, alt: "", width: 160, height: 160, decoding: "async" }, plate);
      plate.appendChild(stamp); // the stamp lands on the plate's edge
      c.classList.add("has-plate");
    }
    el("p", { class: "nk-botany" }, c).textContent = n.botanikk;
    el("p", { class: "nk-story" }, c).textContent = n.historie;
    if (n.vits) el("blockquote", { class: "nk-wit" }, c).textContent = n.vits;

    if (n.fakta && n.fakta.length) {
      const f = el("div", { class: "nk-facts" }, c);
      el("p", { class: "nk-label" }, f).textContent = "Visste du?";
      const ul = el("ul", {}, f);
      for (const x of n.fakta) el("li", {}, ul).textContent = x.tekst;
    }

    const ours = el("dl", { class: "nk-ours" }, c);
    const row = (k, v) => { el("dt", {}, ours).textContent = k; el("dd", {}, ours).textContent = v; };
    if (n.produkter.length) {
      row("I glassene våre", n.produkter.join(" · "));
      row("Våre kommer fra", n.vaare ? (n.vaare.notat ? `${n.vaare.land} (${n.vaare.notat.split(" (")[0]})` : n.vaare.land) : "Vi sjekker med leverandøren. Ærlighet tar litt tid.");
      row(n.vaare ? "Reisen hit" : "Reisen hit (fra opphavet)", `${approxKm(km)} i luftlinje til ${data.hjem.sted}`);
      row("Hjemme", data.hjem.notat);
    } else {
      row("I glassene våre", "Nei. Med på kartet for allmenndannelsens skyld.");
      row("Avstand", `${approxKm(km)} i luftlinje fra ${data.hjem.sted}`);
    }
    const kilder = (n.kilder || []).filter((k) => k.apnet !== false);
    if (kilder.length) {
      const det = el("details", { class: "nk-sources" }, c);
      el("summary", {}, det).textContent = `${n.verifisert ? "Faktasjekket" : "Kilder"} · ${kilder.length}`;
      const ol = el("ol", {}, det);
      for (const k of kilder) {
        const a = el("a", { href: k.url, target: "_blank", rel: "noopener" }, el("li", {}, ol));
        a.textContent = k.title || new URL(k.url).hostname;
      }
    }
    if (!n.verifisert) el("p", { class: "nk-draft" }, c).textContent = "Utkast · fakta ikke verifisert";
    if (n.side) {
      const a = el("a", { class: "nk-more", href: (this.root.dataset.nkBase || "") + n.side }, c);
      a.innerHTML = `Les hele oppslaget om ${n.navn.toLowerCase()} <span aria-hidden="true">→</span>`;
    }
  }

  startIdleSpin() {
    if (reduceMotion()) return;
    let prev = performance.now();
    const tick = (now) => {
      const dt = Math.min(64, now - prev); prev = now;
      if (this.idle && !this.dragging && this.inView !== false) this.setRotation([this.rotation[0] + dt * 0.005, this.rotation[1]]);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    new IntersectionObserver(([e]) => { this.inView = e.isIntersecting; }).observe(this.root);
  }

  // Scroll entrance (GSAP + ScrollTrigger, loaded by Webflow). As the globe scrolls in, it turns in from
  // the far side of the planet and settles over the selected nut; chips and card arrive in a short stagger.
  // The first touch, drag or chip click hands control to the reader for good.
  bindScroll(tries = 0) {
    const gsap = window.gsap, ST = window.ScrollTrigger;
    if (reduceMotion()) return;
    if (!gsap || !ST) {                       // Webflow may load GSAP after us
      if (tries < 40) setTimeout(() => this.bindScroll(tries + 1), 150);
      return;
    }
    gsap.registerPlugin(ST);
    const stage = this.root.querySelector(".nk-stage");
    const target = this.rotation.slice(0, 2);
    const proxy = { k: 0 };
    this.idle = false;
    const pose = () => {
      if (this.userTook || this.dragging) return;
      const e = 1 - Math.pow(1 - proxy.k, 2);
      this.setRotation([target[0] - (1 - e) * 150, target[1] * e]);
      this.idle = proxy.k >= 0.999;          // settled: the slow drift may take over
    };
    gsap.timeline({
      scrollTrigger: { trigger: this.root, start: "top 90%", end: "top 30%", scrub: 0.8 },
    })
      .fromTo(stage, { scale: 0.86, rotate: -4 }, { scale: 1, rotate: 0, ease: "none" }, 0)
      .to(proxy, { k: 1, ease: "none", onUpdate: () => pose() }, 0);
    // GSAP only calls onUpdate once scrolling starts, so set the starting pose now (no jump later).
    const tl = ST.getAll().find((t) => t.trigger === this.root);
    proxy.k = tl ? tl.progress : 0;
    pose();
    // Opacity only (never visibility): hidden chips would drop out of keyboard navigation.
    const enter = [];
    enter.push(gsap.from(this.root.querySelectorAll(".nk-nav .nk-label, .nk-chip"), {
      y: 14, opacity: 0, duration: 0.5, ease: "power2.out", stagger: 0.018,
      scrollTrigger: { trigger: this.root.querySelector(".nk-panel"), start: "top 85%", once: true },
    }));
    enter.push(gsap.from(this.card, {
      y: 28, opacity: 0, duration: 0.7, ease: "power3.out",
      scrollTrigger: { trigger: this.card, start: "top 90%", once: true },
    }));
    // Keyboard users who tab in before scrolling see everything at once.
    this.root.addEventListener("focusin", () => enter.forEach((t) => t.progress(1)), { once: true });
  }
}

function init() {
  injectCSS();
  const assets = scriptSrc ? scriptSrc.replace(/dist\/[^/]*$/, "assets/") : "assets/";
  const instances = [...document.querySelectorAll("[data-nottekart]")].map((r) => new Nottekart(r, assets));
  window.Nottekart = { instances, data };
  window.dispatchEvent(new CustomEvent("nottekart:ready", { detail: instances }));
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
