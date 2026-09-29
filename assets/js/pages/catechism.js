/* Catechism tools — catechism.html?id=wsc&mode=flashcards
   Study:    Q&A · Scripture proofs · Topics · Search
   Practice: Flashcards · Fill in the blank · Multiple choice · Random · Memorize
   Games:    Challenge (10 / 25 / all, optional timer) · Streak
   Everything runs from the JSON data; progress and scores live in localStorage. */
RE.pages.catechisms = function () {
  const { esc, $, $$, param, shuffle, isPH } = RE.ui;
  const root = document.getElementById("cat-root");
  const SECONDS = 20;
  const phc = (s) => (isPH(s) ? "ph" : "");

  RE.ui.run(root, async () => {
    const cat = await RE.data.catechism(param("id") || "wsc");
    if (!cat) { root.innerHTML = `<div class="notice error">Catechism not found. <a href="catechisms.html">All catechisms</a></div>`; return; }
    document.title = `${cat.name} — Reformed Education`;
    const qs = cat.questions || [];
    if (!qs.length && cat.count) { root.innerHTML = `<div class="notice error"><strong>This page is out of date in your browser.</strong> Please reload it (Cmd/Ctrl + Shift + R) to fetch the latest files.</div>`; return; }
    const knownKey = `known:${cat.id}`;
    const known = () => new Set(RE.store.get(knownKey, []));
    const saveKnown = (s) => RE.store.set(knownKey, [...s]);
    const qUrl = (q) => `question.html?id=${encodeURIComponent(cat.id)}&q=${q.n}`;

    const groups = {
      Study: [["browse", "Q&A"], ["proofs", "Scripture proofs"], ["topics", "Topics"], ["search", "Search"]],
      Practice: [["flashcards", "Flashcards"], ["fillblank", "Fill in the blank"], ["choice", "Multiple choice"], ["random", "Random"], ["memorize", "Memorize"]],
      Games: [["challenge", "Challenge"], ["streak", "Streak"]],
    };
    const fm = cat.front_matter || [];
    if (fm.length) groups.Preface = [["preface", fm.length > 1 ? "Prefaces" : "Preface"]];
    const groupOf = (m) => Object.keys(groups).find((g) => groups[g].some((x) => x[0] === m));
    const big = qs.length > 300 && qs.some((q) => q.topic);      // e.g. Fisher's: open by topic, not one long list
    let mode = groupOf(param("mode")) ? param("mode") : big ? "topics" : "browse";

    root.innerHTML = `${RE.ui.breadcrumb([{ label: "Home", href: "index.html" }, { label: "Catechisms", href: "catechisms.html" }, { label: cat.short }])}
      <p class="label">${esc(cat.kind || "Catechism")} · ${esc(cat.group || "")}</p><h1>${esc(cat.name)}</h1>
      ${cat.coverage_note ? `<div class="notice"><strong>Note.</strong> ${esc(cat.coverage_note)}</div>` : ""}
      ${cat.placeholder ? RE.ui.placeholderNotice("Question and answer text below is placeholder content pending an approved edition.") : ""}
      ${fm.length ? `<p><a class="btn btn-primary" href="?id=${esc(cat.id)}&amp;mode=preface">Read the ${fm.length > 1 ? "prefaces" : "preface"}</a></p>` : ""}
      ${qs.length ? `<div class="tabs" role="tablist" id="groups">${Object.keys(groups).map((g) => `<button class="tab" role="tab" data-group="${g}">${g}</button>`).join("")}
          <a class="tab" style="text-decoration:none" href="quiz.html?set=${esc(cat.id)}">Quiz →</a></div>
        <div class="btn-row" id="modes" style="margin:-8px 0 24px"></div><div id="panel"></div>`
        : `<div class="notice">Planned. The text and study tools for this document have not yet been added.</div>`}
      <div style="margin-top:48px;max-width:640px">${RE.ui.citation(cat.source, { heading: "Edition & Source" })}</div>`;
    if (!qs.length) return;
    const panel = $("#panel");

    /* ── shared multiple-choice engine ─────────────────────────────── */
    function choicesFor(q) {
      const others = shuffle(qs.filter((x) => x.n !== q.n).map((x) => x.answer).filter((a) => a !== q.answer)).slice(0, 3);
      return shuffle([q.answer, ...others]);
    }
    /* Render one MC question into `el`. opts: { timed, label, onAnswer(correct, picked) } */
    function renderMC(el, q, opts) {
      const choices = choicesFor(q);
      let done = false, timer = null, left = SECONDS;
      el.innerHTML = `<p class="label">${esc(opts.label || "")}${opts.timed ? ` · <span id="clock">${SECONDS}s</span>` : ""}</p>
        <h2 class="${phc(q.question)}">${q.n}. ${esc(q.question)}</h2>
        <div class="choices">${choices.map((c, i) => `<button class="choice" data-i="${i}">${esc(c)}</button>`).join("")}</div><div id="after"></div>`;
      const reveal = (i) => {
        if (done) return; done = true; clearInterval(timer);
        const ok = i != null && choices[i] === q.answer;
        $$(".choice", el).forEach((b) => { b.disabled = true; if (choices[+b.dataset.i] === q.answer) b.classList.add("correct"); else if (+b.dataset.i === i) b.classList.add("wrong"); });
        $("#after", el).innerHTML = `<p class="muted">${ok ? "Correct." : i == null ? "Time is up." : "Incorrect."}</p>`;
        opts.onAnswer(ok, i);
      };
      $$(".choice", el).forEach((b) => (b.onclick = () => reveal(+b.dataset.i)));
      if (opts.timed) timer = setInterval(() => { left--; const c = $("#clock", el); if (c) c.textContent = left + "s"; if (left <= 0) reveal(null); }, 1000);
      return () => clearInterval(timer);
    }
    const needMC = () => qs.length < 2 && (panel.innerHTML = `<div class="notice">At least two questions are needed for multiple choice.</div>`, true);

    const views = {
      preface() {
        const block = (b) => b.type === "outline"
          ? `<ul class="outline">${b.items.map((i) => `<li style="margin-left:${(i.level - 1) * 22}px">${i.label ? `<strong>${esc(i.label)}</strong> ` : ""}${esc(i.text)}</li>`).join("")}</ul>`
          : b.type === "note" ? `<p class="muted" style="font-size:.85rem">${esc(b.text)}</p>` : `<p>${esc(b.text)}</p>`;
        panel.innerHTML = `<div class="prose preface">${fm.map((f) => `<section style="margin-bottom:40px"><h2>${esc(f.title)}</h2>
          <p class="muted" style="margin-top:-6px">${esc(f.byline)} · ${esc(f.date)}</p>${f.blocks.map(block).join("")}</section>`).join("")}</div>`;
      },
      /* ── Study ── */
      browse() {
        const k = known(), PAGE = 200;
        let shown = 0;
        panel.innerHTML = `<p class="muted">${k.size} of ${qs.length} marked as known.</p><ol class="qlist" id="ql"></ol><div id="more"></div>`;
        const more = () => {
          const chunk = qs.slice(shown, shown + PAGE); shown += chunk.length;
          $("#ql").insertAdjacentHTML("beforeend", chunk.map((q) => `<li><a href="${qUrl(q)}"><span class="q-num">${q.n}</span>
            <span class="q-text ${phc(q.question)}">${esc(q.question)}${k.has(q.n) ? " ✓" : ""}</span></a></li>`).join(""));
          $("#more").innerHTML = shown < qs.length ? `<button class="btn" id="showmore" style="margin-top:16px">Show more (${qs.length - shown} left)</button>` : "";
          if ($("#showmore")) $("#showmore").onclick = more;
        };
        more();
      },
      proofs() {
        if (!qs.some((q) => (q.proofs || []).length)) { panel.innerHTML = `<div class="notice">Scripture proofs have not yet been added for this document.</div>`; return; }
        panel.innerHTML = `<p class="muted">Scripture proofs for each answer (King James Version). Open a question to read the verses.</p>
          <ol class="qlist">${qs.map((q) => `<li><a href="${qUrl(q)}"><span class="q-num">${q.n}</span><span>
            <span class="q-text ${phc(q.question)}">${esc(q.question)}</span><br>
            <span class="muted">${(q.proofs || []).map((p) => esc(p.ref)).join("; ") || "No proof texts in this edition."}</span></span></a></li>`).join("")}</ol>`;
      },
      topics() {
        if (!qs.some((q) => q.topic)) { panel.innerHTML = `<div class="notice">Topics have not yet been assigned to these questions.</div>`; return; }
        const by = new Map();
        qs.forEach((q) => { const k = q.topic || "Uncategorized"; if (!by.has(k)) by.set(k, []); by.get(k).push(q); });
        const rows = (list) => `<ol class="qlist">${list.map((q) => `<li><a href="${qUrl(q)}"><span class="q-num">${q.n}</span><span class="q-text ${phc(q.question)}">${esc(q.question)}</span></a></li>`).join("")}</ol>`;
        panel.innerHTML = `<p class="muted">${by.size} topics. Open a topic to see its questions.</p>` + [...by].map(([tp, list], i) =>
          `<details class="topic" data-i="${i}"><summary><span class="${phc(tp)}">${esc(tp)}</span> <span class="muted">(${list.length})</span></summary><div class="topic-body"></div></details>`).join("");
        const lists = [...by.values()];
        $$("details.topic", panel).forEach((d) => d.addEventListener("toggle", () => {
          const body = $(".topic-body", d);
          if (d.open && !body.innerHTML) body.innerHTML = rows(lists[+d.dataset.i]);
        }));
      },
      search() {
        panel.innerHTML = `<div class="field"><label for="cs">Search this ${esc((cat.kind || "catechism").toLowerCase())}</label><input class="input" id="cs" type="search" placeholder="Search questions, answers and topics…"></div><ol class="qlist" id="cr" style="margin-top:16px"></ol>`;
        const draw = () => {
          const t = $("#cs").value.trim().toLowerCase();
          const hits = t ? qs.filter((q) => [q.question, q.answer, q.topic].join(" ").toLowerCase().includes(t)) : [];
          $("#cr").innerHTML = t ? (hits.map((q) => `<li><a href="${qUrl(q)}"><span class="q-num">${q.n}</span><span class="q-text ${phc(q.question)}">${esc(q.question)}</span></a></li>`).join("") || `<li class="muted" style="padding:14px 0">No matches.</li>`) : "";
        };
        $("#cs").oninput = draw; $("#cs").focus();
      },

      /* ── Practice ── */
      flashcards() {
        let deck = qs.slice(), i = 0, flipped = false;
        const draw = () => {
          const q = deck[i], k = known();
          panel.innerHTML = `<div class="progress"><i style="width:${((i + 1) / deck.length) * 100}%"></i></div>
            <button class="flashcard" id="card" aria-label="Flip card"><span class="side">${flipped ? "Answer" : "Question"} ${q.n}</span>
              <span class="text ${phc(flipped ? q.answer : q.question)}">${esc(flipped ? q.answer : q.question)}</span></button>
            <div class="tool-controls">
              <button class="btn" id="prev" ${i === 0 ? "disabled" : ""}>← Previous</button>
              <button class="btn" id="flip">Flip</button>
              <button class="btn" id="next" ${i === deck.length - 1 ? "disabled" : ""}>Next →</button>
              <button class="btn btn-primary" id="know">${k.has(q.n) ? "Marked known ✓" : "Mark as known"}</button>
              <button class="btn" id="shuf">Shuffle</button>
              <span class="spacer">Card ${i + 1} of ${deck.length}</span></div>`;
          const go = (d) => { i += d; flipped = false; draw(); };
          $("#card").onclick = $("#flip").onclick = () => { flipped = !flipped; draw(); $("#card").focus(); };
          $("#prev").onclick = () => go(-1); $("#next").onclick = () => go(1);
          $("#shuf").onclick = () => { deck = shuffle(deck); i = 0; flipped = false; draw(); };
          $("#know").onclick = () => { const s = known(); s.has(q.n) ? s.delete(q.n) : s.add(q.n); saveKnown(s); draw(); };
        };
        draw();
      },
      fillblank() {
        /* Blanks every other longer word of the answer; deterministic so a card is stable while you work. */
        let i = 0;
        const draw = () => {
          const q = qs[i];
          const words = q.answer.split(/(\s+)/);
          let n = 0; const blanks = [];
          const html = words.map((w) => {
            const core = w.replace(/[^\p{L}\p{N}'’-]/gu, "");
            if (!/\S/.test(w) || core.length < 4 || n++ % 2) return esc(w);
            blanks.push(core.toLowerCase());
            return `<input class="input blank" data-b="${blanks.length - 1}" size="${Math.max(core.length, 4)}" style="display:inline-block;width:auto;min-height:30px;padding:2px 6px" aria-label="Blank ${blanks.length}" autocomplete="off">`;
          }).join("");
          panel.innerHTML = `<p class="muted">Fill in the missing words.</p>
            <h3><span class="${phc(q.question)}">${q.n}. ${esc(q.question)}</span></h3>
            <p style="font-size:1.15rem;line-height:2.2;white-space:pre-line">${html}</p><div id="fb"></div>
            <div class="tool-controls"><button class="btn btn-primary" id="check">Check</button>
              <button class="btn" id="fprev" ${i === 0 ? "disabled" : ""}>← Previous</button>
              <button class="btn" id="fnext" ${i === qs.length - 1 ? "disabled" : ""}>Next →</button></div>`;
          $("#check").onclick = () => {
            let right = 0;
            $$(".blank").forEach((inp) => {
              const ok = inp.value.trim().toLowerCase().replace(/[^\p{L}\p{N}'’-]/gu, "") === blanks[+inp.dataset.b];
              inp.style.borderColor = ok ? "var(--color-olive)" : "var(--color-oxblood)"; if (ok) right++;
            });
            $("#fb").innerHTML = `<p class="muted">${blanks.length ? `${right} of ${blanks.length} correct.` : "This answer has no blanks."}</p>`;
          };
          $("#fprev").onclick = () => { i--; draw(); }; $("#fnext").onclick = () => { i++; draw(); };
        };
        draw();
      },
      choice() {
        if (needMC()) return;
        let score = 0, asked = 0;
        const next = () => {
          const q = qs[Math.floor(Math.random() * qs.length)];
          panel.innerHTML = `<div class="stat-row"><div class="stat"><b>${score} / ${asked}</b><span>This session</span></div></div><div id="mc"></div>`;
          renderMC($("#mc"), q, { label: "Multiple choice", onAnswer(ok) {
            asked++; if (ok) score++;
            $("#after").insertAdjacentHTML("beforeend", `<button class="btn btn-primary" id="nx">Next question →</button>`);
            $("#nx").onclick = next; $("#nx").focus();
          } });
        };
        next();
      },
      random() {
        const draw = () => {
          const q = qs[Math.floor(Math.random() * qs.length)];
          panel.innerHTML = `<div class="flashcard" style="cursor:default"><span class="side">Question ${q.n}</span>
            <span class="text ${phc(q.question)}">${esc(q.question)}</span></div>
            <div class="tool-controls"><button class="btn btn-primary" id="another">Another random question</button>
              <a class="btn" href="${qUrl(q)}">Open question page</a></div>`;
          $("#another").onclick = draw;
        };
        draw();
      },
      memorize() {
        let i = 0, revealed = false;
        const draw = () => {
          const q = qs[i];
          panel.innerHTML = `<p class="muted">Recite or type the answer from memory, then reveal it and check yourself.</p>
            <h3>${q.n}. <span class="${phc(q.question)}">${esc(q.question)}</span></h3>
            <textarea class="input" id="attempt" placeholder="Type the answer from memory…" aria-label="Your answer"></textarea>
            <div class="tool-controls"><button class="btn btn-primary" id="reveal">${revealed ? "Hide answer" : "Reveal answer"}</button>
              <button class="btn" id="mprev" ${i === 0 ? "disabled" : ""}>← Previous</button>
              <button class="btn" id="mnext" ${i === qs.length - 1 ? "disabled" : ""}>Next →</button></div>
            ${revealed ? `<div class="notice" style="margin-top:20px"><strong>Answer.</strong> <span class="${phc(q.answer)}">${esc(q.answer)}</span>
              <div class="btn-row" style="margin-top:12px"><button class="btn" id="gotit">I knew it</button></div></div>` : ""}`;
          $("#reveal").onclick = () => { const t = $("#attempt").value; revealed = !revealed; draw(); $("#attempt").value = t; };
          $("#mprev").onclick = () => { i--; revealed = false; draw(); };
          $("#mnext").onclick = () => { i++; revealed = false; draw(); };
          if (revealed) $("#gotit").onclick = () => { const s = known(); s.add(q.n); saveKnown(s); $("#gotit").textContent = "Saved ✓"; };
        };
        draw();
      },

      /* ── Games ── */
      challenge() {
        if (needMC()) return;
        const hist = RE.store.scoresFor(`${cat.id}-challenge`).slice(-5).reverse();
        panel.innerHTML = `<p class="prose">Answer a run of multiple-choice questions and save your score. The full challenge uses every question currently loaded (${qs.length}).</p>
          <label style="display:flex;gap:8px;align-items:center;margin:16px 0"><input type="checkbox" id="timed"> Timed (${SECONDS} seconds per question)</label>
          <div class="btn-row"><button class="btn btn-primary" data-size="10">10-question</button><button class="btn btn-primary" data-size="25">25-question</button>
            <button class="btn btn-primary" data-size="all">Full (${qs.length})</button></div>
          ${hist.length ? `<h3 style="margin-top:32px">Recent scores</h3><table class="table"><thead><tr><th>Date</th><th>Score</th><th>Mode</th></tr></thead><tbody>${hist.map((h) => `<tr><td>${new Date(h.date).toLocaleDateString()}</td><td>${h.score} / ${h.total}</td><td>${h.timed ? "Timed" : "Untimed"}</td></tr>`).join("")}</tbody></table>` : ""}`;
        $$("[data-size]").forEach((b) => (b.onclick = () => run(b.dataset.size === "all" ? qs.length : Math.min(+b.dataset.size, qs.length), $("#timed").checked)));
        function run(size, timed) {
          const deck = shuffle(qs).slice(0, size); let i = 0, score = 0, stop = () => {};
          const show = () => {
            panel.innerHTML = `<div class="progress"><i style="width:${(i / deck.length) * 100}%"></i></div><div id="mc"></div>`;
            stop = renderMC($("#mc"), deck[i], { timed, label: `Question ${i + 1} of ${deck.length}`, onAnswer(ok) {
              if (ok) score++;
              $("#after").insertAdjacentHTML("beforeend", `<button class="btn btn-primary" id="nx">${i === deck.length - 1 ? "See results" : "Next →"}</button>`);
              $("#nx").onclick = () => { i++; i < deck.length ? show() : finish(); }; $("#nx").focus();
            } });
          };
          const finish = () => {
            RE.store.addScore({ set: `${cat.id}-challenge`, score, total: deck.length, timed });
            panel.innerHTML = `<div class="stat-row"><div class="stat"><b>${score} / ${deck.length}</b><span>Score</span></div><div class="stat"><b>${Math.round((score / deck.length) * 100)}%</b><span>Correct</span></div></div>
              <p class="muted">Score saved in this browser.</p><div class="btn-row"><button class="btn btn-primary" id="again">Play again</button></div>`;
            $("#again").onclick = views.challenge;
          };
          show();
        }
      },
      streak() {
        if (needMC()) return;
        const key = `streak:${cat.id}`; let cur = 0;
        const next = () => {
          const best = RE.store.get(key, 0);
          const q = qs[Math.floor(Math.random() * qs.length)];
          panel.innerHTML = `<div class="stat-row"><div class="stat"><b>${cur}</b><span>Current streak</span></div><div class="stat"><b>${best}</b><span>Best streak</span></div></div><div id="mc"></div>`;
          renderMC($("#mc"), q, { label: "Streak — one wrong answer ends the run", onAnswer(ok) {
            if (ok) { cur++; if (cur > RE.store.get(key, 0)) RE.store.set(key, cur); $("#after").insertAdjacentHTML("beforeend", `<button class="btn btn-primary" id="nx">Keep going →</button>`); $("#nx").onclick = next; $("#nx").focus(); }
            else { $("#after").insertAdjacentHTML("beforeend", `<p><strong>Streak ended at ${cur}.</strong></p><button class="btn btn-primary" id="nx">Start over</button>`); cur = 0; $("#nx").onclick = next; $("#nx").focus(); }
          } });
        };
        next();
      },
    };

    const select = (m) => {
      mode = m; const g = groupOf(m);
      $$("[data-group]").forEach((t) => t.setAttribute("aria-selected", t.dataset.group === g));
      $("#modes").style.display = groups[g].length > 1 ? "" : "none";
      $("#modes").innerHTML = groups[g].map(([k, l]) => `<button class="btn ${k === m ? "btn-primary" : ""}" data-mode="${k}" aria-pressed="${k === m}">${l}</button>`).join("");
      $$("[data-mode]").forEach((b) => (b.onclick = () => select(b.dataset.mode)));
      history.replaceState(null, "", `?id=${encodeURIComponent(cat.id)}&mode=${m}`);
      views[m]();
    };
    $$("[data-group]").forEach((t) => (t.onclick = () => select(groups[t.dataset.group][0][0])));
    select(mode);
  });
};
