/* Shared parts for the Nøtteverden carousels: data, fonts, paper, globe snapshots, PNG export. */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BUILD = path.join(__dirname, "build");
// SLIDE_H=1350 renders the 4:5 feed format (Meta Business Suite); default 1440 is 3:4.
const H = Number(process.env.SLIDE_H || 1440);
const OUT = path.join(__dirname, "out", H === 1440 ? "" : `${H}`);
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "src/notter.json"), "utf8"));
const HOME = data.hjem;
const url = (p) => "file://" + p;
const art = (f) => url(path.join(__dirname, "art", f));
const local = (f) => path.join(ROOT, "fonts-local", f);
const nut = (id) => data.notter.find((n) => n.id === id);

const ACCENT = { orange: "#ff7a2a", red: "#e23c2e", green: "#bee6db", pistasj: "#b8be6e", matcha: "#7fa233",
  jordbaer: "#e2506e", mango: "#ffb02e", solbaer: "#7a2e68", brown: "#5a3a1c", camel: "#c49a6c" };

function km(from) {
  const r = Math.PI / 180;
  const d = Math.acos(Math.sin(from.lat * r) * Math.sin(HOME.lat * r) +
    Math.cos(from.lat * r) * Math.cos(HOME.lat * r) * Math.cos((from.lon - HOME.lon) * r));
  return Math.round(d * 6371).toLocaleString("nb-NO");
}

// Brand fonts: the site's own files from the git-ignored fonts-local/ (licensed), with open stand-ins.
function fontCSS() {
  const ff = (family, weight, file) => fs.existsSync(file) ? `@font-face{font-family:"${family}";font-weight:${weight};src:url(${url(file)})}` : "";
  const fs_ = (pkg, f) => url(path.join(ROOT, "node_modules/@fontsource", pkg, "files", f));
  return [
    ff("Recoleta", 600, local("Recoleta-SemiBold.otf")),
    ff("DM Sans", "100 1000", local("DMSans-Variable.ttf")),
    ff("DM Mono", 500, local("DMMono-Medium.ttf")),
    `@font-face{font-family:"Fraunces";font-weight:600;src:url(${fs_("fraunces", "fraunces-latin-600-normal.woff2")})}`,
    `@font-face{font-family:"DM Sans";font-weight:400;src:url(${fs_("dm-sans", "dm-sans-latin-400-normal.woff2")})}`,
  ].join("\n");
}

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>")}")`;

const BASE_CSS = `
:root{--cream:#fbf7f3;--almond:#f5e0c6;--brown:#5a3a1c;--key:#1b1108;--red:#e23c2e;--orange:#ff7a2a;
  --display:"Recoleta","Fraunces",Georgia,serif;--body:"DM Sans",system-ui,sans-serif;--mono:"DM Mono","Space Mono",monospace}
*{box-sizing:border-box} body{margin:0;background:#ccc}
.slide{position:relative;width:1080px;height:${H}px;overflow:hidden;background:var(--cream);color:var(--brown);
  font-family:var(--body);padding:72px;display:flex;flex-direction:column;margin-bottom:20px}
.slide::after{content:"";position:absolute;inset:0;background-image:${GRAIN};opacity:.10;mix-blend-mode:multiply;pointer-events:none;z-index:9}
.top{display:flex;justify-content:space-between;align-items:center;position:relative;z-index:3}
.tag{font:500 22px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;background:var(--brown);color:var(--cream);padding:13px 20px;border-radius:999px}
.tag.ghost{background:transparent;color:var(--brown);box-shadow:inset 0 0 0 2.5px var(--brown)}
.display{font:600 150px/.9 var(--display);letter-spacing:-.02em;margin:0;color:var(--brown)}
.lead{font:400 38px/1.35 var(--body);margin:0}
.mono{font:500 24px/1.3 var(--mono);letter-spacing:.07em;text-transform:uppercase}
.stamp{margin:0;font:500 40px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--key);
  border:6px solid currentColor;outline:2.5px solid currentColor;outline-offset:6px;padding:16px 20px;border-radius:10px;
  transform:rotate(-8deg);background:rgba(251,247,243,.82);mix-blend-mode:multiply;display:inline-block}
.pill-link{display:inline-block;font:500 34px/1 var(--mono);background:var(--key);color:var(--cream);padding:22px 30px;border-radius:999px;box-shadow:8px 8px 0 var(--orange)}
`;

// Globe snapshots from the real component. flight: 0..1 puts Helt nøtta mid-route.
async function globeShots(browser, list) {
  fs.mkdirSync(BUILD, { recursive: true });
  fs.writeFileSync(path.join(BUILD, "globe.html"),
    `<!doctype html><meta charset="utf-8"><body style="margin:0;background:transparent">
     <div data-nottekart style="width:900px;display:block"></div>
     <script src="${url(path.join(ROOT, "dist/nottekart.min.js"))}"></script>`);
  const p = await browser.newPage({ viewport: { width: 900, height: 1400 } });
  await p.goto(url(path.join(BUILD, "globe.html")));
  await p.waitForFunction(() => window.Nottekart);
  await p.evaluate(() => { document.querySelectorAll(".nk-hint, .nk-panel, .nk-legend").forEach((e) => e.remove()); window.Nottekart.instances[0].idle = false; });
  const files = {};
  for (const { id, flight = 1 } of list) {
    await p.evaluate(async ([id, t]) => {
      const k = window.Nottekart.instances[0];
      await k.select(id, { animate: false });
      k.idle = false;
      k.flight.t = t; k.flight.flying = t < 1; k.render();
    }, [id, flight]);
    await p.waitForTimeout(500); // let the hero and cargo images decode
    const f = path.join(BUILD, `globe-${id}-${flight}.png`);
    await p.locator(".nk-globe").screenshot({ path: f, omitBackground: true });
    files[id] = url(f);
  }
  await p.close();
  return files;
}

// Route snapshots for any ingredient: from [lon,lat] to home, Helt nøtta at progress t carrying `cargo` (a file path).
async function routeShots(browser, list) {
  fs.mkdirSync(BUILD, { recursive: true });
  fs.writeFileSync(path.join(BUILD, "globe.html"),
    `<!doctype html><meta charset="utf-8"><body style="margin:0;background:transparent">
     <div data-nottekart style="width:900px;display:block"></div>
     <script src="${url(path.join(ROOT, "dist/nottekart.min.js"))}"></script>`);
  const p = await browser.newPage({ viewport: { width: 900, height: 1400 } });
  await p.goto(url(path.join(BUILD, "globe.html")));
  await p.waitForFunction(() => window.Nottekart);
  await p.evaluate(() => document.querySelectorAll(".nk-hint, .nk-panel, .nk-legend").forEach((e) => e.remove()));
  const files = {};
  for (const { key, from, cargo, t = 0.58 } of list) {
    await p.evaluate(([from, href, t]) => window.Nottekart.instances[0].showRoute(from, href, t), [from, url(cargo), t]);
    await p.waitForTimeout(500);
    const f = path.join(BUILD, `route-${key}.png`);
    await p.locator(".nk-globe").screenshot({ path: f, omitBackground: true });
    files[key] = url(f);
  }
  await p.close();
  return files;
}

async function exportSlides(browser, html, prefix) {
  fs.mkdirSync(OUT, { recursive: true });
  const f = path.join(BUILD, `${prefix}.html`);
  fs.writeFileSync(f, html);
  const p = await browser.newPage({ viewport: { width: 1080, height: H }, deviceScaleFactor: 1 });
  await p.goto(url(f));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  const els = await p.locator(".slide").all();
  for (let i = 0; i < els.length; i++) {
    const out = path.join(OUT, `${prefix}-${String(i + 1).padStart(2, "0")}.png`);
    await els[i].screenshot({ path: out });
    console.log("✓", path.relative(ROOT, out));
  }
  await p.close();
}

module.exports = { H, ROOT, data, HOME, url, art, nut, km, ACCENT, fontCSS, BASE_CSS, globeShots, routeShots, exportSlides,
  hasRecoleta: () => fs.existsSync(local("Recoleta-SemiBold.otf")) };
