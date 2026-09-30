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
    const total = node.all.length;
    const sections = [...byType].map(([type, list]) => { const cfg = RE.config.collections[type];
      return `<details class="dgroup"${total <= 8 ? " open" : ""}><summary><span class="dgroup-title">${esc(cfg.label)}</span><span class="dgroup-sub">${list.length}</span></summary>
        <div class="lrows">${list.map((e) => RE.ui.directoryRow(type, e)).join("")}</div></details>`; }).join("");
    const picks = (node.start_here || []).map((p) => { const hit = node.all.find((i) => i.type === p.type && i.entry.id === p.id); return hit ? { hit, why: p.why } : null; }).filter(Boolean);
    const startHere = picks.length ? `<section class="starthere"><p class="label">Start here</p>
      <ol>${picks.map(({ hit, why }) => `<li><a href="${esc(RE.config.urlFor(hit.type, hit.entry))}"><strong>${esc(hit.entry.name)}</strong></a> <span class="muted">· ${esc(RE.config.collections[hit.type].singular)}</span><br>${esc(why)}</li>`).join("")}</ol>
      <p class="muted" style="font-size:.82rem;margin:0">Editorial suggestions from reformededucation.org. They describe and do not endorse.</p></section>` : "";
    root.innerHTML = `<div class="page-head"><div class="container">
        ${RE.ui.breadcrumb([{ label: "Home", href: "index.html" }, { label: "Topics", href: "topics.html" }].concat(crumbs(node).map((n, i, a) => (i < a.length - 1 ? { label: n.name, href: href(n) } : { label: n.name }))))}
        <p class="label">${node.parent ? "Topic" : "Topic area"}</p><h1>${esc(node.name)}</h1>${node.blurb ? `<p class="prose">${esc(node.blurb)}</p>` : ""}</div></div>
      <div class="container page-body">
        ${/^biblical-counseling/.test(node.path) ? `<div class="notice"><strong>If you or someone you know is in danger or thinking about suicide,</strong> call your local emergency number now or, in the U.S., call or text <strong>988</strong>. Biblical counseling is not a substitute for medical or clinical care.</div>` : ""}
        ${startHere}
        ${kids.length ? `<h2>Narrower topics</h2><div class="grid grid-cards" style="margin-bottom:40px">${kids.map(card).join("")}</div>` : ""}
        <h2>All ${total} resources in ${esc(node.name)}</h2>${sections}
      </div>`;
  });
};
