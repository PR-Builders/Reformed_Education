/* Topics — topics.html (all topics)  ·  topics.html?t=biblical-counseling/ocd-and-scrupulosity (one topic)
   Topics are defined in data/topics.json; entries join a topic by `topic_ids` or by subject labels.
   Topics with no entries are hidden. A parent topic lists everything in its subtopics too. */
RE.pages.topics = function () {
  const { esc, param } = RE.ui;
  const root = document.getElementById("topics-root");
  RE.ui.run(root, async () => {
    const { top, nodes } = await RE.data.topics();
    const has = (n) => n.all.length > 0;
    const href = (n) => `topics.html?t=${encodeURIComponent(n.path).replace(/%2F/g, "/")}`;
    const node = nodes[param("t")];
    const crumbs = (n) => { const out = []; for (let x = n; x; x = x.parent && nodes[x.parent]) out.unshift(x); return out; };
    const card = (n) => `<article class="card"><h3 class="card-title"><a href="${href(n)}">${esc(n.name)}</a></h3>
      <div class="card-meta">${n.all.length} ${n.all.length === 1 ? "resource" : "resources"}</div>
      ${n.blurb ? `<p class="card-body">${esc(n.blurb)}</p>` : ""}
      ${n.children.filter(has).length ? `<div class="card-tags">${n.children.filter(has).map((c) => `<a class="tag" href="${href(c)}" style="text-decoration:none">${esc(c.name)} (${c.all.length})</a>`).join("")}</div>` : ""}</article>`;

    if (!node || !has(node)) {
      document.title = "Topics — Reformed Education";
      root.innerHTML = `<div class="page-head"><div class="container">${RE.ui.breadcrumb([{ label: "Home", href: "index.html" }, { label: "Topics" }])}
        <p class="label">Browse</p><h1>Topics</h1><p class="prose">Find podcasts, authors, lectures and other resources by subject. Choose a topic to see what is in it and any narrower topics inside it.</p></div></div>
        <div class="container page-body">${top.filter(has).length ? `<div class="grid grid-cards">${top.filter(has).map(card).join("")}</div>` : `<p class="muted">No topics yet.</p>`}</div>`;
      return;
    }
    document.title = `${node.name} — Topics — Reformed Education`;
    const kids = node.children.filter(has);
    const byType = new Map();
    node.all.forEach((i) => { if (!byType.has(i.type)) byType.set(i.type, []); byType.get(i.type).push(i.entry); });
    const sections = [...byType].map(([type, list]) => { const cfg = RE.config.collections[type];
      return `<section class="group"><h2>${esc(cfg.label)} <span class="muted" style="font-size:1rem;font-family:var(--font-body);font-weight:400">(${list.length})</span></h2>
        <div class="lrows">${list.slice(0, 12).map((e) => RE.ui.directoryRow(type, e)).join("")}</div>
        ${list.length > 12 ? `<details class="more"><summary class="btn" style="margin-top:12px">Show the other ${list.length - 12}</summary><div class="lrows">${list.slice(12).map((e) => RE.ui.directoryRow(type, e)).join("")}</div></details>` : ""}</section>`; }).join("");
    root.innerHTML = `<div class="page-head"><div class="container">
        ${RE.ui.breadcrumb([{ label: "Home", href: "index.html" }, { label: "Topics", href: "topics.html" }].concat(crumbs(node).map((n, i, a) => (i < a.length - 1 ? { label: n.name, href: href(n) } : { label: n.name }))))}
        <p class="label">${node.parent ? "Topic" : "Topic area"}</p><h1>${esc(node.name)}</h1>${node.blurb ? `<p class="prose">${esc(node.blurb)}</p>` : ""}</div></div>
      <div class="container page-body">
        ${kids.length ? `<h2>Narrower topics</h2><div class="grid grid-cards" style="margin-bottom:40px">${kids.map(card).join("")}</div>` : ""}
        ${kids.length ? `<h2>Everything in ${esc(node.name)}</h2>` : ""}${sections}
      </div>`;
  });
};
