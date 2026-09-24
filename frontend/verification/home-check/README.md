# Home check page (standalone)

A build of the **real** customer Home screen for layout checks in a real
browser, when the full Vite app can't be run (no `node_modules`, no network).
Created for Task 10.2z6-1; reused by 10.2z6-2..11.

## What is real, what is stubbed

Real, bundled straight from `frontend/src` (nothing copied, so it can't drift):
`Home.jsx` + `Home.module.css`, `RoleShell`, `EntityCard`, `ResponsiveGrid`,
`HorizontalScroller`, `FilterBar`, `SearchBar`, `StatusBadge`, `EmptyState`,
the hooks (`useApiQuery`, `useDebouncedValue`), `entityCardImages`, every CSS
Module, and `styles/global.css`.

Stubbed (`stubs/`):
- `react-router-dom` -> `router.jsx` (`useNavigate` records taps on
  `window.__navigations`; `NavLink` renders an `<a>`; "Home" is the active tab).
- `src/api/client.js` -> `apiClient.js` + `fixtures.js` (fixture data in the
  backend's response shapes; photos in portrait / landscape / square).

## Build and run

```
G=$(npm root -g)      # a global dir with react, react-dom, tsx (tsx ships esbuild)
ESBUILD_PATH=$G/tsx/node_modules/esbuild REACT_NODE_MODULES=$G node build.mjs
python3 smoke.py      # needs python playwright + chromium
```

`dist/index.html` opens straight from disk. `dist/build-info.json` lists a
sha256 of every project file in the bundle — quote it in a check log to show
which version of the CSS was measured.

## Viewport check (Tasks 10.2z6-2..8)

```
python3 viewport_check.py <width> [height]            # e.g. 320 640
python3 viewport_check.py 320 640 --shot /tmp/x.png   # + full-page screenshots
```

Runs the browse view and the search-results view and fails (exit 1) on: page
overflow; anything outside a horizontal scroller past the viewport edge; any
overflow-hidden box that a descendant pokes out of (deliberate one-line
ellipsis text is listed, not failed); the Restaurants row not showing exactly 3
cards / 0 partial at start and after scrolling to the end (measured inside the
row's `clip-path`, as designed in Home.module.css); header or bottom nav
outside the viewport; last content hiding under the bottom nav; console
errors. Non-failing `NOTE`s cover things a box check can't see (search
placeholder cut off). `--inject "<css>"` adds CSS after load — only for
negative controls, to prove the checks can fail. (In `--shot` full-page
screenshots the fixed bottom nav is drawn mid-page; that is a screenshot
artifact, not a layout bug.)

## Scenarios (URL query)

`?scenario=normal|loading|error|empty` (Restaurants / Categories / Popular
Foods), `&search=ok|loading|error|empty` (type in the search box to trigger),
`&latency=<ms>`.

## What this is NOT (log this whenever it is used)

- **Not the Vite app.** esbuild's CSS Modules instead of Vite's (same scoping,
  different generated class names); React 19.2.5 here vs the app's ^18.3.1.
- **No real router / backend / auth / uploads / notifications.** Anything that
  depends on those (real navigation, real data volumes, real images) is not
  covered.
- Text widths depend on the fonts installed in the checking browser.
