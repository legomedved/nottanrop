/* Nøttekjøkkenet · oppskrift-schema.js (26 Nov 2026)
 * Lives in the page footer of the "nøttekjøkkenet Template" (CMS recipe page), inline.
 * The Recipe JSON-LD in Page settings can't hold rich text, so this fills in the parts Google wants
 * for recipe results from what is already on the page: ingredients, steps, and total time.
 * Google reads JSON-LD after running scripts. Answer engines that don't run JS read the same lists in the HTML.
 * Selectors: .nk-opp_ingredienser li (ingredients), ol li in .nk-opp_container.is-innhold outside the aside (steps),
 * first cell of .nk-opp_meta ("1 t 10 min") for time. See SEO.md.
 */
(function () {
  var s = [].filter.call(document.querySelectorAll('script[type="application/ld+json"]'), function (x) { return /"Recipe"/.test(x.textContent); })[0];
  if (!s) return;
  var d; try { d = JSON.parse(s.textContent); } catch (e) { return; }
  var r = (d['@graph'] || [d]).filter(function (n) { return n['@type'] === 'Recipe'; })[0];
  if (!r) return;
  var t = function (e) { return e.textContent.replace(/\s+/g, ' ').trim(); };
  var ing = [].map.call(document.querySelectorAll('.nk-opp_ingredienser li'), t).filter(Boolean);
  var steps = [].filter.call(document.querySelectorAll('.nk-opp_container.is-innhold ol li'), function (li) { return !li.closest('aside'); }).map(t).filter(Boolean);
  if (ing.length) r.recipeIngredient = ing;
  if (steps.length) r.recipeInstructions = steps.map(function (x) { return { '@type': 'HowToStep', text: x }; });
  var m = document.querySelector('.nk-opp_meta > div:nth-child(1)');
  if (m) {
    var h = /(\d+)\s*t\b/.exec(t(m)), mi = /(\d+)\s*min/.exec(t(m));
    if (h || mi) r.totalTime = 'PT' + (h ? h[1] + 'H' : '') + (mi ? mi[1] + 'M' : '');
  }
  s.textContent = JSON.stringify(d);
})();
