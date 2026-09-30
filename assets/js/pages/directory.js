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
          <div class="field" style="flex:0 0 auto"><label>View</label>
            <div class="viewtoggle" role="group" aria-label="View"><button type="button" data-view="list">List</button><button type="button" data-view="cards">Cards</button></div></div>
          <div class="field"><label for="filter-q">Filter ${esc(cfg.label.toLowerCase())}</label>
            <input class="input" id="filter-q" type="search" placeholder="Type to filter…"></div>
          ${facets.map((f) => `<div class="field"><label for="f-${f.key}">${esc(f.label)}</label>
            <select class="input" id="f-${f.key}" data-facet="${f.key}"><option value="">All</option>${f.values.map((v) => `<option>${esc(v)}</option>`).join("")}</select></div>`).join("")}
          <div class="count" id="count" aria-live="polite"></div>
          ${waiting.length ? `<p class="muted" style="flex:1 1 100%;margin:0;font-size:.85rem">Filters by ${waiting.map((f) => esc(f.label.toLowerCase())).join(", ")} will appear as entries are tagged.</p>` : ""}
        </div>
        <div id="cards"></div>
      </div>`;

    const vocab = cfg.groupBy ? (await RE.data.taxonomy(type, cfg.groupBy)) || [] : [];
    const PAGE = 40;
    let shownCount = PAGE;
    let view = RE.store.get("dirview:" + type, cfg.defaultView || (entries.length > 12 ? "list" : "cards"));
    const inView = (list) => (view === "list" ? `<div class="lrows">${list.map((e) => RE.ui.directoryRow(type, e)).join("")}</div>` : `<div class="grid grid-cards">${list.map((e) => directoryCard(type, e)).join("")}</div>`);
    const headed = (title, note, list) => `<section class="group"><h2>${esc(title)} <span class="muted" style="font-size:1rem;font-family:var(--font-body);font-weight:400">(${list.length})</span></h2>${note ? `<p class="muted group-note">${esc(note)}</p>` : ""}${inView(list)}</section>`;
    const grouped = (list) => {
      const by = new Map(vocab.map((v) => [v, []]));
      list.forEach((e) => { const k = by.has(e[cfg.groupBy]) ? e[cfg.groupBy] : "Not yet classified"; if (!by.has(k)) by.set(k, []); by.get(k).push(e); });
      return [...by].filter(([, l]) => l.length).map(([k, l]) => headed(k, (RE.config.postureNotes || {})[k], l)).join("");
    };
    /* collapseBy: entries from the same producer (e.g. all of Ligonier's podcasts) fold into one expandable group. */
    const collapsed = (list, open) => {
      const by = new Map();
      list.forEach((e) => { const k = e[cfg.collapseBy]; const key = k && !isPH(k) ? k : ""; if (!by.has(key)) by.set(key, []); by.get(key).push(e); });
      const big = [...by].filter(([k, l]) => k && l.length >= 3).sort((a, b) => a[0].localeCompare(b[0]));
      const rest = list.filter((e) => !big.some(([k]) => k === e[cfg.collapseBy]));
      return big.map(([k, l]) => {
        const topics = [...new Set(l.flatMap((e) => (Array.isArray(e.subject) ? e.subject : [])).filter((v) => v && !isPH(v)))].slice(0, 4).join(" · ");
        return `<details class="dgroup"${open ? " open" : ""}><summary><span class="dgroup-title">${esc(k)}</span><span class="dgroup-sub">${l.length} ${esc(cfg.label.toLowerCase())}${topics ? " · " + esc(topics) : ""}</span></summary>${inView(l)}</details>`;
      }).join("") + (rest.length ? (big.length ? `<h2 style="margin-top:32px">Other ${esc(cfg.label.toLowerCase())}</h2>` : "") + inView(rest.slice(0, shownCount)) + (rest.length > shownCount ? `<p class="showmore"><button class="btn" id="more" type="button">Show more (${rest.length - shownCount} left)</button></p>` : "") : "");
    };
    const draw = () => {
      const q = $("#filter-q").value.trim();
      const chosen = facets.map((f) => [f.key, $(`#f-${f.key}`).value]).filter((p) => p[1]);
      const shown = entries.filter((e) => (!q || RE.search.matches(e, q)) && chosen.every(([k, v]) => [].concat(e[k]).includes(v)));
      root.querySelectorAll(".viewtoggle button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
      $("#cards").className = "";
      $("#cards").innerHTML = !shown.length ? `<p class="muted">No entries match.</p>`
        : cfg.groupBy ? grouped(shown)
        : cfg.collapseBy ? collapsed(shown, !!(q || chosen.length))
        : inView(shown.slice(0, shownCount)) + (shown.length > shownCount ? `<p class="showmore"><button class="btn" id="more" type="button">Show more (${shown.length - shownCount} left)</button></p>` : "");
      $("#count").textContent = `${shown.length} of ${entries.length} entries`;
    };
    root.addEventListener("input", () => { shownCount = PAGE; draw(); });
    root.addEventListener("click", (ev) => {
      const b = ev.target.closest(".viewtoggle button"); if (b) { view = b.dataset.view; RE.store.set("dirview:" + type, view); draw(); }
      if (ev.target.id === "more") { shownCount += PAGE; draw(); }
    });
    draw();
  });
};

Object.keys(RE.config.collections).filter((k) => !RE.config.collections[k].detailPage).forEach((k) => (RE.pages[k] = RE.pages._directory));
