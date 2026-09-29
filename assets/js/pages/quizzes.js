RE.pages.quizzes = function () {
  const { esc, tag } = RE.ui;
  const root = document.getElementById("quiz-root");
  RE.ui.run(root, async () => {
    const sets = await RE.data.quizzes();
    const cats = [...new Set(sets.map((s) => s.category))];
    const scores = RE.store.get("scores", []);
    root.innerHTML = `${RE.ui.breadcrumb([{ label: "Home", href: "index.html" }, { label: "Quizzes" }])}
      <p class="label">Quizzes</p><h1>Test Your Knowledge</h1>
      <p class="prose">Multiple-choice quizzes with an optional timer. Your scores are stored only in this browser.</p>
      ${RE.ui.placeholderNotice("Quiz questions are placeholders demonstrating the format. Sets marked Planned have no questions yet.")}
      ${cats.map((c) => `<h2 style="margin-top:40px">${esc(c)}</h2><div class="grid grid-cards">${sets.filter((s) => s.category === c).map((s) => {
        const mine = scores.filter((x) => x.set === s.id);
        const best = mine.length ? Math.max(...mine.map((x) => Math.round((x.score / x.total) * 100))) : null;
        return `<a class="card" href="quiz.html?set=${encodeURIComponent(s.id)}"><div class="card-kicker">${esc(s.category)}</div>
          <h3 class="card-title">${esc(s.title)}</h3>
          <p class="card-body">${s.count ? `${s.count} ${s.status === "ready" ? "questions" : "sample questions"}` : "Questions not yet added."}</p>
          <div class="card-tags">${tag(s.status === "planned" ? "Planned" : s.status === "ready" ? "Ready" : "Placeholder questions", s.status === "planned" ? "tag-planned" : s.status === "ready" ? "" : "tag-placeholder")}${best !== null ? tag(`Best: ${best}%`) : ""}</div></a>`;
      }).join("")}</div>`).join("")}
      ${scores.length ? `<hr class="rule"><div class="btn-row"><button class="btn" id="clear">Clear saved scores</button></div>` : ""}`;
    const clear = document.getElementById("clear");
    if (clear) clear.onclick = () => { if (confirm("Clear all saved quiz scores in this browser?")) { RE.store.set("scores", []); RE.pages.quizzes(); } };
  });
};
