/*
  Samtykke v1.0 — cookie consent for Webflow, by Ampers& house
  -------------------------------------------------------------
  Put it in <head>, BEFORE Google Tag Manager / gtag, and without defer or async,
  so Google Consent Mode gets its "denied" defaults before any tag runs:

    <script src=".../samtykke.min.js" data-policy="/personvern" data-version="1"></script>

  Block a script until consent (Webflow Embed or custom code):
    <script type="text/plain" data-samtykke="analytics" src="https://…"></script>
    <script type="text/plain" data-samtykke="marketing">fbq('init', '…')</script>

  Block an iframe (YouTube, Vimeo, maps…). A placeholder with an "Allow" button appears in its place:
    <iframe data-samtykke="marketing" data-samtykke-src="https://www.youtube-nocookie.com/embed/…"></iframe>

  Show / hide anything by consent:
    data-samtykke-if="analytics"      shown only with consent
    data-samtykke-unless="marketing"  shown only without consent

  Reopen the settings (footer link, button, link block):
    data-samtykke-action="open-preferences"

  Own UI built in the Designer instead of the default one:
    data-samtykke-ui="banner" | "preferences"
    data-samtykke-action="accept-all" | "reject-all" | "save" | "open-preferences" | "close"
    <input type="checkbox" data-samtykke-toggle="analytics">

  JavaScript:
    Samtykke.has("analytics")   Samtykke.get()   Samtykke.open()   Samtykke.reset()
    Samtykke.on(state => …)     window.addEventListener("samtykke:change", e => e.detail)
*/

import css from "./samtykke.css";
import TEXTS from "./texts.js";

(function () {
  if (window.Samtykke) return;

  const doc = document;
  const script = doc.currentScript;
  const ds = (script && script.dataset) || {};
  const user = window.SamtykkeConfig || {};
  const pick = (key, attr, fallback) => (user[key] !== undefined ? user[key] : ds[attr] !== undefined ? ds[attr] : fallback);
  const bool = (v) => v === true || v === "" || v === "true";

  const ALL = ["necessary", "preferences", "analytics", "marketing"];
  const cfg = {
    version: String(pick("version", "version", "1")),
    expiryDays: Number(pick("expiryDays", "expiry", 180)),
    cookieName: pick("cookieName", "cookie", "samtykke"),
    cookieDomain: pick("cookieDomain", "domain", ""),
    policyUrl: pick("policyUrl", "policy", ""),
    endpoint: pick("endpoint", "endpoint", ""),
    ui: pick("ui", "ui", "auto"), // auto | none
    position: pick("position", "position", "center"), // center | left
    floating: bool(pick("floating", "floating", false)),
    consentMode: pick("consentMode", "consentMode", "on") !== "off" && user.consentMode !== false,
    respectGPC: pick("respectGPC", "gpc", "on") !== "off" && user.respectGPC !== false,
    reloadOnRevoke: pick("reloadOnRevoke", "reload", "on") !== "off" && user.reloadOnRevoke !== false,
    webflowCategory: pick("webflowCategory", "webflowCategory", "analytics"),
    categories: ["necessary"].concat(
      String(pick("categories", "categories", "preferences analytics marketing"))
        .split(/[\s,]+/)
        .filter((c) => c && c !== "necessary" && ALL.indexOf(c) > -1)
    ),
    // Cookies deleted when a category is withdrawn. "*" is a wildcard.
    cookies: Object.assign(
      {
        analytics: ["_ga", "_ga_*", "_gid", "_gat*", "_hj*", "_clck", "_clsk", "_pk_*", "mp_*", "ajs_*"],
        marketing: ["_fbp", "_fbc", "_gcl_*", "_ttp", "_tt_*", "_pin_*", "_uetsid", "_uetvid", "li_*", "_rdt_uuid", "_scid*"],
        preferences: [],
      },
      user.cookies || {}
    ),
  };

  const htmlLang = (doc.documentElement.lang || navigator.language || "en").toLowerCase();
  const langKey = (String(pick("lang", "lang", "")) || htmlLang).toLowerCase().slice(0, 2);
  const L = Object.assign({}, TEXTS.en, TEXTS[{ no: "nb", nn: "nb" }[langKey] || langKey] || {}, user.texts || {});
  L.cat = Object.assign({}, (TEXTS[{ no: "nb", nn: "nb" }[langKey] || langKey] || TEXTS.en).cat, (user.texts && user.texts.cat) || {});

  const gpc = cfg.respectGPC && navigator.globalPrivacyControl === true;
  const listeners = [];
  const executed = {}; // category -> true once a blocked script for it has run on this page
  let state = read();

  // ---------- 1. Before anything else: styles + Consent Mode defaults ----------
  const style = doc.createElement("style");
  style.setAttribute("data-samtykke-css", "");
  style.textContent = css;
  (doc.head || doc.documentElement).appendChild(style);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); } // must push `arguments`, not an array
  if (cfg.consentMode) {
    gtag("consent", "default", Object.assign(googleSignals(null), { wait_for_update: 500 }));
    gtag("set", "ads_data_redaction", true);
    if (state) gtag("consent", "update", googleSignals(state.cats));
  }
  if (state) emit("init");

  // ---------- 2. Storage ----------
  function read() {
    const m = doc.cookie.match(new RegExp("(?:^|; )" + cfg.cookieName.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&") + "=([^;]*)"));
    if (!m) return null;
    try {
      const s = JSON.parse(decodeURIComponent(m[1]));
      if (!s || s.v !== cfg.version || !s.c) return null; // policy changed → ask again
      return { id: s.id, v: s.v, ts: s.ts, cats: normalize(s.c) };
    } catch (e) {
      return null;
    }
  }
  function write(s) {
    const c = {};
    cfg.categories.forEach((k) => { if (k !== "necessary") c[k] = s.cats[k] ? 1 : 0; });
    const value = encodeURIComponent(JSON.stringify({ id: s.id, v: s.v, ts: s.ts, c: c }));
    doc.cookie = cfg.cookieName + "=" + value + "; Max-Age=" + Math.round(cfg.expiryDays * 86400) + "; Path=/; SameSite=Lax" +
      (cfg.cookieDomain ? "; Domain=" + cfg.cookieDomain : "") + (location.protocol === "https:" ? "; Secure" : "");
  }
  function normalize(c) {
    const out = {};
    ALL.forEach((k) => { out[k] = k === "necessary" ? true : cfg.categories.indexOf(k) > -1 && !!(c && c[k]); });
    return out;
  }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
      const r = (Math.random() * 16) | 0;
      return (ch === "x" ? r : (r & 3) | 8).toString(16);
    });
  }
  function deleteCookies(patterns) {
    if (!patterns || !patterns.length) return;
    const res = patterns.map((p) => new RegExp("^" + p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"));
    const host = location.hostname.split(".");
    const domains = [""];
    for (let i = 0; i < host.length - 1; i++) domains.push("; Domain=" + host.slice(i).join("."), "; Domain=." + host.slice(i).join("."));
    doc.cookie.split("; ").forEach((pair) => {
      const name = pair.split("=")[0];
      if (!name || name === cfg.cookieName || !res.some((r) => r.test(name))) return;
      domains.forEach((d) => { doc.cookie = name + "=; Max-Age=0; Path=/" + d; });
    });
  }

  // ---------- 3. Signals out: Google, Webflow, GTM, listeners, log ----------
  function googleSignals(cats) {
    const g = (k) => (cats && cats[k] ? "granted" : "denied");
    return {
      ad_storage: g("marketing"), ad_user_data: g("marketing"), ad_personalization: g("marketing"),
      analytics_storage: g("analytics"),
      functionality_storage: g("preferences"), personalization_storage: g("preferences"),
      security_storage: "granted",
    };
  }
  function webflowTracking(allow) {
    const run = () => {
      const wf = window.wf;
      if (!wf || typeof wf.ready !== "function") return false;
      wf.ready(() => {
        try { allow ? wf.allowUserTracking({ reload: false }) : wf.denyUserTracking({ reload: false }); } catch (e) {}
      });
      return true;
    };
    if (!run()) window.addEventListener("load", run, { once: true });
  }
  function emit(action) {
    const detail = get();
    window.dataLayer.push({ event: "samtykke_update", samtykke: Object.assign({ action: action }, detail.categories) });
    if (state) webflowTracking(!!state.cats[cfg.webflowCategory]);
    listeners.forEach((fn) => { try { fn(detail); } catch (e) { console.error(e); } });
    try { window.dispatchEvent(new CustomEvent("samtykke:change", { detail: detail })); } catch (e) {}
  }
  function log(action) {
    if (!cfg.endpoint) return;
    const body = JSON.stringify({
      id: state.id, version: state.v, ts: new Date(state.ts).toISOString(), action: action,
      categories: get().categories, page: location.origin + location.pathname, lang: langKey, gpc: gpc,
    });
    try {
      // text/plain keeps it a "simple" request: no CORS preflight, survives page unload.
      if (!(navigator.sendBeacon && navigator.sendBeacon(cfg.endpoint, new Blob([body], { type: "text/plain" })))) {
        fetch(cfg.endpoint, { method: "POST", body: body, keepalive: true, headers: { "Content-Type": "text/plain" } });
      }
    } catch (e) {}
  }

  // ---------- 4. Decide ----------
  function decide(cats, action) {
    const before = state ? state.cats : normalize({});
    state = { id: (state && state.id) || uuid(), v: cfg.version, ts: Date.now(), cats: normalize(cats) };
    write(state);
    if (cfg.consentMode) gtag("consent", "update", googleSignals(state.cats));
    emit(action);
    log(action);
    closeUI();

    const revoked = cfg.categories.filter((k) => before[k] && !state.cats[k]);
    revoked.forEach((k) => deleteCookies(cfg.cookies[k]));
    // Scripts that already ran can't be unloaded. A reload is the only honest way to stop them.
    if (cfg.reloadOnRevoke && revoked.some((k) => executed[k])) return location.reload();
    scan();
  }
  const allOn = () => {
    const c = {};
    cfg.categories.forEach((k) => { c[k] = !(gpc && k === "marketing"); });
    return c;
  };

  // ---------- 5. Unblock: scripts (in order), embeds, conditional elements ----------
  const has = (attr) => String(attr || "").split(/[\s,]+/).filter(Boolean).every((k) => k === "necessary" || (state && state.cats[k]));
  let queue = Promise.resolve();

  function scan() {
    const nodes = Array.prototype.slice.call(doc.querySelectorAll('script[type="text/plain"][data-samtykke]'))
      .filter((n) => !n.__smk && has(n.getAttribute("data-samtykke")));
    nodes.forEach((n) => { n.__smk = true; });
    // Run one after another, waiting for each external file, so an inline init never runs before its library.
    nodes.forEach((old) => { queue = queue.then(() => runScript(old)); });

    doc.querySelectorAll("[data-samtykke-src]").forEach(embed);
    doc.querySelectorAll("[data-samtykke-if]").forEach((el) => { el.hidden = !has(el.getAttribute("data-samtykke-if")); });
    doc.querySelectorAll("[data-samtykke-unless]").forEach((el) => { el.hidden = has(el.getAttribute("data-samtykke-unless")); });
  }
  function runScript(old) {
    return new Promise((resolve) => {
      const s = doc.createElement("script");
      for (let i = 0; i < old.attributes.length; i++) {
        const a = old.attributes[i];
        if (a.name !== "type" && a.name !== "data-type") s.setAttribute(a.name, a.value);
      }
      const t = old.getAttribute("data-type"); // e.g. data-type="module"
      if (t) s.type = t;
      String(old.getAttribute("data-samtykke")).split(/[\s,]+/).forEach((k) => { executed[k] = true; });
      if (old.src) {
        s.async = false;
        s.onload = s.onerror = () => resolve();
      } else {
        s.text = old.text;
      }
      old.parentNode.replaceChild(s, old);
      if (!old.src) resolve();
    });
  }
  function embed(el) {
    const cat = el.getAttribute("data-samtykke") || "marketing";
    const ok = has(cat);
    const ph = el.__smkPlaceholder;
    if (ok) {
      if (ph) { ph.remove(); el.__smkPlaceholder = null; el.style.display = el.__smkDisplay || ""; }
      if (el.getAttribute("src") !== el.getAttribute("data-samtykke-src")) el.setAttribute("src", el.getAttribute("data-samtykke-src"));
      return;
    }
    if (el.tagName !== "IFRAME" || ph || el.getAttribute("data-samtykke-placeholder") === "none") return;
    let host = "";
    try { host = new URL(el.getAttribute("data-samtykke-src"), location.href).hostname.replace(/^www\./, ""); } catch (e) {}
    const box = doc.createElement("div");
    box.className = "smk smk-placeholder";
    box.style.aspectRatio = (el.getAttribute("width") && el.getAttribute("height")) ? el.getAttribute("width") + " / " + el.getAttribute("height") : "16 / 9";
    box.innerHTML = "<p></p>";
    box.firstChild.textContent = L.placeholder.replace("{host}", host || L.thirdParty);
    const btn = button(L.placeholderBtn, "allow");
    btn.setAttribute("data-samtykke-category", cat);
    box.appendChild(btn);
    el.__smkDisplay = el.style.display;
    el.style.display = "none";
    el.parentNode.insertBefore(box, el);
    el.__smkPlaceholder = box;
  }

  // ---------- 6. UI ----------
  let banner = null;
  let prefs = null;
  let floating = null;
  let lastFocus = null;

  function button(label, action) {
    const b = doc.createElement("button");
    b.type = "button";
    b.className = "smk-btn";
    b.setAttribute("data-samtykke-action", action);
    b.textContent = label;
    return b;
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function buildDefaultUI() {
    const policy = cfg.policyUrl ? ' <a href="' + esc(cfg.policyUrl) + '">' + esc(L.policy) + "</a>" : "";
    const actions = '<div class="smk-actions">' +
      ["rejectAll:reject-all", "customize:open-preferences", "acceptAll:accept-all"].map((p) => {
        const [k, a] = p.split(":");
        return '<button type="button" class="smk-btn" data-samtykke-action="' + a + '">' + esc(L[k]) + "</button>";
      }).join("") + "</div>";

    if (!doc.querySelector('[data-samtykke-ui="banner"]')) {
      banner = doc.createElement("section");
      banner.className = "smk smk-banner";
      banner.setAttribute("data-samtykke-ui", "banner");
      banner.setAttribute("data-position", cfg.position);
      banner.setAttribute("aria-label", L.region);
      banner.innerHTML = '<h2 id="smk-title">' + esc(L.title) + "</h2><p>" + esc(L.body) + policy + "</p>" + actions;
      // First in the DOM: keyboard and screen-reader users meet it first, without focus being stolen on load.
      doc.body.insertBefore(banner, doc.body.firstChild);
    }

    if (!doc.querySelector('[data-samtykke-ui="preferences"]')) {
      prefs = doc.createElement("dialog");
      prefs.className = "smk smk-dialog";
      prefs.setAttribute("data-samtykke-ui", "preferences");
      prefs.setAttribute("aria-labelledby", "smk-prefs-title");
      const cats = cfg.categories.map((k) => {
        const [name, desc] = L.cat[k] || [k, ""];
        const control = k === "necessary"
          ? '<span class="smk-always">' + esc(L.alwaysOn) + "</span>"
          : '<input type="checkbox" role="switch" class="smk-switch" id="smk-c-' + k + '" data-samtykke-toggle="' + k + '" aria-describedby="smk-d-' + k + '">';
        const label = k === "necessary" ? "<strong>" + esc(name) + "</strong>" : '<label for="smk-c-' + k + '">' + esc(name) + "</label>";
        return '<li class="smk-cat"><div>' + label + '<p id="smk-d-' + k + '">' + esc(desc) + "</p></div>" + control + "</li>";
      }).join("");
      prefs.innerHTML = '<div class="smk-dialog-inner">' +
        '<button type="button" class="smk-close" data-samtykke-action="close" aria-label="' + esc(L.close) + '">×</button>' +
        '<h2 id="smk-prefs-title">' + esc(L.prefsTitle) + "</h2><p>" + esc(L.prefsBody) + policy + "</p>" +
        (gpc ? '<p class="smk-note">' + esc(L.gpc) + "</p>" : "") +
        '<ul class="smk-cats">' + cats + "</ul>" +
        actions.replace('data-samtykke-action="open-preferences">' + esc(L.customize), 'data-samtykke-action="save">' + esc(L.save)) +
        "</div>";
      doc.body.appendChild(prefs);
    }

    if (cfg.floating) {
      floating = button(L.floating, "open-preferences");
      floating.className = "smk smk-floating";
      floating.hidden = true;
      doc.body.appendChild(floating);
    }
  }

  const ui = (name) => doc.querySelector('[data-samtykke-ui="' + name + '"]');
  const focusables = (root) => Array.prototype.filter.call(
    root.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    (el) => !el.disabled && el.getClientRects().length > 0
  );

  function show(el) { if (el) el.setAttribute("data-samtykke-open", ""); }
  function hide(el) { if (el) el.removeAttribute("data-samtykke-open"); }

  function openBanner() {
    show(ui("banner"));
    if (floating) floating.hidden = true;
  }
  function openPrefs() {
    const el = ui("preferences");
    if (!el) return;
    lastFocus = doc.activeElement;
    const cats = state ? state.cats : normalize({});
    el.querySelectorAll("[data-samtykke-toggle]").forEach((input) => setChecked(input, !!cats[input.getAttribute("data-samtykke-toggle")]));
    show(el);
    if (el.tagName === "DIALOG" && typeof el.showModal === "function") {
      if (!el.open) el.showModal(); // native: focus trap, Esc, inert page
    } else {
      el.setAttribute("role", el.getAttribute("role") || "dialog");
      el.setAttribute("aria-modal", "true");
      const f = focusables(el);
      if (f[0]) f[0].focus();
    }
  }
  function closePrefs() {
    const el = ui("preferences");
    if (!el || !el.hasAttribute("data-samtykke-open")) return;
    hide(el);
    if (el.tagName === "DIALOG" && el.open) el.close();
    if (lastFocus && lastFocus.focus && doc.contains(lastFocus)) lastFocus.focus();
  }
  function closeUI() {
    hide(ui("banner"));
    closePrefs();
    if (floating) floating.hidden = false;
  }
  function setChecked(input, on) {
    input.checked = on;
    // Webflow's custom checkbox draws a sibling div; keep it in sync.
    const visual = input.parentElement && input.parentElement.querySelector(".w-checkbox-input");
    if (visual) visual.classList.toggle("w--redirected-checked", on);
  }
  function readToggles() {
    const c = {};
    const el = ui("preferences");
    if (el) el.querySelectorAll("[data-samtykke-toggle]").forEach((i) => { c[i.getAttribute("data-samtykke-toggle")] = i.checked; });
    return c;
  }

  function onAction(action, el) {
    if (action === "accept-all") decide(allOn(), "accept-all");
    else if (action === "reject-all") decide({}, "reject-all");
    else if (action === "save") decide(readToggles(), "custom");
    else if (action === "open-preferences") openPrefs();
    else if (action === "close") {
      closePrefs();
      if (!state) openBanner();
    } else if (action === "allow") {
      const c = Object.assign({}, state ? state.cats : {});
      String(el.getAttribute("data-samtykke-category") || "").split(/[\s,]+/).forEach((k) => { c[k] = true; });
      decide(c, "allow");
    }
  }

  doc.addEventListener("click", (e) => {
    const el = e.target.closest && e.target.closest("[data-samtykke-action]");
    if (!el) return;
    e.preventDefault();
    onAction(el.getAttribute("data-samtykke-action"), el);
  });
  doc.addEventListener("keydown", (e) => {
    const el = ui("preferences");
    if (!el || el.tagName === "DIALOG" || !el.hasAttribute("data-samtykke-open")) return;
    if (e.key === "Escape") { e.preventDefault(); onAction("close"); }
    if (e.key === "Tab") { // focus trap for custom (non-<dialog>) preferences
      const f = focusables(el);
      if (!f.length) return;
      if (e.shiftKey && doc.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && doc.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  // Toggles inside a Webflow form: Enter must not submit the form to Webflow.
  doc.addEventListener("submit", (e) => {
    if (e.target.closest && e.target.closest("[data-samtykke-ui]")) { e.preventDefault(); onAction("save"); }
  }, true);
  // Native <dialog> closed with Esc.
  doc.addEventListener("cancel", (e) => {
    if (e.target.getAttribute && e.target.getAttribute("data-samtykke-ui") === "preferences") { e.preventDefault(); onAction("close"); }
  }, true);

  function start() {
    if (cfg.ui !== "none") buildDefaultUI();
    scan();
    if (!state) openBanner();
    else if (floating) floating.hidden = false;
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start);
  else start();

  // ---------- 7. Public API ----------
  function get() {
    const c = {};
    cfg.categories.forEach((k) => { c[k] = !!(state && state.cats[k]); });
    c.necessary = true;
    return { decided: !!state, id: state && state.id, version: cfg.version, timestamp: state && state.ts, categories: c };
  }
  window.Samtykke = {
    version: "1.0.0",
    config: cfg,
    get: get,
    has: (k) => has(k),
    open: openPrefs,
    close: closeUI,
    acceptAll: () => decide(allOn(), "accept-all"),
    rejectAll: () => decide({}, "reject-all"),
    set: (cats) => decide(Object.assign({}, state ? state.cats : {}, cats), "api"),
    reset: () => {
      doc.cookie = cfg.cookieName + "=; Max-Age=0; Path=/" + (cfg.cookieDomain ? "; Domain=" + cfg.cookieDomain : "");
      state = null;
      openBanner();
    },
    on: (fn) => { listeners.push(fn); if (state) fn(get()); },
    refresh: scan,
  };
})();
