/* Catechism workspace: Browse · Flashcards · Memorize · Random.  catechism.html?id=wsc&mode=flashcards */
RE.pages.catechisms = function () {
  const { esc, $, param, shuffle } = RE.ui;
  const root = document.getElementById("cat-root");
  RE.ui.run(root, async () => {
    const cat = await RE.data.catechism(param("id") || "wsc");
    if (!cat) { root.innerHTML = `<div class="notice error">Catechism not found. <a href="catechisms.html">All catechisms</a></div>`; return; }
    document.title = `${cat.name} — Reformed Education`;
    const qs = cat.questions;
    const knownKey = `known:${cat.id}`;
    const known = () => new Set(RE.store.get(knownKey, []));
    const saveKnown = (s) => RE.store.set(knownKey, [...s]);
    const qUrl = (q) => `question.html?id=${encodeURIComponent(cat.id)}&q=${q.n}`;
    const modes = [["browse", "Browse"], ["flashcards", "Flashcards"], ["memorize", "Memorize"], ["random", "Random"]];
    let mode = modes.some((m) => m[0] === param("mode")) ? param("mode") : "browse";

    root.innerHTML = `${RE.ui.breadcrumb([{ label: "Home", href: "index.html" }, { label: "Catechisms", href: "catechisms.html" }, { label: cat.short }])}
      <p class="label">Catechism</p><h1>${esc(cat.name)}</h1>
      ${cat.placeholder ? RE.ui.placeholderNotice("Question and answer text below is placeholder content pending an approved source.") : ""}
      ${qs.length ? `<div class="tabs" role="tablist">${modes.map(([k, l]) => `<button class="tab" role="tab" data-mode="${k}">${l}</button>`).join("")}
        <a class="tab" style="text-decoration:none" href="quiz.html?set=${esc(cat.id)}">Quiz →</a></div><div id="panel"></div>`
        : `<div class="notice">Planned. Content for this catechism has not yet been added.</div>`}`;
    root.insertAdjacentHTML("beforeend", `<div style="margin-top:48px;max-width:640px">${RE.ui.citation(cat.source, { heading: "Edition & Source" })}</div>`);
    if (!qs.length) return;

    const panel = $("#panel");
    const views = {
      browse() {
        const k = known();
        panel.innerHTML = `<p class="muted">${k.size} of ${qs.length} marked as known.</p>
          <ol class="qlist">${qs.map((q) => `<li><a href="${qUrl(q)}"><span class="q-num">${q.n}</span>
            <span class="q-text ${RE.ui.isPH(q.question) ? "ph" : ""}">${esc(q.question)}${k.has(q.n) ? " ✓" : ""}</span></a></li>`).join("")}</ol>`;
      },
      flashcards() {
        let deck = qs.slice(), i = 0, flipped = false;
        const draw = () => {
          const q = deck[i], k = known();
          panel.innerHTML = `<div class="progress"><i style="width:${((i + 1) / deck.length) * 100}%"></i></div>
            <button class="flashcard" id="card" aria-label="Flip card"><span class="side">${flipped ? "Answer" : "Question"} ${q.n}</span>
              <span class="text ${RE.ui.isPH(flipped ? q.answer : q.question) ? "ph" : ""}">${esc(flipped ? q.answer : q.question)}</span></button>
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
      memorize() {
        let i = 0, revealed = false;
        const draw = () => {
          const q = qs[i];
          panel.innerHTML = `<p class="muted">Recite or type the answer from memory, then reveal it and check yourself.</p>
            <h3>${q.n}. <span class="${RE.ui.isPH(q.question) ? "ph" : ""}">${esc(q.question)}</span></h3>
            <textarea class="input" id="attempt" placeholder="Type the answer from memory…" aria-label="Your answer"></textarea>
            <div class="tool-controls"><button class="btn btn-primary" id="reveal">${revealed ? "Hide answer" : "Reveal answer"}</button>
              <button class="btn" id="mprev" ${i === 0 ? "disabled" : ""}>← Previous</button>
              <button class="btn" id="mnext" ${i === qs.length - 1 ? "disabled" : ""}>Next →</button></div>
            ${revealed ? `<div class="notice" style="margin-top:20px"><strong>Answer.</strong> <span class="${RE.ui.isPH(q.answer) ? "ph" : ""}">${esc(q.answer)}</span>
              <div class="btn-row" style="margin-top:12px"><button class="btn" id="gotit">I knew it</button></div></div>` : ""}`;
          $("#reveal").onclick = () => { const t = $("#attempt").value; revealed = !revealed; draw(); $("#attempt").value = t; };
          $("#mprev").onclick = () => { i--; revealed = false; draw(); };
          $("#mnext").onclick = () => { i++; revealed = false; draw(); };
          if (revealed) $("#gotit").onclick = () => { const s = known(); s.add(q.n); saveKnown(s); $("#gotit").textContent = "Saved ✓"; };
        };
        draw();
      },
      random() {
        const draw = () => {
          const q = qs[Math.floor(Math.random() * qs.length)];
          panel.innerHTML = `<div class="flashcard" style="cursor:default"><span class="side">Question ${q.n}</span>
            <span class="text ${RE.ui.isPH(q.question) ? "ph" : ""}">${esc(q.question)}</span></div>
            <div class="tool-controls"><button class="btn btn-primary" id="another">Another random question</button>
              <a class="btn" href="${qUrl(q)}">Open question page</a></div>`;
          $("#another").onclick = draw;
        };
        draw();
      },
    };

    const select = (m) => {
      mode = m;
      RE.ui.$$(".tab[data-mode]").forEach((t) => t.setAttribute("aria-selected", t.dataset.mode === m));
      history.replaceState(null, "", `?id=${encodeURIComponent(cat.id)}&mode=${m}`);
      views[m]();
    };
    RE.ui.$$(".tab[data-mode]").forEach((t) => (t.onclick = () => select(t.dataset.mode)));
    select(mode);
  });
};
