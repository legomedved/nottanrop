/*
  Nøtteverden-karusell → PNG-er for Instagram (1080 × 1440, 3:4)
  Kjør:  npm run build && npm run carousel
  Resultat: carousel/out/nan-car-notteverden-NN.png

  Innholdet hentes fra src/notter.json (samme kilde som nøttekartet),
  og hver nøtt får sin egen globus tegnet av den ekte nøttekart-koden.
*/
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const BUILD = path.join(__dirname, "build");
const OUT = path.join(__dirname, "out");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "src/notter.json"), "utf8"));
const url = (p) => "file://" + p;

// Which nuts, in which order. The drama: impostor, honest one, then the betrayal of our own almond.
const SERIES = ["peanott", "hasselnott", "mandel", "kokos", "valnott"];
const STEMPEL = { ekte: "Ekte nøtt", bedrager: "Ikke nøtt", omstridt: "Omstridt", ingrediens: "Ingrediens" };
const ACCENT = { orange: "#ff7a2a", red: "#e23c2e", green: "#bee6db", pistasj: "#b8be6e", matcha: "#7fa233",
  jordbaer: "#e2506e", mango: "#ffb02e", solbaer: "#7a2e68", brown: "#5a3a1c", camel: "#c49a6c" };
const HOME = data.hjem;
const km = (n) => {
  const r = Math.PI / 180, a = n.opphav;
  const d = Math.acos(Math.sin(a.lat * r) * Math.sin(HOME.lat * r) + Math.cos(a.lat * r) * Math.cos(HOME.lat * r) * Math.cos((a.lon - HOME.lon) * r));
  return Math.round(d * 6371).toLocaleString("nb-NO");
};
const coord = (o) => `${Math.abs(o.lat).toFixed(0)}°${o.lat >= 0 ? "N" : "S"} ${Math.abs(o.lon).toFixed(0)}°${o.lon >= 0 ? "Ø" : "V"}`;
const font = (pkg, file) => url(path.join(ROOT, "node_modules/@fontsource", pkg, "files", file));

(async () => {
  fs.mkdirSync(BUILD, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  // 1) Globes: draw each nut's globe with the real component, transparent background.
  fs.writeFileSync(path.join(BUILD, "globe.html"),
    `<!doctype html><meta charset="utf-8"><body style="margin:0;background:transparent">
     <div data-nottekart style="width:900px;display:block"></div>
     <script src="${url(path.join(ROOT, "dist/nottekart.min.js"))}"></script>`);
  const gp = await browser.newPage({ viewport: { width: 900, height: 1400 } });
  await gp.emulateMedia({ reducedMotion: "reduce" }); // no flight, route drawn instantly
  await gp.goto(url(path.join(BUILD, "globe.html")));
  await gp.waitForFunction(() => window.Nottekart);
  await gp.evaluate(() => { document.querySelector(".nk-hint")?.remove(); });
  for (const id of SERIES) {
    await gp.evaluate((id) => window.Nottekart.instances[0].select(id), id);
    await gp.waitForTimeout(150);
    await gp.locator(".nk-globe").screenshot({ path: path.join(BUILD, `globe-${id}.png`), omitBackground: true });
  }

  // 2) Slides
  const art = (f) => url(path.join(__dirname, "art", f));
  const draft = data.notter.some((n) => SERIES.includes(n.id) && !n.verifisert);
  const total = SERIES.length + 2;
  const pager = (i) => `<span class="tag ghost">${String(i).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span>`;
  const slides = [];

  slides.push(`<section class="slide cover">
    <div class="top"><span class="tag">Nøtteverden · del 1</span>${pager(1)}</div>
    <h1>Nøtt eller<br>bedrager?</h1>
    <p class="lead">Vi har gått nøtteverdenen etter i sømmene. Noen av dem har løyet til oss i årevis.</p>
    <img class="phone" src="${art("nan-ill-heltnotta-telefon-800.webp")}" alt="">
    <p class="swipe">Sveip for avsløringen →</p>
  </section>`);

  SERIES.forEach((id, i) => {
    const n = data.notter.find((x) => x.id === id);
    const accent = n.produkter.length ? ACCENT[n.farge] : ACCENT.camel;
    const visual = id === "mandel"
      ? `<img class="panel-art" src="${art("nan-ill-mandel-panel-800.webp")}" alt="">`
      : `<img class="globe" src="${url(path.join(BUILD, `globe-${id}.png`))}" alt="">`;
    slides.push(`<section class="slide nut" style="--accent:${accent}">
      <div class="top"><span class="tag">${coord(n.opphav)}</span>${pager(i + 2)}</div>
      <div class="visual">${visual}<p class="stamp stamp-${n.stempel}">${STEMPEL[n.stempel]}</p></div>
      <div class="card">
        <h2>${n.navn}</h2>
        <p class="latin">${n.latin} · ${n.opphav.sted}</p>
        <p class="botany">${n.botanikk}</p>
        <p class="wit">${n.vits}</p>
        <p class="meta">${km(n)} km fra Nesodden${n.produkter.length ? ` · i ${n.produkter[0]}` : ""}</p>
      </div>
    </section>`);
  });

  slides.push(`<section class="slide cta">
    <div class="top"><span class="tag">Nøtteverden</span>${pager(total)}</div>
    <img class="fly" src="${art("nan-ill-heltnotta-flyr-pakke-1024.webp")}" alt="">
    <h2>Snu hele kloden selv.</h2>
    <p class="lead">${data.notter.length} nøtter, frø og bedragere – og hvor våre egne kommer fra.</p>
    <p class="link">nøttanrop.no/notteverden</p>
    <p class="sign">Ved nøtt-nød – ring oss.</p>
  </section>`);

  const grain = `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}")`;

  // Recoleta is licensed: it lives in fonts-local/ (git-ignored), never in the repo.
  const rec = ["Recoleta-Bold.woff2", "Recoleta-Bold.woff", "Recoleta-Bold.otf", "Recoleta-Bold.ttf"]
    .map((f) => path.join(ROOT, "fonts-local", f)).find((f) => fs.existsSync(f));
  console.log(rec ? `Recoleta: ${path.basename(rec)}` : "Recoleta not found in fonts-local/ – using Fraunces stand-in");
  const html = `<!doctype html><html lang="no"><meta charset="utf-8"><style>
  ${rec ? `@font-face { font-family: "Recoleta"; font-weight: 700; src: url(${url(rec)}); }` : ""}
  @font-face { font-family: "Fraunces"; font-weight: 700; src: url(${font("fraunces", "fraunces-latin-700-normal.woff2")}); }
  @font-face { font-family: "DM Sans"; font-weight: 400; src: url(${font("dm-sans", "dm-sans-latin-400-normal.woff2")}); }
  @font-face { font-family: "DM Sans"; font-weight: 500; src: url(${font("dm-sans", "dm-sans-latin-500-normal.woff2")}); }
  @font-face { font-family: "Space Mono"; font-weight: 700; src: url(${font("space-mono", "space-mono-latin-700-normal.woff2")}); }
  :root { --cream:#fbf7f3; --almond:#f5e0c6; --brown:#5a3a1c; --key:#1b1108; --red:#e23c2e; --orange:#ff7a2a;
          --display:"Recoleta","Fraunces",Georgia,serif; --body:"DM Sans",system-ui,sans-serif; --mono:"Space Mono",monospace; }
  * { box-sizing: border-box; } body { margin: 0; background: #ccc; }
  .slide { position: relative; width: 1080px; height: 1440px; overflow: hidden; background: var(--cream); color: var(--brown);
           font-family: var(--body); padding: 72px; display: flex; flex-direction: column; margin-bottom: 20px; }
  .slide::after { content: ""; position: absolute; inset: 0; background-image: ${grain}; opacity: .10; mix-blend-mode: multiply; pointer-events: none; }
  ${draft ? `.slide::before { content: "Utkast · ikke publiser"; white-space: nowrap; position: absolute; z-index: 5; top: 84px; left: 50%; transform: translateX(-50%);
     font: 700 18px/1 var(--mono); letter-spacing: .08em; text-transform: uppercase; color: #fff; background: #b43024; padding: 10px 16px; border-radius: 999px; }` : ""}
  .top { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2; }
  .tag { font: 700 22px/1 var(--mono); letter-spacing: .08em; text-transform: uppercase; background: var(--brown); color: var(--cream); padding: 13px 20px; border-radius: 999px; }
  .tag.ghost { background: transparent; color: var(--brown); box-shadow: inset 0 0 0 2.5px var(--brown); }
  h1 { font: 700 168px/.9 var(--display); margin: 90px 0 0; color: var(--brown); letter-spacing: -.02em; position: relative; z-index: 2; }
  h2 { font: 700 120px/.92 var(--display); margin: 0; color: var(--brown); letter-spacing: -.015em; }
  .lead { font: 400 40px/1.35 var(--body); max-width: 760px; margin: 40px 0 0; position: relative; z-index: 2; }
  .cover { background: var(--almond); }
  .cover .phone { position: absolute; right: -20px; bottom: 60px; width: 600px; }
  .swipe { position: absolute; left: 72px; bottom: 120px; margin: 0; font: 700 24px/1 var(--mono); letter-spacing: .08em; text-transform: uppercase; }
  .nut .visual { position: relative; flex: 1; display: grid; place-items: center; min-height: 0; }
  .nut .globe { width: 660px; height: 660px; }
  .nut .panel-art { width: 640px; height: 640px; border-radius: 28px; border: 3px solid var(--key); }
  .stamp { position: absolute; top: 50px; right: 10px; margin: 0; font: 700 44px/1 var(--mono); letter-spacing: .1em; text-transform: uppercase;
           color: var(--key); border: 6px solid currentColor; outline: 2.5px solid currentColor; outline-offset: 6px; padding: 18px 22px; border-radius: 10px;
           transform: rotate(-8deg); background: rgba(251,247,243,.82); mix-blend-mode: multiply; }
  .stamp-bedrager { color: var(--red); } .stamp-omstridt { color: #cc6121; transform: rotate(6deg); }
  .card { position: relative; z-index: 2; background: var(--cream); border: 3px solid var(--key); border-radius: 30px; box-shadow: 14px 14px 0 var(--accent); padding: 46px 52px 50px; }
  .latin { font: italic 400 26px/1.3 var(--body); margin: 14px 0 6px; opacity: .85; }
  .botany { font: 400 30px/1.35 var(--body); margin: 0 0 26px; }
  .wit { font: 700 40px/1.2 var(--display); color: var(--key); margin: 0 0 26px; padding: 20px 26px; background: var(--almond); border-radius: 18px; box-shadow: inset 8px 0 0 var(--accent); }
  .meta { font: 700 22px/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; margin: 0; }
  .cta { background: var(--almond); }
  .cta .fly { width: 820px; margin: 90px auto 50px; display: block; }
  .cta .link { display: inline-block; align-self: flex-start; font: 700 34px/1 var(--mono); background: var(--key); color: var(--cream); padding: 22px 30px; border-radius: 999px; margin: 50px 0 0; box-shadow: 8px 8px 0 var(--orange); }
  .sign { font: 700 44px/1 var(--display); margin: auto 0 60px; }
  </style><body>${slides.join("\n")}</body></html>`;
  fs.writeFileSync(path.join(BUILD, "carousel.html"), html);

  const p = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 1 });
  await p.goto(url(path.join(BUILD, "carousel.html")));
  await p.evaluate(() => document.fonts.ready);
  const els = await p.locator(".slide").all();
  for (let i = 0; i < els.length; i++) {
    const f = path.join(OUT, `nan-car-notteverden-${String(i + 1).padStart(2, "0")}.png`);
    await els[i].screenshot({ path: f });
    console.log("✓", path.relative(ROOT, f));
  }
  await browser.close();
})();
