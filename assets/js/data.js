/* DATA LAYER — the only file that knows where data comes from.
   Pages call RE.data.list / get / all; to move to a database or API later, reimplement
   `load()` (e.g. fetch from an endpoint) and keep these function signatures. */
(function () {
  const cache = {};

  async function fetchJSON(file) {
    let res;
    try { res = await fetch(RE.config.dataPath + file); }
    catch (e) {
      const err = new Error("Could not load " + file);
      err.fileProtocol = location.protocol === "file:";
      throw err;
    }
    if (!res.ok) throw new Error(`Could not load ${file} (HTTP ${res.status})`);
    return res.json();
  }

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
    quizzes: async () => (await load("quizzes")).sets || [],
    async quiz(id) { return (await RE.data.quizzes()).find((s) => s.id === id) || null; },
    /* Catechism helpers */
    catechism: (id) => RE.data.get("catechisms", id),
  };
})();
