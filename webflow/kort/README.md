# Kortsystem (card system)

One stylesheet, `kort.css`, gives every card on nottanrop.no the same print language.
Loaded site-wide from Webflow → Site settings → Custom code → Head, pinned to a commit:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/legomedved/nottanrop@<commit>/webflow/kort/kort.css">
```

To change a card: edit `kort.css`, commit, swap the hash in the Head code, publish.

## The rule in one line
**Lapp** = cut paper you *read* (hand-cut corners, halftone plate).
**Etikett** = a label you *open* (round corners, solid plate).
Only links move: hover lifts the card off the paper, press prints it.

| Lapp | Etikett |
|---|---|
| Hvorfor-kort, kanaler, telefonbeskjeder (Hjem) | Produktkort (Hjem, Produkter) |
| Fakta (Om oss) | Nøtteverden-kort, globuskortet |
| Nøttetyper (Nøtteverden) | Fjordnotater |
| Slik blir du forhandler (Forhandlere) | Forhandlerkort |
| Samarbeid / Presse / B2B | Kontaktkort, FAQ |
| | Utforsk mer, oppskrifter |

Tokens live at the top of `kort.css` (`--k-*`): ink, paper, radii, plate offsets, padding, type.

## Also in this file
- **One mono, one sans:** the names "Space Mono" and "Plus Jakarta Sans" are re-pointed to the DM Mono / DM Sans files,
  so every old rule (Hjem, Om oss, Samarbeid, map labels, FAQ answers) prints in DM. When convenient, delete the
  Space Mono upload and the Plus Jakarta Google Fonts entry in Webflow; nothing will change visually.
- **Panels and menu:** the Kontakt form panels and the Ressurser menu cards use the same edge and solid plate.
- **The globe card** keeps its entry-coloured plate on purpose: it's the "print registers itself" moment.
