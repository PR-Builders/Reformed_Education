/* Quiz runner: quiz.html?set=wsc.  Multiple choice, optional per-question timer, scores in localStorage. */
RE.pages.quizzes = function () {
  const { esc, $, param, shuffle } = RE.ui;
  const root = document.getElementById("quiz-root");
  const SECONDS = 20;

  RE.ui.run(root, async () => {
    const set = await RE.data.quiz(param("set"));
    if (!set) { root.innerHTML = `<div class="notice error">Quiz not found. <a href="quizzes.html">All quizzes</a></div>`; return; }
    document.title = `${set.title} Quiz — Reformed Education`;
    const crumbs = RE.ui.breadcrumb([{ label: "Home", href: "index.html" }, { label: "Quizzes", href: "quizzes.html" }, { label: set.title }]);

    const intro = () => {
      const hist = RE.store.scoresFor(set.id).slice(-5).reverse();
      root.innerHTML = `${crumbs}<p class="label">${esc(set.category)}</p><h1>${esc(set.title)}</h1>
        ${set.status !== "planned" ? RE.ui.placeholderNotice("These questions and answers are placeholders. Do not treat them as real content.") : ""}
        <p class="prose">${esc(set.description)}</p>
        ${set.questions.length ? `<label class="radio" style="display:flex;gap:8px;align-items:center;margin:20px 0"><input type="checkbox" id="timed"> Timed (${SECONDS} seconds per question)</label>
          <button class="btn btn-primary" id="start">Begin quiz</button>` : `<div class="notice">Planned. Questions have not yet been added.</div>`}
        ${hist.length ? `<h3 style="margin-top:40px">Recent scores</h3><table class="table"><thead><tr><th>Date</th><th>Score</th><th>Mode</th></tr></thead><tbody>${hist.map((h) =>
          `<tr><td>${new Date(h.date).toLocaleDateString()}</td><td>${h.score} / ${h.total}</td><td>${h.timed ? "Timed" : "Untimed"}</td></tr>`).join("")}</tbody></table>` : ""}`;
      const start = $("#start");
      if (start) start.onclick = () => run($("#timed").checked);
    };

    const run = (timed) => {
      const qs = shuffle(set.questions);
      let i = 0, score = 0, timer = null, left = SECONDS;
      const finish = () => {
        clearInterval(timer);
        RE.store.addScore({ set: set.id, score, total: qs.length, timed });
        root.innerHTML = `${crumbs}<p class="label">Results</p><h1>${esc(set.title)}</h1>
          <div class="stat-row"><div class="stat"><b>${score} / ${qs.length}</b><span>Score</span></div>
          <div class="stat"><b>${Math.round((score / qs.length) * 100)}%</b><span>Correct</span></div></div>
          <p class="muted">Score saved in this browser.</p>
          <div class="btn-row"><button class="btn btn-primary" id="again">Try again</button><a class="btn" href="quizzes.html">All quizzes</a></div>`;
        $("#again").onclick = intro;
      };
      const show = () => {
        const q = qs[i];
        const order = shuffle(q.choices.map((c, idx) => idx));
        let answered = false;
        root.innerHTML = `${crumbs}<div class="progress"><i style="width:${(i / qs.length) * 100}%"></i></div>
          <p class="label">Question ${i + 1} of ${qs.length}${timed ? ` · <span id="clock" aria-live="off">${SECONDS}s</span>` : ""}</p>
          <h2 class="${RE.ui.isPH(q.prompt) ? "ph" : ""}">${esc(q.prompt)}</h2>
          <div class="choices">${order.map((idx) => `<button class="choice" data-i="${idx}">${esc(q.choices[idx])}</button>`).join("")}</div>
          <div id="after"></div>`;
        const reveal = (picked) => {
          if (answered) return; answered = true; clearInterval(timer);
          if (picked === q.answer) score++;
          RE.ui.$$(".choice").forEach((b) => { b.disabled = true; const n = +b.dataset.i;
            if (n === q.answer) b.classList.add("correct"); else if (n === picked) b.classList.add("wrong"); });
          $("#after").innerHTML = `<p class="muted">${picked === q.answer ? "Correct." : picked == null ? "Time is up." : "Incorrect."}</p>
            <button class="btn btn-primary" id="next">${i === qs.length - 1 ? "See results" : "Next question →"}</button>`;
          $("#next").onclick = () => { i++; i < qs.length ? show() : finish(); };
          $("#next").focus();
        };
        RE.ui.$$(".choice").forEach((b) => (b.onclick = () => reveal(+b.dataset.i)));
        if (timed) {
          left = SECONDS; clearInterval(timer);
          timer = setInterval(() => { left--; const c = $("#clock"); if (c) c.textContent = left + "s"; if (left <= 0) reveal(null); }, 1000);
        }
      };
      show();
    };
    intro();
  });
};
