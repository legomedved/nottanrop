# Nøttanrop: SEO, speed and AI-visibility audit (26 Nov 2026)

Site: Webflow `693eb2bc3e42b68a1bb20701`, staging https://nottanrop-26.webflow.io.
Method: crawled all 27 linked pages plus 92 CMS item pages; read Webflow page settings, JSON-LD, custom code, CMS and assets
through the API; Lighthouse 12 (mobile, simulated slow 4G) on 4 pages. Every finding below was measured, not assumed.
Where something is an inference or a judgement call, it says so.

Companion to `LAUNCH.md` (on branch `claude/magical-lovelace-1kcvq3`), which already covers contrast, H1s, share images and favicon.

---

## 0. The short version

| # | Finding | Impact | Who |
|---|---|---|---|
| 1 | nottanrop.no still serves the **coming-soon site**. The new site lives only on webflow.io, which is `Disallow: /` | Nothing ranks until this moves | 🔴 You, dashboard |
| 2 | **92 CMS pages are orphans**: Nøtteverden cards are plain `div`s, recipe cards link to `href="#"` | Search engines and AI crawlers can't reach your best content | 🔴 You, Designer (10 min) |
| 3 | **LCP 10–17 s** on mobile. Hero images are `loading="lazy"`, plus 7 render-blocking head scripts | Core Web Vitals fail, and so does ranking | 🔴 Designer (hero Load: Eager). Head scripts ✅ done |
| 4 | **Duplicate product pages**: `/produkt/x` and `/product/x`, same title and description | Splits ranking signals | ✅ `/product` main, `/produkt` noindex |
| 5 | Structured data gaps (no FAQPage, no retailer data, empty Article image, thin Recipe, Organization without logo/socials) | Fewer rich results; less for AI answers to quote | ✅ Fixed (staged) |
| 6 | Checkout, PayPal, order confirmation and password pages indexable | Junk in the index | ✅ Fixed (staged) |
| 7 | Facts disagree across pages (where it's made, cocoa origin) | AI answers quote whichever they read first | 🟡 You and Barbora |
| 8 | 4.8 MB of PNG stickers and 2–3 MB photo originals on /produkter | Slow on phones | ✅ /produkter 6.9 → 3.6 MB |

"Staged" = saved in Webflow, **not published**. It goes live with the next publish.

### Done 26 Nov, evening (approved, published to staging only, checked)

Published to nottanrop-26.webflow.io at 17:37 and 17:40, after checking that no other session had work waiting.
20 screenshots (10 pages × 1440 px and 390 px) taken before and after are visually identical: the largest colour
difference is 20/255 (WebP noise); the only other change is the globe's grain, which is random on every load.

| What | Result |
|---|---|
| Head scripts | `nanenkel`, `nandrypp2`, `nanfix4` removed as scripts. Their CSS, and the two stylesheets `nanfix4` wrote (`kort.css`, `responsiv.css`), now sit at the end of the site head code in the same order (block "Speed (26 Nov 2026)"). `drips.js` and `lansering.js` moved to the footer: Webflow only accepts `data-` attributes, so `defer` can't be set, and both already wait for the page to be ready. `nanprelaunch` stays in the head until 1 Dec |
| Render-blocking resources | 9–10 → 2–3 per page. FCP: Home 6.4 s → 3.6–4.3 s; recipe 6.4 s → 3.3–5.7 s; /produkter 5.0 → 3.1–4.1 s |
| `/produkt/…` | `noindex, follow` in the template head (label styling unchanged, verified byte for byte). Menu links now go to `/product/…` |
| Images | 13 assets → WebP: 24.5 MB → 2.0 MB (the three `&-nan-*-230g` jars, `nottanrop-1-2…11`). The 21 `kakepiknikk-*.jpg` were left alone: WebP came out bigger. The 6 CMS jar stickers (≈800 KB PNG each) were replaced by WebP versions (≈80 KB) with the same alt text. **/produkter: 6.9 MB → 3.6 MB** |
| Not compressed, on purpose | `nan-mandelykke/sunntella/cashewdrom-klistremerke.png` and `nan-grain.png` are referenced by URL in code on every page; compressing them in place would break those references |
| Titles | /produkter "Nøttesmør og nøttepålegg, håndlaget \| Nøttanrop"; Sunntella and Cashewdrøm (ecommerce SEO title); recipe pattern "{name} \| Nøttanrop"; Home description shortened by removing "og uten tull" |
| robots.txt | Training crawlers allowed (your call). Paste `webflow/site/robots.txt` after the domain move |

Still slow: **LCP 9–14 s**, because the hero images are lazy-loaded (§6, Designer, about 2 min). That is now the biggest single speed win.
New find: Webflow loads **all 20 GSAP plugins** on every page. Measured which ones are actually used (each plugin wrapped
and logged in a real browser on 33 pages at 1440 px and 390 px, with scrolling and hovering; plus a text scan of all custom
code and a read of the 3 IX3 interactions):
- **Keep: ScrollTrigger.** Used by the Nøtteverden globe's scroll entrance. `drips.js` calls `ScrollTrigger.refresh()` only if it exists
- **Switch off: the other 19** (Flip, SplitText, Draggable, DrawSVG, Inertia, MorphSVG, MotionPath, MotionPathHelper, Observer,
  Physics2D, PhysicsProps, ScrambleText, ScrollSmoother, ScrollTo, Text, CustomEase, CustomBounce, CustomWiggle, EasePack).
  The only CustomEase calls come from CustomWiggle registering itself. The home "Helt Nøtta hopper" interactions animate only
  scale, rotation, x/y and opacity with standard eases. Saves 236 KB of JS (≈95 KB compressed) and 19 requests per page
- No API can change these toggles (confirmed with Webflow's assistant), so this is a Designer click. Afterwards: check the home
  intro jump and the globe on Nøtteverden. If you later add a text-split or scroll interaction in the Designer, switch its plugin back on

---

## 1. Indexing and domain (the blocker)

- `nottanrop.no`, `www.nottanrop.no`, `nøttanrop.no` and `www.nøttanrop.no` are attached to **"& nan – Nøttanrop coming soon"** (last published 4 Nov 2025). The new site has **no custom domain** and no hosting plan (the API refuses sitemap controls: "Site plan doesn't support sitemap indexing controls").
- Staging `robots.txt` is `Disallow: /`, which is correct for staging, but means nothing on the new site is crawlable today.
- The steps are in `LAUNCH.md` → "Move nottanrop.no to this site". Add these, in Site settings → SEO, once the domain is on:
  - [ ] **Global canonical tag URL:** `https://www.nottanrop.no`. Today **no page has a canonical tag**. All structured data already points at `https://www.nottanrop.no/…`, so make `www` the default domain to match
  - [ ] robots.txt: paste `webflow/site/robots.txt`
  - [ ] Auto-generate sitemap: on. Then exclude the thin pages (§3) via each page's "Sitemap indexing" toggle
  - [ ] llms.txt: upload `webflow/site/llms.txt` if Site settings → SEO offers an llms.txt field *(I could not confirm from here that your plan shows this field)*

**After launch (30 min, high leverage):**
- [ ] **Google Search Console:** verify the domain (DNS TXT), submit `sitemap.xml`, request indexing for Home, Produkter, Nøtteverden and Nøttekjøkkenet
- [ ] **Bing Webmaster Tools:** import from Search Console. Bing's index feeds ChatGPT search and Copilot, so this is the cheapest "AI SEO" step there is
- [ ] **Google Business Profile** for the self-serve stand and pickup point. Local packs ("nøttesmør Nesodden", "gårdsbutikk Nesodden") come from here, not from the website
- [ ] Rich Results Test (search.google.com/test/rich-results) on `/faq`, one recipe and one product, once live

## 2. Orphaned content: the biggest content win

| Hub | Items | What the HTML does today |
|---|---|---|
| `/notteverden` | 43 encyclopedia entries (200 OK, 430–1,150 words each, good titles and meta) | Cards are `div.nv_card` with **no link**. The globe's "Les hele oppslaget →" link only exists after JavaScript runs, and only for the selected nut |
| `/nottekjokkenet` | 9 recipes | Cards are `a.section-oppskrift-teaser_card` with **`href="#"`**, so clicking does nothing for visitors either |
| `/notteverden` | (also) | Two links point at a bare `/notteverden/`, which looks like an empty slug binding |

With no internal link, these 52 pages can only be found through the sitemap, which is weak, and AI crawlers that don't run JS can't find them at all.
The encyclopedia is the content most likely to earn search traffic and AI citations: questions like "er cashew en nøtt?" and "hvor kommer mandler fra?" have exactly this kind of answer *(inference: no search-volume data was available here)*.

**Fix (Designer):**
- [ ] Nøtteverden → Collection List `nv_grid` → wrap each `nv_card` in a Link Block, link setting: *Current nøtteverden item*. Or select the card's heading and convert it to a link to the item page
- [ ] Nøttekjøkkenet → `section-oppskrift-teaser_card` (already a link) → Link settings → *Current nøttekjøkkenet item* instead of `#`. Check the same card component on Home and on product pages
- [ ] Find the two `/notteverden/` links (empty slug) and bind or remove them

FAQ (`/faq/…`) and retailer (`/forhandler/…`) item pages return **404**: their template pages are switched off. That is fine, because the content lives on the hub pages. Their structured data now lives there too (§5).

## 3. Thin and utility pages

- ✅ **noindex added** (page head code, staged): `/checkout`, `/paypal-checkout`, `/order-confirmation`, `/401`
- Template pages for tags, categories, difficulty, ingredients, use cases, reviews, SKU and ecommerce category all return 404 (switched off). Good; leave them off
- Donutland drafts (Home 01–05, About Us 02–05, Why Donutland, Subscribe & Save, Contact Us 02–04, Old Home, Om oss (gammel), Instructions, Style Guide) are drafts and don't publish. Safe to delete when convenient
- Template leftovers still **visible**: `customer-2/3/5.webp` (Donutland testimonial avatars) on `/notteverden`, and `donut-finger-arm.webp` in the site chrome on every page

## 4. Duplicate product pages: needs your decision

`/produkt/mandelykke` (CMS "Produkter", 629 words, no buy button, no schema) and `/product/mandelykke` (Ecommerce, 998 words, buy button, Product + Offer schema) share **the same title and meta description**. The same applies to Sunntella and Cashewdrøm, and the menu links both.

**Recommendation:** make `/product/…` canonical, since that's where the cart, price and Product schema are, and Google Shopping needs it from 1 Dec. Then either:
- (a) add `<meta name="robots" content="noindex, follow">` to the Produkter template head and point the menu at `/product/…`, or
- (b) once on a paid plan, 301-redirect `/produkt/(.*)` → `/product/%1` and fold the best parts of the `/produkt` design into the ecommerce template.

The `/produkter` ItemList schema and `llms.txt` already point at `/product/…`.

## 5. Structured data (JSON-LD)

Before this pass, 15 pages already had good JSON-LD (from earlier work). Changes made today, **staged**:

| Page | Change |
|---|---|
| Home (`#organization`) | + `logo` (501 × 501 siren mark), `image`, `sameAs` Instagram / Facebook / TikTok. This is what ties the brand to its socials in Google's knowledge graph and in LLMs |
| `/om-oss` | had none → `AboutPage` + breadcrumb |
| `/faq` | `WebPage` → **`FAQPage`** with the 24 questions that are visible on the page (answers copied from CMS `svar`). Note: Google only shows FAQ rich results for health and government sites since 2023, so the gain here is AI answers and Bing *(judgement)* |
| `/forhandlere` | + `ItemList` of all 14 retailers as `Store` / `Bakery` / `GroceryStore` / `CafeOrCoffeeShop` with address, phone, geo and map link |
| Nøtteverden template | `image` was `{{hovedbilde}}`, but **no entry has an image**, so it rendered `"image": ""` (invalid). Now the Nøtteverden hero |
| Recipe template | + `recipeYield`; + `webflow/site/oppskrift-schema.js` in the page footer: fills `recipeIngredient`, `recipeInstructions` and `totalTime` from the page (tested on 4 recipes: "1 t 10 min" → `PT1H10M`, 4–11 ingredients, 4–9 steps) |

Regenerate the FAQ and retailer JSON-LD when those collections change. They are static copies; ask Claude ("rebuild FAQ and forhandler schema").

Still open:
- [ ] Product schema: add `availability` (`PreOrder` until 1 Dec, then `InStock`) and per-size `offers`. Do it at stage 2
- [ ] Nøtteverden entries have no `hovedbilde`. The globe illustrations (`assets/nan-ill-*-160.webp`, `carousel/art/notter/*-512.webp`) exist for 12 of them. Uploading the 512 versions as `hovedbilde` gives each entry its own share image and schema image

## 6. Speed (Lighthouse mobile, staging)

| Page | Perf | LCP | FCP | TBT | CLS | Weight |
|---|---|---|---|---|---|---|
| Home | 55 | **17.5 s** | 6.4 s | 180 ms | 0 | 2.6 MB |
| /produkter | 59 | **10.1 s** | 5.0 s | 70 ms | 0 | 6.9 MB |
| /notteverden | 60 | **12.2 s** | 3.4 s | 330 ms | 0 | 3.0 MB |
| Recipe (havregrøt) | 59 | **11.9 s** | 6.4 s | 80 ms | 0 | 1.6 MB |

Good: CLS is 0 everywhere, including the globe. "Good" LCP is under 2.5 s.

**Why LCP is so slow: "load delay" of 14 s on Home and 9.7 s on Nøtteverden.** The LCP image is lazy-loaded, so the browser waits for layout before even asking for it.

- [ ] 🔴 Designer → select image → ⚙ Settings → **Load: Eager** on:
  - Home: `hero-vinter_ekorn` (Helt Nøtta with Mandelykke) and the landscape behind it
  - Nøtteverden: `nh-nv__img` (stratosphere)
  - Recipe template: `nk-opp_bilde`
  - Fjordnotater page and article template hero (also lazy, measured), and the first image on Om oss and Samarbeid
  - `/produkter` already has its hero on Eager: that's the model to copy

  *(The API doesn't expose this setting, which is why I didn't change it.)*
- [ ] 🔴 **7 render-blocking scripts in `<head>`** on every page (~1.2 s on FCP): `webfont.js` (Webflow's Google Fonts loader), `nanprelaunch`, `nanenkel`, `nandrypp2`, `nanfix4`, `drips.js` (nandrypp3), `lansering.js` (nanlansering2). Proposal, to do together with a visual check:
  - `drips.js`, `lansering.js`, `nandrypp2`, `nanenkel` → add `defer` (they run after layout anyway)
  - `nanfix4` loads `responsiv.css` → serve it as a real `<link rel="stylesheet">` (no JS round-trip)
  - `nanprelaunch` stays blocking until 1 Dec (it hides buy buttons; deferring would flash them), then delete it
  - `nandrypp2` looks superseded by `nandrypp3` (drips.js); check, then remove
- [ ] 🟡 Fonts: remove **Anton** and **Plus Jakarta Sans** (still downloaded; Lighthouse sees them) and the Space Mono upload. Then Webflow's `webfont.js` has less to wait for
- [ ] 🟡 Images (needs your OK, because Webflow compression **replaces the original** and can't be undone): convert the PNG stickers (`*-klistremerke*.png`, `&-nan-*-230g.png`, 0.7–2 MB each) and the `nottanrop-1-*.jpg` / `kakepiknikk-*.jpg` photos (1–3 MB originals) to WebP. Lighthouse estimates −4.8 MB on /produkter
- [ ] 🟡 `nan-grain.png` (48 KB, on every page) → WebP
- Leave alone: 190 KB unused CSS and 450 KB unused JS are Webflow's own bundle (Ecommerce + interactions); not worth fighting

The globe (`dist/nottekart.min.js`, 150 KB, 43 KB gzipped) loads with `defer` from jsDelivr pinned to a commit. That's fine, and it caused no layout shift.

## 7. Alt text and headings

Alt text is in good shape: **0 images without an `alt` attribute** on 119 pages, and the Om oss photo story is exemplary.
Content images that are currently marked decorative (`alt=""`) but carry meaning:
- [ ] `/produkter`: the three jar photos `&-nan-mandelykke/sunntella/cashewdrom-230g.png`
- [ ] `/produkter` and Home: photo series `kakepiknikk-1…8.jpg` and `nottanrop-1-2/4/5/7/8/11.jpg`
- [ ] Home: `nan-ferje-jul-600.webp` (the Christmas ferry illustration)
- [ ] Product CMS: `logotype`, `livsstilsbilde` and `teksturbilde` have empty alt on Mandelykke, Sunntella and Cashewdrøm

I didn't write these: I'd be describing photos I haven't been asked to caption. If you want, I'll look at each one and propose alt text for you to approve.

Headings: every page starts `h3, h3, h1`. The two `h3`s are in the nav dropdown cards (`nav-card`), and levels skip (`h2→h4`, `h3→h5`) in the footer.
- [ ] Nav card titles and footer headings → *Text Block* (or `div` tag). Same look, clean outline. Lighthouse flags `heading-order` and `link-name` (one icon link without a label per page)

## 8. AI search and agents ("agentic SEO")

What answer engines need, and where Nøttanrop stands:

| Need | Status |
|---|---|
| Content in plain HTML (most AI crawlers don't run JS) | ✅ Webflow renders server-side. ❌ But the globe's content is JS-only (fine, it's duplicated in the CMS), and 52 CMS pages are unlinked (§2) |
| Allowed to crawl | ❌ today (domain). `webflow/site/robots.txt` allows search, answer and training bots. **Decide** whether to allow training bots (GPTBot, ClaudeBot, Google-Extended, CCBot): allowing them is how models learn the brand exists; opting out costs you nothing in search |
| A map for agents | `webflow/site/llms.txt`: what Nøttanrop is, products with ingredients, where to buy, links to the knowledge pages |
| Entity clarity (who, what, where) | ✅ Organization + sameAs now. ❌ **Facts disagree**, see below |
| Quotable answers | ✅ FAQ is written as question → direct answer, and Nøtteverden entries open with a one-line definition. Both ideal |
| Measurement | Webflow AEO analytics needs an entitlement this account doesn't have (403). After launch: Bing Webmaster Tools shows Copilot and ChatGPT-search referrals; GA/Webflow Analyze shows `chatgpt.com` / `perplexity.ai` referrers |

**Facts that disagree** (AI engines will quote whichever they read; fix in copy, not in code):
- **Where it's made:** FAQ "Hvor produseres" says *Nesodden*. The Organization schema and the globe say *Vinterbro*. The Fager Bakst retailer card says "kjøkkenet der Nøttanrop blir til". Pickup is *Nessetveien 75* (Kjøpsvilkår)
- **Cocoa origin:** FAQ says *Kakaopulver – Nederland*; `src/notter.json` and README say Brazil (Freia)
- **"Nettbutikk på nøttanrop.no"** (FAQ "Hvor kan jeg kjøpe") is true only from 1 Dec
- Typos the FAQPage schema now repeats: "Barbaras mandelsmør" (Barbora), "nisjekuriositert"

## 9. Keywords and titles

*No search-volume tool was reachable from here (the Ahrefs connector failed to connect), so these come from reading the site and the Norwegian market. Verify in Search Console after a few weeks of data.*

The copy says **"nøttepålegg"** almost everywhere. Norwegians also search **"nøttesmør"**, **"mandelsmør"**, **"cashewsmør"**, and for Sunntella **"sjokoladepålegg"** / **"Nutella uten palmeolje"**. Proposals only; your words, your call:

| Page | Now | Proposal |
|---|---|---|
| /produkter title | Produkter – håndlaget nøttepålegg \| Nøttanrop | Nøttesmør og nøttepålegg, håndlaget \| Nøttanrop |
| Sunntella title | Sunntella – Hasselnøtt-kakao pålegg fra Oslofjorden | Sunntella – sjokoladepålegg med hasselnøtt, uten palmeolje |
| Cashewdrøm title | Cashewdrøm – Cashew-kokos pålegg fra Oslofjorden | Cashewdrøm – cashewsmør med kokos fra Oslofjorden |
| Home description | 168 characters (cut off at about 155) | Shorten by one clause |
| 4 recipe titles | 63–65 characters | Drop " – Nøttekjøkkenet" from the template title pattern |

Mandelykke ("100% mandelsmør") already has the right word.

## 10. Repo housekeeping

The live site loads code from **five different session branches**, pinned by commit: the globe from `115a951` (`serene-fermi`), `drips.js` from `a3b4930` (`modest-bell`), `lansering.js` from `1d577d3` (`magical-lovelace`). `main` holds none of it.
- [ ] Merge the `claude/*` branches into `main`, so there is one place to read what runs on the site. The pinned URLs keep working either way

## Files

| File | What |
|---|---|
| `SEO.md` | This audit |
| `webflow/site/oppskrift-schema.js` | Recipe JSON-LD enrichment (copy lives in the recipe template footer) |
| `webflow/site/robots.txt` | robots.txt to paste after the domain move |
| `webflow/site/llms.txt` | llms.txt for AI agents |
