#!/usr/bin/env python3
"""Stamp every local script, stylesheet and data fetch with a version so browsers never mix old and new files.
Run before each deploy:  python3 tools/bump_version.py   (or pass a label: python3 tools/bump_version.py 2026-10-01a)"""
import re, sys, time, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
ver = sys.argv[1] if len(sys.argv) > 1 else time.strftime("%Y%m%d%H%M")
for f in ROOT.glob("*.html"):
    t = f.read_text()
    t = re.sub(r'((?:src|href)="assets/(?:js|css)/[^"?]+\.(?:js|css))(?:\?v=[^"]*)?"', rf'\1?v={ver}"', t)
    f.write_text(t)
cfg = ROOT / "assets/js/config.js"
t = cfg.read_text()
t = re.sub(r'version: "[^"]*"', f'version: "{ver}"', t)
cfg.write_text(t)
print("version", ver)
