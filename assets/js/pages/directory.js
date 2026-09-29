/* Generic list page for any directory collection: <body data-type="seminaries"> */
RE.pages.seminaries = RE.pages.colleges = RE.pages.schools = RE.pages.courses = RE.pages.resources = function () {
  const { esc, directoryCard, isPH, $ } = RE.ui;
  const type = document.body.dataset.type;
  const cfg = RE.config.collections[type];
  const root = document.getElementById("dir-root");

  RE.ui.run(root, async () => {
    const entries = await RE.data.list(type);

    // Build facet dropdowns from real (non-placeholder) values only.
    const facets = cfg.filters.map((key) => {
      const label = (cfg.fields.find((f) => f.key === key) || { label: key }).label;
      const values = [...new Set(entries.map((e) => e[key]).filter((v) => typeof v === "string" && v && !isPH(v)))].sort();
      return { key, label, values };
    }).filter((f) => f.values.length);

    root.innerHTML = `
      <div class="page-head"><div class="container">
        ${RE.ui.breadcrumb([{ label: "Home", href: "index.html" }, { label: cfg.label }])}
        <p class="label">Directory</p><h1>${esc(cfg.label)}</h1>
        <p class="prose">${esc(cfg.intro)}</p></div></div>
      <div class="container page-body">
        ${entries.some((e) => e.placeholder) ? RE.ui.placeholderNotice("Entries below are design samples only. Verified listings will be added.") : ""}
        <div class="toolbar">
          <div class="field"><label for="filter-q">Filter ${esc(cfg.label.toLowerCase())}</label>
            <input class="input" id="filter-q" type="search" placeholder="Type to filter…"></div>
          ${facets.map((f) => `<div class="field"><label for="f-${f.key}">${esc(f.label)}</label>
            <select class="input" id="f-${f.key}" data-facet="${f.key}"><option value="">All</option>${f.values.map((v) => `<option>${esc(v)}</option>`).join("")}</select></div>`).join("")}
          <div class="count" id="count" aria-live="polite"></div>
        </div>
        <div class="grid grid-cards" id="cards"></div>
      </div>`;

    const draw = () => {
      const q = $("#filter-q").value.trim();
      const chosen = facets.map((f) => [f.key, $(`#f-${f.key}`).value]).filter((p) => p[1]);
      const shown = entries.filter((e) => (!q || RE.search.matches(e, q)) && chosen.every(([k, v]) => e[k] === v));
      $("#cards").innerHTML = shown.length ? shown.map((e) => directoryCard(type, e)).join("") : `<p class="muted">No entries match.</p>`;
      $("#count").textContent = `${shown.length} of ${entries.length} entries`;
    };
    root.addEventListener("input", draw);
    draw();
  });
};
