RE.pages.home = function () {
  const { esc, directoryCard, categoryCard, tag } = RE.ui;
  const c = RE.config;
  document.getElementById("home-categories").innerHTML = c.categories.map(categoryCard).join("");
  document.getElementById("home-pathways").innerHTML = RE.ui.pathways(c.pathways);

  RE.ui.run(document.getElementById("home-entries"), async () => {
    const all = await RE.data.all();
    const picks = ["seminaries", "colleges", "schools", "courses", "publishers", "podcasts"].map((t) => [t, all[t][0]]).filter((p) => p[1]);
    document.getElementById("home-entries").innerHTML = picks.map(([t, e]) => directoryCard(t, e)).join("");
    const sets = await RE.data.quizzes();
    document.getElementById("home-quizzes").innerHTML = sets.slice(0, 6).map((s) => `
      <a class="card" href="quiz.html?set=${encodeURIComponent(s.id)}">
        <div class="card-kicker">${esc(s.category)}</div>
        <h3 class="card-title">${esc(s.title)}</h3>
        <p class="card-body">${s.questions.length ? `${s.questions.length} sample questions` : "Planned"}</p>
        <div class="card-tags">${tag(s.status === "planned" ? "Planned" : "Placeholder questions", s.status === "planned" ? "tag-planned" : "tag-placeholder")}</div>
      </a>`).join("");
  });
};
