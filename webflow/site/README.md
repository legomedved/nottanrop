# Site-wide pieces

## `drips.js`: every drip on the site

Registered in Webflow as the hosted site script **nandrypp3** (Site settings → Custom code), loaded from jsDelivr
pinned to a commit, with an SRI hash. It replaces the old **nanfix7** (drip seams + the `.legal_hero-kicker` rule,
which it carries over), so the site stays at Webflow's 15-script limit.

**The rule:** one drip shape, one direction. The colour *above* melts *down* into what's below, on every page.

**The shape:** the site's original hand-drawn template drip, turned so the drops hang. The notch where its two
halves were glued together is smoothed away. One period (tile + mirror) is seamless. It's always drawn at natural
proportions, never stretched, and each page gets its own offset, so no two pages drip alike.

**Where:**
| Seam | How |
|---|---|
| hero → next section (home, produkter, produkt/*, product/*, nøtteverden, om, forhandlere, legal pages, faq/presse/investor) | the hero is masked along its bottom edge and pulled down over the next section. The drops *are* the hero (its gradient, grain and picture run into them). The gaps show the real section below. Nothing to colour-match, so nothing can seam. |
| last section → footer | when the last section is see-through (most pages, and Om oss with its fixed night sky), the drops are cut out of the footer, so the real backdrop shows through, colour-exact. Otherwise it's a drip layer in the last section's bottom-edge colour. Either way nothing above the footer is clipped (the review cards on /produkter hang over it). The strip grows if the footer content rides up over it, so drop tips are never cut. |
| new heroes (`.nh-hero`: Nøtteverden, Fjordnotater, Samarbeid) | same as the other heroes; they keep their built-in drip space |
| Om oss fjord strip | the strip drips down into the night |
| review cards, /produkt/* smak and glass cards | the frame colour drips into the card (drawn 1.9× wider at this size) |
| product cards (home, /produkter) | the picture drips down into the card body (was a cream wave rising up) |

**Retired:** the white-wave masks (they pointed *up*), the rising footer SVG drip, the legal wave, the per-hero
template SVGs, the home mask PNG and `drip-seams.js` / nanfix7.

**To change it:** edit `drips.js`, commit and push, then point the registered script at the new commit
(new version + SRI hash: `openssl dgst -sha384 -binary drips.js | openssl base64 -A`), then publish.
`drip-seams.js` and `nanfix7-1.0.0.js` (on the older branch) are history.
