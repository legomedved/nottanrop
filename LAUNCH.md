# Nøttanrop: launch checklist

**Stage 1 — website live today (26 Nov 2026), shop switched off.**
**Stage 2 — shop live by 1 Dec 2026.**

Staging: https://nottanrop-26.webflow.io · Webflow site `693eb2bc3e42b68a1bb20701`

## Where the work stands (26 Nov, 10:15)

| Chat | Result |
|---|---|
| Om oss redesign | Riso heroes, Samarbeid cards, Fjordnotater. `nv-hopp` hero hidden, not deleted |
| Drips (first chat) | Drips hang down on Hjem and Fjordnotat articles |
| Nøtteverden globe | Rounds 1 and 2 live, 22 entries, Oslofjord inset |
| Cards consistency | One card system (`kort.css` v1.2.0), DM Sans / DM Mono everywhere, FAQ button now "Ring oss" |
| Drips polish | One drip script (`nandrypp3` 1.1.0), checked at 1440 and 390 px |
| Launch prep (this chat) | Audit and the fixes below |

## Done in the launch pass (published to staging)

- [x] 404 page was the Donutland template (English "Page Not Found" and a donut photo). It now shows Helt Nøtta on the phone, "Oi. Denne siden finnes ikke." and "Men nøttepålegget finnes – og det er ganske bra." (copy taken from the page's own meta description)
- [x] All H1s are now Recoleta in sentence case. FAQ, Samarbeid, Presse and Investor og B2B were uppercase (`nanlansering` script)
- [x] Removed two site scripts that were HTML registered as JavaScript (`nan_brand_css_variables`, `nan_google_fonts`). They never ran and caused the console error on every page
- [x] Internal style guide (`/admin/style-guide`) set to draft
- [x] Checked: only DM Sans, DM Mono and Recoleta load on screen
- [x] Checked: menu opens and closes on desktop and mobile; "Ring oss" is `tel:+4792970305` in the same tab
- [x] Checked: 70 pages crawled. No lorem ipsum or template leftovers, one H1 per page, Norwegian meta descriptions, no sideways scroll
- [x] Checked: prelaunch mode hides cart and buy buttons and shows "Nettbutikken åpner 1. desember"

## Readability and language pass (published to staging)

All in `webflow/site/lansering.js`, loaded as site script `nanlansering2` (1.1.0, pinned to a commit with SRI).
Measured on 25 pages at 1440 and 390 px: axe-core for text on plain colour, rendered-pixel contrast for text on images and gradients.

- [x] **Mid-tone worlds:** small hero text and the Nøttpost band take the world's own deep shade (as mango, cashew and matcha already do); big titles keep cream with a riso plate shadow
  - mandelykke orange: cream measured 2.3–2.7:1 → deep orange-brown #421C08 (6.7–8:1)
  - jordbær pink: 3.4–3.9 → #24060C
  - nød coral (FAQ, Kontakt): 3.0–3.8 → #2A0604; FAQ subtitle also enlarged from ~12px to 16–18px
  - fjord sage band: 2.2–2.5 → #1F2B28
  - Om oss lead and kicker on salmon → deep plum #2E0F18
  - sunntella band and cookies (praktisk 3): neither colour reaches 4.5:1 → cream kept, with a dark halo
- [x] **Accent orange on cream** (#CC6121, 3.7–3.9:1): every legal link and section number, the Nøtteverden kickers, "Se glasset →" → #A3470F (5.4:1). Bright #FF7A2A text (2.5:1: stats, 404) → #C9541A for large text, #A3470F for small
- [x] **Buttons and labels:** cream on orange buttons → ink; cream on red "Telefonbeskjed", "Ring inn" and "Åpner 1. des" → fill deepened to pass
- [x] **Minimum 12px** for all text (was down to 8.5px: footer copyright on mobile, "Via Google", "Est. 2025")
- [x] **Home hero line:** weight 325 → 400, plus a soft plum halo over the snowy land
- [x] **Norwegian dates** on Fjordnotater ("26. november 2026"); "Emne" placeholder on Kontakt (was "Last name")
- [x] Already fine and left alone: light worlds (mango, cashew, matcha, pistasj, kjøkken, samarbeid, mint), dark worlds (praktisk 1–2, Nøtteverden), the Fjordnotater title (riso shadow), "Se glasset", "Utforsk produkter"

## Waiting for Barbora

- [ ] **Om oss, Barbora's founder card:** "Ingredienser", "Kan inneholde spor av" and "Oppbevaring" still read "[Barbora skriver selv]". The rows are hidden on the site until she writes them in the Designer; they reappear on their own once the text changes

## Move nottanrop.no to this site (needs you, in the Webflow dashboard — the API can't move domains or plans)

The live nottanrop.no is the site **"& nan – Nøttanrop coming soon"**, in the same workspace. It holds `nottanrop.no`, `www.nottanrop.no`, `nøttanrop.no` and `www.nøttanrop.no`, and has no form submissions to save. Both sites are on Webflow, so the DNS records stay as they are.

- [ ] 🔴 Workspace → Site plans: move the coming-soon site's plan to **Nøttanrop (nottanrop-26)**, upgrading to Ecommerce if it's Basic or CMS
- [ ] 🔴 Coming-soon site → Site settings → Publishing: remove the four domains
- [ ] 🔴 Nøttanrop → Site settings → Publishing: add the four domains; make `www.nottanrop.no` (or the bare domain) the default
- [ ] 🔴 Nøttanrop → Site settings → SEO: indexing on, auto sitemap on; keep "disable Webflow subdomain indexing" on
- [ ] Then Claude publishes to all domains and checks robots.txt, sitemap, redirects and HTTPS on the live domain

## Still open (small)

- [x] "Kjøp nå" on the home hero stays as it is (decided 26 Nov)
- [ ] 🟡 **"Endre samtykke"** on /cookies links to `#` and should reopen the consent banner
- [ ] 🟡 **Unused fonts:** remove Anton and Plus Jakarta Sans (Site settings → Fonts) and the Space Mono upload. Nothing changes on screen; two fewer downloads
- [ ] Final click-through on your phone

## Stage 2 — shop live by 1 Dec

- [ ] Ecommerce plan active; business details, VAT (MVA 15 % food), NOK prices checked against Kjøpsvilkår
- [ ] Payments: Stripe/Klarna/Vipps as promised in the footer logos and Kjøpsvilkår. Remove any logo you don't actually offer
- [ ] Shipping: PostNord 99 kr, free over 1 200 kr, free pickup at Nessetveien 75 (matches Kjøpsvilkår)
- [ ] Order emails in Norwegian; order confirmation page reviewed
- [ ] Checkout and PayPal checkout pages styled and translated (they still show "$0 · Place Order")
- [ ] Products: SKUs, stock, weights, images; Pistasjel stays "kommer snart"
- [ ] Switch off `nanprelaunch` (the "Nettbutikken åpner" bar and hidden buy buttons) at go-live
- [ ] Test orders: card, Vipps, pickup, refund, one real order end to end
- [ ] Brevo: "Si ifra når vi åpner" list gets the opening email on 1 Dec
