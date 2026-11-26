# Responsive layout

## `responsiv.css`: one layout on every screen

(Kept apart from `webflow/site/README.md`, which lives on the drips branch, so the two merge cleanly.)

Loaded on every page from Webflow → Site settings → Custom code → Head, pinned to a commit:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/legomedved/nottanrop@<commit>/webflow/site/responsiv.css">
```

To change it: edit the file, commit and push, swap the commit hash in the Head code, publish.
To switch it off: delete that one line and publish. Nothing else depends on it.

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

### How it was checked

Every one of the 22 page templates, on the published staging site, with headless Chromium:

- **Scale test**: each element's box at 1920 and 2560 px compared with the same element at 1440 px.
- **Measured audit** at 2560, 1920, 1440, 1280, 1024, 991, 768, 600, 480, 390, 360, 320 px: sideways scroll,
  text cut by a frame, text on top of text, anything pinned that is taller than the window.
- **Read by eye**: contact sheets of every page at 390, 768 and 1024 px, reviewed independently.

### Not changed here (found on the way)

- The round menu button is fixed at the top left and the page's left margin is 32 px, so text scrolls
  under it. A design decision, not a bug in the CSS.
- Buttons on phones are about 31 px tall ("Kjøp nå", "Meld meg på"). 44 px is the usual target.
- `/checkout` is still the unstyled Webflow default (on the launch list for 1 Dec).
- The 404 page has no link back into the site.
- Pistasjel's nutrition table has labels and no values. Om oss still shows three "Bilde kommer" boxes.
- Low-contrast small print on some worlds (product hero note lines, form labels on Kontakt).
- The template's body size is set in `vw`, here as before. Browser zoom therefore enlarges text less than
  it should until the window crosses a breakpoint. Worth a look for WCAG 1.4.4.
