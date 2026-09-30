#!/usr/bin/env python3
"""Fill in King James Version text for Scripture references in data/catechisms/*.json.

Usage: python3 tools/add_kjv.py path/to/pg10.txt
       (pg10.txt is Project Gutenberg's plain-text King James Bible, public domain:
        https://www.gutenberg.org/cache/epub/10/pg10.txt)

Works on any proof whose `text` is empty. A proof whose `ref` holds several passages
("Rom 1:19-20; Psa 19:1-3") is split into one proof per passage, in the same order and
with the same footnote `key`. Whole-chapter references ("Genesis 1 throughout") and any
reference the parser cannot read are left without text and reported at the end.
Non-adjacent verses are joined with "..." as in the Westminster catechism data."""
import json, re, sys, pathlib

DATA = pathlib.Path(__file__).resolve().parent.parent / "data" / "catechisms"
BOOKS = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings",
 "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
 "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah",
 "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians",
 "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
 "1 John", "2 John", "3 John", "Jude", "Revelation"]
ALIASES = {
 "gen": "Genesis", "ez": "Ezekiel", "zec": "Zechariah", "zach": "Zechariah", "canticles": "Song of Solomon", "obad": "Obadiah", "ex": "Exodus", "exod": "Exodus", "lev": "Leviticus", "num": "Numbers", "deut": "Deuteronomy", "josh": "Joshua", "judg": "Judges",
 "ruth": "Ruth", "sam": "Samuel", "kings": "Kings", "kin": "Kings", "chron": "Chronicles", "chr": "Chronicles", "ezra": "Ezra", "neh": "Nehemiah",
 "esth": "Esther", "est": "Esther", "job": "Job", "psa": "Psalms", "ps": "Psalms", "psalm": "Psalms", "psalms": "Psalms", "prov": "Proverbs",
 "eccl": "Ecclesiastes", "eccles": "Ecclesiastes", "song": "Song of Solomon", "isa": "Isaiah", "is": "Isaiah", "jer": "Jeremiah", "lam": "Lamentations",
 "ezek": "Ezekiel", "eze": "Ezekiel", "dan": "Daniel", "hos": "Hosea", "joel": "Joel", "amos": "Amos", "obad": "Obadiah", "jonah": "Jonah",
 "mic": "Micah", "mi": "Micah", "nah": "Nahum", "hab": "Habakkuk", "zeph": "Zephaniah", "hag": "Haggai", "zech": "Zechariah", "mal": "Malachi",
 "mat": "Matthew", "matt": "Matthew", "mark": "Mark", "luke": "Luke", "john": "John", "joh": "John", "acts": "Acts", "rom": "Romans", "cor": "Corinthians",
 "gal": "Galatians", "eph": "Ephesians", "phil": "Philippians", "col": "Colossians", "thes": "Thessalonians", "thess": "Thessalonians",
 "tim": "Timothy", "tit": "Titus", "titus": "Titus", "philem": "Philemon", "heb": "Hebrews", "jam": "James", "james": "James", "pet": "Peter",
 "jude": "Jude", "rev": "Revelation",
}
NUMBERED = {"Samuel", "Kings", "Chronicles", "Corinthians", "Thessalonians", "Timothy", "Peter", "John"}
ROMAN = {"i": "1", "ii": "2", "iii": "3", "1": "1", "2": "2", "3": "3", "1st": "1", "2nd": "2", "3rd": "3", "first": "1", "second": "2", "third": "3"}

def load_kjv(path):
    raw = open(path, encoding="utf8", errors="ignore").read().replace("\r", "")
    start = raw.index("1:1 In the beginning God created")
    end = raw.find("*** END OF", start)
    body = raw[start:end if end > 0 else None]
    kjv, book, last, mark = {}, -1, None, re.compile(r"(?:^|(?<=\s))(\d{1,3}):(\d{1,3}) ")
    for para in re.split(r"\n\s*\n", body):          # heading paragraphs have no leading C:V and are skipped
        para = re.sub(r"\s+", " ", para).strip()
        ms = list(mark.finditer(para))
        if not ms: continue
        if ms[0].start() > 0 and kjv:                      # text before the first marker finishes the previous verse
            kjv[last] = (kjv[last] + " " + para[:ms[0].start()]).strip()
        for i, m in enumerate(ms):
            c, v = int(m.group(1)), int(m.group(2))
            if c == 1 and v == 1: book += 1
            last = (BOOKS[book], c, v)
            kjv[last] = para[m.end():ms[i + 1].start() if i + 1 < len(ms) else len(para)].strip()
    assert book == 65, f"expected 66 books, found {book + 1}"
    assert 31000 < len(kjv) < 31200, f"unexpected verse count {len(kjv)}"
    return kjv

def canon_book(tok):
    """'I Cor.' / '1 Corinthians' / 'Psa' -> canonical book name, or None."""
    t = re.sub(r"[.\s]+$", "", tok.strip())
    m = re.match(r"^(?:(i{1,3}|[1-3](?:st|nd|rd)?|first|second|third)\s+)?([A-Za-z]+)$", t, re.I)
    if not m: return None
    num, name = m.group(1), m.group(2).lower()
    base = ALIASES.get(name)
    if base is None:
        full = [b for b in BOOKS if b.split(" ", 1)[-1].lower() == name or b.lower() == name]
        base = full[0].split(" ", 1)[-1] if full else None
        if base is None: return None
        if base == "Song of Solomon": base = "Song of Solomon"
    if base in NUMBERED:
        if not num: return None if base != "John" else "John"
        return f"{ROMAN[num.lower()]} {base}"
    if num: return None
    return base

BOOK_PREFIX = re.compile(r"^((?:(?:i{1,3}|[1-3](?:st|nd|rd)?|first|second|third)\s+)?[A-Za-z]+)[.:]?\s*(?=\d)", re.I)
SINGLE_CHAPTER = {"Obadiah", "Philemon", "2 John", "3 John", "Jude"}
REF_START = r"(?:(?:i{1,3}|[1-3])\s?)?[A-Z][a-z]+\.?\s*\d"

def split_refs(ref):
    ref = ref.replace("–", "-").replace("—", "-").replace(" ", " ")
    ref = re.sub(r"[()]", ";", ref)
    ref = re.sub(r",?\s*(etc\.?|&c\.?)\s*$", "", ref.strip())
    ref = re.sub(r"\s*\.\s*$", "", ref.strip())
    out = []
    for piece in re.split(r"\s*;\s*|\s+with\s+|,\s*(?=" + REF_START + r"[^,]*:)|(?:(?<=[:\-]\d)|(?<=[:\-]\d\d)|(?<=[:\-]\d\d\d))\s+(?=" + REF_START + r"[^\s]*:\d)|\s+and\s+(?=(?:[1-3I]{1,3}\s)?[A-Z][a-z]+\.?\s+\d|\d+:\d)", ref):
        piece = piece.strip(" .")
        if piece: out.append(piece)
    return out

def passages(piece, book_default):
    """-> (label_book_as_written, canonical_book, rest, [(chapter, v1, v2)] or None for whole chapter/unparseable)"""
    m = BOOK_PREFIX.match(piece)
    written, book, rest = None, book_default[1] if book_default else None, piece
    if m:
        cb = canon_book(m.group(1))
        if cb: written, book, rest = m.group(1).strip(), cb, piece[m.end():]
    if written is None and book_default: written = book_default[0]
    if not book: return written, None, rest, None
    if re.search(r"throughout|passim|\bchap", rest, re.I) or (re.fullmatch(r"\d+", rest.strip()) and book not in SINGLE_CHAPTER):
        return written, book, rest, None
    spans, ch = [], (1 if book in SINGLE_CHAPTER else None)
    rest = re.sub(r",?\s*(etc\.?|&c\.?)\s*$", "", rest.strip())
    for tok in [t.strip() for t in re.split(r"\s*,\s*", rest) if t.strip()]:
        mm = re.fullmatch(r"(\d+)\s*:\s*(\d+)(?:\s*-\s*(?:(\d+)\s*:\s*)?(\d+))?", tok)
        if mm:
            ch = int(mm.group(1)); v1 = int(mm.group(2))
            if mm.group(3): spans.append((ch, v1, int(mm.group(3)), int(mm.group(4))))   # 19:1-20:5 crosses chapters
            else: spans.append((ch, v1, ch, int(mm.group(4) or v1)))
            if mm.group(3): ch = int(mm.group(3))
            continue
        mm = re.fullmatch(r"(\d+)(?:\s*-\s*(\d+))?", tok)
        if mm and ch is not None:
            spans.append((ch, int(mm.group(1)), ch, int(mm.group(2) or mm.group(1)))); continue
        return written, book, rest, None
    return written, book, rest, spans or None

def text_for(kjv, book, spans):
    parts, last = [], None
    for c1, v1, c2, v2 in spans:
        seq = []
        if c1 == c2: seq = [(c1, v) for v in range(v1, v2 + 1)]
        else:
            seq = [(c1, v) for v in range(v1, 200) if (book, c1, v) in kjv] + [(c2, v) for v in range(1, v2 + 1)]
        for c, v in seq:
            t = kjv.get((book, c, v))
            if t is None: return None
            if last and (last[0] != c or v != last[1] + 1) and parts: parts.append("...")
            parts.append(t); last = (c, v)
    return " ".join(parts)

def expand(proofs, kjv, report):
    new = []
    for p in proofs:
        if p.get("text"): new.append(p); continue
        default = None
        for piece in split_refs(p["ref"]):
            written, book, rest, spans = passages(piece, default)
            label = f"{written} {rest}".strip() if written and not piece.lower().startswith(written.lower()) else piece
            if book and written: default = (written, book)
            q = {k: v for k, v in p.items() if k not in ("ref", "text")}
            q["ref"] = label; q["text"] = ""
            if spans:
                t = text_for(kjv, book, spans)
                if t: q["text"] = t
                else: report.append(f"no verse: {label}")
            else: report.append(f"skipped: {label}")
            new.append(q)
    return new

def main():
    kjv = load_kjv(sys.argv[1])
    report = []
    for f in sorted(DATA.glob("*.json")):
        if f.stem in ("wsc", "wlc", "fishers"): continue
        d = json.load(open(f))
        n = 0
        for q in d.get("questions", []):
            q["proofs"] = expand(q.get("proofs", []), kjv, report); n += len(q["proofs"])
        for c in d.get("chapters", []):
            for s in c["sections"]:
                s["proofs"] = expand(s.get("proofs", []), kjv, report); n += len(s["proofs"])
        json.dump(d, open(f, "w"), indent=1, ensure_ascii=False)
        print(f"{f.name}: {n} proofs")
    print(f"{len(report)} references without text")
    for r in report: print("  ", r)

if __name__ == "__main__":
    main()
