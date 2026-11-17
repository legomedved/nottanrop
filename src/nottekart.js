/*
  Nøttekart — et interaktivt nøttekart for nøttanrop.no
  ------------------------------------------------------
  Bruk i Webflow:
    <div data-nottekart></div>
    <script src=".../nottekart.min.js" defer></script>

  Valgfrie attributter på div-en:
    data-nk-scroll   → globusen roterer når man scroller (krever GSAP + ScrollTrigger)
    data-nk-start    → id for nøtta som er valgt ved start (f.eks. "mandel")

  JavaScript-API (for GSAP-animasjoner):
    window.Nottekart.instances[0].goTo("cashew")
    window.Nottekart.instances[0].setRotation([lon, lat])
*/

import { geoOrthographic, geoPath, geoGraticule10, geoDistance } from "d3-geo";
import { feature } from "topojson-client";
import land110 from "world-atlas/land-110m.json";
import data from "./notter.json";
import css from "./nottekart.css";

// Brand palette (from the Nøttanrop design system). Base + dark step per family.
const FARGER = {
  orange:   ["#ff7a2a", "#cc6121"],
  red:      ["#e23c2e", "#b43024"],
  green:    ["#bee6db", "#4c5c57"],
  pistasj:  ["#b8be6e", "#4a4c2c"],
  matcha:   ["#7fa233", "#334114"],
  jordbaer: ["#e2506e", "#5a202c"],
  brown:    ["#5a3a1c", "#24170b"],
  camel:    ["#c49a6c", "#5a3a1c"],
};

const SVGNS = "http://www.w3.org/2000/svg";
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const land = feature(land110, land110.objects.land);
const graticule = geoGraticule10();

function el(tag, attrs = {}, parent, ns) {
  const n = ns ? document.createElementNS(ns, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}

function injectCSS() {
  if (document.getElementById("nk-css")) return;
  const s = el("style", { id: "nk-css" });
  s.textContent = css;
  document.head.appendChild(s);
}

class Nottekart {
  constructor(root) {
    this.root = root;
    this.size = 600;
    this.rotation = [-20, -35, 0]; // start: Europe facing us
    this.projection = geoOrthographic()
      .scale(this.size / 2 - 4)
      .translate([this.size / 2, this.size / 2])
      .clipAngle(90)
      .precision(0.5);
    this.path = geoPath(this.projection);
    this.selected = null;
    this.dragging = false;
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

    // --- globe -----------------------------------------------------------
    const stage = el("div", { class: "nk-stage" }, r);
    this.svg = el("svg", {
      class: "nk-globe",
      viewBox: `0 0 ${this.size} ${this.size}`,
      role: "img",
      "aria-label": "Jordklode som viser hvor nøttene kommer fra. Dra for å snu den, eller velg en nøtt i listen.",
    }, stage, SVGNS);
    this.gSphere = el("path", { class: "nk-sphere" }, this.svg, SVGNS);
    this.gGrat = el("path", { class: "nk-grat" }, this.svg, SVGNS);
    this.gLand = el("path", { class: "nk-land" }, this.svg, SVGNS);
    this.gMarks = el("g", { class: "nk-marks" }, this.svg, SVGNS);

    this.marks = data.notter.map((n) => {
      const [base, dark] = FARGER[n.farge] || FARGER.camel;
      const g = el("g", { class: "nk-mark", "data-id": n.id, "aria-hidden": "true" }, this.gMarks, SVGNS);
      el("circle", { class: "nk-pulse", r: 10, fill: base }, g, SVGNS);
      el("circle", { class: "nk-dot", r: 7, fill: base, stroke: dark }, g, SVGNS);
      g.addEventListener("click", () => this.select(n.id));
      return { n, g };
    });

    el("p", { class: "nk-hint", "aria-hidden": "true" }, stage).textContent = "Dra for å snu kloden ↻";

    // --- panel -----------------------------------------------------------
    const panel = el("div", { class: "nk-panel" }, r);
    const nav = el("nav", { class: "nk-nav", "aria-label": "Velg nøtt" }, panel);
    const ul = el("ul", {}, nav);
    this.buttons = data.notter.map((n) => {
      const li = el("li", {}, ul);
      const b = el("button", { type: "button", class: "nk-chip", "data-farge": n.farge, "aria-pressed": "false" }, li);
      b.style.setProperty("--nk-c", (FARGER[n.farge] || FARGER.camel)[0]);
      b.textContent = n.navn;
      b.addEventListener("click", () => this.select(n.id));
      return { n, b };
    });

    this.card = el("article", { class: "nk-card", "aria-live": "polite" }, panel);

    // --- drag to rotate ----------------------------------------------------
    let last = null;
    this.svg.addEventListener("pointerdown", (e) => {
      this.dragging = true; this.idle = false; last = [e.clientX, e.clientY];
      this.svg.setPointerCapture(e.pointerId);
      this.root.classList.add("nk-touched");
    });
    this.svg.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      const k = 180 / (this.svg.getBoundingClientRect().width || this.size); // degrees per px
      const [x, y] = last; last = [e.clientX, e.clientY];
      const [l, p] = this.rotation;
      this.setRotation([l + (e.clientX - x) * k, Math.max(-80, Math.min(80, p - (e.clientY - y) * k))]);
    });
    const end = () => { this.dragging = false; };
    this.svg.addEventListener("pointerup", end);
    this.svg.addEventListener("pointercancel", end);
  }

  setRotation([l, p]) {
    this.rotation = [l, p, 0];
    this.render();
  }

  render() {
    this.projection.rotate(this.rotation);
    this.gSphere.setAttribute("d", this.path({ type: "Sphere" }));
    this.gGrat.setAttribute("d", this.path(graticule));
    this.gLand.setAttribute("d", this.path(land));
    const center = [-this.rotation[0], -this.rotation[1]];
    for (const { n, g } of this.marks) {
      const pt = [n.opphav.lon, n.opphav.lat];
      const visible = geoDistance(pt, center) < Math.PI / 2 - 0.05;
      g.style.display = visible ? "" : "none";
      if (visible) {
        const [x, y] = this.projection(pt);
        g.setAttribute("transform", `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      }
    }
  }

  // Smoothly turn the globe so [lon, lat] faces the viewer.
  rotateTo(lon, lat, ms = 1100) {
    const from = this.rotation.slice(0, 2);
    let toL = -lon, toP = -lat;
    while (toL - from[0] > 180) toL -= 360;   // take the short way round
    while (toL - from[0] < -180) toL += 360;
    if (reduceMotion() || ms === 0) return this.setRotation([toL, toP]);
    cancelAnimationFrame(this.raf);
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms), e = ease(t);
      this.setRotation([from[0] + (toL - from[0]) * e, from[1] + (toP - from[1]) * e]);
      if (t < 1) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  select(id, { animate = true } = {}) {
    const n = data.notter.find((x) => x.id === id);
    if (!n) return;
    this.selected = n;
    this.idle = animate ? false : this.idle;
    for (const { n: m, g } of this.marks) g.classList.toggle("is-active", m.id === id);
    for (const { n: m, b } of this.buttons) b.setAttribute("aria-pressed", String(m.id === id));
    this.root.style.setProperty("--nk-accent", (FARGER[n.farge] || FARGER.camel)[0]);
    this.renderCard(n);
    this.rotateTo(n.opphav.lon, n.opphav.lat, animate ? 1100 : 0);
  }

  goTo(id) { this.select(id); }

  renderCard(n) {
    const c = this.card;
    c.innerHTML = "";
    el("p", { class: "nk-label" }, c).textContent = `Opprinnelse · ${n.opphav.sted}`;
    el("h3", { class: "nk-title" }, c).textContent = n.navn;
    el("p", { class: "nk-latin" }, c).textContent = n.latin;
    el("p", { class: "nk-story" }, c).textContent = n.historie;
    el("p", { class: "nk-wit" }, c).textContent = n.vits;

    const ours = el("div", { class: "nk-ours" }, c);
    if (n.produkter.length) {
      el("p", { class: "nk-label" }, ours).textContent = "I glassene våre";
      el("p", {}, ours).textContent = n.produkter.join(" · ");
      el("p", { class: "nk-label" }, ours).textContent = "Våre kommer fra";
      el("p", {}, ours).textContent = n.vaare ? n.vaare.land : "Vi sjekker med leverandøren. Ærlighet tar litt tid.";
    } else {
      el("p", { class: "nk-label" }, ours).textContent = "Ikke i glassene våre (ennå)";
      el("p", {}, ours).textContent = "Med på kartet for allmenndannelsens skyld.";
    }
    if (!n.verifisert) el("p", { class: "nk-draft" }, c).textContent = "UTKAST – fakta ikke verifisert";
  }

  // Slow drift when nobody is touching it. Stops on interaction and for reduced motion.
  startIdleSpin() {
    if (reduceMotion()) return;
    let prev = performance.now();
    const tick = (now) => {
      const dt = now - prev; prev = now;
      if (this.idle && !this.dragging && this.inView !== false) {
        this.setRotation([this.rotation[0] + dt * 0.006, this.rotation[1]]);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // Don't burn battery when the globe is off-screen.
    new IntersectionObserver(([e]) => { this.inView = e.isIntersecting; }).observe(this.root);
  }

  // Optional: scroll drives a half-turn of the globe (GSAP ScrollTrigger, which Webflow ships).
  bindScroll() {
    const ST = window.ScrollTrigger;
    if (!window.gsap || !ST || reduceMotion()) return;
    const start = this.rotation[0];
    ST.create({
      trigger: this.root,
      start: "top top",
      end: "bottom top",
      scrub: 0.6,
      onUpdate: (self) => { if (!this.dragging) { this.idle = false; this.setRotation([start + self.progress * 180, this.rotation[1]]); } },
    });
  }
}

function init() {
  injectCSS();
  const instances = [...document.querySelectorAll("[data-nottekart]")].map((r) => new Nottekart(r));
  window.Nottekart = { instances, data };
  window.dispatchEvent(new CustomEvent("nottekart:ready", { detail: instances }));
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
