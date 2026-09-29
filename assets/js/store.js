/* Thin wrapper over localStorage (progress, scores). Fails soft if storage is unavailable. */
(function () {
  const PREFIX = "reformed-education:";
  RE.store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
      catch (e) { return false; }
    },
    /* Quiz score history: [{ set, score, total, timed, date }] */
    addScore(entry) {
      const all = RE.store.get("scores", []);
      all.push(Object.assign({ date: new Date().toISOString() }, entry));
      RE.store.set("scores", all.slice(-200));
    },
    scoresFor(setId) { return RE.store.get("scores", []).filter((s) => s.set === setId); },
  };
})();
