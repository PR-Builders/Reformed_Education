# Reformed Education

*Reformed education and resources, in one place.*  
Latin motto: *Quaere et Disce* (“Seek and learn”)

A directory and resource hub for Reformed Christian education: seminaries, colleges, Christian schools, online courses, catechisms, books, lectures, podcasts, quizzes and more.

**Status: early foundation.** Directory entries are name-only listings awaiting research (`[Placeholder — information to be added]`). The Westminster Shorter Catechism is complete (107 questions with KJV Scripture proofs, public domain). The Larger Catechism (196 questions with KJV proofs, needs a proofread) and Fisher's Catechism (about 3,800 questions, needs a proofread) are added; other documents are planned. Nothing has been invented; real content is added only from verified or approved sources.

## Architecture

Static HTML, CSS and vanilla JavaScript. No backend, database, accounts, build step, analytics or framework.

```
index.html, education.html, about.html, search.html
seminaries.html colleges.html schools.html courses.html resources.html   directory lists (shells)
entry.html                 generic directory detail (?type=…&id=…)
catechisms.html            catechism index
catechism.html             Browse / Flashcards / Memorize / Random (?id=wsc&mode=…)
question.html              single question page
quizzes.html, quiz.html    quiz index and runner
assets/css/                tokens.css (brand) · base.css · components.css
assets/js/
  config.js                site nav, categories, and per-collection field config
  data.js                  DATA LAYER — the only code that reads data
  search.js                one index across every collection
  store.js                 localStorage wrapper (progress, quiz scores)
  ui.js                    reusable components (cards, detail facts, badges)
  layout.js                shared header/footer; boots the page script
  pages/*.js               one small script per page
data/*.json                content
```

Scripts are classic (non-module) so the code has no build step. The design follows the *Reformed Education Brand Sheet*: Covenant Ink, Parchment, Reformation Gold, with Geneva Navy and Vellum accents, Cormorant Garamond headings and Lora body. The seal is `assets/img/seal.svg`. Fonts load from Google Fonts, with Georgia as the fallback.

## Run locally

Browsers block `fetch` of local files, so the JSON data cannot load from a bare `file://` page. Serve the folder:

```
python3 -m http.server 8000
# open http://localhost:8000
```

(Any static server works, e.g. `npx serve`.) If you open `index.html` directly, the site shows a message explaining this.

## Deploy on GitHub Pages

Before each deploy run `python3 tools/bump_version.py`. GitHub Pages lets browsers cache files for 10 minutes, and the version stamp on every script, stylesheet and data request stops a browser mixing old and new files (which shows up as odd errors right after an update).


1. Push the repository to GitHub.
2. **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder `/ (root)`.
3. The site appears at `https://<user>.github.io/<repo>/`. All links are relative, so a project subpath works.

## Where the data lives

`/data`: `seminaries`, `colleges`, `schools`, `courses`, `resources`, `catechisms`, `quizzes` (`.json`). Entries share a shape: `id`, `name`, `description`, `tags`, `placeholder`, plus type-specific fields. Any missing value should be `"[Placeholder — information to be added]"`. Placeholder-aware rendering and the "Placeholder entry" badge come from `placeholder: true`.

**Add a new directory collection** (e.g. books, people): add a JSON file, then add one block to `collections` in `assets/js/config.js` (label, fields, filters) and copy one of the small list-page shells. Search, cards and detail pages work automatically.

## Directory content status

Entries were seeded from the owner's preliminary research as **names only**. Each carries `"verification": "listed"` (shown as a *Details pending* badge); every other field is a placeholder until researched from the institution's own website. Move an entry to `researched` and then `verified` (which requires a cited source URL) as details are confirmed.

- **Vocabularies:** Filter values (seminary tradition/delivery/degrees, school emphasis, subjects, officer role) live in `data/taxonomies.json`. Filters appear only when at least one entry uses a value.
- **Related entries:** an entry may list `"related": [{ "type": "publishers", "id": "…" }]`, e.g. an author linking to books, courses and lectures.
- **Categories:** seminaries, colleges, schools, courses, catechisms, library (publishers, authors, podcasts, lectures, resources), family, officers, quizzes.

## Catechism data layout

`data/catechisms.json` holds metadata only (name, group, source, `count`, `file`). Each catechism's questions live in `data/catechisms/<id>.json`, loaded on demand by `RE.data.catechism(id)`, so the home and directory pages stay small. The Westminster Shorter and Larger Catechisms and Fisher's Catechism (about 3,800 explanatory questions, grouped by `topic` under each Shorter Catechism question) are included. To add another, drop its file in `data/catechisms/`, add its entry to `catechisms.json` and run `python3 tools/validate_data.py`.

## Interactive tools

The catechism page (`catechism.html?id=wsc`) offers Study (Q&A, Scripture proofs, topics, search), Practice (flashcards, fill in the blank, multiple choice, random, memorize) and Games (10 / 25 / full challenge with optional timer, and streak). Data comes from the catechism's `questions` array (`question`, `answer`, optional `topic`, and `proofs` as `{ ref, text }` KJV citations). The catechism's quiz set is generated from the same text (`from_catechism` in `quizzes.json`). Multiple choice draws distractors from the other answers, so each new catechism gets every mode automatically. Progress, scores and best streaks are stored in `localStorage` only.

## Sources & attribution

The site is a catalog: it links to, describes and credits original sources rather than republishing them. Policy is shown to visitors on `sources.html`.

Every entry, catechism and quiz set has a `source` record:

```json
"source": {
  "title": "", "author": "", "organization": "", "url": "https://…", "date": "",
  "edition": "", "translation": "",
  "copyright_status": "retained | public-domain | licensed | unknown",
  "copyright": "", "license": "", "notes": ""
}
```

- Unknown values stay `"[Placeholder — information to be added]"`. Never guess.
- If `copyright` or `notes` are omitted, site defaults apply (`citationDefaults` in `config.js`): *"Copyright retained by original publisher."* / *"Resource indexed for educational and directory purposes."*
- Components in `ui.js`: `RE.ui.citation()` (full block with a "Visit the original source" button and a formatted "Cite as" line), `RE.ui.citeLine()` (one-line credit on cards), `RE.ui.quote()` (attributed quotation, capped at 300 characters).
- **Catechisms/confessions** must record the `edition` and `translation` used (e.g. a named publisher's or denomination's edition). The catechisms are public domain, so their source record notes that and needs no publisher. Scripture proofs and quotations use the King James Version. Any non-public-domain text still needs permission and a named edition.
- Add brief quotations to an entry as `"quotes": [{ "text": "…", "source": { "author": "…", "title": "…", "url": "…" } }]`.
- Run `python3 tools/validate_data.py` before committing data. It fails on a missing `source`, non-http(s) URLs, public-domain claims with no named source, over-long quotes, or catechism text with no edition.

## Migrating to a database later

Pages never touch JSON directly. They only call `RE.data.list(type)`, `RE.data.get(type, id)`, `RE.data.all()`, `RE.data.quizzes()` in `assets/js/data.js`. To move to Supabase, Postgres behind an API, or similar:

1. Reimplement `load()` / `list()` / `get()` in `data.js` to call the new source, and keep the return shapes.
2. Optionally replace `RE.search.query` with a server-side full-text search.
3. Replace `localStorage` score tracking in `store.js` when accounts arrive.

No page, component or stylesheet needs to change.

## Not included (by design)

No custom domain, accounts, authentication, analytics, advertising or external services.
