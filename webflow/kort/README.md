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
