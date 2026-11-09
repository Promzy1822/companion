#!/usr/bin/env python3
"""Past Questions squeeze fix: the 7 subject tabs are flex:1 with no
shrink allowed and no scroll container, so their combined minimum width
(~770px) is wider than a phone screen. The browser widens the whole page
to fit them (worse once the app font loads and labels get wider), which
is the squeeze/pan/shift. Make the row scrollable like the year row,
and pin the laptop practice grid explicitly."""
import sys, pathlib
root = pathlib.Path(sys.argv[1])
fails = []
def sub(path, old, new, label):
    p = root / path
    t = p.read_text()
    n = t.count(old)
    if n != 1:
        print(f"FAIL {label}: {n} matches in {path}"); fails.append(label); return
    p.write_text(t.replace(old, new, 1))
    print(f"ok   {label}")

sub("app/questions/page.tsx",
    '        <div style={{ display:"flex", gap:8, marginBottom:12 }}>',
    '        <div style={{ display:"flex", gap:8, marginBottom:12, overflowX:"auto", scrollbarWidth:"none" }}>',
    "questions: subject tab row scrolls instead of widening the page")
sub("app/questions/page.tsx",
    '              flex:1, padding:"10px 8px", borderRadius:12, cursor:"pointer",',
    '              flex:"0 0 auto", padding:"10px 14px", whiteSpace:"nowrap", borderRadius:12, cursor:"pointer",',
    "questions: subject tabs keep their natural width")

if fails:
    print("PATCH FAILURES:", fails); sys.exit(1)
print("questions patches applied")
