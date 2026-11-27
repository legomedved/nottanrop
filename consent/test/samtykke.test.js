// Browser test for Samtykke: node consent/test/samtykke.test.js
// Serves consent/ on localhost (cookies don't work on file://) and drives Chromium with Playwright.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript" };
const logs = [];
const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/log") {
    let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => { logs.push(JSON.parse(b)); res.end("ok"); });
    return;
  }
  const file = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.statusCode = 404; return res.end(); }
  res.setHeader("Content-Type", TYPES[path.extname(file)] || "text/plain");
  fs.createReadStream(file).pipe(res);
});

let failed = 0;
const ok = (cond, msg) => { console.log((cond ? "  ✓ " : "  ✗ ") + msg); if (!cond) failed++; };

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = "http://localhost:" + server.address().port;
  const browser = await chromium.launch();

  // ---------- Default UI ----------
  console.log("Default UI (nb)");
  let ctx = await browser.newContext();
  let page = await ctx.newPage();
  await page.addInitScript(() => { window.SamtykkeConfig = { endpoint: "/log" }; });
  await page.goto(base + "/demo/index.html");

  const consentDefault = await page.evaluate(() => Array.from(dataLayer).find((e) => e[0] === "consent" && e[1] === "default"));
  ok(consentDefault && consentDefault[2].analytics_storage === "denied" && consentDefault[2].ad_storage === "denied", "Consent Mode v2 defaults are denied");
  ok(await page.isVisible(".smk-banner"), "banner visible on first visit");
  ok(await page.evaluate(() => document.body.firstElementChild.matches(".smk-banner")), "banner is first in reading order");
  ok((await page.textContent(".smk-banner")).includes("Avvis alle"), "Norwegian texts from <html lang>");
  ok(await page.evaluate(() => !window.analyticsLoaded && !window.marketingRan), "no blocked script ran before consent");
  ok(!(await page.evaluate(() => document.cookie)).includes("_ga"), "no _ga cookie before consent");
  ok(await page.isVisible(".smk-placeholder"), "iframe replaced by placeholder");
  ok(await page.evaluate(() => !document.querySelector("iframe").getAttribute("src")), "iframe has no src");
  ok(await page.isVisible("text=Statistikk er av"), "data-samtykke-unless shown");

  // Accessibility scan of banner + preferences
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  let axe = await page.evaluate(() => axe.run(".smk-banner", { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] }));
  ok(axe.violations.length === 0, "axe: banner has no WCAG A/AA violations " + JSON.stringify(axe.violations.map((v) => v.id)));

  await page.click(".smk-banner >> text=Velg selv");
  ok(await page.evaluate(() => document.querySelector("dialog.smk-dialog").open), "preferences open as modal <dialog>");
  axe = await page.evaluate(() => axe.run("dialog.smk-dialog", { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] }));
  ok(axe.violations.length === 0, "axe: preferences have no WCAG A/AA violations " + JSON.stringify(axe.violations.map((v) => v.id)));
  ok(await page.evaluate(() => [...document.querySelectorAll("[data-samtykke-toggle]")].every((i) => !i.checked)), "no switch pre-ticked");
  await page.keyboard.press("Escape");
  ok(await page.evaluate(() => !document.querySelector("dialog.smk-dialog").open), "Esc closes preferences");
  ok(await page.isVisible(".smk-banner"), "banner stays until a choice is made");

  // Choose analytics only, by keyboard
  await page.click(".smk-banner >> text=Velg selv");
  await page.focus("#smk-c-analytics");
  await page.keyboard.press("Space");
  await page.click("dialog >> text=Lagre valgene");
  await page.waitForFunction(() => window.analyticsInit);
  ok(await page.evaluate(() => window.analyticsInit === "G-DEMO"), "external library loaded, then its inline init ran (order kept)");
  ok(await page.evaluate(() => !window.marketingRan), "marketing script still blocked");
  ok(await page.isHidden(".smk-banner"), "banner closed after choice");
  ok(await page.isVisible(".smk-floating"), "floating reopen button appears");
  const upd = await page.evaluate(() => Array.from(dataLayer).filter((e) => e[0] === "consent" && e[1] === "update").pop());
  ok(upd && upd[2].analytics_storage === "granted" && upd[2].ad_storage === "denied", "Consent Mode update: analytics granted, ads denied");
  ok(await page.evaluate(() => dataLayer.some((e) => e.event === "samtykke_update" && e.samtykke.analytics === true)), "GTM event samtykke_update pushed");
  ok(await page.isVisible("text=Statistikk er på"), "data-samtykke-if shown");
  await page.waitForTimeout(200);
  ok(logs.length === 1 && logs[0].action === "custom" && logs[0].categories.analytics === true && !("ip" in logs[0]), "consent record sent to endpoint (no IP, no user agent)");

  // Persist across reload
  await page.reload();
  await page.waitForFunction(() => window.analyticsInit);
  ok(await page.isHidden(".smk-banner"), "no banner on return visit");
  ok(await page.evaluate(() => window.analyticsLoaded === 1), "analytics runs again on reload, once");

  // Placeholder button grants marketing and loads the iframe
  await page.click(".smk-placeholder >> text=Tillat og vis");
  ok(await page.evaluate(() => document.querySelector("iframe").getAttribute("src") === "embed.html"), "iframe loads after 'Tillat og vis'");
  ok(await page.evaluate(() => window.marketingRan === true), "marketing script ran");

  // Withdraw analytics: cookies deleted, page reloads so the running script stops
  ok((await page.evaluate(() => document.cookie)).includes("_ga_ABC123"), "_ga cookies exist while analytics is on");
  await page.click(".smk-floating");
  await Promise.all([page.waitForNavigation(), page.click("dialog >> text=Avvis alle")]);
  const cookies = await page.evaluate(() => document.cookie);
  ok(!cookies.includes("_ga"), "withdrawal deleted _ga and _ga_* cookies");
  ok(await page.evaluate(() => !window.analyticsLoaded && !window.marketingRan), "after withdrawal + reload nothing runs");
  ok(await page.evaluate(() => Samtykke.get().decided && !Samtykke.has("analytics")), "API reports the rejection");

  // Version bump asks again
  await page.addInitScript(() => { window.SamtykkeConfig = { version: "2" }; });
  await page.goto(base + "/demo/index.html?v2");
  ok(await page.isVisible(".smk-banner"), "new policy version asks again");
  await ctx.close();

  // ---------- GPC ----------
  console.log("Global Privacy Control");
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.addInitScript(() => Object.defineProperty(navigator, "globalPrivacyControl", { get: () => true }));
  await page.goto(base + "/demo/index.html");
  await page.click(".smk-banner >> text=Godta alle");
  await page.waitForFunction(() => window.analyticsInit);
  ok(await page.evaluate(() => Samtykke.has("analytics") && !Samtykke.has("marketing")), "'Accept all' with GPC keeps marketing off");
  await ctx.close();

  // ---------- Custom UI built in the Designer ----------
  console.log("Custom UI (Webflow-style)");
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.goto(base + "/demo/custom.html");
  ok(await page.evaluate(() => !document.querySelector(".smk-banner")), "no default UI injected with data-ui=none");
  ok(await page.isVisible(".my-banner"), "custom banner shown");
  ok(await page.isHidden(".my-prefs"), "custom preferences hidden until opened");
  await page.click("text=Choose");
  ok(await page.isVisible(".my-prefs"), "custom preferences open");
  ok(await page.evaluate(() => document.querySelector(".my-prefs").getAttribute("aria-modal") === "true"), "custom preferences get dialog semantics");
  await page.click("text=Marketing");
  ok(await page.evaluate(() => document.querySelector('[data-samtykke-toggle="marketing"]').checked), "Webflow checkbox toggles");
  await page.keyboard.press("Enter"); // form submit must save, not post to Webflow
  await page.waitForTimeout(100);
  ok(await page.evaluate(() => window.marketingRan && !window.analyticsRan), "form submit saved: marketing on, analytics off");
  ok(await page.isHidden(".my-prefs") && await page.isHidden(".my-banner"), "custom UI closed");
  await page.evaluate(() => Samtykke.open());
  ok(await page.evaluate(() => document.querySelector('[data-samtykke-toggle="marketing"]').parentElement.querySelector(".w-checkbox-input").classList.contains("w--redirected-checked")), "Webflow custom checkbox visual synced on reopen");
  await ctx.close();

  // ---------- Screenshots for the README ----------
  ctx = await browser.newContext({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: 2 });
  page = await ctx.newPage();
  await page.goto(base + "/demo/index.html");
  await page.screenshot({ path: path.join(ROOT, "demo/shot-banner.png") });
  await page.click(".smk-banner >> text=Velg selv");
  await page.screenshot({ path: path.join(ROOT, "demo/shot-preferences.png") });
  await ctx.close();
  ctx = await browser.newContext({ ...require("playwright").devices["iPhone 13"] });
  page = await ctx.newPage();
  await page.goto(base + "/demo/index.html");
  await page.screenshot({ path: path.join(ROOT, "demo/shot-mobile.png") });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  ok(!overflow, "no horizontal scroll on phone");

  await browser.close();
  server.close();
  console.log(failed ? `\n${failed} failed` : "\nAll passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
