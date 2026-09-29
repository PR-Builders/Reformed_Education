RE.pages.catechisms = function () {
  const { esc, tag } = RE.ui;
  const root = document.getElementById("cat-root");
  RE.ui.run(root, async () => {
    const list = await RE.data.list("catechisms");
    root.innerHTML = `
      ${RE.ui.breadcrumb([{ label: "Home", href: "index.html" }, { label: "Catechisms" }])}
      <p class="label">Study</p><h1>Catechisms</h1>
      <p class="prose">Study each document by question, Scripture proofs or topic; practice with flashcards, fill-in-the-blank and multiple choice; then play challenge and streak games. Progress is saved only in this browser.</p>
      <div class="notice">The Westminster Shorter and Larger Catechisms are added, with KJV Scripture proofs. Text for the other documents is coming. All catechisms are in the public domain; Scripture proofs use the King James Version.</div>
      ${[...new Set(list.map((c) => c.group))].map((g) => `<h2 style="margin-top:40px">${esc(g)}</h2><div class="grid grid-cards">${list.filter((c) => c.group === g).map((c) => {
        const n = c.questions.length;
        return `<article class="card"><div class="card-kicker">${esc(c.kind)} · ${esc(c.short)}</div>
          <h3 class="card-title"><a href="${esc(RE.config.urlFor("catechisms", c))}">${esc(c.name)}</a></h3>
          <p class="card-body">${esc(c.description)}</p>${RE.ui.citeLine(c.source)}
          <div class="card-tags">${tag(n ? (c.placeholder ? "Study tools ready · placeholder text" : `${n} questions · study tools`) : "Planned", n && c.placeholder ? "tag-placeholder" : n ? "" : "tag-planned")}</div></article>`;
      }).join("")}</div>`).join("")}`;
  });
};
