/* Confession reader — confession.html?id=wcf            (table of contents)
                        confession.html?id=wcf&ch=3      (one chapter)
                        confession.html?id=wcf&ch=3&sec=2 (highlights one section) */
RE.pages.confession = function () {
  const { esc, param } = RE.ui;
  const root = document.getElementById("cat-root");
  RE.ui.run(root, async () => {
    const doc = await RE.data.catechism(param("id") || "wcf");
    const chs = (doc && doc.chapters) || [];
    if (!doc || !chs.length) { root.innerHTML = `<div class="notice error">Document not found. <a href="catechisms.html">All catechisms and confessions</a></div>`; return; }
    const cn = parseInt(param("ch"), 10), hl = parseInt(param("sec"), 10);
    const ch = chs.find((c) => c.n === cn);
    const url = (n) => `confession.html?id=${encodeURIComponent(doc.id)}&ch=${n}`;
    const crumbs = [{ label: "Home", href: "index.html" }, { label: "Catechisms", href: "catechisms.html" }];
    const cite = `<div style="margin-top:48px;max-width:640px">${RE.ui.citation(doc.source, { heading: "Edition & Source" })}</div>`;
    const note = doc.coverage_note ? `<div class="notice"><strong>Note.</strong> ${esc(doc.coverage_note)}</div>` : "";
    if (!ch) {
      document.title = `${doc.name} — Reformed Education`;
      root.innerHTML = `${RE.ui.breadcrumb(crumbs.concat([{ label: doc.short }]))}
        <p class="label">${esc(doc.kind)} · ${esc(doc.group || "")}</p><h1>${esc(doc.name)}</h1>${note}
        <ol class="toc">${chs.map((c) => `<li><a href="${url(c.n)}"><strong>${esc(c.numeral)}.</strong> ${esc(c.title)}</a></li>`).join("")}</ol>${cite}`;
      return;
    }
    document.title = `${doc.short} ${ch.numeral} — Reformed Education`;
    const body = (sec) => esc(sec.text).replace(/\{([a-z]{1,2})\}/g, (m, k) => `<sup class="fn"><a href="#p${sec.n}${k}">${k}</a></sup>`);
    root.innerHTML = `${RE.ui.breadcrumb(crumbs.concat([{ label: doc.short, href: `confession.html?id=${doc.id}` }, { label: `Chapter ${ch.numeral}` }]))}
      <p class="label">${esc(doc.name)} · Chapter ${esc(ch.numeral)}</p><h1>${esc(ch.title)}</h1>${note}
      ${ch.sections.map((s) => `<section class="sec${s.n === hl ? " is-target" : ""}" id="s${s.n}">
        <p class="prose" style="font-size:1.12rem"><span class="sec-num">${esc(ch.numeral)}.${s.n}</span>${body(s)}</p>
        ${s.proofs.length ? `<ul class="proofs">${s.proofs.map((p) => `<li id="p${s.n}${esc(p.key)}"><strong>${esc(p.key)}.</strong> ${esc(p.ref)}</li>`).join("")}</ul>` : ""}</section>`).join("")}
      <div class="tool-controls">
        ${chs.some((c) => c.n === ch.n - 1) ? `<a class="btn" href="${url(ch.n - 1)}">← Chapter ${esc(chs[ch.n - 2].numeral)}</a>` : ""}
        <a class="btn" href="confession.html?id=${esc(doc.id)}">All chapters</a>
        ${chs.some((c) => c.n === ch.n + 1) ? `<a class="btn btn-primary" href="${url(ch.n + 1)}">Chapter ${esc(chs[ch.n].numeral)} →</a>` : ""}</div>${cite}`;
    if (hl) { const el = document.getElementById("s" + hl); if (el) el.scrollIntoView(); }
  });
};
