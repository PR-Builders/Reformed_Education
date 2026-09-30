/* Article reader — article.html?id=presbyterian-church-of-courts. Articles live in data/articles.json. */
RE.pages.article = function () {
  const { esc, param } = RE.ui;
  const root = document.getElementById("cat-root");
  RE.ui.run(root, async () => {
    const a = await RE.data.get("articles", param("id"));
    if (!a) { root.innerHTML = `<div class="notice error">Article not found. <a href="articles.html">All articles</a></div>`; return; }
    document.title = `${a.name} — Reformed Education`;
    const all = await RE.data.list("articles");
    const rel = (a.related || []).map((id) => all.find((x) => x.id === id)).filter(Boolean);
    const sec = (s) => `<section class="art-sec">${s.heading ? `<h2>${esc(s.heading)}</h2>` : ""}
      ${(s.paragraphs || []).map((p) => `<p class="prose">${esc(p)}</p>`).join("")}
      ${s.points ? `<ul class="art-points">${s.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
      ${s.table ? `<div class="art-table"><table><thead><tr>${s.table.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${s.table.rows.map((r) => `<tr>${r.map((c, i) => (i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`)).join("")}</tr>`).join("")}</tbody></table></div>` : ""}</section>`;
    root.innerHTML = `${RE.ui.breadcrumb([{ label: "Home", href: "index.html" }, { label: "Articles", href: "articles.html" }, { label: a.name }])}
      <p class="label">Article</p><h1>${esc(a.name)}</h1>
      <p class="lead prose">${esc(a.description)}</p>
      <p class="muted">By ${esc(a.author)} · ${esc(a.date)}</p>
      ${a.sections.map(sec).join("")}
      ${rel.length ? `<section class="art-sec"><h2>Related articles</h2><ul>${rel.map((r) => `<li><a href="${esc(RE.config.urlFor("articles", r))}">${esc(r.name)}</a></li>`).join("")}</ul></section>` : ""}
      <section class="art-sec"><h2>Sources</h2><ul>${(a.research_sources || []).map((u) => `<li><a href="${esc(u)}" rel="noopener">${esc(u.replace(/^https?:\/\//, ""))}</a></li>`).join("")}</ul>
        <p class="muted" style="font-size:.85rem">${esc(a.source.notes)}</p></section>`;
  });
};
