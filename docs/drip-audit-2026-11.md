# Drip audit: staging, November 2026

Checked on nottanrop-26.webflow.io at 1440px and 390px with Playwright. The pixel checks compare the drip colour with the colour of the section next to it.

## Scope
- 161 URLs from the sitemap and CMS collections. 85 of them are live.
- The other 76 are draft CMS items that return 404: anmeldelser, bruksomrader, faq items, forhandler, ingredienser, tagger and vanskelighetsgrader. None of them have pages to check.

## Agreed structure
- The top and the bottom of each page share one world colour (codex, decided).
- A coloured hero ends in a drip into the next section.
- Cream heroes are the second hero type. They have a soft world wash and no drip.
- The footer drip takes the colour of the last section's bottom edge. This is handled site-wide by `webflow/site/drip-seams.js`, installed as the registered site script `nanfix7`.

## Result: 85 of 85 live pages pass
- Footer drip: seamless on all 85 pages, desktop and mobile.
- Hero drip: seamless on every page that has one (difference of 2 RGB units or less). This covers the home page, products, produkt/*, product/*, nøtteverden/*, kategorier/*, fjordnotater/*, the legal pages, faq, presse, samarbeid, investor-b2b and forhandlere.
- Cream heroes, with no drip by design: /kontakt-oss and /nottekjokkenet.

## Fixed in this pass
- **/om-oss**: the cover now ends in the site's drip shape, cut out of the fjord strip so the sky shows through. The cream wash over the night sky is removed, and the brown band is gone. The fix is in `webflow/om-oss/build.py` (`.oo-shore`), commit 5818194.
- **Home and /product/***: the "Hvorfor Nøttanrop" waves were painted pure white (#fff) on cream (#fffcfb) and left a visible band. They are now masked in the body-background colour. The fix is an embed in product-proof_section on the home page and on the product template.

## Open decisions
1. **Om oss colours**: the cover is dusk orange and the footer is aqua (verden-om-notta). This breaks the top = bottom rule. Option A: set the page world so the footer is orange, as on the home page (dusk hero, orange footer). Option B: keep aqua and change the cover sky to aqua.
2. **/category/***: six leftover Donutland pages are still live (chocolate, frosted and others). Delete them, or redirect them to /produkter.
3. **/product/***: these duplicate /produkt/*. Pick one set as canonical and add 301 redirects from the other.
4. **404 page**: still the English Donutland "PAGE NOT FOUND" donut.
