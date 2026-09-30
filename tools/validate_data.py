#!/usr/bin/env python3
"""Checks /data for source and attribution problems. Run: python3 tools/validate_data.py
Fails (exit 1) on: missing `source`, non-http(s) URLs, public-domain claims without a source
title/organization, over-long quotes, or non-placeholder catechism text without an edition."""
import json, re, sys, pathlib

DATA = pathlib.Path(__file__).resolve().parent.parent / "data"
PH = re.compile(r"^\[Placeholder", re.I)
MAX_QUOTE = 300
errors = []
TAX = json.load(open(DATA / "taxonomies.json"))
VERIFICATION = {"listed", "researched", "verified"}

def check_entry(w, coll, e):
    if not e.get("placeholder") and e.get("verification") not in VERIFICATION:
        errors.append(f"{w}: non-placeholder entries need verification = listed | researched | verified")
    if e.get("verification") == "verified" and not real((e.get("source") or {}).get("url")):
        errors.append(f"{w}: a verified entry must cite a source url")
    for field, vocab in TAX.get(coll, {}).items():
        vals = e.get(field, [])
        for x in ([vals] if isinstance(vals, str) else vals):
            if real(x) and x not in vocab: errors.append(f"{w}: {field} value {x!r} is not in the {coll}.{field} vocabulary")


def real(v): return isinstance(v, str) and v and not PH.match(v)

def check_source(where, s, need_edition=False):
    if not isinstance(s, dict): errors.append(f"{where}: missing `source` record"); return
    if real(s.get("url")) and not re.match(r"^https?://", s["url"]): errors.append(f"{where}: source.url must be http(s)")
    if s.get("copyright_status") == "public-domain" and not real(s.get("title")):
        errors.append(f"{where}: public-domain works must name a source title")
    if need_edition and not (real(s.get("edition")) or real(s.get("translation"))):
        errors.append(f"{where}: real catechism text requires source.edition/translation")

def check_quotes(where, e):
    for i, q in enumerate(e.get("quotes", [])):
        if len(q.get("text", "")) > MAX_QUOTE: errors.append(f"{where}: quote {i} exceeds {MAX_QUOTE} chars")
        s = q.get("source", {})
        if not (real(s.get("author")) or real(s.get("title"))): errors.append(f"{where}: quote {i} needs author or source title")

def catechism_questions(e):
    if e.get("file"):
        return json.load(open(DATA / e["file"])).get("questions", [])
    return e.get("questions", [])

for f in sorted(DATA.glob("*.json")):
    d = json.load(open(f))
    for e in d.get("entries", []):
        w = f"{f.name}:{e.get('id')}"
        check_source(w, e.get("source"), need_edition=(f.name == "catechisms.json" and e.get("structure") != "chapters" and any(not q.get("placeholder") for q in catechism_questions(e))))
        if f.name == "catechisms.json":
            if e.get("structure") == "chapters":
                chs = json.load(open(DATA / e["file"])).get("chapters", [])
                if e.get("count") != len(chs): errors.append(f"{w}: count {e.get('count')} does not match {len(chs)} chapters")
                for c in chs:
                    for sec in c["sections"]:
                        keys = {p["key"] for p in sec["proofs"]}
                        marks = set(re.findall(r"\{([a-z]{1,2})\}", sec["text"]))
                        if keys != marks: errors.append(f"{w}: {c['numeral']}.{sec['n']} footnote markers {sorted(marks)} != proofs {sorted(keys)}")
                continue
            qs_ = catechism_questions(e)
            if e.get("count", len(qs_)) != len(qs_): errors.append(f"{w}: count {e.get('count')} does not match {len(qs_)} questions in its file")
            for q_ in qs_:
                if not q_.get("question") or not q_.get("answer"): errors.append(f"{w}: question {q_.get('n')} is missing its question or answer text")
        check_quotes(w, e)
        check_entry(w, f.stem, e)
        if e.get("website") and real(e["website"]) and not re.match(r"^https?://", e["website"]): errors.append(f"{w}: website must be http(s)")
    for s in d.get("sets", []): check_source(f"{f.name}:{s.get('id')}", s.get("source"))

print("\n".join(errors) if errors else "OK: all data files pass source & attribution checks.")
sys.exit(1 if errors else 0)
