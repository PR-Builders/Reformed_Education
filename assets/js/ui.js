/* Reusable UI components. Each returns an HTML string; all data is escaped. */
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const isPH = (v) => typeof v === "string" && /^\[Placeholder/i.test(v);
  const isURL = (v) => typeof v === "string" && /^https?:\/\//i.test(v);

  const ui = {
    esc, isPH, isURL,

    seal(cls) {
      return `<svg class="${cls || ""}" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="60" cy="60" r="56" stroke-width="2.2"/><circle cx="60" cy="60" r="51.5" stroke-width="1"/><path d="M60 22v24M52.5 30h15" stroke-width="2.6"/><path d="M60 58c-9-6-20-7.5-31-5.5v29c11-2 22-.5 31 5.5z" stroke-width="2.4"/><path d="M60 58c9-6 20-7.5 31-5.5v29c-11-2-22-.5-31 5.5z" stroke-width="2.4"/><path d="M60 58v29" stroke-width="1.5"/></svg>`;
    },

    tag(text, cls) { return `<span class="tag ${cls || ""}">${esc(text)}</span>`; },

    /* Render one field value: placeholder-aware, list-aware, link-aware. */
    value(v, type) {
      if (v == null || v === "") return `<span class="ph">${esc(RE.config.PLACEHOLDER)}</span>`;
      if (Array.isArray(v)) {
        if (v.length === 1 && isPH(v[0])) return ui.value(v[0]);
        return `<ul>${v.map((x) => `<li>${ui.value(x)}</li>`).join("")}</ul>`;
      }
      if (isPH(v)) return `<span class="ph">${esc(v)}</span>`;
      if (type === "url" || isURL(v)) {
        return isURL(v) ? `<a href="${esc(v)}" rel="noopener" target="_blank">${esc(v.replace(/^https?:\/\/(www\.)?/, ""))}</a>` : esc(v);
      }
      return esc(v);
    },

    /* Directory card — used on list pages, home page, and search results. */
    directoryCard(type, e) {
      const cfg = RE.config.collections[type];
      const meta = cfg.cardMeta.map((k) => e[k]).filter((v) => v && !isPH(v)).join(" · ");
      const tags = (e.tags || []).filter((t) => t !== "placeholder");
      return `<article class="card">
        <div class="card-kicker">${esc(cfg.singular)}</div>
        <h3 class="card-title"><a href="${esc(RE.config.urlFor(type, e))}">${esc(e.name)}</a></h3>
        ${meta ? `<div class="card-meta">${esc(meta)}</div>` : ""}
        <p class="card-body">${ui.value(e.description)}</p>
        <div class="card-tags">${e.placeholder ? ui.tag("Placeholder entry", "tag-placeholder") : ""}${tags.map((t) => ui.tag(t)).join("")}</div>
      </article>`;
    },

    /* Detail body for a directory entry: a definition list driven by the collection's field config. */
    detailFacts(type, e) {
      const cfg = RE.config.collections[type];
      return `<dl class="facts">${cfg.fields.filter((f) => f.type !== "text").map((f) =>
        `<div class="row"><dt>${esc(f.label)}</dt><dd>${ui.value(e[f.key], f.type)}</dd></div>`).join("")}</dl>`;
    },

    categoryCard(c) {
      return `<a class="card category-card" href="${esc(c.href)}">
        <span class="numeral">${esc(c.numeral)}.</span>
        <h3 class="card-title">${esc(c.label)}</h3>
        <p class="card-body">${esc(c.blurb)}</p>
        <span class="go">Browse →</span></a>`;
    },

    breadcrumb(items) {
      return `<nav class="breadcrumb" aria-label="Breadcrumb">${items.map((i) => i.href ? `<a href="${esc(i.href)}">${esc(i.label)}</a>` : esc(i.label)).join(" &nbsp;/&nbsp; ")}</nav>`;
    },

    placeholderNotice(what) {
      return `<div class="notice"><strong>Placeholder content.</strong> ${esc(what || "This entry is a design sample only. It is not a real record; verified information will replace it.")}</div>`;
    },

    error(err) {
      const local = err && err.fileProtocol;
      return `<div class="notice error"><strong>${local ? "Open this site through a local web server." : "Something went wrong."}</strong>
        ${local ? `Browsers block a page opened directly from disk (<code>file://</code>) from reading the JSON data files. From the project folder run <code>python3 -m http.server</code> and visit <code>http://localhost:8000</code>. Deployed on GitHub Pages this works automatically.`
                : esc(err && err.message || "Unknown error")}</div>`;
    },

    /* Run an async page renderer into a container, showing a friendly error on failure. */
    async run(container, fn) {
      try { await fn(); }
      catch (err) { console.error(err); container.innerHTML = ui.error(err); }
    },

    pathways(list) {
      return list.map((p) => `<div class="pathway"><h3>${esc(p.q)}</h3>
        <div class="links">${p.links.map(([l, h]) => `<a href="${esc(h)}">${esc(l)} →</a>`).join("")}</div></div>`).join("");
    },

    param: (name) => new URLSearchParams(location.search).get(name),
    $: (sel, root) => (root || document).querySelector(sel),
    $$: (sel, root) => Array.from((root || document).querySelectorAll(sel)),
    shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  };
  RE.ui = ui;
})();
