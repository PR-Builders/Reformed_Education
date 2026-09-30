/* SEARCH — one index over every collection and over the full text of every catechism
   (questions, answers, Scripture proof texts, prefaces). Finds every passage that mentions a word,
   including its variants (baptism · baptize · baptized · baptizing · baptismal), shows each match
   in context, and never truncates the result list.
     RE.search.query(text)   → { hits: [{doc, score, count, snippets}], total, tokens }
   To index a new content type, register the collection in config.js; for nested content (like
   catechism questions) add an adapter below that returns documents with `fields`. */
(function () {
  const isPH = (v) => typeof v === "string" && /^\[Placeholder/i.test(v);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ── text normalisation (length-preserving so offsets still point into the original) ── */
  const FOLD = { à: "a", á: "a", â: "a", ã: "a", ä: "a", å: "a", ç: "c", è: "e", é: "e", ê: "e", ë: "e", ì: "i", í: "i", î: "i", ï: "i", ñ: "n", ò: "o", ó: "o", ô: "o", õ: "o", ö: "o", ù: "u", ú: "u", û: "u", ü: "u", ý: "y", ÿ: "y" };
  const norm = (s) => s.toLowerCase().replace(/[’‘`]/g, "'").replace(/[àáâãäåçèéêëìíîïñòóôõöùúûüýÿ]/g, (c) => FOLD[c]);
  const WORD = /[a-z0-9]+(?:['-][a-z0-9]+)*/g;

  /* Light stemmer: baptism / baptisms / baptize / baptized / baptizing → "bapt"; sins → "sin". */
  function stem(w) {
    w = w.replace(/'s$/, "").replace(/z/g, "s");
    const s = w.replace(/(isms|ising|ised|ises|ism|ise|ings|ing|edly|ed|ies|es|s)$/, "");
    return s.length >= 3 ? s : w;
  }

  /* Tokenise a field once and cache: parallel arrays of stems / word starts / word ends. */
  function tok(field) {
    if (!field._tok) {
      const n = norm(field.text), stems = [], starts = [], ends = [], words = [];
      let m; WORD.lastIndex = 0;
      while ((m = WORD.exec(n))) { words.push(m[0]); stems.push(stem(m[0])); starts.push(m.index); ends.push(m.index + m[0].length); }
      field._tok = { n, words, stems, starts, ends };
    }
    return field._tok;
  }

  /* ── what to index ─────────────────────────────────────────────────────────────── */
  /* Turn any entry into searchable text (skips URLs and placeholder strings). */
  function textOf(entry) {
    const parts = [];
    (function walk(v, key) {
      if (v == null || key === "id" || /url|website|^source$|verification|listing_note|questions|front_matter|chapters/i.test(key || "")) return;
      if (typeof v === "string") { if (!isPH(v)) parts.push(v); }
      else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
      else if (typeof v === "object") Object.keys(v).forEach((k) => walk(v[k], k));
    })(entry);
    return parts.join(" ");
  }

  const adapters = {
    catechisms(cat) {
      const docs = [];
      const group = cat.name;
      (cat.questions || []).forEach((q) => {
        const fields = [
          { label: "Question", text: q.question, weight: 3 },
          { label: "Answer", text: q.answer, weight: 2 },
        ];
        (q.proofs || []).forEach((p) => {
          if (typeof p === "string" ? isPH(p) : !p.text && !p.ref) return;
          fields.push({ label: "Scripture proof", text: typeof p === "string" ? p : `${p.ref}. ${p.text || ""}`.trim(), weight: 1.5 });
        });
        if (q.topic && !isPH(q.topic)) fields.push({ label: "Topic", text: q.topic, weight: 1 });
        docs.push({ type: "catechisms", kind: "Catechism question", group, order: q.n, id: `${cat.id}-${q.n}`,
          title: `${cat.short || cat.name} ${q.n}. ${q.question}`, url: `question.html?id=${encodeURIComponent(cat.id)}&q=${q.n}`,
          placeholder: !!q.placeholder, fields });
      });
      (cat.chapters || []).forEach((c) => {
        c.sections.forEach((sec) => {
          const fields = [{ label: `${cat.short} ${c.numeral}.${sec.n}`, text: sec.text.replace(/\{[a-z]{1,2}\}/g, ""), weight: 2 }];
          sec.proofs.forEach((p) => fields.push({ label: "Scripture reference", text: p.ref, weight: 1 }));
          docs.push({ type: "catechisms", kind: "Confession section", group, order: c.n * 100 + sec.n, id: `${cat.id}-${c.n}-${sec.n}`,
            title: `${cat.short} ${c.numeral}.${sec.n} — ${c.title}`, url: `confession.html?id=${encodeURIComponent(cat.id)}&ch=${c.n}&sec=${sec.n}`, fields });
        });
      });
      (cat.front_matter || []).forEach((f, fi) => {
        (f.blocks || []).forEach((b, bi) => {
          const text = b.type === "outline" ? b.items.map((i) => `${i.label} ${i.text}`).join(" ") : b.text;
          if (!text) return;
          docs.push({ type: "catechisms", kind: "Preface", group, order: 1e6 + fi * 100 + bi, id: `${cat.id}-fm-${fi}-${bi}`,
            title: `${cat.name}: ${f.title}`, url: `catechism.html?id=${encodeURIComponent(cat.id)}&mode=preface`,
            fields: [{ label: `${f.title}, ${f.byline}`, text, weight: 1 }] });
        });
      });
      return docs;
    },
  };

  let indexPromise;
  const finish = (d) => {
    d._blob = norm(d.fields.map((f) => f.text).join(" \n "));
    d._stems = new Set();
    d.fields.forEach((f) => tok(f).stems.forEach((s) => d._stems.add(s)));
    return d;
  };

  RE.search = {
    textOf, stem,
    async index() {
      if (!indexPromise) indexPromise = (async () => {
        const all = await RE.data.all();
        const docs = [];
        for (const type of Object.keys(all)) {
          const cfg = RE.config.collections[type];
          for (const e of all[type]) {
            if (type === "catechisms") {
              const full = await RE.data.catechism(e.id);
              docs.push(finish({ type, kind: cfg.singular, group: cfg.label, order: 0, id: e.id, title: e.name, url: RE.config.urlFor(type, e), placeholder: !!e.placeholder,
                fields: [{ label: "Title", text: e.name, weight: 5 }, { label: "About", text: textOf(e), weight: 1 }] }));
              adapters.catechisms(full).forEach((d) => docs.push(finish(d)));
              continue;
            }
            const details = textOf(e);
            docs.push(finish({ type, kind: cfg.singular, group: cfg.label, order: 0, id: e.id, title: e.name, url: RE.config.urlFor(type, e), placeholder: !!e.placeholder,
              fields: [{ label: "Title", text: [e.name].concat(e.aliases || []).join(" "), weight: 5 }, { label: "Details", text: details, weight: 1 }, { label: "Tags", text: (e.tags || []).join(" "), weight: 2 }] }));
          }
        }
        return docs;
      })();
      return indexPromise;
    },

    /* Parse the query into terms: "quoted phrases" and single words. */
    parse(q) {
      const terms = [];
      norm(q).replace(/"([^"]+)"/g, (_, p) => { terms.push({ phrase: p.trim() }); return " "; })
        .split(/[^a-z0-9'-]+/).filter((w) => w && w.length > 1 || /\d/.test(w)).forEach((w) => terms.push({ word: w, stem: stem(w), prefix: w.length >= 5 }));
      return terms;
    },

    /* Does word #i of a tokenised field match this term? */
    wordMatches(t, term, i) {
      if (term.phrase) return false;
      return t.stems[i] === term.stem || t.words[i] === term.word || (term.prefix && t.words[i].startsWith(term.word));
    },

    async query(q) {
      const terms = RE.search.parse(q);
      if (!terms.length) return { hits: [], total: 0, terms };
      const docs = await RE.search.index();
      const hits = [];
      let total = 0;
      for (const d of docs) {
        // cheap pre-filter: every term must occur somewhere in the document
        let ok = true;
        for (const t of terms) {
          if (t.phrase) { if (!d._blob.includes(t.phrase)) { ok = false; break; } }
          else if (!(d._stems.has(t.stem) || d._blob.includes(t.word))) { ok = false; break; }
        }
        if (!ok) continue;
        let score = 0, count = 0;
        const perField = [];
        for (const f of d.fields) {
          const tk = tok(f); let c = 0;
          for (const t of terms) {
            if (t.phrase) { let p = -1; while ((p = tk.n.indexOf(t.phrase, p + 1)) !== -1) c++; }
            else for (let i = 0; i < tk.stems.length; i++) if (RE.search.wordMatches(tk, t, i)) c++;
          }
          if (c) { perField.push({ f, c }); score += c * (f.weight || 1); count += c; }
        }
        if (!count) continue;
        if (terms.every((t) => !t.phrase && d.fields[0].label === "Title" && tok(d.fields[0]).stems.includes(t.stem))) score += 10;
        total += count;
        hits.push({ doc: d, score, count, perField });
      }
      hits.sort((a, b) => b.score - a.score || (a.doc.group || "").localeCompare(b.doc.group || "") || (a.doc.order || 0) - (b.doc.order || 0));
      return { hits, total, terms };
    },

    /* Up to `max` highlighted excerpts for a hit, best-weighted fields first. */
    snippets(hit, terms, max) {
      const out = [];
      const fields = hit.perField.slice().sort((a, b) => (b.f.weight || 1) - (a.f.weight || 1));
      for (const { f } of fields) {
        if (out.length >= max) break;
        if ((f.label === "Title" || f.label === "Question") && fields.length > 1) continue;   // already visible in the result title
        const tk = tok(f), spans = [];
        terms.forEach((t) => {
          if (t.phrase) { let p = -1; while ((p = tk.n.indexOf(t.phrase, p + 1)) !== -1) spans.push([p, p + t.phrase.length]); }
          else for (let i = 0; i < tk.stems.length; i++) if (RE.search.wordMatches(tk, t, i)) spans.push([tk.starts[i], tk.ends[i]]);
        });
        if (!spans.length) continue;
        spans.sort((a, b) => a[0] - b[0]);
        const first = spans[0][0];
        let a = Math.max(0, first - 110), b = Math.min(f.text.length, first + 170);
        if (a > 0) { const sp = f.text.indexOf(" ", a); if (sp !== -1 && sp < first) a = sp + 1; }
        if (b < f.text.length) { const sp = f.text.lastIndexOf(" ", b); if (sp > first) b = sp; }
        let html = "", pos = a;
        spans.filter((s) => s[0] >= a && s[1] <= b).forEach((s) => {
          if (s[0] < pos) return;
          html += esc(f.text.slice(pos, s[0])) + "<mark>" + esc(f.text.slice(s[0], s[1])) + "</mark>"; pos = s[1];
        });
        html += esc(f.text.slice(pos, b));
        out.push({ label: f.label, html: (a > 0 ? "… " : "") + html + (b < f.text.length ? " …" : "") });
      }
      return out;
    },

    /* Cheap client-side filter for one list page. */
    matches(entry, q) {
      const hay = norm(entry.name + " " + textOf(entry) + " " + (entry.tags || []).join(" "));
      return norm(q).split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
    },
  };
})();
