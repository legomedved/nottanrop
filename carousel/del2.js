/*
  Nøtteverden del 2 – "Alt som er i glassene" (alle 12 ingredienser i de 6 glassene)
  Kjør: npm run build && npm run carousel:del2  →  carousel/out/nan-car-notteverden-del2-NN.png

  Kilde: `ingredienser` i src/notter.json.
  - Har ingrediensen `vaare` (bekreftet opprinnelse) → globus med rute og Helt nøtta i flukt.
  - Ellers → illustrasjon med stempelet «Venter på datablad».
  Når et datablad kommer: fyll inn `vaare` (land, lat, lon), kjør på nytt. Ingenting gjettes.
*/
const path = require("path");
const { chromium } = require("playwright");
const { data, HOME, art, km, ACCENT, fontCSS, BASE_CSS, routeShots, exportSlides, hasRecoleta } = require("./lib");

const ING = data.ingredienser;
const PRODUKT = { // jar → its accent, for the "finnes i" chips
  "Mandelykke": ACCENT.orange, "Sunntella": ACCENT.red, "Cashewdrøm": ACCENT.green,
  "Cashewdrøm med matcha": ACCENT.matcha, "Cashewdrøm med jordbær": ACCENT.jordbaer, "Pistasjkrem": ACCENT.pistasj,
};
const TOTAL = ING.length + 2;
const CONFIRMED = ING.filter((x) => x.vaare).length;
const pad = (n) => String(n).padStart(2, "0");
const pager = (i) => `<span class="tag ghost">${pad(i)} / ${pad(TOTAL)}</span>`;
const artFile = (id) => path.join(__dirname, "art", "notter", `nan-ill-${id}-512.webp`);
const chips = (list) => list.map((p) => `<span class="jar" style="--c:${PRODUKT[p]}">${p}</span>`).join("");

(async () => {
  console.log(hasRecoleta() ? "Recoleta: fonts-local ✓" : "Recoleta missing in fonts-local/ – using Fraunces stand-in");
  const browser = await chromium.launch();
  const routes = await routeShots(browser, ING.filter((x) => x.vaare)
    .map((x) => ({ key: x.id, from: [x.vaare.lon, x.vaare.lat], cargo: artFile(x.id) })));
  const slides = [];

  // 1 · cover: the pantry poster
  slides.push(`<section class="slide cover">
    <div class="top"><span class="tag">Nøtteverden · del 2</span>${pager(1)}</div>
    <h1 class="display" style="margin-top:70px">Alt som er<br>i glassene.</h1>
    <p class="lead small" style="margin-top:28px;max-width:860px">${ING.length} ingredienser. 6 glass. ${CONFIRMED} ruter vi kan stå inne for. Resten tegner vi når databladene ligger på bordet.</p>
    <div class="pantry">${ING.map((x) => `<figure><img src="${art(`notter/nan-ill-${x.id}-512.webp`)}" alt=""><figcaption class="mono">${x.navn}</figcaption></figure>`).join("")}</div>
  </section>`);

  // 2–13 · one per ingredient
  ING.forEach((x, i) => {
    const accent = ACCENT[x.farge] || ACCENT.camel;
    const head = `<div class="top"><span class="tag">Ingrediens ${pad(i + 1)} / ${pad(ING.length)}</span>${pager(i + 2)}</div>`;
    const finnes = `<p class="mono finnes">${x.i.length === 6 ? "I alle seks glass" : "Finnes i"}</p><div class="jars">${chips(x.i)}</div>`;
    if (x.vaare) {
      const steg = [x.vaare.land, x.vaare.via, HOME.sted].filter(Boolean);
      slides.push(`<section class="slide route" style="--accent:${accent}">${head}
        <div class="visual"><img class="globe" src="${routes[x.id]}" alt=""></div>
        <div class="card">
          <p class="mono route-line">${steg.map((s) => `<span>${s}</span>`).join('<i aria-hidden="true">→</i>')}</p>
          <div class="row"><h2 class="${x.navn.length > 8 ? "long" : ""}">${x.navn}</h2><p class="km"><b>${km(x.vaare)}</b> km</p></div>
          <p class="lead small">${x.tekst}</p>
          ${finnes}
        </div></section>`);
    } else {
      const why = x.notat || "Ny leverandør. Vi tegner ruten når databladet ligger på bordet.";
      slides.push(`<section class="slide pending" style="--accent:${accent}">${head}
        <div class="visual"><div class="plate"><img src="${art(`notter/nan-ill-${x.id}-512.webp`)}" alt=""></div><p class="stamp">Venter på datablad</p></div>
        <div class="card">
          <p class="mono route-line"><span>Opprinnelse</span><i aria-hidden="true">→</i><span>kommer</span></p>
          <h2>${x.navn}</h2>
          <p class="lead small">${why}</p>
          ${finnes}
        </div></section>`);
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
  .visual{position:relative;flex:1;display:grid;place-items:center;min-height:0;margin:8px 0 -30px}
  .route .globe{width:780px;height:780px}
  .pending .plate{width:600px;height:600px;border-radius:50%;background:radial-gradient(circle at 38% 34%,#fff8ef,var(--almond));
    border:3px solid var(--key);display:grid;place-items:center;box-shadow:12px 12px 0 var(--accent)}
  .pending .plate img{max-width:420px;max-height:360px;object-fit:contain}
  .pending .stamp{position:absolute;top:70px;right:20px;color:var(--red);font-size:36px}
  .card{position:relative;z-index:2;background:var(--cream);border:3px solid var(--key);border-radius:30px;box-shadow:14px 14px 0 var(--accent);padding:38px 48px 40px}
  .route-line{margin:0 0 16px;display:flex;flex-wrap:wrap;gap:14px;align-items:center}
  .route-line i{font-style:normal;color:var(--accent)}
  .pending .route-line{opacity:.7}
  .row{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:4px 20px}
  h2.long{font-size:84px}
  h2{font:600 104px/.95 var(--display);margin:0;color:var(--brown)}
  .km{margin:0;font:500 30px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
  .km b{font:600 72px/1 var(--display);letter-spacing:0;text-transform:none}
  .finnes{margin:24px 0 12px;font-size:19px;opacity:.8}
  .jars{display:flex;flex-wrap:wrap;gap:10px}
  .jar{font:500 20px/1 var(--body);padding:10px 16px 10px 12px;border:2px solid var(--key);border-radius:999px;display:inline-flex;align-items:center;gap:9px}
  .jar::before{content:"";width:15px;height:15px;border-radius:50%;background:var(--c);box-shadow:0 0 0 1.5px var(--key)}
  .home{background:url(${art("nan-bg-oslofjorden-skumring-1080.webp")}) center/cover}
  .home .sign{font:600 46px/1.1 var(--display);margin:40px 0 0;color:var(--brown);max-width:700px}
  .home .cta{margin-top:auto;padding-bottom:40px}
  </style><body>${slides.join("\n")}</body></html>`;

  await exportSlides(browser, html, "nan-car-notteverden-del2");
  await browser.close();
})();
