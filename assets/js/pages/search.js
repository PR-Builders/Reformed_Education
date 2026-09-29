RE.pages.search = function () {
  const { esc, tag } = RE.ui;
  const q = (RE.ui.param("q") || "").trim();
  const box = document.getElementById("q"), out = document.getElementById("results");
  box.value = q;
  if (!q) { out.innerHTML = `<p class="muted">Enter a search term above to search seminaries, colleges, schools, courses, resources and catechisms.</p>`; return; }
  RE.ui.run(out, async () => {
    const hits = await RE.search.query(q);
    if (!hits.length) { out.innerHTML = `<p>No results for “${esc(q)}”.</p>`; return; }
    out.innerHTML = `<p class="muted" aria-live="polite">${hits.length} result${hits.length === 1 ? "" : "s"} for “${esc(q)}”</p>
      <ul class="qlist">${hits.map((d) => `<li><a href="${esc(d.url)}" style="display:block;padding:16px 0">
        <div class="card-kicker">${esc(d.kind)}</div>
        <div class="q-text">${esc(d.title)}</div>
        ${d.placeholder ? tag("Placeholder", "tag-placeholder") : ""}</a></li>`).join("")}</ul>`;
  });
};
