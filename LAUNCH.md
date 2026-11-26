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

## Before publishing to nottanrop.no (needs you, in Webflow)

- [ ] 🔴 **Connect the domain.** Webflow lists no custom domain on the site. A paid site plan is needed (take the Ecommerce plan now, the shop needs it on 1 Dec anyway). Site settings → Publishing → Custom domains: add `nottanrop.no` and `www.nottanrop.no`, set the DNS records at the registrar, and make one of them the default
- [ ] 🔴 **Let search engines in.** robots.txt is currently `Disallow: /`. Site settings → SEO: turn indexing on for the custom domain and switch on the auto-generated sitemap
- [ ] 🟠 **Hero text contrast on desktop.** "Tre nøtter. Tre smaker…" is white over pale snowy land and hard to read. Fix with a soft shadow or a darker plate behind the text
- [ ] 🟠 **"Kjøp nå" on the hero** goes to /produkter and carries the "Fra 1. des" tag. Fine for a week, or change it to "Se glassene" until 1 Dec (your call)
- [ ] 🟡 **Fjordnotat date** shows "November 26, 2026". Set a Norwegian date format on the date element in the template
- [ ] 🟡 **"Endre samtykke"** on /cookies links to `#` and should reopen the consent banner
- [ ] 🟡 **Unused fonts:** remove Anton and Plus Jakarta Sans (Site settings → Fonts) and the Space Mono upload. Nothing changes on screen; two fewer downloads
- [ ] Final click-through on your phone, then publish to staging + nottanrop.no + www

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
