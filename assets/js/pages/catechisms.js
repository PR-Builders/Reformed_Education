RE.pages.catechisms = function () {
  const { esc, tag } = RE.ui;
  const root = document.getElementById("cat-root");
  RE.ui.run(root, async () => {
    const list = await RE.data.list("catechisms");
    root.innerHTML = `
      ${RE.ui.breadcrumb([{ label: "Home", href: "index.html" }, { label: "Catechisms" }])}
      <p class="label">Study</p><h1>Catechisms</h1>
      <p class="prose">Browse the catechisms, then study with flashcards, memorization practice and quizzes. Progress is saved only in this browser.</p>
      ${RE.ui.placeholderNotice("Question and answer text is placeholder content. No catechism text has been added until an approved source is provided.")}
      <div class="grid grid-cards">${list.map((c) => {
        const n = c.questions.length;
        return `<article class="card"><div class="card-kicker">${esc(c.short)}</div>
          <h3 class="card-title"><a href="${esc(RE.config.urlFor("catechisms", c))}">${esc(c.name)}</a></h3>
          <p class="card-body">${esc(c.description)}</p>
          <div class="card-tags">${tag(n ? "Framework ready · placeholder text" : "Planned", n ? "tag-placeholder" : "tag-planned")}</div></article>`;
      }).join("")}</div>`;
  });
};
