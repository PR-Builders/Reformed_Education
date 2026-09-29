/* SEARCH — builds one flat index over every collection so a single box can search everything.
   To include a new content type (books, people, …) register it in config.js; to index nested
   content (like catechism questions) add an adapter below. */
(function () {
  const isPH = (v) => typeof v === "string" && /^\[Placeholder/i.test(v);

  /* Turn any entry into searchable text (skips URLs and placeholder strings). */
  function textOf(entry) {
    const parts = [];
    (function walk(v, key) {
      if (v == null || key === "id" || /url|website/i.test(key || "")) return;
      if (typeof v === "string") { if (!isPH(v)) parts.push(v); }
      else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
      else if (typeof v === "object" && key !== "questions") Object.keys(v).forEach((k) => walk(v[k], k));
    })(entry);
    return parts.join(" ");
  }

  /* Adapters can emit extra documents for nested content. */
  const adapters = {
    catechisms(entry) {
      return (entry.questions || []).map((q) => ({
        type: "catechisms", kind: "Catechism Question",
        id: `${entry.id}-${q.n}`,
        title: `${entry.short || entry.name} Q${q.n}: ${q.question}`,
        text: `${q.question} ${q.answer}`, tags: entry.tags || [],
        url: `question.html?id=${encodeURIComponent(entry.id)}&q=${q.n}`,
        placeholder: !!q.placeholder,
      }));
    },
  };

  let indexPromise;
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  RE.search = {
    textOf,
    async index() {
      if (!indexPromise) indexPromise = (async () => {
        const all = await RE.data.all();
        const docs = [];
        Object.keys(all).forEach((type) => {
          const cfg = RE.config.collections[type];
          all[type].forEach((e) => {
            docs.push({
              type, kind: cfg.singular, id: e.id, title: e.name, text: textOf(e),
              tags: e.tags || [], url: RE.config.urlFor(type, e), placeholder: !!e.placeholder,
              blurb: e.description,
            });
            if (adapters[type]) docs.push(...adapters[type](e));
          });
        });
        return docs.map((d) => Object.assign(d, {
          _t: norm(d.title || ""), _b: norm(d.text), _g: norm(d.tags.join(" ")),
          _k: norm(`${d.kind} ${RE.config.collections[d.type].label}`),
        }));
      })();
      return indexPromise;
    },
    /* Score a query against the index. All tokens must match somewhere (AND). */
    async query(q) {
      const tokens = norm(q).split(/\s+/).filter(Boolean);
      if (!tokens.length) return [];
      const docs = await RE.search.index();
      return docs.map((d) => {
        let score = 0;
        for (const t of tokens) {
          const s = (d._t.includes(t) ? 5 : 0) + (d._g.includes(t) ? 3 : 0) + (d._k.includes(t) ? 2 : 0) + (d._b.includes(t) ? 1 : 0);
          if (!s) return null;
          score += s;
        }
        return { doc: d, score };
      }).filter(Boolean).sort((a, b) => b.score - a.score).map((r) => r.doc);
    },
    /* Cheap client-side filter for one list page. */
    matches(entry, q) {
      const hay = norm(entry.name + " " + textOf(entry) + " " + (entry.tags || []).join(" "));
      return norm(q).split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
    },
  };
})();
