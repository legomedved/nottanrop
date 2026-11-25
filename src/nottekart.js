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
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const land = feature(land110, land110.objects.land);
const graticule = geoGraticule10();
const HOME = [data.hjem.lon, data.hjem.lat];
const scriptSrc = document.currentScript && document.currentScript.src;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const fmtKm = (n) => n.toLocaleString("nb-NO");
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

class Nottekart {
  constructor(root, assets) {
    this.root = root;
    this.assets = root.dataset.nkAssets || assets;
    this.rotation = [-20, -40, 0];
    this.projection = geoOrthographic().scale(S / 2 - 6).translate([S / 2, S / 2]).clipAngle(90).precision(0.4);
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
    this.svg = svg("svg", {
      class: "nk-globe", viewBox: `0 0 ${S} ${S}`, role: "img",
      "aria-label": "Jordklode tegnet som et gammelt skoleatlas. Den viser hvor nøttene kommer fra, og ruten til Nesodden. Dra for å snu den, eller velg en nøtt i listen.",
    }, stage);
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
    const clip = svg("clipPath", { id: `${uid}-c` }, defs);
    this.clipSphere = svg("path", {}, clip);

    this.gWater = svg("path", { class: "nk-water", fill: `url(#${uid}-w)` }, this.svg);
    this.gGrat = svg("path", { class: "nk-grat" }, this.svg);
    this.gPlate = svg("path", { class: "nk-plate", transform: "translate(2.2 1.6)" }, this.svg); // misregistered plate
    this.gInk = svg("path", { class: "nk-ink" }, this.svg);
    svg("rect", { width: S, height: S, fill: `url(#${uid}-d)`, mask: `url(#${uid}-m)`, "clip-path": `url(#${uid}-c)`, class: "nk-halftone" }, this.svg);
    this.gRouteUnder = svg("path", { class: "nk-route-under" }, this.svg);
    this.gRoute = svg("path", { class: "nk-route" }, this.svg);
    this.gMarks = svg("g", {}, this.svg);
    this.gHome = svg("g", { class: "nk-home" }, this.svg);
    this.gHero = svg("g", { class: "nk-hero" }, this.svg);
    this.gRim = svg("path", { class: "nk-rim" }, this.svg);
    svg("image", { href: grain(), width: S, height: S, preserveAspectRatio: "none", class: "nk-grain", "clip-path": `url(#${uid}-c)` }, this.svg);

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

    // home: the siren from the logo, on the tip of Nesodden
    const rays = svg("g", { class: "nk-rays" }, this.gHome);
    [[-12, -10, -16, -15], [0, -14, 0, -21], [12, -10, 16, -15]].forEach(([x1, y1, x2, y2]) =>
      svg("line", { x1, y1, x2, y2 }, rays));
    svg("path", { d: "M-7 1 A7 7 0 0 1 7 1 Z", fill: "#e23c2e", stroke: KEY, "stroke-width": 1.6 }, this.gHome);
    svg("rect", { x: -9, y: 1, width: 18, height: 4, rx: 1, fill: "#5a3a1c", stroke: KEY, "stroke-width": 1.4 }, this.gHome);

    // Helt nøtta, flying the parcel home. Image faces right.
    this.hero = svg("image", {
      href: `${this.assets}nan-ill-heltnotta-flyr-pakke-360.webp`,
      width: 120, height: 85, x: -60, y: -48, class: "nk-hero-img",
    }, this.gHero);

    const legend = el("p", { class: "nk-legend", "aria-hidden": "true" }, stage);
    legend.innerHTML = `<span><i class="nk-lg-ours"></i>I glassene våre</span><span><i class="nk-lg-rest"></i>Resten av nøtteverden</span><span><i class="nk-lg-route"></i>Utrykning til Nesodden</span><span><i class="nk-lg-dist"></i>Bare avstand</span>`;
    el("p", { class: "nk-hint", "aria-hidden": "true" }, stage).textContent = "Dra for å snu kloden";

    // ---- panel -----------------------------------------------------------
    const panel = el("div", { class: "nk-panel" }, r);
    const nav = el("nav", { class: "nk-nav", "aria-label": "Velg nøtt" }, panel);
    this.buttons = [];
    for (const [title, list] of [
      ["I glassene våre", data.notter.filter((n) => n.produkter.length)],
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

    // ---- drag to rotate --------------------------------------------------
    let last = null;
    this.svg.addEventListener("pointerdown", (e) => {
      this.dragging = true; this.idle = false; last = [e.clientX, e.clientY];
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
    ang = Math.max(-35, Math.min(35, ang)); // keep him upright-ish; he's a squirrel, not a rocket
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
    const token = (this.token = {});
    this.selected = n;
    if (animate) this.idle = false;
    for (const { n: m, g } of this.marks) g.classList.toggle("is-active", m.id === id);
    for (const { n: m, b } of this.buttons) b.setAttribute("aria-pressed", String(m.id === id));
    const [accent] = INK[n.farge] || INK.camel;
    this.root.style.setProperty("--nk-accent", accent);

    const src = n.vaare || n.opphav;
    const from = [src.lon, src.lat];
    const interp = geoInterpolate(from, HOME);
    const km = Math.round(geoDistance(from, HOME) * 6371);
    this.renderCard(n, km);
    this.root.dispatchEvent(new CustomEvent("nottekart:select", { bubbles: true, detail: { id, km } }));

    // frame the trip: centre between origin and home, unless it's half the planet away
    const far = geoDistance(from, HOME) > 2.2;
    const centre = far ? geoInterpolate(from, HOME)(0.2) : interp(0.5);
    const ours = n.produkter.length > 0; // only what's in our jars gets an utrykning (and a hero)
    this.flight = { interp, t: 0, flying: false, ours };
    this.gRoute.classList.toggle("is-distance", !ours);
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

  alarm() {
    this.gHome.classList.remove("is-alarm");
    void this.gHome.getBBox();
    this.gHome.classList.add("is-alarm");
  }

  goTo(id) { this.select(id); }

  renderCard(n, km) {
    const c = this.card;
    const nr = String(data.notter.indexOf(n) + 1).padStart(2, "0");
    const total = String(data.notter.length).padStart(2, "0");
    c.innerHTML = "";
    c.dataset.stempel = n.stempel;

    const top = el("div", { class: "nk-card-top" }, c);
    el("span", { class: "nk-tag" }, top).textContent = `${n.produkter.length ? "Utrykning" : "Oppslag"} nr. ${nr}/${total}`;
    el("span", { class: "nk-tag nk-tag-ghost" }, top).textContent = fmtCoord(n.opphav.lat, n.opphav.lon);

    const stamp = el("p", { class: `nk-stamp nk-stamp-${n.stempel}` }, c);
    stamp.textContent = STEMPEL[n.stempel] || "";

    el("h3", { class: "nk-title" }, c).textContent = n.navn;
    el("p", { class: "nk-latin" }, c).textContent = `${n.latin} · ${n.opphav.sted}`;
    el("p", { class: "nk-botany" }, c).textContent = n.botanikk;
    el("p", { class: "nk-story" }, c).textContent = n.historie;
    el("blockquote", { class: "nk-wit" }, c).textContent = n.vits;

    const ours = el("dl", { class: "nk-ours" }, c);
    const row = (k, v) => { el("dt", {}, ours).textContent = k; el("dd", {}, ours).textContent = v; };
    if (n.produkter.length) {
      row("I glassene våre", n.produkter.join(" · "));
      row("Våre kommer fra", n.vaare ? n.vaare.land : "Vi sjekker med leverandøren. Ærlighet tar litt tid.");
      row(n.vaare ? "Reisen hit" : "Reisen hit (fra opphavet)", `${fmtKm(km)} km til Nesodden`);
    } else {
      row("I glassene våre", "Nei. Med på kartet for allmenndannelsens skyld.");
      row("Avstand", `${fmtKm(km)} km fra Nesodden`);
    }
    if (!n.verifisert) el("p", { class: "nk-draft" }, c).textContent = "Utkast · fakta ikke verifisert";
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

  bindScroll() {
    const ST = window.ScrollTrigger;
    if (!window.gsap || !ST || reduceMotion()) return;
    let base = null;
    ST.create({
      trigger: this.root, start: "top top", end: "bottom top", scrub: 0.6,
      onUpdate: (self) => {
        if (this.dragging) return;
        if (base === null) base = this.rotation[0];
        this.idle = false;
        this.setRotation([base + self.progress * 120, this.rotation[1]]);
      },
    });
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
