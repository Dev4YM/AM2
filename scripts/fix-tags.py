#!/usr/bin/env python3
import pathlib

TAG = "mo" + "tion"
for p in pathlib.Path("src").rglob("*.tsx"):
    t = p.read_text()
    n = t.replace(f"</{TAG}>", "</div>").replace(f"<{TAG} ", "<div ").replace(f"<{TAG}>", "<div>")
    if n != t:
        p.write_text(n)
        print("fixed", p)
