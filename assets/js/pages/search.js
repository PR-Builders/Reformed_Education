RE.pages.search = function () {
  const { esc, $ } = RE.ui;
  const q = (RE.ui.param("q") || "").trim();
  const box = $("#q"), out = $("#results");
  box.value = q;
  if (!q) { out.innerHTML = `<p class="muted">Search every seminary, college, school, course, author, resource and catechism, including the full text of the catechisms, their answers, Scripture proofs and prefaces. Try <a href="search.html?q=baptism">baptism</a> or <a href="search.html?q=%22effectual+calling%22">“effectual calling”</a>. Use quotation marks for an exact phrase.</p>`; return; }
  out.innerHTML = `<p class="muted" aria-live="polite">Searching…</p>`;
  const PAGE = 30;
  RE.ui.run(out, async () => {
    const { hits, total, terms } = await RE.search.query(q);
    if (!hits.length) { out.innerHTML = `<p>No results for “${esc(q)}”.</p><p class="muted">Check the spelling, or try a shorter or different word. Word endings are matched automatically (baptism, baptized, baptizing).</p>`; return; }
    const groups = new Map();
    hits.forEach((h) => groups.set(h.doc.group, (groups.get(h.doc.group) || 0) + 1));
    let filter = "", shown = 0;
    const list = () => hits.filter((h) => !filter || h.doc.group === filter);
    const draw = () => {
      const items = list();
      out.innerHTML = `<p class="muted" aria-live="polite">${hits.length.toLocaleString()} result${hits.length === 1 ? "" : "s"} for “${esc(q)}” · ${total.toLocaleString()} mention${total === 1 ? "" : "s"}${filter ? ` · showing ${items.length.toLocaleString()} in ${esc(filter)}` : ""}</p>
        <div class="chips" role="group" aria-label="Filter results by source">
          <button class="chip" data-g="" aria-pressed="${!filter}">All (${hits.length.toLocaleString()})</button>
          ${[...groups].sort((a, b) => b[1] - a[1]).map(([g, n]) => `<button class="chip" data-g="${esc(g)}" aria-pressed="${filter === g}">${esc(g)} (${n.toLocaleString()})</button>`).join("")}
        </div>
        <ul class="results" id="rl"></ul><div id="more"></div>`;
      $$("[data-g]").forEach((b) => (b.onclick = () => { filter = b.dataset.g; shown = 0; draw(); }));
      more();
    };
    const $$ = (s) => RE.ui.$$(s, out);
    const more = () => {
      const items = list(), chunk = items.slice(shown, shown + PAGE); shown += chunk.length;
      $("#rl").insertAdjacentHTML("beforeend", chunk.map((h) => {
        const d = h.doc, sn = RE.search.snippets(h, terms, 3);
        return `<li class="result"><div class="card-kicker">${esc(d.kind)} · ${esc(d.group)}</div>
          <a class="result-title" href="${esc(d.url)}">${esc(d.title)}</a>${d.placeholder ? ` ${RE.ui.tag("Placeholder", "tag-placeholder")}` : ""}
          ${sn.map((s) => `<p class="snippet"><span class="snip-label">${esc(s.label)}</span> ${s.html}</p>`).join("")}</li>`;
      }).join(""));
      $("#more").innerHTML = shown < items.length ? `<button class="btn" id="showmore">Show more (${(items.length - shown).toLocaleString()} left)</button>` : "";
      if ($("#showmore")) $("#showmore").onclick = more;
    };
    draw();
  });
};
