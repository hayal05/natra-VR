"""Layout check of the real Home screen at one viewport (Tasks 10.2z6-2..8).
    python3 viewport_check.py <width> [height] [--shot out.png]
Views checked: browse (Restaurants row, Categories, Popular Foods) and search
results (Restaurants row + Foods grid). Exit code 1 if any hard check fails.

Hard checks (must pass):
  1. no horizontal page overflow (scrollWidth <= clientWidth)
  2. nothing outside a horizontal scroller extends past the viewport's edges
  3. no unintended clipping: for every overflow-hidden box, no descendant pokes
     outside it (photos/logos/badges/text) — deliberate one-line ellipsis text
     is reported separately, not as a failure
  4. Restaurants row: exactly 3 cards fully in view and 0 partly in view, at
     the start AND after scrolling to the end (Task 10.2z4-22/23; from 3 to 3)
  5. header (wordmark, Sign up, search bar) and bottom nav inside the viewport
  6. scrolled to the bottom, the last content ends above the bottom nav
"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
URL = (HERE / "dist" / "index.html").resolve().as_uri()
_skip = {sys.argv[i + 1] for i, a in enumerate(sys.argv) if a in ("--shot", "--inject") and i + 1 < len(sys.argv)}
args = [a for a in sys.argv[1:] if not a.startswith("--") and a not in _skip]
W = int(args[0]); H = int(args[1]) if len(args) > 1 else 800
shot = sys.argv[sys.argv.index("--shot") + 1] if "--shot" in sys.argv else None
LANDSCAPE_NOTE = f"{W}x{H}"
# --inject "<css>": add a style tag after each load. Only for negative controls (proving the checks CAN fail).
INJECT = sys.argv[sys.argv.index("--inject") + 1] if "--inject" in sys.argv else None

MEASURE = r"""() => {
  const vw = document.documentElement.clientWidth;
  const R = e => e.getBoundingClientRect();
  const out = {vw, pageOverflow: document.documentElement.scrollWidth > vw, escapes: [], clipped: [], ellipsized: [], rows: [], nav: null, header: {}, tail: null};
  const isScroller = e => { const s = getComputedStyle(e); return (s.overflowX === 'auto' || s.overflowX === 'scroll'); };
  const inScroller = e => { for (let p = e.parentElement; p; p = p.parentElement) if (isScroller(p) && p !== document.documentElement && p !== document.body) return true; return false; };
  const label = e => { const c = (e.className && e.className.baseVal === undefined ? String(e.className) : '').split(' ')[0]; return e.tagName.toLowerCase() + (c ? '.' + c : '') + (e.textContent && e.children.length === 0 ? ' "' + e.textContent.trim().slice(0, 24) + '"' : ''); };
  const all = [...document.querySelectorAll('body *')].filter(e => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && R(e).width > 0; });

  // 2. escapes past the viewport edge, outside scrollers
  for (const e of all) {
    if (inScroller(e) || isScroller(e) && false) continue;
    const r = R(e);
    if (r.left < -0.5 || r.right > vw + 0.5) out.escapes.push([label(e), +r.left.toFixed(1), +r.right.toFixed(1)]);
  }
  // scrollers themselves must sit inside the viewport
  for (const e of all) if (isScroller(e) && e !== document.documentElement) { const r = R(e); if (r.left < -0.5 || r.right > vw + 0.5) out.escapes.push(['SCROLLER ' + label(e), +r.left.toFixed(1), +r.right.toFixed(1)]); }

  // 3. clipping
  for (const e of all) {
    const s = getComputedStyle(e);
    const clips = ['hidden', 'clip'].includes(s.overflowX) || ['hidden', 'clip'].includes(s.overflowY);
    if (!clips) continue;
    if (s.textOverflow === 'ellipsis') {
      if (e.scrollWidth > e.clientWidth + 0.5) out.ellipsized.push(e.textContent.trim().slice(0, 40));
      continue;
    }
    if (e === document.body || e === document.documentElement) continue;
    const r = R(e);
    for (const d of e.querySelectorAll('*')) {
      const ds = getComputedStyle(d);
      if (ds.display === 'none' || ds.position === 'fixed') continue;
      const dr = R(d);
      if (dr.width === 0 || dr.height === 0) continue;
      const p = 0.75;
      const horizontal = !isScroller(e);   // a scroller's off-screen items are by design
      if ((horizontal && (dr.left < r.left - p || dr.right > r.right + p)) || dr.top < r.top - p || dr.bottom > r.bottom + p)
        out.clipped.push([label(e), 'contains', label(d), [dr.left - r.left, dr.top - r.top, dr.right - r.right, dr.bottom - r.bottom].map(v => +v.toFixed(1))]);
    }
  }
  // 4. restaurant rows — "visible" means inside the row's clip-path (Home.module.css clips the peeking
  //    4th card to just inside the row's padding), not merely inside its box.
  for (const row of document.querySelectorAll('[role=list][aria-label^="Restaurants"]')) {
    const rr = R(row); const items = [...row.children];
    const m = /inset\(([^)]*)\)/.exec(getComputedStyle(row).clipPath || '');
    let l = 0, rt = 0;
    if (m) { const v = m[1].trim().split(/\s+/).map(parseFloat); const [t, r_, b, l_] = v.length === 1 ? [v[0], v[0], v[0], v[0]] : v.length === 2 ? [v[0], v[1], v[0], v[1]] : v.length === 3 ? [v[0], v[1], v[2], v[1]] : v; l = l_; rt = r_; }
    const vl = rr.left + l, vr = rr.right - rt;
    let full = 0, partial = 0;
    for (const it of items) { const r = R(it); const inside = r.left >= vl - 0.5 && r.right <= vr + 0.5; const outside = r.right <= vl + 0.5 || r.left >= vr - 0.5; if (inside) full++; else if (!outside) partial++; }
    out.rows.push({full, partial, cardW: +R(items[0]).width.toFixed(1), items: items.length, clipInset: [l, rt], visible: [+vl.toFixed(1), +vr.toFixed(1)], scrollable: row.scrollWidth > row.clientWidth + 1});
  }
  // 5. header + nav
  const q = s => document.querySelector(s);
  const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Sign up');
  const search = q('input');
  const inView = e => e && R(e).left >= -0.5 && R(e).right <= vw + 0.5;
  out.header = {signUp: inView(btn), search: inView(search), brand: inView([...document.querySelectorAll('span')].find(s => s.textContent.trim() === 'NATRA'))};
  const nav = q('nav'); if (nav) { const links = [...nav.querySelectorAll('a')]; out.nav = {inView: links.every(inView), n: links.length, top: R(nav).top}; }
  return out;
}"""
TAIL = r"""() => { const nav = document.querySelector('nav'); const navTop = nav ? nav.getBoundingClientRect().top : innerHeight;
  window.scrollTo(0, document.documentElement.scrollHeight); return new Promise(res => setTimeout(() => {
    const nt = nav ? nav.getBoundingClientRect().top : innerHeight;
    const els = [...document.querySelectorAll('article, [role=listitem], p, h2, h3')].filter(e => e.getBoundingClientRect().height > 0);
    const lowest = Math.max(...els.map(e => e.getBoundingClientRect().bottom));
    res({lowest: +lowest.toFixed(1), navTop: +nt.toFixed(1), clear: lowest <= nt + 0.5}); }, 150)); }"""

PLACEHOLDER = r"""() => [...document.querySelectorAll('input')].filter(i => i.placeholder).map(i => {
  const cs = getComputedStyle(i), c = document.createElement('canvas').getContext('2d');
  c.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const need = c.measureText(i.placeholder).width, have = i.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  return {text: i.placeholder, need: +need.toFixed(1), have: +have.toFixed(1), cut: need > have + 0.5, textOverflow: cs.textOverflow}; })"""
NOTES = []

def report(view, m, extra_rows=None):
    bad = []
    if m["pageOverflow"]: bad.append("page overflows horizontally")
    if m["escapes"]: bad.append(f"{len(m['escapes'])} element(s) past the viewport edge: {m['escapes'][:4]}")
    if m["clipped"]: bad.append(f"{len(m['clipped'])} unintended clip(s): {m['clipped'][:4]}")
    for i, r in enumerate(m["rows"]):
        if r["full"] != 3 or r["partial"] != 0: bad.append(f"restaurant row {i}: {r['full']} full / {r['partial']} partial (want 3 / 0)")
    for k, v in m["header"].items():
        if not v: bad.append(f"header {k} outside viewport")
    if m["nav"] and not m["nav"]["inView"]: bad.append("bottom nav outside viewport")
    print(f"[{view}] " + ("PASS" if not bad else "FAIL"))
    print(f"    overflow={m['pageOverflow']} escapes={len(m['escapes'])} clipped={len(m['clipped'])} ellipsized={len(set(m['ellipsized']))}"
          + (f" rows(full,partial,cardW,visible)={[(r['full'], r['partial'], r['cardW'], r['visible']) for r in m['rows']]}" if m['rows'] else ""))
    for b in bad: print("    !!", b)
    return bad

fails = []
with sync_playwright() as pw:
    br = pw.chromium.launch()
    pg = br.new_page(viewport={"width": W, "height": H})
    errs = []
    pg.on("console", lambda x: errs.append(x.text) if x.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    print(f"=== Home at {LANDSCAPE_NOTE} ===")

    # ---- browse view
    pg.goto(URL + "?scenario=normal"); pg.wait_for_timeout(400)
    if INJECT: pg.add_style_tag(content=INJECT); pg.wait_for_timeout(100)
    m = pg.evaluate(MEASURE); fails += report("browse, start", m)
    ell_browse = sorted(set(m["ellipsized"]))
    for p in pg.evaluate(PLACEHOLDER):
        if p["cut"]:
            NOTES.append(f'search placeholder "{p["text"]}" is cut off: needs {p["need"]}px, field has {p["have"]}px (text-overflow: {p["textOverflow"]})')
    # restaurants row scrolled to the end
    pg.evaluate("document.querySelector('[role=list][aria-label^=Restaurants]').scrollLeft = 1e6"); pg.wait_for_timeout(250)
    m2 = pg.evaluate(MEASURE); fails += report("browse, restaurant row scrolled to end", m2)
    pg.evaluate("document.querySelector('[role=list][aria-label^=Restaurants]').scrollLeft = 0"); pg.wait_for_timeout(100)
    t = pg.evaluate(TAIL); print(f"[browse, page bottom] {'PASS' if t['clear'] else 'FAIL'}  last content bottom {t['lowest']} vs nav top {t['navTop']}")
    if not t["clear"]: fails.append("content under nav (browse)")
    if shot: pg.evaluate("window.scrollTo(0,0)"); pg.screenshot(path=shot.replace('.png', '-browse.png'), full_page=True)

    # ---- search view (real SearchBar, real debounce)
    pg.goto(URL + "?scenario=normal&search=ok"); pg.wait_for_timeout(300)
    if INJECT: pg.add_style_tag(content=INJECT); pg.wait_for_timeout(100)
    pg.fill("input", "doro"); pg.wait_for_timeout(900)
    m = pg.evaluate(MEASURE); fails += report("search results, start", m)
    ell_search = sorted(set(m["ellipsized"]))
    pg.evaluate("document.querySelector('[role=list][aria-label^=Restaurants]').scrollLeft = 1e6"); pg.wait_for_timeout(250)
    fails += report("search results, restaurant row scrolled to end", pg.evaluate(MEASURE))
    t = pg.evaluate(TAIL); print(f"[search, page bottom] {'PASS' if t['clear'] else 'FAIL'}  last content bottom {t['lowest']} vs nav top {t['navTop']}")
    if not t["clear"]: fails.append("content under nav (search)")
    if shot: pg.evaluate("window.scrollTo(0,0)"); pg.screenshot(path=shot.replace('.png', '-search.png'), full_page=True)

    print("console/page errors:", errs or "none")
    if errs: fails.append("console errors")
    print("deliberate one-line ellipsis (browse):", ell_browse)
    print("deliberate one-line ellipsis (search):", ell_search)
    br.close()
for n in NOTES: print("NOTE (not a failure):", n)
print(f"\nRESULT at {LANDSCAPE_NOTE}:", ("ALL PASS" if not fails else f"{len(fails)} FAILED") + (f" + {len(NOTES)} note(s)" if NOTES else ""))
sys.exit(1 if fails else 0)
