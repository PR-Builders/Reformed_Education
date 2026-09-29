RE.pages.catechisms = function () {
  const { esc, param } = RE.ui;
  const root = document.getElementById("cat-root");
  RE.ui.run(root, async () => {
    const cat = await RE.data.catechism(param("id") || "wsc");
    const n = parseInt(param("q"), 10);
    const q = cat && cat.questions.find((x) => x.n === n);
    if (!q) { root.innerHTML = `<div class="notice error">Question not found. <a href="catechisms.html">All catechisms</a></div>`; return; }
    const u = (m) => `question.html?id=${encodeURIComponent(cat.id)}&q=${m}`;
    const known = new Set(RE.store.get(`known:${cat.id}`, []));
    document.title = `${cat.short} Q${q.n} — Reformed Education`;
    root.innerHTML = `${RE.ui.breadcrumb([{ label: "Home", href: "index.html" }, { label: "Catechisms", href: "catechisms.html" }, { label: cat.short, href: `catechism.html?id=${cat.id}` }, { label: `Question ${q.n}` }])}
      <p class="label">${esc(cat.name)} · Question ${q.n}</p>
      ${q.placeholder ? RE.ui.placeholderNotice("Question and answer text is placeholder content.") : ""}
      <h1 class="${RE.ui.isPH(q.question) ? "ph" : ""}">${esc(q.question)}</h1>
      <div class="prose"><p class="${RE.ui.isPH(q.answer) ? "ph" : ""}" style="font-size:1.2rem">${esc(q.answer)}</p></div>
      <p class="muted">${known.has(q.n) ? "You have marked this question as known." : ""}</p>
      <div class="tool-controls">
        ${cat.questions.some((x) => x.n === n - 1) ? `<a class="btn" href="${u(n - 1)}">← Question ${n - 1}</a>` : ""}
        ${cat.questions.some((x) => x.n === n + 1) ? `<a class="btn" href="${u(n + 1)}">Question ${n + 1} →</a>` : ""}
        <a class="btn btn-primary" href="catechism.html?id=${esc(cat.id)}&amp;mode=memorize">Practice memorization</a></div>
      <div style="margin-top:40px;max-width:640px">${RE.ui.citation(cat.source, { heading: "Edition & Source" })}</div>`;
  });
};
