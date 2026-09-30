/* Helper for tools/build_seo.py. Loads pages from a local server in headless Chromium, lets the site's own JavaScript render them,
   and saves the finished <body> HTML. Usage: node seo_render.js <base-url> <specs.json> <out.json>
   specs: [{url, out}] -> writes each body to its `out` file; also writes site facts (collections, topics) to <out.json>. */
const fs = require("fs");
const { execSync } = require("child_process");
const { chromium } = require(require("path").join(execSync("npm root -g").toString().trim(), "playwright"));

(async () => {
  const [base, specFile, factsFile] = process.argv.slice(2);
  const specs = JSON.parse(fs.readFileSync(specFile, "utf8"));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
  const facts = {};
  {
    const p = await browser.newPage();
    await p.goto(base + "topics.html"); await p.waitForFunction(() => window.RE && RE.data);
    facts.collections = await p.evaluate(() => JSON.parse(JSON.stringify(RE.config.collections, (k, v) => (typeof v === "function" ? undefined : v))));
    facts.topics = await p.evaluate(async () => { const { nodes } = await RE.data.topics(); return Object.values(nodes).filter((n) => n.all.length).map((n) => ({ path: n.path, name: n.name, blurb: n.blurb || "", parent: n.parent || null, count: n.all.length })); });
    await p.close();
  }
  fs.writeFileSync(factsFile, JSON.stringify(facts));
  const failures = [];
  let i = 0;
  async function worker() {
    const page = await browser.newPage();
    while (i < specs.length) {
      const s = specs[i++];
      try {
        await page.goto(base + s.url, { waitUntil: "load" });
        await page.waitForFunction(() => document.querySelector(".site-header") && document.querySelector("main") && !/^\s*Loading/.test(document.querySelector("main").innerText) && !document.querySelector("main .notice.error"), null, { timeout: 15000 });
        await page.waitForTimeout(60);
        const html = await page.evaluate(() => document.body.innerHTML);
        fs.writeFileSync(s.out, html);
      } catch (e) { failures.push(s.url + " — " + e.message.split("\n")[0]); }
    }
    await page.close();
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  await browser.close();
  if (failures.length) { console.error("RENDER FAILURES:\n" + failures.join("\n")); process.exit(2); }
})();
