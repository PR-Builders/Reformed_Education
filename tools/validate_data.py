#!/usr/bin/env python3
"""Checks /data for source and attribution problems. Run: python3 tools/validate_data.py
Fails (exit 1) on: missing `source`, non-http(s) URLs, public-domain claims without a source
title/organization, over-long quotes, or non-placeholder catechism text without an edition."""
import json, re, sys, pathlib

DATA = pathlib.Path(__file__).resolve().parent.parent / "data"
PH = re.compile(r"^\[Placeholder", re.I)
MAX_QUOTE = 300
errors = []

def real(v): return isinstance(v, str) and v and not PH.match(v)

def check_source(where, s, need_edition=False):
    if not isinstance(s, dict): errors.append(f"{where}: missing `source` record"); return
    if real(s.get("url")) and not re.match(r"^https?://", s["url"]): errors.append(f"{where}: source.url must be http(s)")
    if s.get("copyright_status") == "public-domain" and not (real(s.get("title")) and real(s.get("organization"))):
        errors.append(f"{where}: public-domain works must name a source title and organization")
    if need_edition and not (real(s.get("edition")) or real(s.get("translation"))):
        errors.append(f"{where}: real catechism text requires source.edition/translation")

def check_quotes(where, e):
    for i, q in enumerate(e.get("quotes", [])):
        if len(q.get("text", "")) > MAX_QUOTE: errors.append(f"{where}: quote {i} exceeds {MAX_QUOTE} chars")
        s = q.get("source", {})
        if not (real(s.get("author")) or real(s.get("title"))): errors.append(f"{where}: quote {i} needs author or source title")

for f in sorted(DATA.glob("*.json")):
    d = json.load(open(f))
    for e in d.get("entries", []):
        w = f"{f.name}:{e.get('id')}"
        check_source(w, e.get("source"), need_edition=(f.name == "catechisms.json" and any(not q.get("placeholder") for q in e.get("questions", []))))
        check_quotes(w, e)
        if e.get("website") and real(e["website"]) and not re.match(r"^https?://", e["website"]): errors.append(f"{w}: website must be http(s)")
    for s in d.get("sets", []): check_source(f"{f.name}:{s.get('id')}", s.get("source"))

print("\n".join(errors) if errors else "OK: all data files pass source & attribution checks.")
sys.exit(1 if errors else 0)
