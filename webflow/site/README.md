# Site-wide pieces

`drip-seams.js` is the readable source of the drip seam fix. It ships inside the registered site script
**nanfix7** (Webflow → Site settings → Custom code → registered scripts), together with the one rule from the
old nanfix3 it replaced (`.legal_hero-kicker`). `nanfix7-1.0.0.js` is exactly what is registered.

Why: every drip used to get its seam colour by hand (cream for most pages, a hard-coded `#5a3a1c` brown for the
Om oss world in nanfix3). When a page changed, the seam broke. Now each drip reads the colour of its neighbour:

- footer drip: the colour at the bottom edge of the last section; transparent if that section paints nothing,
  so whatever is behind both (page background, Om oss' night sky) runs straight through
- hero drip dividers (Fjordnotater, FAQ, Samarbeid, Presse, Investor): the colour at the top edge of the next section

The site already has 15 registered scripts, Webflow's limit per block, so new fixes must be merged into an
existing one. To change it: edit `drip-seams.js`, minify (`npx esbuild drip-seams.js --minify`), prepend the
legal_hero line, register as a new version/name, swap it in, publish.
