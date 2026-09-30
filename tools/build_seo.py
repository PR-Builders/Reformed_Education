#!/usr/bin/env python3
"""Search-engine build for the static site. Run after any content or code change:

    python3 tools/build_seo.py            # pre-render pages, write sitemap.xml, robots.txt, llms.txt, feed.xml ...
    python3 tools/build_seo.py --bump     # also re-stamp script/style versions first (do this when JS or CSS changed)
    python3 tools/build_seo.py --check    # only verify that every page the data needs has been generated

What it makes (all committed, so GitHub Pages needs no build step):
  * a pre-rendered, crawlable HTML page at a clean URL for every directory entry, article, topic, catechism,
    catechism question and confession chapter (for example resources/sibbes-the-bruised-reed/, topics/biblical-counseling/depression/,
    catechisms/wsc/1/). The site's own JavaScript renders each page in headless Chromium and the result is saved,
    so the text is in the HTML for search engines, link previews and readers without JavaScript; the page still hydrates as normal.
  * a unique <title>, meta description, canonical URL, Open Graph / Twitter tags and JSON-LD structured data on every page
  * sitemap.xml, sitemap.html (a plain-link map of the whole site), robots.txt, llms.txt, feed.xml (Atom, articles), 404.html
    and assets/img/og-default.png (the link-preview image)
The canonical address comes from `siteUrl` in assets/js/config.js.

Needs Node with Playwright installed globally and Chromium (see README)."""
import html, json, os, pathlib, re, shutil, subprocess, sys, tempfile, time, socket, datetime
from urllib.parse import urlparse

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CHECK = "--check" in sys.argv
PLACEHOLDER = "[Placeholder — information to be added]"
SITE_NAME = "Reformed Education"
TAGLINE = "Reformed education and resources, in one place."
OG_IMAGE = "assets/img/og-default.png"
SKIP_QUESTION_PAGES = {"fishers"}  # about 3,800 questions; the document page is generated, the individual questions are not

cfg_js = (ROOT / "assets/js/config.js").read_text()
SITE_URL = re.search(r'siteUrl:\s*"([^"]+)"', cfg_js).group(1)
if not SITE_URL.endswith("/"): SITE_URL += "/"
VERSION = re.search(r'version:\s*"([^"]+)"', cfg_js).group(1)
E = lambda s: html.escape(str(s), quote=True)


def load(name): return json.loads((DATA / name).read_text())


def clean(s, n=155):
    s = re.sub(r"\s+", " ", re.sub(r"\{[a-z]{1,2}\}", "", str(s or ""))).strip()
    if PLACEHOLDER in s: s = s.replace(PLACEHOLDER, "").strip()
    if len(s) <= n: return s
    head = s[:n]
    ends = [m.end() for m in re.finditer(r"[.?!](?=\s|$)", head)]
    if ends and ends[-1] >= 70: return head[:ends[-1]].strip()
    return head.rsplit(" ", 1)[0].rstrip(",;:—-") + "…"


def real(v): return bool(v) and PLACEHOLDER not in str(v)


def ok_title(t):  # keep titles near 60 characters
    return t if len(t) <= 62 else t[:59].rsplit(" ", 1)[0] + "…"


# ---------------------------------------------------------------- the pages the data calls for
def collect(facts):
    col = facts["collections"]
    pages = []
    for type_, c in col.items():
        if type_ == "catechisms": continue
        for e in load(c["file"])["entries"]:
            pages.append(dict(kind="entry", type=type_, entry=e, cfg=c, path=f"{type_}/{e['id']}/",
                              shell="article.html" if type_ == "articles" else "entry.html",
                              params={"id": e["id"]} if type_ == "articles" else {"type": type_, "id": e["id"]},
                              lastmod=lastmod(c["file"])))
    cats = load("catechisms.json")["entries"]
    for e in cats:
        chapters = e.get("structure") == "chapters"
        doc = json.loads((DATA / e["file"]).read_text()) if e.get("file") and (DATA / e["file"]).exists() else {}
        pages.append(dict(kind="cat-doc", type="catechisms", entry=e, doc=doc, chapters=chapters, path=f"catechisms/{e['id']}/",
                          shell="confession.html" if chapters else "catechism.html", params={"id": e["id"]}, lastmod=lastmod("catechisms.json")))
        if chapters and len(doc.get("chapters", [])) > 1:
            for ch in doc.get("chapters", []):
                pages.append(dict(kind="chapter", type="catechisms", entry=e, ch=ch, path=f"catechisms/{e['id']}/{ch['n']}/", shell="confession.html",
                                  params={"id": e["id"], "ch": str(ch["n"])}, lastmod=lastmod("catechisms.json")))
        elif e["id"] not in SKIP_QUESTION_PAGES:
            for q in doc.get("questions", []):
                pages.append(dict(kind="question", type="catechisms", entry=e, q=q, path=f"catechisms/{e['id']}/{q['n']}/", shell="question.html",
                                  params={"id": e["id"], "q": str(q["n"])}, lastmod=lastmod("catechisms.json")))
    for t in facts["topics"]:
        pages.append(dict(kind="topic", topic=t, path=f"topics/{t['path']}/", shell="topics.html", params={"t": t["path"]}, lastmod=lastmod("topics.json")))
    return pages


_lm = {}
def lastmod(fn):
    if fn not in _lm:
        try:
            d = subprocess.run(["git", "log", "-1", "--format=%cs", "--", f"data/{fn}"], cwd=ROOT, capture_output=True, text=True).stdout.strip()
        except Exception: d = ""
        _lm[fn] = d or datetime.date.today().isoformat()
    return _lm[fn]


# ---------------------------------------------------------------- metadata for each page
def meta_for(p, facts):
    col = facts["collections"]
    crumbs = [("Home", "")]
    kind = p["kind"]
    ld = None
    og_type = "website"
    robots = "index,follow,max-image-preview:large,max-snippet:-1"
    if kind == "entry":
        e, c, t = p["entry"], p["cfg"], p["type"]
        name = e["name"]
        crumbs += [(c["label"], c["page"]), (name, p["path"])]
        title = ok_title(f"{name} — {c['singular']}") if t != "articles" else ok_title(name)
        desc = clean(e.get("description")) or f"{name}: a {c['singular'].lower()} listed in the Reformed Education directory."
        if len(desc) < 70 and t != "articles": desc = clean(f"{desc} Listed in the Reformed Education directory with its source, doctrinal basis and points to weigh.".strip())
        if e.get("placeholder") or e.get("verification") == "listed": robots = "noindex,follow"
        url = SITE_URL + p["path"]
        sameas = [e["website"]] if real(e.get("website")) and str(e.get("website")).startswith("http") else []
        base = {"@type": "WebPage", "@id": url, "url": url, "name": name, "description": desc, "isPartOf": {"@id": SITE_URL + "#website"}}
        if t == "articles":
            og_type = "article"
            dm = re.search(r"\d{4}-\d{2}-\d{2}", e.get("date", ""))
            base = {"@type": "Article", "@id": url, "url": url, "headline": name, "description": desc, "inLanguage": "en",
                    "author": {"@type": "Organization", "name": SITE_NAME}, "publisher": {"@id": SITE_URL + "#org"}, "mainEntityOfPage": url,
                    "isPartOf": {"@id": SITE_URL + "#website"}, "image": SITE_URL + OG_IMAGE}
            if dm: base["datePublished"] = dm.group(0); base["dateModified"] = p["lastmod"] if p["lastmod"] >= dm.group(0) else dm.group(0)
        else:
            about = None
            if t in ("seminaries", "colleges", "schools"):
                about = {"@type": "CollegeOrUniversity" if t in ("seminaries", "colleges") else "EducationalOrganization", "name": name}
            elif t == "churches": about = {"@type": "Church", "name": name}
            elif t in ("denominations", "publishers", "courses"): about = {"@type": "Organization", "name": name}
            elif t == "authors": about = {"@type": "Person", "name": name}
            elif t == "podcasts": about = {"@type": "PodcastSeries", "name": name}
            elif e.get("kind") == "Book": about = {"@type": "Book", "name": name}
            if about:
                if real(e.get("website")) and str(e["website"]).startswith("http"): about["url"] = e["website"]
                if real(e.get("description")): about["description"] = clean(e["description"], 300)
                if about["@type"] == "Book":
                    if real(e.get("creator")): about["author"] = {"@type": "Person", "name": e["creator"]} if not re.search(r"Founded|Association|Foundation|Press|Ministries", e["creator"]) else {"@type": "Organization", "name": e["creator"]}
                    if real(e.get("publisher")): about["publisher"] = {"@type": "Organization", "name": re.sub(r"\s*\(.*$|,\s*\d{4}.*$", "", e["publisher"])}
                base["about"] = about
        ld = base
    elif kind == "cat-doc":
        e = p["entry"]
        crumbs += [("Catechisms", "catechisms.html"), (e["name"], p["path"])]
        title = ok_title(f"{e['name']}: full text with Scripture proofs" if e.get("kind") != "Creed" else f"{e['name']}: text and background")
        desc = clean(e.get("description")) or f"{e['name']}."
        if e.get("source", {}).get("copyright_status") == "public-domain": desc = clean(desc + " Public-domain text.", 158)
        url = SITE_URL + p["path"]
        ld = {"@type": "Book" if e.get("kind") in ("Catechism", "Confession") else "CreativeWork", "@id": url, "url": url, "name": e["name"], "description": desc,
              "inLanguage": "en", "isAccessibleForFree": True, "isPartOf": {"@id": SITE_URL + "#website"}}
        if e.get("source", {}).get("copyright_status") == "public-domain": ld["license"] = "https://creativecommons.org/publicdomain/mark/1.0/"
    elif kind == "chapter":
        e, ch = p["entry"], p["ch"]
        unit = e.get("unit", "chapter")
        label = f"{ch['numeral']}" if unit != "article" else f"{ch['numeral']}"
        crumbs += [("Catechisms", "catechisms.html"), (e["short"], f"catechisms/{e['id']}/"), (f"{ch['numeral']}. {ch['title']}" if ch.get("title") else str(ch["numeral"]), p["path"])]
        one = e.get("kind") == "Creed" or not ch.get("title")
        title = ok_title(f"{e['name']}" if one else f"{e['short']} {unit.capitalize()} {ch['numeral']}: {ch['title']}")
        first = (ch.get("sections") or [{}])[0].get("text", "")
        desc = clean(f"{e['name']}, {unit} {ch['numeral']}" + (f", {ch['title']}" if ch.get("title") else "") + f". {first}")
        url = SITE_URL + p["path"]
        ld = {"@type": "WebPage", "@id": url, "url": url, "name": title, "description": desc, "inLanguage": "en", "isAccessibleForFree": True,
              "isPartOf": {"@type": "Book", "name": e["name"], "url": SITE_URL + f"catechisms/{e['id']}/"}}
    elif kind == "question":
        e, q = p["entry"], p["q"]
        crumbs += [("Catechisms", "catechisms.html"), (e["short"], f"catechisms/{e['id']}/"), (f"Question {q['n']}", p["path"])]
        title = ok_title(f"{e['short']} Q{q['n']}: {q['question']}")
        desc = clean(f"{q['question']} {q['answer']}")
        url = SITE_URL + p["path"]
        ld = {"@type": "WebPage", "@id": url, "url": url, "name": title, "description": desc, "inLanguage": "en", "isAccessibleForFree": True,
              "isPartOf": {"@type": "Book", "name": e["name"], "url": SITE_URL + f"catechisms/{e['id']}/"},
              "mainEntity": {"@type": "Question", "name": q["question"], "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"\{[a-z]{1,2}\}", "", q["answer"])}}}
    elif kind == "topic":
        t = p["topic"]
        parts = t["path"].split("/")
        names = {x["path"]: x["name"] for x in facts["topics"]}
        crumbs += [("Topics", "topics.html")] + [(names.get("/".join(parts[:i + 1]), parts[i]), f"topics/{'/'.join(parts[:i + 1])}/") for i in range(len(parts))]
        title = ok_title(f"{t['name']}: Reformed books, courses and more")
        n = t["count"]
        desc = clean(t["blurb"]) or f"Reformed resources on {t['name'].lower()}."
        if len(desc) < 110: desc = clean(f"{desc.rstrip('.')}. {n} Reformed book{'s' if n != 1 else ''}, podcast{'s' if n != 1 else ''}, course{'s' if n != 1 else ''} and other resource{'s' if n != 1 else ''} on Reformed Education, each with its source.", 158)
        url = SITE_URL + p["path"]
        ld = {"@type": "CollectionPage", "@id": url, "url": url, "name": t["name"], "description": desc, "isPartOf": {"@id": SITE_URL + "#website"}}
    p["title_full"] = title
    p["title"] = title if SITE_NAME in title else f"{title} | {SITE_NAME}"
    p["desc"] = desc
    p["crumbs"] = crumbs
    p["ld"] = ld
    p["robots"] = robots
    p["og_type"] = og_type
    p["url"] = SITE_URL + p["path"]
    return p


def breadcrumb_ld(crumbs):
    return {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": SITE_URL + h} for i, (n, h) in enumerate(crumbs)]}


ORG = {"@type": "Organization", "@id": None, "name": SITE_NAME, "url": None, "logo": None, "description": TAGLINE}
SITE = {"@type": "WebSite", "@id": None, "url": None, "name": SITE_NAME, "description": TAGLINE, "inLanguage": "en", "publisher": {"@id": None},
        "potentialAction": {"@type": "SearchAction", "target": {"@type": "EntryPoint", "urlTemplate": None}, "query-input": "required name=search_term_string"}}


def site_graph():
    org = dict(ORG, **{"@id": SITE_URL + "#org", "url": SITE_URL, "logo": SITE_URL + "assets/img/seal.svg"})
    site = json.loads(json.dumps(SITE))
    site.update({"@id": SITE_URL + "#website", "url": SITE_URL}); site["publisher"] = {"@id": SITE_URL + "#org"}
    site["potentialAction"]["target"]["urlTemplate"] = SITE_URL + "search.html?q={search_term_string}"
    return [org, site]


# ---------------------------------------------------------------- HTML assembly
def meta_block(title, desc, url, robots, og_type, ld_nodes):
    ld = json.dumps({"@context": "https://schema.org", "@graph": ld_nodes}, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    img = SITE_URL + OG_IMAGE
    return f"""<title>{E(title)}</title>
  <meta name="description" content="{E(desc)}">
  <meta name="robots" content="{robots}">
  <link rel="canonical" href="{E(url)}">
  <meta name="theme-color" content="#1f2a44">
  <meta property="og:site_name" content="{SITE_NAME}">
  <meta property="og:locale" content="en_US">
  <meta property="og:type" content="{og_type}">
  <meta property="og:title" content="{E(title)}">
  <meta property="og:description" content="{E(desc)}">
  <meta property="og:url" content="{E(url)}">
  <meta property="og:image" content="{img}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{SITE_NAME}: {E(TAGLINE)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{E(title)}">
  <meta name="twitter:description" content="{E(desc)}">
  <meta name="twitter:image" content="{img}">
  <link rel="alternate" type="application/atom+xml" title="{SITE_NAME}: articles" href="{SITE_URL}feed.xml">
  <script type="application/ld+json">{ld}</script>"""


def head_html(title, desc, url, robots, og_type, ld_nodes, css_links, base=None):
    return f"""<meta charset="utf-8">
  {f'<base href="{base}">' if base else ''}
  <meta name="viewport" content="width=device-width, initial-scale=1">
  {meta_block(title, desc, url, robots, og_type, ld_nodes)}
  <link rel="icon" href="assets/img/seal.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
{css_links}"""


def shell_parts(shell):
    t = (ROOT / shell).read_text()
    fonts = re.search(r'<link href="https://fonts\.googleapis[^>]+>', t).group(0)
    css = "\n".join(re.findall(r'  <link rel="stylesheet"[^>]+>', t))
    body_open = re.search(r"<body[^>]*>", t).group(0)
    return f"  {fonts}\n{css}", body_open


def page_doc(head, body_open, body_inner, params=None):
    if params is not None:
        inject = f"  <script>window.RE_PARAMS={json.dumps(params, separators=(',', ':'))};</script>\n"
        body_inner = body_inner.replace("<script src=", inject + "  <script src=", 1) if "<script src=" in body_inner else body_inner + inject
    return f"<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  {head}\n</head>\n{body_open}\n{body_inner}\n</body>\n</html>\n"


# ---------------------------------------------------------------- root pages (hand-edited shells): head only
ROOT_PAGES = {
    "index.html": ("Reformed Education — Reformed education and resources, in one place", "A free directory and resource hub for Reformed Christian education: seminaries, colleges, Christian schools, catechisms and confessions, books, podcasts, courses, churches and denominations.", "website"),
    "browse.html": ("Browse the Reformed Education directory", "Browse every directory on Reformed Education: seminaries, colleges, Christian schools, courses, catechisms, books and resources, podcasts, authors, churches, denominations and articles.", "website"),
    "topics.html": ("Topics: Reformed resources by subject", "Find Reformed books, podcasts, lectures, courses and catechisms by topic: theology, biblical counseling, church life, Christian education, science, technology and more.", "website"),
    "catechisms.html": ("Reformed catechisms and confessions, with Scripture proofs", "Read the Westminster Standards, Heidelberg Catechism, Belgic Confession, Canons of Dort, Second Helvetic Confession, 1689 Baptist Confession and the ecumenical creeds, with proof texts and study tools.", "website"),
    "quizzes.html": ("Reformed catechism quizzes", "Test yourself on the catechisms with short quizzes.", "website"),
    "about.html": ("About Reformed Education", "What Reformed Education is, how entries are researched and marked, and what this site does and does not do.", "website"),
    "sources.html": ("Sources and copyright", "How Reformed Education cites its sources, what text it reproduces, and the copyright status of each resource.", "website"),
}
NOINDEX_ROOT = {"search.html": "Search — Reformed Education", "entry.html": "Directory entry — Reformed Education", "question.html": "Catechism question — Reformed Education",
                "confession.html": "Confession — Reformed Education", "catechism.html": "Catechism — Reformed Education", "article.html": "Article — Reformed Education",
                "quiz.html": "Quiz — Reformed Education"}

SEO_START, SEO_END = "<!-- seo:start -->", "<!-- seo:end -->"


def rewrite_root_head(fn, title, desc, robots, og_type, facts):
    f = ROOT / fn
    t = f.read_text()
    url = SITE_URL + ("" if fn == "index.html" else fn)
    nodes = site_graph() + [{"@type": "WebPage", "@id": url, "url": url, "name": title, "description": desc, "isPartOf": {"@id": SITE_URL + "#website"}}]
    if fn != "index.html": nodes.append(breadcrumb_ld([("Home", ""), (title.split(":")[0].split(" — ")[0], fn)]))
    mb = meta_block(title, desc, url, robots, og_type, nodes)
    if "noindex" in robots: mb = re.sub(r'\s*<link rel="canonical"[^>]*>', "", mb)
    block = f"{SEO_START}\n  {mb}\n  {SEO_END}"
    t = re.sub(r"\s*" + SEO_START + r".*?" + SEO_END, "", t, flags=re.S)
    t = re.sub(r"\s*<title>.*?</title>", "", t, count=1, flags=re.S)
    t = re.sub(r'\s*<meta name="description"[^>]*>', "", t, count=1)
    t = re.sub(r'\s*<link rel="canonical"[^>]*>', "", t, count=1)
    t = re.sub(r'(<meta name="viewport"[^>]*>)', lambda m: m.group(1) + "\n  " + block, t, count=1)
    f.write_text(t)


def collection_page_meta(facts):
    out = {}
    for type_, c in facts["collections"].items():
        out[c["page"]] = (f"{c['label']}: Reformed Education directory", c.get("intro") or f"{c['label']} in the Reformed Education directory.", "website")
    return out


# ---------------------------------------------------------------- the build
def free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p


def write_site_files(pages, facts):
    indexable = [p for p in pages if "noindex" not in p["robots"]]
    urls, seen = [], set()
    for fn in list(ROOT_PAGES) + [v["page"] for k, v in facts["collections"].items()] + ["sitemap.html"]:
        if fn in seen: continue
        seen.add(fn); urls.append((fn, SITE_URL + ("" if fn == "index.html" else fn), lastmod("catechisms.json") if fn == "catechisms.html" else ""))
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    def add(loc, lm=None, pr=None):
        sm.append(f"  <url><loc>{E(loc)}</loc>" + (f"<lastmod>{lm}</lastmod>" if lm else "") + (f"<priority>{pr}</priority>" if pr else "") + "</url>")
    for fn, loc, lm in urls: add(loc, lm or None, "1.0" if fn == "index.html" else "0.8")
    for p in indexable: add(p["url"], p.get("lastmod"), "0.7" if p["kind"] in ("entry", "topic", "cat-doc") else "0.5")
    sm.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sm) + "\n")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}sitemap.xml\n")

    arts = sorted([p for p in pages if p["kind"] == "entry" and p["type"] == "articles"], key=lambda p: p["entry"].get("date", ""), reverse=True)
    feed = ['<?xml version="1.0" encoding="utf-8"?>', '<feed xmlns="http://www.w3.org/2005/Atom">', f"  <title>{SITE_NAME}: articles</title>",
            f'  <link href="{SITE_URL}feed.xml" rel="self"/>', f'  <link href="{SITE_URL}articles.html"/>', f"  <id>{SITE_URL}</id>",
            f"  <updated>{max([lastmod('articles.json')] + [''])}T00:00:00Z</updated>", f"  <subtitle>{E(TAGLINE)}</subtitle>"]
    for p in arts:
        d = (re.search(r"\d{4}-\d{2}-\d{2}", p["entry"].get("date", "")) or [lastmod("articles.json")])
        d = d if isinstance(d, str) else d.group(0)
        feed.append(f"  <entry><title>{E(p['entry']['name'])}</title><link href=\"{E(p['url'])}\"/><id>{E(p['url'])}</id><updated>{d}T00:00:00Z</updated>"
                    f"<author><name>{SITE_NAME}</name></author><summary>{E(p['desc'])}</summary></entry>")
    feed.append("</feed>")
    (ROOT / "feed.xml").write_text("\n".join(feed) + "\n")

    col = facts["collections"]
    top = [t for t in facts["topics"] if not t["parent"]]
    lines = [f"# {SITE_NAME}", "", f"> {TAGLINE} A free, static directory and resource hub for Reformed Christian education: seminaries, colleges, schools, catechisms and confessions, books, podcasts, courses, churches and denominations. Every entry cites its source; unknown details are marked as placeholders rather than guessed.", "",
             "Editorial positions (for example on Genesis 1 and on public schooling) are labelled as this site's position, separate from the facts recorded about each institution.", "", "## Directories", ""]
    for k, c in col.items(): lines.append(f"- [{c['label']}]({SITE_URL}{c['page']}): {clean(c.get('intro'), 140)}")
    lines += ["", "## Topics", ""] + [f"- [{t['name']}]({SITE_URL}topics/{t['path']}/): {clean(t['blurb'], 120)}" for t in top]
    lines += ["", "## Articles", ""] + [f"- [{p['entry']['name']}]({p['url']}): {clean(p['entry'].get('description'), 140)}" for p in arts]
    lines += ["", "## Full list of pages", "", f"- [Site map]({SITE_URL}sitemap.html)", f"- [sitemap.xml]({SITE_URL}sitemap.xml)", ""]
    (ROOT / "llms.txt").write_text("\n".join(lines))

    # HTML sitemap: plain links to every page, grouped
    def li(href, text): return f'<li><a href="{E(href)}">{E(text)}</a></li>'
    groups = []
    for k, c in col.items():
        if k == "catechisms": continue
        items = sorted([p for p in pages if p["kind"] == "entry" and p["type"] == k and "noindex" not in p["robots"]], key=lambda p: p["entry"]["name"].lower())
        if items: groups.append(f'<section class="sm-group"><h2><a href="{c["page"]}">{E(c["label"])}</a></h2><ul class="sm-list">' + "".join(li(p["path"], p["entry"]["name"]) for p in items) + "</ul></section>")
    tp = sorted([p for p in pages if p["kind"] == "topic"], key=lambda p: p["topic"]["path"])
    groups.append('<section class="sm-group"><h2><a href="topics.html">Topics</a></h2><ul class="sm-list">' + "".join(li(p["path"], ("— " * p["topic"]["path"].count("/")) + p["topic"]["name"]) for p in tp) + "</ul></section>")
    cs = []
    for p in pages:
        if p["kind"] == "cat-doc":
            e = p["entry"]; sub = [q for q in pages if q["kind"] in ("question", "chapter") and q["entry"]["id"] == e["id"]]
            cs.append(f'<li><a href="{p["path"]}">{E(e["name"])}</a>' + (f' <span class="muted">({len(sub)} pages)</span>' if sub else "") + (f'<ul class="sm-list sm-sub">' + "".join(li(q["path"], q["crumbs"][-1][0] if q["kind"] == "chapter" else f"Question {q['q']['n']}") for q in sub) + "</ul>" if sub and len(sub) <= 200 else "") + "</li>")
    groups.append('<section class="sm-group"><h2><a href="catechisms.html">Catechisms, confessions and creeds</a></h2><ul class="sm-list sm-tree">' + "".join(cs) + "</ul></section>")
    css, body_open = shell_parts("about.html")
    title, desc = "Site map: every page on Reformed Education", "A plain list of every directory entry, topic, article, catechism, confession chapter and question on Reformed Education."
    nodes = site_graph() + [{"@type": "CollectionPage", "@id": SITE_URL + "sitemap.html", "url": SITE_URL + "sitemap.html", "name": title, "description": desc, "isPartOf": {"@id": SITE_URL + "#website"}}]
    scripts = "\n".join(re.findall(r'  <script src="assets/js/(?:config|store|data|search|ui|layout)\.js[^>]*></script>', (ROOT / "about.html").read_text()))
    body = f'<main id="main"><div class="page-head"><div class="container"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> <span aria-hidden="true">/</span> <span>Site map</span></nav><h1>Site map</h1><p class="prose">{E(desc)}</p></div></div><div class="container page-body sm">{"".join(groups)}</div></main>\n{scripts}'
    (ROOT / "sitemap.html").write_text(page_doc(head_html(title, desc, SITE_URL + "sitemap.html", "index,follow", "website", nodes, css), body_open.replace(re.search(r'data-page="[^"]*"', body_open).group(0), 'data-page="sitemap"'), body))

    # 404
    base = urlparse(SITE_URL).path or "/"
    css404 = re.sub(r'href="assets/', f'href="{base}assets/', css)
    (ROOT / "404.html").write_text(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page not found | {SITE_NAME}</title>
  <meta name="robots" content="noindex">
  <link rel="icon" href="{base}assets/img/seal.svg" type="image/svg+xml">
{css404}
</head>
<body>
<main id="main" class="container page-body" style="padding-top:64px;text-align:center">
  <img src="{base}assets/img/seal.svg" alt="" width="72" height="72">
  <h1>Page not found</h1>
  <p class="prose">That page is not here, or has moved. <em>Quaere et disce</em>: try one of these.</p>
  <p class="btn-row" style="justify-content:center"><a class="btn btn-primary" href="{base}">Home</a> <a class="btn" href="{base}browse.html">Browse</a> <a class="btn" href="{base}topics.html">Topics</a> <a class="btn" href="{base}search.html">Search</a> <a class="btn" href="{base}sitemap.html">Site map</a></p>
</main>
</body>
</html>
""")


def make_og_image(port):
    out = ROOT / OG_IMAGE
    if out.exists(): return
    js = f"""
const {{ execSync }} = require("child_process");
const {{ chromium }} = require(require("path").join(execSync("npm root -g").toString().trim(), "playwright"));
(async () => {{
  const b = await chromium.launch({{ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" }});
  const p = await b.newPage({{ viewport: {{ width: 1200, height: 630 }} }});
  await p.setContent(`<body style="margin:0;width:1200px;height:630px;background:#1f2a44;color:#f5efe0;font-family:Georgia,serif;display:flex;align-items:center;padding:0 90px;box-sizing:border-box;border-bottom:14px solid #b89a4b">
    <img src="http://127.0.0.1:{port}/assets/img/seal.svg" style="width:230px;height:230px;color:#b89a4b;margin-right:70px">
    <div><div style="font-size:92px;letter-spacing:1px;line-height:1">Reformed<br>Education</div>
    <div style="font-size:34px;margin-top:28px;color:#e6d9b4">{TAGLINE}</div>
    <div style="font-size:28px;margin-top:18px;font-style:italic;color:#b89a4b">Quaere et Disce</div></div></body>`);
  await p.waitForTimeout(400);
  await p.screenshot({{ path: {json.dumps(str(out))} }});
  await b.close();
}})();"""
    tmp = pathlib.Path(tempfile.mkdtemp()) / "og.js"; tmp.write_text(js)
    subprocess.run(["node", str(tmp)], check=True)


def main():
    facts_file = pathlib.Path(tempfile.mkdtemp()) / "facts.json"
    if CHECK:
        missing = []
        names = {m.group(1): m.group(2) for m in re.finditer(r'(\w+): \{\s*\n\s*file: "([^"]+)"', cfg_js)}
        for t, fn in names.items():
            if t == "catechisms": continue
            for e in load(fn)["entries"]:
                if not (ROOT / t / e["id"] / "index.html").exists(): missing.append(f"{t}/{e['id']}/")
        for e in load("catechisms.json")["entries"]:
            if not (ROOT / "catechisms" / e["id"] / "index.html").exists(): missing.append(f"catechisms/{e['id']}/")
        for fn in ("sitemap.xml", "robots.txt", "llms.txt", "feed.xml", "sitemap.html", "404.html"):
            if not (ROOT / fn).exists(): missing.append(fn)
        if missing:
            print(f"{len(missing)} generated page(s) missing; run python3 tools/build_seo.py\n  " + "\n  ".join(missing[:25])); sys.exit(1)
        print("SEO pages present."); return

    if "--bump" in sys.argv: subprocess.run([sys.executable, str(ROOT / "tools/bump_version.py")], check=True)
    port = free_port()
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1"], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        base_url = f"http://127.0.0.1:{port}/"
        # first pass: facts only (collections and topics the site really shows)
        subprocess.run(["node", str(ROOT / "tools/seo_render.js"), base_url, "/dev/stdin", str(facts_file)], input="[]", text=True, check=True)
        facts = json.loads(facts_file.read_text())
        pages = [meta_for(p, facts) for p in collect(facts)]
        make_og_image(port)
        work = pathlib.Path(tempfile.mkdtemp())
        specs = []
        for i, p in enumerate(pages):
            q = "&".join(f"{k}={v}" for k, v in p["params"].items() if k != "t") if p["kind"] != "topic" else f"t={p['params']['t']}"
            p["tmp"] = work / f"{i}.html"
            specs.append({"url": f"{p['shell']}?{q}", "out": str(p["tmp"])})
        spec_file = work / "specs.json"; spec_file.write_text(json.dumps(specs))
        print(f"rendering {len(specs)} pages ...")
        subprocess.run(["node", str(ROOT / "tools/seo_render.js"), base_url, str(spec_file), str(facts_file)], check=True)
    finally:
        server.terminate()

    # clear old generated pages, then write the new ones
    for d in {p["path"].split("/")[0] for p in pages}:
        shutil.rmtree(ROOT / d, ignore_errors=True)
    shells = {}
    for p in pages:
        depth = p["path"].count("/")
        if p["shell"] not in shells: shells[p["shell"]] = shell_parts(p["shell"])
        css, body_open = shells[p["shell"]]
        nodes = site_graph() + ([p["ld"]] if p["ld"] else []) + [breadcrumb_ld(p["crumbs"])]
        head = head_html(p["title"], p["desc"], p["url"], p["robots"], p["og_type"], nodes, css, base="../" * depth)
        body = p["tmp"].read_text()
        out = ROOT / p["path"] / "index.html"; out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page_doc(head, body_open, body, p["params"]))

    # root pages: titles, descriptions, canonical, social tags
    meta = dict(ROOT_PAGES); meta.update(collection_page_meta(facts))
    for fn, (title, desc, og) in meta.items():
        if (ROOT / fn).exists(): rewrite_root_head(fn, title, desc, "index,follow,max-image-preview:large,max-snippet:-1", og, facts)
    for fn, title in NOINDEX_ROOT.items():
        if (ROOT / fn).exists(): rewrite_root_head(fn, title, "Reformed Education: reformed education and resources, in one place.", "noindex,follow", "website", facts)

    write_site_files(pages, facts)
    n_index = len([p for p in pages if "noindex" not in p["robots"]])
    print(f"done: {len(pages)} pages written ({n_index} indexable), sitemap.xml, sitemap.html, robots.txt, llms.txt, feed.xml, 404.html")


if __name__ == "__main__":
    main()
