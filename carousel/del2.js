/*
  Nøtteverden del 2 – "Hvor kommer våre fra?"
  Kjør: npm run build && npm run carousel:del2  →  carousel/out/nan-car-notteverden-del2-NN.png

  Bare bekreftede ruter vises (feltet `vaare` i src/notter.json). Det som ikke er bekreftet,
  får sitt eget ærlige lysbilde. Når databladene kommer: fyll inn `vaare`, kjør på nytt.
*/
const { chromium } = require("playwright");
const { data, HOME, art, nut, km, ACCENT, fontCSS, BASE_CSS, globeShots, exportSlides, hasRecoleta } = require("./lib");

// Routes we can show, in the order of the story. `steg` = the stops on the way, in plain words.
const RUTER = [
  { id: "jordbaer", produkt: "Cashewdrøm med jordbær", steg: ["Slovakia", "Tsjekkia", HOME.sted],
    tekst: "Dyrket i Slovakia. Pakket i Tsjekkia. Smurt på brød ved Oslofjorden." },
  { id: "kakao", produkt: "Sunntella", accent: "red", steg: ["Brasil", HOME.sted],
    tekst: "Kakaoen som gjør Sunntella brun, kommer fra Brasil." },
  { id: "matcha", produkt: "Cashewdrøm med matcha", steg: ["Japan", HOME.sted],
    tekst: "Grønne teblader fra Japan, malt til pulver. Den mest zen ingrediensen i hylla." },
];
const VENTER = ["mandel", "hasselnott", "cashew", "kokos"]; // new suppliers, data sheets pending
const TOTAL = 6;
const pager = (i) => `<span class="tag ghost">${String(i).padStart(2, "0")} / ${String(TOTAL).padStart(2, "0")}</span>`;

(async () => {
  console.log(hasRecoleta() ? "Recoleta: fonts-local ✓" : "Recoleta missing in fonts-local/ – using Fraunces stand-in");
  const browser = await chromium.launch();
  const confirmed = RUTER.filter((r) => nut(r.id).vaare);           // never show a route we can't stand behind
  const globes = await globeShots(browser, confirmed.map((r) => ({ id: r.id, flight: 0.58 })));
  const slides = [];

  // 1 · cover
  slides.push(`<section class="slide cover">
    <div class="top"><span class="tag">Nøtteverden · del 2</span>${pager(1)}</div>
    <h1 class="display" style="margin-top:96px">Hvor kommer<br>våre fra?</h1>
    <p class="lead" style="margin-top:40px;max-width:760px">Helt nøtta på utrykning. Bare rutene vi kan stå inne for.</p>
    <div class="hero"><img src="${art("nan-ill-heltnotta-flyr-tom-1024.webp")}" alt=""><img class="cargo" src="${art("notter/nan-ill-jordbaer-512.webp")}" alt=""></div>
    <p class="mono swipe">Sveip for ruten →</p>
  </section>`);

  // 2–4 · confirmed routes
  confirmed.forEach((r, i) => {
    const n = nut(r.id);
    const accent = ACCENT[r.accent || n.farge];
    const route = r.steg.map((s) => `<span>${s}</span>`).join('<i aria-hidden="true">→</i>');
    slides.push(`<section class="slide route" style="--accent:${accent}">
      <div class="top"><span class="tag">Utrykning ${String(i + 1).padStart(2, "0")} / ${String(confirmed.length).padStart(2, "0")}</span>${pager(i + 2)}</div>
      <div class="globe-wrap"><img class="globe" src="${globes[r.id]}" alt=""></div>
      <div class="card">
        <p class="mono route-line">${route}</p>
        <div class="row"><h2>${n.navn}</h2><p class="km"><b>${km(n.vaare)}</b> km</p></div>
        <p class="lead small">${r.tekst}</p>
        <p class="mono meta">I ${r.produkt}</p>
      </div>
    </section>`);
  });

  // 5 · the honest one
  slides.push(`<section class="slide honest">
    <div class="top"><span class="tag">Og resten?</span>${pager(TOTAL - 1)}</div>
    <h2 class="display" style="font-size:118px;margin-top:70px">Vi kunne gjettet.<br>Det gjør vi ikke.</h2>
    <p class="lead small" style="margin-top:36px;max-width:820px">Vi har byttet leverandører. Før vi tegner én eneste rute for mandler, hasselnøtter, cashew og kokos, vil vi se databladene.</p>
    <div class="grid">${VENTER.map((id) => `<figure><img src="${art(`notter/nan-ill-${id}-512.webp`)}" alt=""><figcaption class="mono">${nut(id).navn}</figcaption><span class="stamp mini">Venter på datablad</span></figure>`).join("")}</div>
  </section>`);

  // 6 · home + call to action
  slides.push(`<section class="slide home">
    <div class="top"><span class="tag">Hjemme</span>${pager(TOTAL)}</div>
    <h2 class="display" style="font-size:132px;margin-top:70px">Alle ruter<br>ender her.</h2>
    <p class="lead small" style="margin-top:30px">${HOME.notat.split(" · ").map((x) => x[0].toUpperCase() + x.slice(1)).join(". ")}.</p>
    <p class="sign">Ved nøtt-nød – ring oss.</p>
    <div class="cta"><span class="pill-link">nøttanrop.no/notteverden</span></div>
  </section>`);

  const html = `<!doctype html><html lang="no"><meta charset="utf-8"><style>${fontCSS()}${BASE_CSS}
  .cover{background:var(--almond)}
  .cover .hero{position:absolute;left:150px;right:0;bottom:170px}
  .cover .hero img:first-child{width:880px;display:block}
  .cover .hero .cargo{position:absolute;width:118px;left:790px;top:232px;transform:rotate(-6deg);filter:drop-shadow(4px 6px 0 rgba(27,17,8,.18))}
  .cover .swipe{position:absolute;left:72px;bottom:96px;margin:0}
  .route .globe-wrap{flex:1;display:grid;place-items:center;min-height:0;margin:10px 0 -40px}
  .route .globe{width:800px;height:800px}
  .route .card{position:relative;z-index:2;background:var(--cream);border:3px solid var(--key);border-radius:30px;box-shadow:14px 14px 0 var(--accent);padding:40px 50px 44px}
  .route .route-line{margin:0 0 18px;display:flex;flex-wrap:wrap;gap:14px;align-items:center;color:var(--brown)}
  .route .route-line i{font-style:normal;color:var(--accent)}
  .route .row{display:flex;justify-content:space-between;align-items:baseline;gap:20px}
  .route h2{font:600 112px/.95 var(--display);margin:0;color:var(--brown)}
  .route .km{margin:0;font:500 30px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
  .route .km b{font:600 76px/1 var(--display);letter-spacing:0;text-transform:none}
  .lead.small{font-size:32px;margin-top:18px}
  .route .meta{margin:22px 0 0;opacity:.85}
  .honest .grid{margin-top:auto;display:grid;grid-template-columns:1fr 1fr;gap:28px 36px;padding-bottom:10px}
  .honest figure{position:relative;margin:0;height:300px;border:3px solid var(--key);border-radius:24px;background:#fff8ef;display:grid;place-items:center}
  .honest figure img{width:210px;height:210px;object-fit:contain;opacity:.92}
  .honest figcaption{position:absolute;left:22px;bottom:18px;font-size:20px}
  .honest .stamp.mini{position:absolute;right:-6px;top:22px;font-size:20px;border-width:4px;outline-width:1.5px;outline-offset:4px;padding:10px 12px;color:var(--red)}
  .home{background:url(${art("nan-bg-oslofjorden-skumring-1080.webp")}) center/cover}
  .home .cta{margin-top:auto;padding-bottom:40px}
  .home .sign{font:600 46px/1 var(--display);margin:40px 0 0;color:var(--brown)}
  </style><body>${slides.join("\n")}</body></html>`;

  await exportSlides(browser, html, "nan-car-notteverden-del2");
  await browser.close();
})();
