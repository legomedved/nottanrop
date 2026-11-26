/* Nøttanrop · lansering.js (26 Nov 2026)
 * Launch polish, loaded site-wide from the Webflow head (registered script "nanlansering").
 * Every rule below comes from a measured audit of staging (desktop 1440 + mobile 390):
 * contrast was measured against the rendered pixels, not guessed from CSS.
 *
 * 1. Worlds: on the mid-tone worlds (mandelykke orange, sunntella red, jordbær pink, nød coral,
 *    fjord sage) small light text in the hero and in the Nøttpost band takes the world's own deep
 *    shade, the way mango, cashew and matcha already do. Big titles keep cream and get a riso
 *    "plate" shadow in the world's dark tone (the same misregistration the Fjordnotater title uses).
 *    Where neither cream nor a dark shade reaches 4.5:1 (sunntella band, praktisk trinn 3),
 *    cream stays and gets a soft dark halo.
 * 2. Accent colours on light paper: #CC6121, #FF7A2A and #E23C2E as text on cream fail AA
 *    (2.5–3.9:1). They are deepened in their own hue only where the local background is light.
 * 3. Buttons and labels with their own fill: light text that fails gets ink if ink passes;
 *    otherwise the fill itself is deepened a little (cream on red "Ring oss", "Telefonbeskjed").
 * 4. Small text floor: nothing below 12px (map labels inside SVG excepted).
 * 5. Typography: every H1 in sentence case; the home hero line gets weight and a plum halo.
 * 6. Language: English CMS dates become "26. november 2026"; Kontakt subject placeholder "Emne".
 * 7. Unwritten copy: rows still reading "[… skriver selv]" are hidden until the text is written.
 * 8. Icons: swaps the template donut favicon/touch icon for Helt Nøtta until Site settings has them.
 *
 * Debug: add ?kontrast to a URL to log every change in the console.
 */
(function () {
  'use strict';
  var d = document, INK = [27, 17, 8];
  var DEBUG = /[?&]kontrast/.test(location.search), log = [];

  /* ---------- static CSS ---------- */
  var css = [
    'h1{text-transform:none!important}',
    '.home-hero_paragraph-text{font-weight:400!important;text-shadow:0 1px 2px rgba(46,20,40,.65),0 0 24px rgba(46,20,40,.6)}',
    '.nan-skjult{display:none!important}',
    /* FAQ hero subtitle was ~12px under a 96px title */
    '.verden-noed .text-box .small-paragraph.white{font-size:clamp(1rem,1.2vw,1.125rem)!important;line-height:1.45!important}'
  ].join('');
  var st = d.createElement('style'); st.id = 'nan-lansering'; st.textContent = css; d.head.appendChild(st);

  /* ---------- colour helpers ---------- */
  function parse(c) {
    var m = c && c.match(/rgba?\(([^)]+)\)/);
    if (m) { var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); return [p[0], p[1], p[2], p[3] == null ? 1 : p[3]]; }
    m = c && c.match(/color\(srgb ([^)]+)\)/);
    if (m) { var q = m[1].split(/[\s\/]+/).filter(Boolean).map(parseFloat); return [q[0] * 255, q[1] * 255, q[2] * 255, q[3] == null ? 1 : q[3]]; }
    return null;
  }
  function lin(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function L(c) { return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]); }
  function ratio(a, b) { var x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgb(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
  function near(c, ref) { return c && Math.abs(c[0] - ref[0]) + Math.abs(c[1] - ref[1]) + Math.abs(c[2] - ref[2]) < 9; }
  function ownText(el) { for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.nodeValue.trim().length > 1) return true; return false; }
  function textEls(root) { var out = [], all = root.getElementsByTagName('*'); for (var i = 0; i < all.length; i++) if (ownText(all[i]) && !all[i].closest('svg')) out.push(all[i]); return out; }
  function isLarge(s) { var fs = parseFloat(s.fontSize); return fs >= 24 || (fs >= 18.66 && parseInt(s.fontWeight, 10) >= 700); }
  /* a solid fill on the element itself or on an ancestor up to `stop` (exclusive) */
  function fillBetween(el, stop) {
    for (var e = el; e && e !== stop; e = e.parentElement) { var c = parse(getComputedStyle(e).backgroundColor); if (c && c[3] >= 0.6) return { c: c, el: e }; }
    return null;
  }
  function set(el, prop, val, why) { el.style.setProperty(prop, val, 'important'); if (DEBUG) log.push([why, (el.textContent || '').trim().slice(0, 40), prop + ': ' + val]); }

  /* ---------- 1 · worlds ---------- */
  var BAND = '.footer-section_newsletter-wrapper';
  var WORLDS = [
    { world: '.verden-mandelykke', scopes: ['.section-produkt-hero', BAND], dark: '#421C08', plate: '#9A3F0A' },
    { world: '.verden-sunntella', scopes: ['.section-produkt-hero'], dark: '#2A0805', plate: '#7E1D14' },
    { world: '.verden-sunntella', scopes: [BAND], halo: '58,12,8' },
    { world: '.verden-jordbaer', scopes: ['.section-produkt-hero', BAND], dark: '#24060C', plate: '#7A1F33' },
    { world: '.verden-noed', scopes: [BAND, '.small-paragraph.white'], dark: '#2A0604', plate: '#8E2A1F', titles: 'h1' },
    { world: '.verden-fjord', scopes: [BAND], dark: '#1F2B28' },
    { world: '.verden-praktisk.trinn-3', scopes: [BAND, '.legal_hero'], halo: '42,26,12' },
    { world: '.verden-hjem', scopes: ['[class*="oo-cover"]'], dark: '#2E0F18' }
  ];
  function worlds() {
    WORLDS.forEach(function (w) {
      var root = d.querySelector('.page_wrapper' + w.world); if (!root) return;
      w.scopes.forEach(function (sc) {
        var scopes = d.querySelectorAll(sc);
        Array.prototype.forEach.call(scopes, function (scope) {
          var els = textEls(scope); if (ownText(scope)) els.push(scope);
          els.forEach(function (el) {
            if (el !== scope && fillBetween(el, scope)) return;          /* buttons, chips: handled by rule 3 */
            var s = getComputedStyle(el), c = parse(s.color); if (!c || L(c) < 0.6) return;   /* only light text */
            var fs = parseFloat(s.fontSize);
            if (w.halo) { set(el, 'text-shadow', '0 0 1px rgba(' + w.halo + ',.9),0 1px 3px rgba(' + w.halo + ',.75),0 0 14px rgba(' + w.halo + ',.45)', 'halo'); return; }
            if (fs >= 40) { if (w.plate) set(el, 'text-shadow', '0.05em 0.05em 0 ' + w.plate, 'plate'); return; }
            set(el, 'color', w.dark, 'world'); set(el, 'text-decoration-color', w.dark, 'world');
          });
        });
      });
      if (w.titles && w.plate) Array.prototype.forEach.call(root.querySelectorAll(w.titles), function (h) {
        var c = parse(getComputedStyle(h).color); if (c && L(c) > 0.6) set(h, 'text-shadow', '0.05em 0.05em 0 ' + w.plate, 'plate');
      });
    });
  }

  /* ---------- 2 · accent colours on light paper ---------- */
  var ACCENTS = [
    { from: [204, 97, 33], small: '#A3470F', large: '#A3470F' },
    { from: [255, 122, 42], small: '#A3470F', large: '#C9541A' },
    { from: [226, 60, 46], small: '#A8261B', large: '#C4321F' }
  ];
  function paperUnder(el) {
    for (var e = el, i = 0; e && i < 6; e = e.parentElement, i++) {
      var s = getComputedStyle(e), c = parse(s.backgroundColor);
      if (c && c[3] >= 0.6) return L(c) > 0.75 ? c : null;
      if (s.backgroundImage && s.backgroundImage !== 'none' && !/grain|noise|data:image\/svg/.test(s.backgroundImage)) return null;
    }
    return null;
  }
  function accents() {
    textEls(d.body).forEach(function (el) {
      var s = getComputedStyle(el), c = parse(s.color);
      for (var i = 0; i < ACCENTS.length; i++) {
        var a = ACCENTS[i]; if (!near(c, a.from)) continue;
        var bg = paperUnder(el); if (!bg) return;
        var large = isLarge(s), need = large ? 3 : 4.5; if (ratio(c, bg) >= need) return;
        var col = large ? a.large : a.small; set(el, 'color', col, 'accent'); set(el, 'text-decoration-color', col, 'accent'); return;
      }
    });
  }

  /* ---------- 3 · buttons and labels with their own fill ---------- */
  function fills() {
    textEls(d.body).forEach(function (el) {
      if (el.closest('.w-commerce-commercecartwrapper, [aria-hidden="true"], .nav-main, .fullscreen-menu_component, .footer_section')) return;
      var f = fillBetween(el, el.parentElement && el.parentElement.parentElement); if (!f) return;
      var box = f.el.getBoundingClientRect(); if (box.width * box.height > 60000 || !box.width) return;
      var s = getComputedStyle(el), c = parse(s.color); if (!c || c[3] < 0.5) return;
      var need = isLarge(s) ? 3 : 4.5, bg = f.c; if (ratio(c, bg) >= need) return;
      if (L(c) > 0.6 && ratio(INK, bg) >= need) { set(el, 'color', rgb(INK), 'knapp-blekk'); return; }
      var toward = L(c) > L(bg) ? INK : [251, 247, 243];
      for (var t = 0.05; t <= 0.6; t += 0.05) { var b2 = mix(bg, toward, t); if (ratio(c, b2) >= need) { set(f.el, 'background-color', rgb(b2), 'knapp-flate'); return; } }
    });
  }

  /* ---------- 4 · small text floor ---------- */
  function floor() {
    textEls(d.body).forEach(function (el) {
      if (el.closest('.w-commerce-commercecartwrapper, [data-nottekart], .nk-root')) return;
      if (parseFloat(getComputedStyle(el).fontSize) < 12) set(el, 'font-size', '12px', 'min-12');
    });
  }

  /* ---------- 6 · language ---------- */
  var EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var NO = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];
  var DATE = /^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (\d{4})$/;
  function language() {
    var w = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) { var m = n.nodeValue.trim().match(DATE); if (m) n.nodeValue = m[2] + '. ' + NO[EN.indexOf(m[1])] + ' ' + m[3]; }
    var emne = d.getElementById('Emne');
    if (emne && /last name/i.test(emne.getAttribute('placeholder') || '')) emne.setAttribute('placeholder', 'Emne');
  }

  /* ---------- 7 · unwritten copy ---------- */
  function unwritten() {
    var w = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT), n, hits = [];
    while ((n = w.nextNode())) if (/^\[[^\]]*skriver selv\]$/i.test(n.nodeValue.trim())) hits.push(n.parentElement);
    hits.forEach(function (el) {
      var row = el;
      while (row.parentElement && row.parentElement.children.length === 1) row = row.parentElement;
      if (row.parentElement && row.parentElement.textContent.trim().length < 140) row = row.parentElement;
      row.classList.add('nan-skjult');
    });
  }

  /* ---------- 8 · icons (stopgap until Site settings → General has the new favicon/webclip) ---------- */
  var ICON = 'https://cdn.jsdelivr.net/gh/legomedved/nottanrop@db9a73c9baaed1ae2cf6377529483a3cd498fda1/webflow/site/ikon/';
  function icons() {
    var fav = d.querySelector('link[rel="shortcut icon"], link[rel="icon"]');
    if (fav && /favicon-2\.png/.test(fav.href)) { fav.href = ICON + 'favicon-32.png'; fav.type = 'image/png'; }
    var tch = d.querySelector('link[rel="apple-touch-icon"]');
    if (tch && /_favicon\.png/.test(tch.href)) tch.href = ICON + 'apple-touch-180.png';
  }
  icons();

  function run() {
    [language, unwritten, worlds, accents, fills, floor].forEach(function (f) { try { f(); } catch (e) { if (DEBUG) console.warn('lansering', f.name, e); } });
    if (DEBUG) console.table(log);
  }
  if (d.readyState === 'complete') setTimeout(run, 300);
  else window.addEventListener('load', function () { setTimeout(run, 300); });
  window.nanLansering = { run: run, log: log };
})();
