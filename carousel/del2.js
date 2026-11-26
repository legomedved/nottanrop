/*
  Nøtteverden del 2 – "Alt som er i glassene" (alle 12 ingredienser i de 6 glassene)
  Kjør: npm run build && npm run carousel:del2  →  carousel/out/nan-car-notteverden-del2-NN.png

  Kilde: `ingredienser` i src/notter.json.
  - Hver ingrediens får en faktasjekket overskrift (`overskrift`, kilde i `overskrift_kilde`).
  - Lysbildene veksler: globus med rute og Helt nøtta ↔ stor illustrasjon på fargeflate.
  - Avstanden står lite og avrundet («≈ … km i luftlinje»): pinnen er et antatt punkt i landet.
  - Uten bekreftet `vaare` → «Venter på datablad». Ingenting gjettes.
*/
const path = require("path");
const { chromium } = require("playwright");
const { H, data, HOME, art, km, ACCENT, fontCSS, BASE_CSS, routeShots, exportSlides, hasRecoleta } = require("./lib");

const ING = data.ingredienser;
const PRODUKT = {
  "Mandelykke": ACCENT.orange, "Sunntella": ACCENT.red, "Cashewdrøm": ACCENT.green,
  "Cashewdrøm med matcha": ACCENT.matcha, "Cashewdrøm med jordbær": ACCENT.jordbaer, "Pistasjkrem": ACCENT.pistasj,
};
const TOTAL = ING.length + 2;
const CONFIRMED = ING.filter((x) => x.vaare).length;
const pad = (n) => String(n).padStart(2, "0");
const pager = (i) => `<span class="tag ghost">${pad(i)} / ${pad(TOTAL)}</span>`;
const artFile = (id) => path.join(__dirname, "art", "notter", `nan-ill-${id}-512.webp`);
const chips = (list) => list.map((p) => `<span class="jar" style="--c:${PRODUKT[p]}">${p}</span>`).join("");
// "≈ 8 400 km i luftlinje": rounded to 100, honest about being approximate
const approx = (v) => `≈ ${(Math.round(Number(km(v).replace(/\s/g, "")) / 100) * 100).toLocaleString("nb-NO")} km i luftlinje`;

(async () => {
  console.log(hasRecoleta() ? "Recoleta: fonts-local ✓" : "Recoleta missing in fonts-local/ – using Fraunces stand-in");
  const browser = await chromium.launch();
  // Globe slides are the 1st, 3rd, 5th … ingredient; only those need a route snapshot.
  const globeIdx = (i) => i % 2 === 0;
  const routes = await routeShots(browser, ING.filter((x, i) => x.vaare && globeIdx(i))
    .map((x) => ({ key: x.id, from: [x.vaare.lon, x.vaare.lat], cargo: artFile(x.id) })));
  const slides = [];

  // 1 · cover: the pantry poster
  slides.push(`<section class="slide cover">
    <div class="top"><span class="tag">Nøtteverden · del 2</span>${pager(1)}</div>
    <h1 class="display" style="margin-top:70px">Alt som er<br>i glassene.</h1>
    <p class="lead small" style="margin-top:28px;max-width:860px">${ING.length} ingredienser. 6 glass. ${CONFIRMED === ING.length ? `${CONFIRMED} ruter, alle hjem til Oslofjorden.` : `${CONFIRMED} ruter vi kan stå inne for. Resten tegner vi når databladene ligger på bordet.`}</p>
    <div class="pantry">${ING.map((x) => `<figure><img src="${art(`notter/nan-ill-${x.id}-512.webp`)}" alt=""><figcaption class="mono">${x.navn}</figcaption></figure>`).join("")}</div>
  </section>`);

  // 2–13 · one per ingredient, alternating globe / illustration
  ING.forEach((x, i) => {
    const accent = ACCENT[x.farge] || ACCENT.camel;
    const isGlobe = globeIdx(i) && x.vaare;
    const head = `<div class="top"><span class="tag">Ingrediens ${pad(i + 1)} / ${pad(ING.length)}</span>${pager(i + 2)}</div>`;
    const where = x.vaare
      ? `<p class="mono where">${[x.vaare.land, x.vaare.via, HOME.sted].filter(Boolean).map((s) => `<span>${s}</span>`).join('<i aria-hidden="true">→</i>')}<span class="dist">${approx(x.vaare)}</span></p>`
      : `<p class="mono where"><span>Opprinnelse</span><i aria-hidden="true">→</i><span>venter på datablad</span></p>`;
    const finnes = `<div class="jars"><span class="mono finnes">${x.i.length === 6 ? "I alle seks glass" : "Finnes i"}</span>${chips(x.i)}</div>`;
    const card = `<div class="card">
        ${where}
        <h2 class="${x.navn.length > 8 ? "long" : ""}">${x.navn}</h2>
        <p class="fact">${x.overskrift}</p>
        ${finnes}
      </div>`;
    if (isGlobe) {
      slides.push(`<section class="slide globe-s" style="--accent:${accent}">${head}
        <div class="visual"><img class="globe" src="${routes[x.id]}" alt=""></div>${card}</section>`);
    } else {
      slides.push(`<section class="slide art-s" style="--accent:${accent}">${head}
        <div class="visual"><div class="plate"><img src="${art(`notter/nan-ill-${x.id}-512.webp`)}" alt=""></div>
        ${x.vaare ? "" : '<p class="stamp">Venter på datablad</p>'}</div>${card}</section>`);
    }
  });

  // 14 · home + call to action
  slides.push(`<section class="slide home">
    <div class="top"><span class="tag">Hjemme</span>${pager(TOTAL)}</div>
    <h2 class="display" style="font-size:132px;margin-top:70px">Alle ruter<br>ender her.</h2>
    <p class="lead small" style="margin-top:30px">${HOME.notat.split(" · ").map((s) => s[0].toUpperCase() + s.slice(1)).join(". ")}.</p>
    <p class="sign">Vi kunne gjettet. Det gjør vi ikke.</p>
    <div class="cta"><span class="pill-link">nøttanrop.no/notteverden</span></div>
  </section>`);

  const html = `<!doctype html><html lang="no"><meta charset="utf-8"><style>${fontCSS()}${BASE_CSS}
  .lead.small{font-size:32px;margin-top:18px}
  .cover{background:var(--almond)}
  .cover .pantry{margin-top:auto;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding-bottom:6px}
  .cover figure{margin:0;height:186px;background:var(--cream);border:2.5px solid var(--key);border-radius:18px;position:relative;display:grid;place-items:center}
  .cover figure img{max-width:150px;max-height:118px;object-fit:contain;margin-top:-18px}
  .cover figcaption{position:absolute;bottom:12px;left:0;right:0;text-align:center;font-size:17px}

  .visual{position:relative;flex:1;display:grid;place-items:center;min-height:0}
  /* globe slides: cream paper, globe large, card below */
  .globe-s .visual{margin:0 0 -40px}
  .globe-s .globe{width:760px;height:760px}
  /* illustration slides: the ingredient's own colour as a flat print plate, drawing big */
  .art-s{background:color-mix(in srgb, var(--accent) 26%, var(--cream))}
  .art-s .visual{margin:10px 0 -24px}
  .art-s .plate{width:640px;height:640px;border-radius:50%;background:var(--cream);border:3px solid var(--key);
    display:grid;place-items:center;box-shadow:14px 14px 0 color-mix(in srgb, var(--accent) 70%, var(--key))}
  .art-s .plate img{max-width:470px;max-height:400px;object-fit:contain}
  .art-s .stamp{position:absolute;top:60px;right:10px;color:var(--red);font-size:34px}

  .card{position:relative;z-index:2;background:var(--cream);border:3px solid var(--key);border-radius:30px;box-shadow:14px 14px 0 var(--accent);padding:34px 46px 36px}
  .where{margin:0 0 10px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;font-size:20px}
  .where i{font-style:normal;color:color-mix(in srgb, var(--accent) 75%, var(--key))}
  .where .dist{margin-left:auto;opacity:.65;font-size:18px}
  h2{font:600 96px/.95 var(--display);margin:0;color:var(--brown)}
  h2.long{font-size:82px}
  .fact{font:600 42px/1.18 var(--display);color:var(--key);margin:18px 0 0;padding:18px 24px;background:var(--almond);border-radius:18px;
    box-shadow:inset 8px 0 0 var(--accent)}
  .jars{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:22px}
  .finnes{font-size:18px;opacity:.75;margin-right:6px}
  .jar{font:500 19px/1 var(--body);padding:9px 14px 9px 11px;border:2px solid var(--key);border-radius:999px;display:inline-flex;align-items:center;gap:8px}
  .jar::before{content:"";width:14px;height:14px;border-radius:50%;background:var(--c);box-shadow:0 0 0 1.5px var(--key)}

  ${H < 1440 ? `.globe-s .globe{width:680px;height:680px}.art-s .plate{width:560px;height:560px}.art-s .plate img{max-width:410px;max-height:350px}.cover h1{margin-top:40px!important}.cover figure{height:160px}.cover figure img{max-height:100px}` : ""}
  .home{background:url(${art("nan-bg-oslofjorden-skumring-1080.webp")}) center/cover}
  .home .sign{font:600 46px/1.1 var(--display);margin:40px 0 0;color:var(--brown);max-width:700px}
  .home .cta{margin-top:auto;padding-bottom:40px}
  </style><body>${slides.join("\n")}</body></html>`;

  await exportSlides(browser, html, "nan-car-notteverden-del2");
  await browser.close();
})();
