# Nøttekart — the nut world map for nøttanrop.no

An interactive globe for the **Nøtteverden** page in Webflow. Turn the world, tap a nut, read where it comes from, and later see where *our* ingredients come from.

## What's in this folder

| File | What it is | Who edits it |
|---|---|---|
| `src/notter.json` | **All the content**: nuts, history, jokes, our suppliers | You and Barbora |
| `src/nottekart.js` | The globe itself (the logic) | Claude / developer |
| `src/nottekart.css` | How it looks (brand colours, fonts) | Claude / designer |
| `dist/nottekart.min.js` | The **finished file** Webflow loads. Generated, so never edit it by hand | nobody (it's built) |
| `demo/index.html` | A test page that imitates the Webflow page | — |

## Put it in Webflow

1. On the Nøtteverden page, add an **Embed** element where the globe should go:
   ```html
   <div data-nottekart data-nk-start="mandel"></div>
   ```
2. In *Page settings → Before </body> tag*:
   ```html
   <script src="https://cdn.jsdelivr.net/gh/legomedved/nottanrop@v0.1.0/dist/nottekart.min.js" defer></script>
   ```
   (This works only if the GitHub repository is **public**. If not, upload `dist/nottekart.min.js` to Webflow Assets and use that URL.)
3. Optional scroll spin: add `data-nk-scroll` to the div, and turn on GSAP + ScrollTrigger in Webflow's site settings.

From your own GSAP timeline you can steer it: `Nottekart.instances[0].goTo("cashew")`.

## Rules we hold ourselves to

- **Fast:** one file, about 38 KB compressed, map included. No extra requests.
- **Accessible:** every nut is a real button (keyboard + screen reader). The globe is the illustration, the list is the navigation. Respects "reduce motion".
- **Honest:** every fact has `verifisert: false` until a source is added to `kilder`. Never guess where our ingredients come from: `vaare: null` until confirmed.

## For a developer: rebuild

```
npm install
npm run build
```
