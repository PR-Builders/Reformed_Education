/* DATA LAYER — the only file that knows where data comes from.
   Pages call RE.data.list / get / all; to move to a database or API later, reimplement
   `load()` (e.g. fetch from an endpoint) and keep these function signatures. */
(function () {
  const cache = {};

  async function fetchJSON(file) {
    let res;
    try { res = await fetch(RE.config.dataPath + file + "?v=" + encodeURIComponent(RE.config.version)); }
    catch (e) {
      const err = new Error("Could not load " + file);
      err.fileProtocol = location.protocol === "file:";
      throw err;
    }
    if (!res.ok) throw new Error(`Could not load ${file} (HTTP ${res.status})`);
    return res.json();
  }

  const fileCache = {};
  const loadFile = (file) => (fileCache[file] = fileCache[file] || fetchJSON(file));

  /* Returns the raw JSON document for a collection (cached). */
  function load(type) {
    if (!cache[type]) {
      const cfg = RE.config.collections[type];
      const file = cfg ? cfg.file : type + ".json";
      cache[type] = fetchJSON(file);
    }
    return cache[type];
  }

  RE.data = {
    /* All entries of a collection: [{ id, name, ... }] */
    async list(type) {
      const doc = await load(type);
      return doc.entries || doc[type] || [];
    },
    async get(type, id) {
      return (await RE.data.list(type)).find((e) => e.id === id) || null;
    },
    /* Every directory collection at once: { seminaries: [...], ... } */
    async all() {
      const types = Object.keys(RE.config.collections);
      const lists = await Promise.all(types.map((t) => RE.data.list(t)));
      return Object.fromEntries(types.map((t, i) => [t, lists[i]]));
    },
    /* Controlled vocabulary for a filter field, e.g. taxonomy("seminaries", "tradition") → [...] */
    async taxonomy(type, field) {
      const doc = await load("taxonomies");
      return (doc[type] && doc[type][field]) || null;
    },
    /* Quiz sets for the index/home pages. `count` is the number of questions; a set with `from_catechism`
       gets its questions generated from that catechism's text only when the quiz itself is opened. */
    async quizzes() {
      const sets = (await load("quizzes")).sets || [];
      const cats = await RE.data.list("catechisms");
      return sets.map((s) => {
        const c = s.from_catechism && cats.find((x) => x.id === s.from_catechism);
        return Object.assign({}, s, { count: s.from_catechism ? (c ? c.count : 0) : (s.questions || []).length });
      });
    },
    async quiz(id) {
      const s = (await RE.data.quizzes()).find((x) => x.id === id);
      if (!s || !s.from_catechism) return s || null;
      const cat = await RE.data.catechism(s.from_catechism);
      const qs = (cat && cat.questions) || [];
      const shuffled = (a) => a.slice().sort(() => Math.random() - 0.5);
      const questions = qs.map((q) => {
        const wrong = shuffled(qs.filter((x) => x.n !== q.n).map((x) => x.answer)).slice(0, 3);
        const choices = shuffled([q.answer, ...wrong]);
        return { id: `${cat.id}-${q.n}`, prompt: `${q.n}. ${q.question}`, choices, answer: choices.indexOf(q.answer) };
      });
      return Object.assign({}, s, { questions });
    },
    /* Catechism helpers */
    /* One catechism with its questions (loaded from data/catechisms/<id>.json on demand). */
    async catechism(id) {
      const e = await RE.data.get("catechisms", id);
      if (!e) return null;
      if (!e.file) return Object.assign({ questions: [] }, e);
      const doc = await loadFile(e.file);
      return Object.assign({}, e, { questions: doc.questions || [], front_matter: doc.front_matter || [], chapters: doc.chapters || [] });
    },
  };
})();
