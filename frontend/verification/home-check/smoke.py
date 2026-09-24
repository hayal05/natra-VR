"""Smoke test for the standalone Home check page (10.2z6-1).
Run after build.mjs:  python3 smoke.py
Proves the page really is the real Home screen: it loads with no console/page
errors, every section renders from the fixtures, the food cards are squares,
and every browse/search state Home can be in is reachable.
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
URL = (HERE / "dist" / "index.html").resolve().as_uri()
fails = []
def check(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + (f"  [{detail}]" if detail else ""))
    if not ok: fails.append(name)

COUNTS = """() => ({
  rest: document.querySelectorAll('[role=list][aria-label="Restaurants"] > [role=listitem]').length,
  foods: document.querySelectorAll('[role=list][aria-label="Popular Foods"] > [role=listitem]').length,
  searchFoods: document.querySelectorAll('[role=list][aria-label="Foods matching your search"] > [role=listitem]').length,
  chips: document.querySelectorAll('button[aria-pressed]').length,
  signUp: [...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Sign up'),
  brand: document.body.innerText.includes('NATRA'),
  nav: document.querySelectorAll('nav a').length,
  overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  text: document.body.innerText
})"""
FOOD = """() => [...document.querySelectorAll('[role=list][aria-label="Popular Foods"] article')].map(a => {
  const r = a.getBoundingClientRect(), m = a.children[0].getBoundingClientRect(), b = a.children[1].getBoundingClientRect();
  return [r.width, r.height, m.height, b.height];
})"""

with sync_playwright() as pw:
    br = pw.chromium.launch()
    def open_page(qs="", w=390, h=844):
        pg = br.new_page(viewport={"width": w, "height": h})
        errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL + qs); pg.wait_for_timeout(400)
        return pg, errs

    # --- normal state
    pg, errs = open_page("?scenario=normal")
    c = pg.evaluate(COUNTS)
    check("no console/page errors (normal)", not errs, "; ".join(errs)[:200])
    check("12 restaurant cards", c["rest"] == 12, c["rest"])
    check("12 Popular Foods cards", c["foods"] == 12, c["foods"])
    check("category chips = All + 7", c["chips"] == 8, c["chips"])
    check("NATRA wordmark + Sign up button", c["brand"] and c["signUp"])
    check("bottom nav rendered (RoleShell)", c["nav"] >= 3, c["nav"])
    check("no horizontal page overflow at 390px", not c["overflow"])
    f = pg.evaluate(FOOD)
    sq = max(abs(w - h) for w, h, _, _ in f)
    check("food cards are squares", sq < 0.01, f"worst |w-h| = {sq:.3f}px")
    w, h, media, strip = f[0]
    # Cross-check against the hand-built harness numbers from 10.2z5-18 (171x171, strip 62, photo 109)
    check("matches 10.2z5-18 numbers at 390px (171px card, strip 62, photo 109)",
          round(w) == 171 and round(strip) == 62 and round(media) == 109, f"{w:.1f}x{h:.1f} strip {strip:.1f} photo {media:.1f}")
    pg.close()

    # --- same cross-check at 320px (10.2z5-19: 136px card, strip 62, photo 74)
    pg, errs = open_page("?scenario=normal", w=320, h=700)
    w, h, media, strip = pg.evaluate(FOOD)[0]
    check("matches 10.2z5-19 numbers at 320px (136px card, strip 62, photo 74)",
          round(w) == 136 and round(strip) == 62 and round(media) == 74, f"{w:.1f}x{h:.1f} strip {strip:.1f} photo {media:.1f}")
    pg.close()

    # --- browse states
    for scen, needle in [("loading", "Loading restaurants"), ("error", "Couldn't load restaurants"), ("empty", "No restaurants yet")]:
        pg, errs = open_page(f"?scenario={scen}")
        c = pg.evaluate(COUNTS)
        check(f"browse state '{scen}' shows: {needle}", needle in c["text"])
        pg.close()
    pg, _ = open_page("?scenario=error"); t = pg.evaluate(COUNTS)["text"]
    check("error state also covers foods + categories", "Couldn't load popular foods" in t and "Couldn't load categories" in t); pg.close()
    pg, _ = open_page("?scenario=empty"); t = pg.evaluate(COUNTS)["text"]
    check("empty state also covers foods", "No foods yet" in t); pg.close()

    # --- search states (typed into the real SearchBar; real 350ms debounce)
    for sc, needle in [("ok", None), ("loading", "Searching"), ("error", "Couldn't search"), ("empty", "No results")]:
        pg, errs = open_page(f"?scenario=normal&search={sc}")
        pg.fill("input[type=search], input", "doro"); pg.wait_for_timeout(900)
        c = pg.evaluate(COUNTS)
        if sc == "ok":
            check("search ok: 12 food cards in the search grid", c["searchFoods"] == 12, c["searchFoods"])
            check("search ok: 'Search results' heading", "Search results" in c["text"])
        else:
            check(f"search state '{sc}' shows: {needle}", needle in c["text"])
        check(f"no console errors (search {sc})", not errs, "; ".join(errs)[:200])
        pg.close()

    # --- navigation stub records taps
    pg, _ = open_page("?scenario=normal")
    pg.click('[role=list][aria-label="Popular Foods"] article >> nth=0'); pg.wait_for_timeout(100)
    nav = pg.evaluate("window.__navigations || []")
    check("tapping a food card navigates (recorded by router stub)", len(nav) == 1 and "1" in nav[0], nav)
    pg.close()
    br.close()

print("\nRESULT:", "ALL PASS" if not fails else f"{len(fails)} FAILED: {fails}")
sys.exit(1 if fails else 0)
