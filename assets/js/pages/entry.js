/* Generic directory detail page: entry.html?type=seminaries&id=... */
RE.pages.entry = function () {
  const { esc, param } = RE.ui;
  const root = document.getElementById("entry-root");
  RE.ui.run(root, async () => {
    const type = param("type"), id = param("id");
    const cfg = RE.config.collections[type];
    const e = cfg && (await RE.data.get(type, id));
    if (!e) { root.innerHTML = `<div class="container page-body"><div class="notice error">Entry not found. <a href="index.html">Return home</a>.</div></div>`; return; }
    document.title = `${e.name} — Reformed Education`;
    const desc = cfg.fields.find((f) => f.key === "description");
    root.innerHTML = `
      <div class="page-head"><div class="container">
        ${RE.ui.breadcrumb([{ label: "Home", href: "index.html" }, { label: cfg.label, href: cfg.page }, { label: e.name }])}
        <p class="label">${esc(cfg.singular)}</p><h1>${esc(e.name)}</h1></div></div>
      <div class="container page-body"><div class="detail-grid">
        <div>${e.placeholder ? RE.ui.placeholderNotice() : ""}
          ${desc ? `<h2>About</h2><p class="prose">${RE.ui.value(e.description)}</p>` : ""}
          <h2>Details</h2>${RE.ui.detailFacts(type, e)}
          ${(e.quotes || []).map(RE.ui.quote).join("")}</div>
        <aside>${RE.ui.citation(e.source)}<div class="aside-box" style="margin-top:20px"><h4>Tags</h4><div class="card-tags">${(e.tags || []).map((t) => RE.ui.tag(t, t === "placeholder" ? "tag-placeholder" : "")).join("") || "—"}</div>
          <hr class="rule"><a href="${esc(cfg.page)}">← Back to ${esc(cfg.label)}</a></div></aside>
      </div></div>`;
  });
};
