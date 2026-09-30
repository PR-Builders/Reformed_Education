/* Generic list page for any directory collection: <body data-type="seminaries"> */
RE.pages._directory = function () {
  const { esc, directoryCard, isPH, $ } = RE.ui;
  const type = document.body.dataset.type;
  const cfg = RE.config.collections[type];
  const root = document.getElementById("dir-root");

  RE.ui.run(root, async () => {
    const entries = await RE.data.list(type);

    // Build facet dropdowns from real (non-placeholder) values only.
    // Options come from the controlled vocabulary (data/taxonomies.json) when one exists; only values
    // actually used by an entry are shown, so a filter never leads to an empty result.
    const facets = (await Promise.all(cfg.filters.map(async (key) => {
      const label = (cfg.fields.find((f) => f.key === key) || { label: key }).label;
      const used = [...new Set(entries.flatMap((e) => [].concat(e[key] == null ? [] : e[key])).filter((v) => typeof v === "string" && v && !isPH(v)))];
      const vocab = await RE.data.taxonomy(type, key);
      const values = vocab ? vocab.filter((v) => used.includes(v)) : used.sort();
      return { key, label, values };
    }))).filter((f) => f.values.length);

    const waiting = cfg.filters.filter((k) => !facets.some((f) => f.key === k)).map((k) => ({ key: k, label: (cfg.fields.find((f) => f.key === k) || { label: k }).label }));
    root.innerHTML = `
      <div class="page-head"><div class="container">
        ${RE.ui.breadcrumb([{ label: "Home", href: "index.html" }, { label: cfg.label }])}
        <p class="label">Directory</p><h1>${esc(cfg.label)}</h1>
        <p class="prose">${esc(cfg.intro)}</p></div></div>
      <div class="container page-body">
        ${cfg.groupBy ? `<div class="notice">${esc(RE.config.classificationNotice)}</div>` : ""}
        ${entries.some((e) => e.placeholder) ? RE.ui.placeholderNotice("Entries below are design samples only. Verified listings will be added.") : ""}
        <div class="toolbar">
          <div class="field"><label for="filter-q">Filter ${esc(cfg.label.toLowerCase())}</label>
            <input class="input" id="filter-q" type="search" placeholder="Type to filter…"></div>
          ${facets.map((f) => `<div class="field"><label for="f-${f.key}">${esc(f.label)}</label>
            <select class="input" id="f-${f.key}" data-facet="${f.key}"><option value="">All</option>${f.values.map((v) => `<option>${esc(v)}</option>`).join("")}</select></div>`).join("")}
          <div class="count" id="count" aria-live="polite"></div>
          ${waiting.length ? `<p class="muted" style="flex:1 1 100%;margin:0;font-size:.85rem">Filters by ${waiting.map((f) => esc(f.label.toLowerCase())).join(", ")} will appear as entries are tagged.</p>` : ""}
        </div>
        <div class="grid grid-cards" id="cards"></div>
      </div>`;

    const vocab = cfg.groupBy ? (await RE.data.taxonomy(type, cfg.groupBy)) || [] : [];
    const cardsFor = (list) => list.map((e) => directoryCard(type, e)).join("");
    const grouped = (list) => {
      const by = new Map(vocab.map((v) => [v, []]));
      list.forEach((e) => { const k = by.has(e[cfg.groupBy]) ? e[cfg.groupBy] : "Not yet classified"; if (!by.has(k)) by.set(k, []); by.get(k).push(e); });
      return [...by].filter(([, l]) => l.length).map(([k, l]) => `<section class="group"><h2>${esc(k)} <span class="muted" style="font-size:1rem;font-family:var(--font-body);font-weight:400">(${l.length})</span></h2>
        ${(RE.config.postureNotes || {})[k] ? `<p class="muted group-note">${esc(RE.config.postureNotes[k])}</p>` : ""}
        <div class="grid grid-cards">${cardsFor(l)}</div></section>`).join("");
    };
    const draw = () => {
      const q = $("#filter-q").value.trim();
      const chosen = facets.map((f) => [f.key, $(`#f-${f.key}`).value]).filter((p) => p[1]);
      const shown = entries.filter((e) => (!q || RE.search.matches(e, q)) && chosen.every(([k, v]) => [].concat(e[k]).includes(v)));
      $("#cards").className = cfg.groupBy ? "" : "grid grid-cards";
      $("#cards").innerHTML = !shown.length ? `<p class="muted">No entries match.</p>` : cfg.groupBy ? grouped(shown) : cardsFor(shown);
      $("#count").textContent = `${shown.length} of ${entries.length} entries`;
    };
    root.addEventListener("input", draw);
    draw();
  });
};

Object.keys(RE.config.collections).filter((k) => !RE.config.collections[k].detailPage).forEach((k) => (RE.pages[k] = RE.pages._directory));
