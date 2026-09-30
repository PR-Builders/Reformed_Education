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
      const meta = cfg.cardMeta.map((k) => [].concat(e[k])).flat().filter((v) => v && !isPH(v)).join(" · ");
      const tags = (e.tags || []).filter((t) => t !== "placeholder");
      return `<article class="card">
        <div class="card-kicker">${esc(cfg.singular)}</div>
        <h3 class="card-title"><a href="${esc(RE.config.urlFor(type, e))}">${esc(e.name)}</a></h3>
        ${meta ? `<div class="card-meta">${esc(meta)}</div>` : ""}
        <p class="card-body">${ui.value(e.description)}</p>
        ${ui.citeLine(e.source)}
        <div class="card-tags">${e.doctrinal_posture && !isPH(e.doctrinal_posture) ? ui.tag(e.doctrinal_posture, /Mainline/.test(e.doctrinal_posture) ? "tag-caution" : "tag-posture") : ""}${e.placeholder ? ui.tag("Placeholder entry", "tag-placeholder") : e.verification === "listed" ? ui.tag("Details pending", "tag-placeholder") : ""}${tags.map((t) => ui.tag(t)).join("")}</div>
      </article>`;
    },

    /* One compact line for a directory entry (list view): name, who/where, one-line summary, tags. */
    directoryRow(type, e) {
      const cfg = RE.config.collections[type];
      const meta = cfg.cardMeta.map((k) => [].concat(e[k])).flat().filter((v) => v && !isPH(v)).join(" · ");
      const subj = (Array.isArray(e.subject) ? e.subject : []).filter((v) => v && !isPH(v)).slice(0, 3);
      const pending = e.placeholder || e.verification === "listed";
      return `<a class="lrow" href="${esc(RE.config.urlFor(type, e))}">
        <span class="lrow-main"><span class="lrow-title">${esc(e.name)}</span>${meta ? `<span class="lrow-meta">${esc(meta)}</span>` : ""}
          ${isPH(e.description) ? "" : `<span class="lrow-desc">${esc(e.description)}</span>`}</span>
        <span class="lrow-tags">${subj.map((t) => ui.tag(t)).join("")}${pending ? ui.tag("Details pending", "tag-placeholder") : ""}</span></a>`;
    },

    /* Detail body for a directory entry: a definition list driven by the collection's field config. */
    detailFacts(type, e, skip) {
      const cfg = RE.config.collections[type];
      return `<dl class="facts">${cfg.fields.filter((f) => f.type !== "text" && !(skip || []).includes(f.key) && !(f.optional && (e[f.key] == null || e[f.key] === "" || (Array.isArray(e[f.key]) && !e[f.key].length)))).map((f) =>
        `<div class="row"><dt>${esc(f.label)}</dt><dd>${ui.value(e[f.key], f.type)}</dd></div>`).join("")}</dl>`;
    },

    /* ── Citation components ────────────────────────────────────────────────
       citation()     full "Source & Attribution" block (detail pages)
       citeLine()     one-line source credit (cards, lists)
       citationText() formatted reference string: Author. Title. Organization, Date. URL
       quote()        brief attributed quotation (length-capped) */
    realSource(s) { return s && ["title", "author", "organization", "url"].some((k) => s[k] && !isPH(s[k])); },

    citationText(s) {
      const ok = (v) => v && !isPH(v);
      const parts = [];
      if (ok(s.author)) parts.push(s.author.replace(/\.?$/, ".") );
      if (ok(s.title)) parts.push(s.title.replace(/\.?$/, ".") + (ok(s.edition) ? ` ${s.edition}.` : ""));
      const pub = [ok(s.organization) && s.organization, ok(s.date) && s.date].filter(Boolean).join(", ");
      if (pub) parts.push(pub + ".");
      if (ok(s.url)) parts.push(s.url);
      return parts.join(" ");
    },

    citeLine(s) {
      if (!ui.realSource(s)) return `<p class="cite-line ph">Source information to be added</p>`;
      const who = [s.organization, s.author].filter((v) => v && !isPH(v)).map(esc).join(" · ");
      const link = isURL(s.url) ? ` <a href="${esc(s.url)}" rel="noopener" target="_blank">Original source ↗</a>` : "";
      return `<p class="cite-line">Source: ${who || esc(s.title)}${link}</p>`;
    },

    citation(s, opts) {
      s = s || {};
      opts = opts || {};
      const D = RE.config.citationDefaults;
      const status = RE.config.copyrightStatuses[s.copyright_status];
      const rows = [
        ["Source", s.title], ["Author", s.author], ["Organization", s.organization],
        ["Edition", s.edition], ["Translation", s.translation], ["Published", s.date],
        ["Original URL", s.url, "url"],
        ["Copyright", s.copyright != null ? s.copyright : D.copyright],
        ["License", s.license],
        ["Attribution", s.notes != null ? s.notes : D.notes],
      ].filter((r) => r[1] !== undefined);
      const text = ui.citationText(s);
      return `<section class="citation" aria-label="Source and attribution">
        <h4 class="citation-title">${esc(opts.heading || "Source & Attribution")}${status ? ` ${ui.tag(status, s.copyright_status === "public-domain" ? "" : "tag-planned")}` : ""}</h4>
        <dl class="citation-list">${rows.map(([l, v, t]) => `<div><dt>${esc(l)}</dt><dd>${ui.value(v, t)}</dd></div>`).join("")}</dl>
        ${isURL(s.url) ? `<p class="citation-cta"><a class="btn btn-primary" href="${esc(s.url)}" rel="noopener" target="_blank">Visit the original source ↗</a></p>
          <p class="citation-encourage">Please visit the original source for the full work.</p>` : ""}
        ${text ? `<p class="citation-text"><span>Cite as</span> ${esc(text)}</p>` : ""}
      </section>`;
    },

    /* Brief attributed quotation. Anything over MAX_QUOTE characters is cut short and pointed to the source. */
    quote(q) {
      const MAX_QUOTE = 300;
      let text = String(q.text || "");
      if (text.length > MAX_QUOTE) { console.warn("Quotation exceeds " + MAX_QUOTE + " characters; truncated."); text = text.slice(0, MAX_QUOTE).replace(/\s+\S*$/, "") + "…"; }
      const s = q.source || {};
      const by = [s.author, s.title].filter((v) => v && !isPH(v)).map(esc).join(", ");
      return `<blockquote class="quote"><p>${esc(text)}</p><footer>${by ? "— " + by : ""}${isURL(s.url) ? ` <a href="${esc(s.url)}" rel="noopener" target="_blank">Source ↗</a>` : ""}</footer></blockquote>`;
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

    /* Callout for researched entries: theological posture, doctrinal basis and points to weigh. */
    postureBox(e, type) {
      const hasPts = (e.points_to_weigh || []).some((x) => !isPH(x));
      if ((!e.doctrinal_posture || isPH(e.doctrinal_posture)) && !hasPts && !e.doctrinal_basis) return "";
      const caution = /Mainline/.test(e.doctrinal_posture || "");
      return `<section class="posture-box${caution ? " caution" : ""}" aria-label="Theological posture">
        ${e.doctrinal_posture && !isPH(e.doctrinal_posture) ? `<p class="label">Theological posture</p><h3>${esc(e.doctrinal_posture)}</h3>
          <p class="muted" style="font-size:.88rem">${esc((((RE.config.collections[type] || {}).postureNotes) || (["seminaries", "colleges", "schools"].includes(type) ? RE.config.postureNotes : RE.config.genericPostureNotes) || {})[e.doctrinal_posture] || "")}</p>` : ""}
        ${e.doctrinal_basis && !isPH(e.doctrinal_basis) ? `<p><strong>Doctrinal basis.</strong> ${esc(e.doctrinal_basis)}</p>` : ""}
        ${hasPts ? `<p style="margin-bottom:4px"><strong>Points to weigh</strong></p><ul>${e.points_to_weigh.filter((x) => !isPH(x)).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
        <p class="muted" style="font-size:.78rem;margin:0">Classification and points to weigh are reformededucation.org's judgments from the sources listed below. They describe and do not endorse; confirm current details with the institution.</p>
      </section>`;
    },

    /* Notice for name-only entries awaiting research. */
    listedNotice(e) {
      return `<div class="notice"><strong>Details pending.</strong> This entry lists the name only. Its details have not yet been researched or verified; please consult the original source.${e.listing_note ? `<br><span class="muted">Note: ${esc(e.listing_note)}</span>` : ""}</div>`;
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

    param: (name) => (window.RE_PARAMS && name in window.RE_PARAMS ? window.RE_PARAMS[name] : new URLSearchParams(location.search).get(name)),
    $: (sel, root) => (root || document).querySelector(sel),
    $$: (sel, root) => Array.from((root || document).querySelectorAll(sel)),
    shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  };
  RE.ui = ui;
})();
