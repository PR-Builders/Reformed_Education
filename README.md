# Reformed Education

*Reformed education and resources, in one place.*

A directory and resource hub for Reformed Christian education: seminaries, colleges, Christian schools, online courses, catechisms, books, lectures, podcasts, quizzes and more.

**Status: initial frontend foundation.** All directory entries, catechism text and quiz questions are **placeholders** (`[Placeholder — information to be added]`). Nothing has been invented. Real content is added only from verified or approved sources.

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

1. Push the repository to GitHub.
2. **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder `/ (root)`.
3. The site appears at `https://<user>.github.io/<repo>/`. All links are relative, so a project subpath works.

## Where the data lives

`/data`: `seminaries`, `colleges`, `schools`, `courses`, `resources`, `catechisms`, `quizzes` (`.json`). Entries share a shape: `id`, `name`, `description`, `tags`, `placeholder`, plus type-specific fields. Any missing value should be `"[Placeholder — information to be added]"`. Placeholder-aware rendering and the "Placeholder entry" badge come from `placeholder: true`.

**Add a new directory collection** (e.g. books, people): add a JSON file, then add one block to `collections` in `assets/js/config.js` (label, fields, filters) and copy one of the small list-page shells. Search, cards and detail pages work automatically.

## Migrating to a database later

Pages never touch JSON directly. They only call `RE.data.list(type)`, `RE.data.get(type, id)`, `RE.data.all()`, `RE.data.quizzes()` in `assets/js/data.js`. To move to Supabase, Postgres behind an API, or similar:

1. Reimplement `load()` / `list()` / `get()` in `data.js` to call the new source, and keep the return shapes.
2. Optionally replace `RE.search.query` with a server-side full-text search.
3. Replace `localStorage` score tracking in `store.js` when accounts arrive.

No page, component or stylesheet needs to change.

## Not included (by design)

No custom domain, accounts, authentication, analytics, advertising or external services.
