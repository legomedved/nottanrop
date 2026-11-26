# Nøtteverden: the nut globe and its carousel

One source of truth, two outputs:

```
src/notter.json  ──►  dist/nottekart.min.js   (the globe on the Webflow Nøtteverden page)
                 └──►  carousel/out/*.png      (Instagram carousel, 1080 × 1440)
```

Fix a fact once in `notter.json`, rebuild, and it's fixed on the site and on Insta.

## Art direction

A 1965 school atlas, printed (see the `nottanrop-art-direction` skill). The globe is built as a print stack:
cream paper → grainy light on the water only → flat olive land plate (offset 2 px, misregistered) → brown-black key ink →
45° halftone on the shadow side → risograph grain. Light comes from the upper left, like the rest of the illustration set.

- **Utrykning (call-out):** pick something that's in our jars, and Helt nøtta flies the parcel along a dashed route to Nesodden. The siren on Nesodden blinks when he lands.
- **Bare avstand (distance only):** nuts we don't use get a thin dotted line and no hero. The flight means *this comes to us*, so we don't fake it.
- **The stamp:** every entry gets a botanical verdict: *Ekte nøtt* (true nut), *Ikke nøtt* (not a nut, in red, alarm), *Omstridt* (disputed) or *Ingrediens* (ingredient).

## Files

| File | What it is | Who edits it |
|---|---|---|
| `src/notter.json` | **All content**: 20 nuts, seeds and impostors; history, jokes, stamps, our suppliers | You and Barbora |
| `src/nottekart.js` / `.css` | The globe | Claude / developer |
| `assets/` | Art the globe loads (Helt nøtta, 27 KB) | — |
| `dist/nottekart.min.js` | The finished file Webflow loads. **Generated, so don't edit it** | — |
| `carousel/render.js` | Carousel part 1, "Nøtt eller bedrager?" (`npm run carousel`) | Claude |
| `carousel/del2.js` | Carousel part 2, "Alt som er i glassene": all 12 ingredients of the 6 jars (`npm run carousel:del2`). Reads `ingredienser` in `src/notter.json`: confirmed `vaare` → globe route, otherwise "Venter på datablad" | Claude |
| `carousel/lib.js` | Shared carousel parts: fonts, paper grain, globe snapshots, PNG export | Claude |
| `carousel/art/` | Illustrations from Magnific (project "& nan - Nøttanrop") | — |
| `carousel/out/` | The finished PNGs | — |
| `demo/index.html` | Local test page that imitates the Webflow page | — |

## Fact-check (25 Nov 2026)

Every entry was researched, then verified line by line against pages that were actually opened and read
(Wikipedia with its cited references, Store norske leksikon). Claims that couldn't be confirmed were removed.
Each card shows the sources under **Faktasjekket**. To add a fact: add a source to `kilder` too.

## Our own ingredients

From the nutrition declarations: **Eldorado** (almonds, hazelnuts, cashews, coconut), **Freia** (cocoa powder),
**Dansukker** (cane sugar). Growing countries confirmed so far: matcha (Japan), strawberries (grown in Slovakia,
packed in Czech Republic), cocoa (Brazil). The rest: read the country of origin off the Eldorado bags and add it to `vaare`.

## Honesty rules (built in)

- Every entry has `verifisert: false` until a source is added in `kilder`. The site shows "Utkast · fakta ikke verifisert" (draft, facts not verified). Every carousel slide carries a red **"Utkast · ikke publiser"** (draft, don't publish) pill until the facts are verified.
- `vaare` (where OUR ingredients come from) stays `null` until the supplier is confirmed. Matcha (Japan) and strawberries (Czech Republic) are the only ones filled in, from the brand guide.

## Put it in Webflow

1. Nøtteverden page → **Embed** element:
   ```html
   <div data-nottekart data-nk-start="mandel"></div>
   ```
Already done on the Nøtteverden page: in the Designer, the "Kartet" section holds a div named
**"Nøttekart (globus)"** with the attributes below; the old dotted map next to it is hidden ("Gammelt prikkekart (skjult)").
The page's custom code (footer) loads the script, pinned to an exact commit. To update: change the commit hash there and publish.
Each card links to its entry in the Nøtteverden CMS (`side` in `src/notter.json`). For other pages:

2. Page settings → *Before </body> tag*:
   ```html
   <script src="https://cdn.jsdelivr.net/gh/legomedved/nottanrop@main/dist/nottekart.min.js" defer></script>
   ```
   The script finds its art in `assets/` next to itself. For launch, pin a version tag (`@v0.2.0`) instead of `@main` so the site never changes by surprise.
3. Optional: `data-nk-scroll` to turn the globe while scrolling (GSAP + ScrollTrigger on in Webflow).
4. From a GSAP timeline: `Nottekart.instances[0].goTo("cashew")`. Listen for `nottekart:select`.

Weight: script about 43 KB compressed (map included), plus 27 KB for Helt nøtta.

## Rebuild (developer)

```
npm install
npm run build       # the globe
npm run carousel    # the Insta slides (put Recoleta-Bold.woff2/.otf in fonts-local/ – never committed, it's licensed)
```

## Om oss (ny): ett døgn i melangeren

The new Om oss page. Scroll is the clock: the sky passes through 24 hours, the melanger grinds whole nuts to butter,
chapters are comic panels, photos of places and process are printed as two-plate riso in brand inks.

```
prototype/om-oss.html  ──►  webflow/om-oss/build.py  ──►  sections/*.html   native Webflow elements (classes prefixed oo-)
                                                     └──►  om-oss.css         loaded by the embed at the top of the page
                                                     └──►  om-oss.js          page footer code: clock, sky, melanger, riso filters,
                                                                              label flips, strikes, lightbox
```

In Webflow: page **«Om oss (ny)»** (`/om-oss-ny`, draft). The text and photos are ordinary Designer elements, so edit them there.
The stylesheet and script load from jsDelivr pinned to a commit (embed «Om oss – stil (jsDelivr)» and the page footer code).
To change the look: edit `prototype/om-oss.html`, run `python3 webflow/om-oss/build.py`, commit, and swap the commit hash in both places.
The melanger, riso colours and sky are drawn by the script, so they show on the published page, not on the Designer canvas.

## Nye helter: Fjordnotater, Samarbeid, Nøtteverden

`prototype/heroes.html` is the study; `webflow/heroes/` is what runs in Webflow.

- `sections/*.html`: native Webflow elements, inserted with the WHTML builder (classes prefixed `nh-`). Text and photos are ordinary Designer elements.
- `heroes.css`: loaded by a style embed at the top of each page, pinned to a commit on jsDelivr. To change the look: edit, commit, swap the hash in the three style embeds, publish.
- `embed-fj-chart.html`, `embed-stamp.html`, `embed-nv-art.html`: the sea chart, the postmark, and the Nøtteverden routes (animated, still under reduced motion).
- The Samarbeid riso filters live in the Samarbeid style embed. The cards and contact box keep their own elements and copy; only photos, ids (`#i-hylla`, `#pa-stand`, `#gaver`) and CSS were added.
- Nøtteverden art: Magnific, project «& nan - Nøttanrop» (stratosphere, upscaled). The unpublished `nv-hopp` capsule hero is hidden in the Designer, not deleted.
