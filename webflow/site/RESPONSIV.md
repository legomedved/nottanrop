# Responsive layout

## `responsiv.css`: one layout on every screen

(Kept apart from `webflow/site/README.md`, which lives on the drips branch, so the two merge cleanly.)

Loaded on every page from the site's head code, as a plain stylesheet link right after the card system,
so it blocks rendering like any stylesheet in the head and the page never flashes unscaled:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/legomedved/nottanrop@<commit>/webflow/kort/kort.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/legomedved/nottanrop@<commit>/webflow/site/responsiv.css">
```

It comes after `kort.css` on purpose. The pin is the commit hash in that `<link>`, in **Site settings → Custom code → Head code**.

To change it: edit the file, commit and push, put the new hash in the `<link>` in the head code, publish.
To roll back: put the previous hash back and publish. Nothing else depends on it.

The globe fixes from the same pass ship in `dist/nottekart.min.js`; the Nøtteverden page's footer code is
pinned to the same commit.

### The rule

**The 1440 px design is the design.** Above it the page is the same page, only larger. Below it the
template's own breakpoints (991, 767, 479) carry on.

Why it was needed: the template (Donutland) sets the body size in `vw`, so everything written in `em`
grows with the window, while `rem` stays 16 px and every later patch (cards, heroes, Om oss, the globe)
was written in `rem` or `px`. Above 1440 px the two halves drifted apart. On top of that the template
restyles 25 classes at 1920 px for its own content (left-aligned intros, 364 px gutters).

What the file does about it:

1. **The scale.** From 1440 px up, `1rem = window width / 90` (16 px at 1440, 21.3 px at 1920), and the
   body size is tied to `rem`. So `em`, `rem` and the container all grow together.
2. **The ceiling.** `--nan-maks: 1920px`. Past it the type holds its size, the content sits centred and
   the artwork still runs edge to edge. On a 27" screen (2560 px) the content column is 73 % of the
   window. Set it to `2560px` and the page keeps growing instead; both were tested.
3. **Template rules from 1920 px, reset** to their 1440 values.
4. **Pixel caps as rem**: `max-width: 1280px`, `clamp(…, 34vw, 480px)` and the like stop growing
   exactly where the rest starts to. Same numbers, divided by 16.

### Fixes at every width (section 4 of the file)

| Where | What was wrong | Now |
|---|---|---|
| Footer, last row (all pages) | Legal links ran into the copyright from 1280 up, and were printed on top of it at 1024 | Links keep their own width; the row wraps |
| Newsletter band (all pages) | Helt Nøtta covered the end of the consent line | The line turns before it reaches him |
| Home, "Hvorfor Nøttanrop?" | Card text hung out below the paper (991–1280); at tablet four cards in one row, wider than the screen, button on top | Cards grow with their text; 2 × 2 at tablet |
| Home, "Nøtta i glasset" | At tablet the third jar sat alone on the right beside a blank half-screen | Two jars, third centred below |
| Section headings with a button | On phones the button was squeezed to a 100 px blob | Stacked |
| FAQ block (FAQ, Forhandlere, Kontakt) | Tablet: the photo stayed pinned while the questions slid over it. Desktop: photo taller than the window | Tablet: a 4:3 picture above the list. Desktop: never taller than the window |
| Samarbeid, Presse, Investor call-out | Paragraph brown on brown (about 1.3:1), at every width | Almond on brown |
| Legal pages | Content column 40 px off centre at 1440, hugging the left edge on wide screens | Centred |
| Legal tables on phones | Third column cut off; they scroll sideways but nothing said so | Right edge fades |
| Sticky side columns (Nøtteverden filter, nut fact box, legal contents) | Taller than a 13" laptop window, so the end could never be reached | Stop at the window height and scroll inside |
| Nøtteverden hero, 768–1279 | Country tags cut by the screen edge | Art re-centred (laptop), shorter hero with only Vinterbro (tablet) |
| New heroes, 768–1439 | 16 px side margin where the site has 32 | 32 px |
| "Allergeninformasjon" card title | Ran through the postmark and off the card at 480 | May hyphenate |
| Phone numbers | Broke as "929 70 / 305" | Never break |
| Cookies title at 320 px | 24 px wider than the screen | Fits |
| 404 on phones | Line under the heading about 9 px | 16 px |

### Phones and tablets (section 5 of the file, 27 Nov 2026)

A second pass, only for the smaller breakpoints. Nothing in it applies above 991 px, except five bugs that showed on desktop too (5.1).

| Where | What was wrong | Now |
|---|---|---|
| Every page, phones | 200–420 px of blank between sections (the template adds 5rem above and below each container under 768 px, on top of the section's own padding) | The sections' own padding is the gap |
| Every page, phones | Side gutter of 10, 16, 19, 21 or 24 px, sometimes on one screen | 20 px everywhere, the footer's gutter |
| Top bar, phones | Logo 23 px left of centre; Kontakt pill taller than the bar, poking out above and below | Logo centred, pill inside a 48 px bar |
| Section headings with a button, phones | Button stranded on the right under a left-aligned heading (a Webflow node-id rule beat the stacking) | Left-aligned under the text |
| Produkter, reviews, phones | Cards overlapped (names hidden), one ran 52 px off the screen | Stacked, tilted, clear of the edges |
| FAQ block, tablet and phone | Questions in 80 % of a shrunken column, right third blank | Full width, answers capped at a readable line |
| Footer, tablet and phone | "Sosiale medier" under "Praktisk" with an empty column (phone); "Produkter" alone beside a blank cell (tablet); 18 px tap targets | Balanced columns, links 32–38 px tall |
| Samarbeid, Presse, Investor, tablet | Three cards stacked (Samarbeid: 2,700 px of scrolling) | One row of three, as on desktop |
| Two-column grids with an odd count, tablet | Last card alone on the left (Julekringle, Knoll, Bunya-nøtt, Hallangspollen, Utforsk mer) | Centred |
| Product page, 480–991 | The "uten tilsatt sukker" seal covered the end of «Slik smaker den» | Room for the seal |
| Om oss | "Ferdig malt? Nei." paragraph ink on ink (1:1), at every width | Almond, readable |
| Allergeninformasjon | White logo on the mint hero | Brown |
| Forhandlere | Region dot covered the first letter and sat 5 px off the timeline | Centred on the line |
| Nøtteverden entries | 137 px gaps where the CMS splits the article, 48 px elsewhere | 48 px everywhere |
| Small cards and links, phones | Card copy at the 12 px floor beside 19–24 px text; 17 px tall text links; newsletter and contact buttons misaligned | 15 px copy, 41 px targets, aligned |
| Tablet gutters (Nøtteverden, Forhandlere, Om oss) | 16–24 px where the site has 32 | 32 |
| Recipe, tablet | Ingredients in a 923 px card above the steps | Side by side, as on desktop |
| Fjordnotater hero, 768–860 | Phone carousel cut the second postcard | The postcard pile |

The globe (`dist/nottekart.min.js`) got the same treatment in the same pass: 12 px floor for its labels, 40 px chips,
and at 861–991 the Oslofjord inset moves under the card (on the globe it was 124 px wide with 4 px place names).
The Nøtteverden page's footer code pins the globe to its own commit.

**A note for whoever edits this next:** `lansering.js` writes an inline `font-size: 12px !important` on any text that
renders under 12 px. A size fix therefore only works from the head (this file), and a "12px !important" seen in the
inspector usually means the template's size was smaller, not that someone typed it in the Designer.

### How it was checked

Every one of the 22 page templates, with headless Chromium, before publishing and again on the published staging site (26 Nov 2026):

- **Scale test**: each element's box at 1920 and 2560 px compared with the same element at 1440 px.
- **Measured audit** at 2560, 1920, 1440, 1280, 1024, 991, 768, 600, 480, 390, 360, 320 px: sideways scroll,
  text cut by a frame, text on top of text, anything pinned that is taller than the window.
- **Read by eye**: contact sheets of every page at 390, 768 and 1024 px, reviewed independently.

### Not changed here (found on the way)

From the 27 Nov phone and tablet pass (content or Designer, not CSS):

- The 404 page has no link back into the site, and no menu. It needs a "Til forsiden" button in the Designer.
- Om oss still shows three "Bilde kommer" boxes (Kiosken på Nesset, Produksjon i kiosken, Fjorden rett utenfor).
- The product page shows two "Ingredienser" cards one after the other (CMS content).
- Produkter uses the old template review cards; Hjem uses the new phone-message notes.
- The FAQ page repeats its hero text right under the hero.
- Images: the Forhandlere hero (2880 px) and the Fjordnotater pictures (2000 px) load full size on phones. In the Designer, turn on responsive image sizes for them or upload a 1200 px version.

From the first pass:

- The round menu button is fixed at the top left and the page's left margin is 32 px, so text scrolls
  under it. A design decision, not a bug in the CSS.
- Buttons on phones are about 31 px tall ("Kjøp nå", "Meld meg på"). 44 px is the usual target.
- `/checkout` is still the unstyled Webflow default (on the launch list for 1 Dec).
- The 404 page has no link back into the site.
- Pistasjel's nutrition table has labels and no values. Om oss still shows three "Bilde kommer" boxes.
- Low-contrast small print on some worlds (product hero note lines, form labels on Kontakt).
- The template's body size is set in `vw`, here as before. Browser zoom therefore enlarges text less than
  it should until the window crosses a breakpoint. Worth a look for WCAG 1.4.4.
