# NATRA — Design Tokens (Task 2.1)

Extracted from `docs/reference_ui/`'s two reference images:
`1000065033.jpg` (full home-screen mock, 282×577) and
`560d4168-0f66-443a-9fbc-c9625f83d15e.png` (restaurant-card row closeup,
868×288 — much higher fidelity, so used as the primary source for
text/badge colors and corner geometry).

Two different kinds of value below, marked per-token:

- **measured** — sampled directly from image pixels (Python/Pillow:
  median color over a thresholded region, not a single eyeballed
  pixel — JPEG compression on `1000065033.jpg` especially means a
  single-pixel read is noisy). High confidence.
- **inferred** — the images don't contain enough resolution/reference
  geometry to pixel-measure this exactly (e.g. converting on-screen
  px in a screenshot of unknown export scale to real dp/rem units), so
  a standard scale was chosen that matches the *visual proportions*
  actually observed. Task 2.2 (global theme/style config) should treat
  these as a starting point to adjust during Task 2.22's visual QA
  pass, not as a pixel-exact spec the way the measured colors are.

---

## Colors

### Brand / primary

| Token | Value | Source |
|---|---|---|
| `color-primary` | `#F2690C` | measured — median of the orange sampled independently from the header, the active category chip, and the "Order Now" buttons in `1000065033.jpg` (individually: `#E96805`, `#F7690C`, `#F8690B` — all the same brand orange, spread is JPEG noise, not three different colors) |
| `color-primary-pressed` | `#D65C08` | inferred — ~12% darker than `color-primary`, standard pressed-state delta |

One brand color, reused everywhere (header background, active chip fill,
CTA buttons, bottom-nav active icon) — there's no secondary brand hue in
either reference image.

| `color-primary-tint` | `#F88834` | measured (added Task 2.22) — the search bar's own fill on the home-screen header in `1000065033.jpg` is not white: sampled at several clean (icon/text-free) points inside the bar (`(247–251, 133–138, 50–54)`, median `#F88834`), clearly distinct from both the flat header orange (`#E46502` sampled the same way) and white. `SearchBar`'s `onPrimary` variant (Task 2.22 correction, see that component's own notes) uses this as its fill with light/white text and icon, matching the reference exactly instead of the plain white pill Task 2.13 originally assumed. |

### Status

| Token | Value | Source |
|---|---|---|
| `color-success` | `#1DA143` | measured — "Open" badge, `560d4168...png` |
| `color-error` | `#FA4F50` | measured — "Closed" badge, `560d4168...png` |

`StatusBadge` (Task 2.4) is exactly this two-value map for now — only
`Open`/`Closed` appear in the reference UI. Other status values this
codebase already has elsewhere (`orders.status`'s pending/confirmed/
etc, `live_requests.status`'s pending/approved/rejected) aren't shown in
either image, so their colors aren't tokened here — that's a call for
whoever builds `StatusBadge` against the fuller status list, not
something to invent from a reference image that doesn't show them.

### Text

| Token | Value | Source |
|---|---|---|
| `color-text-primary` | `#0E1A2B` | measured — "Restaurants" heading and card titles ("Mama's Kitchen"), `560d4168...png`, darkest-15%-of-region sample to filter out anti-aliased edge pixels. Not pure black — has a slight navy tint. |
| `color-text-secondary` | `#707A8A` | measured — the `"1.2 km · 5 areas"` caption line under each card name, same sampling method |
| `color-text-on-primary` | `#FFFFFF` | inferred — white text/icons on the orange header and buttons, standard for a dark-saturated brand color, not separately re-measured |

### Surfaces

| Token | Value | Source |
|---|---|---|
| `color-surface` | `#FFFFFF` | inferred — card backgrounds read as flat white against the page background at both images' resolution; the two are close enough (`#FBFCFD` measured for page bg) that treating surface as pure white and background as the off-white below is the standard two-layer split, not two independently-verified distinct greys |
| `color-background` | `#FBFCFD` | measured — page background outside any card, both images |
| `color-surface-muted` | `#F4F6F6` | measured — inactive category chip fill (`"Breakfast"`/`"Lunch"`/etc, unselected state), `1000065033.jpg` |

### Task 8.9b2 — accessibility-driven darkening (supersedes the values above)

Task 8.9b's audit (see `docs/PROJECT_STATUS.md`) found that most of the
measured brand/status colors above fail WCAG AA (4.5:1) wherever they
sit directly behind or in front of text — buttons, links, badges. Three
options were named there; **darkening the colors themselves** was the
one chosen, over adding separate "text-safe" variants or accepting the
failures as a documented gap. This means the six tokens below no longer
match the reference images pixel-for-pixel — that tradeoff was made
deliberately.

Darkening kept each color's hue/saturation (HSL) and only reduced
lightness, by the minimum amount needed to clear 4.5:1 against every
background/foreground it's actually paired with in the app (`white`,
`color-background`, and `color-surface-muted` where relevant — see
8.9b's own pairing table in `docs/PROJECT_STATUS.md`).

| Token | Old (measured) | New (text-safe) | Worst-case ratio after |
|---|---|---|---|
| `color-primary` | `#F2690C` | `#C1540A` | 4.62 (white text on it / it as link text on white) |
| `color-primary-pressed` | `#D65C08` | `#A44708` | 6.01 (white text on it) — kept meaningfully darker than the new `color-primary` so the pressed state still reads as a state change |
| `color-primary-tint` | `#F88834` | `#BF5607` | 4.61 (white text on it, `SearchBar`'s `onPrimary` fill) |
| `color-success` | `#1DA143` | `#188738` | 4.60 (white text on it, `StatusBadge`) |
| `color-error` | `#FA4F50` | `#EC0708` | 4.58 (white text on it, `StatusBadge`/`.linkButtonDanger` text on white) |
| `color-text-secondary` | `#707A8A` | `#687180` | 4.53 (against `color-surface-muted`, the hardest of its three backgrounds — 4.78–4.91 against white/`color-background`) |

`color-text-primary`, `color-text-on-primary`, `color-surface`,
`color-background`, and `color-surface-muted` were already passing and
are unchanged. Applied in `frontend/src/styles/global.css`'s `:root`
block; no component file hardcodes any of these six hex values
independently of the CSS vars (checked).

---

## Spacing scale

**Inferred.** Neither image has a known export scale (no ruler/dp
reference), so absolute px measurements between elements don't convert
to real units reliably. What *is* visually consistent across both
images: card padding, the gap between adjacent cards in a row, and the
gap between a card's image and its text all read as roughly the same
one or two step sizes — a standard 4px-base scale fits that observation
without overfitting to uncalibrated pixels:

| Token | Value |
|---|---|
| `space-xs` | 4px |
| `space-sm` | 8px |
| `space-md` | 12px |
| `space-lg` | 16px |
| `space-xl` | 24px |
| `space-2xl` | 32px |

`space-lg` (16px) is the workhorse — outer screen padding, gap between
the restaurant-row cards, and gap between the food-grid cards all read
as roughly this size relative to card width in both images.

## Font scale

**Inferred**, same reasoning as spacing — relative proportions between
text elements are clear (heading noticeably larger than card titles,
which are noticeably larger than the caption line), but absolute pt/rem
sizes aren't pixel-verifiable from a screenshot of unknown scale:

| Token | Value | Weight | Used for (per reference UI) |
|---|---|---|---|
| `font-caption` | 12px | Regular | `"1.2 km · 5 areas"`, ETB prices |
| `font-body` | 14px | Regular | restaurant/category names on cards |
| `font-body-strong` | 14px | Semibold | "Order Now" button label |
| `font-title` | 16px | Semibold | card titles (`"Mama's Kitchen"`) |
| `font-heading` | 22px | Bold | section headings (`"Restaurants"`, `"Categories"`) |

## Radius scale

| Token | Value | Source |
|---|---|---|
| `radius-md` | 12px | inferred — food-thumbnail image corners; a corner-curvature scan in `560d4168...png` (top-left corner of the first food photo) traces the curve over roughly 12–13px in that image's own pixel grid, consistent with a moderate rounded-rect at whatever the export scale is — treated as a proportional reference, not a literal 12px-at-1x measurement |
| `radius-lg` | 16px | inferred — outer card container, visibly rounder than the thumbnail image inside it |
| `radius-pill` | 9999px (full) | measured (shape, not a length) — the "Open"/"Closed" status badges and the category filter chips are both fully-rounded pill shapes, unambiguous regardless of scale |

---

## Task 2.22 — visual QA findings

Compared the built component kit (as rendered logically, and as viewed via
the sandbox's own source — this sandbox has no browser/screenshot capability,
so "compare against the reference images" was done by close pixel-level
inspection of `docs/reference_ui/`'s two images — cropping/zooming each
restaurant card and the header/search-bar/bottom-nav regions with Pillow —
cross-checked directly against each component's actual CSS, rather than
against the token doc's own prose description of what a component
*should* look like) against `docs/reference_ui/`. Three real mismatches
found and corrected, beyond the new `color-primary-tint` token above:

1. **`EntityCard`'s status badge does not sit on top of the image.**
   Zooming into `560d4168...png`'s four restaurant cards (all of them, not
   just one, to confirm it's a consistent layout rule and not a one-off)
   shows the "Open"/"Closed" pill sitting *below* the image, left-aligned in
   the white card body, well clear of the image entirely — not overlaid
   top-left on the photo the way Task 2.3's own doc comment guessed (that
   comment said neither reference image gave an exact corner for it, which
   was true at the time 2.3 was written, before this closer crop). Fixed in
   `EntityCard.jsx`/`.module.css`: `badge` moved from an absolutely-positioned
   overlay in `.media` into the top of `.body`, above the title.
2. **`EntityCard`'s circular logo is horizontally centered on the card, not
   left-aligned.** Same four-card crop: every restaurant's logo circle sits
   centered on the card's horizontal midpoint, straddling the image's bottom
   edge, not anchored to the left side. Fixed: `.logo`'s `left: var(--space-md)`
   replaced with centering (`left: 50%; transform: translateX(-50%)`).
3. **`EntityCard`'s food/cover image had its own `border-radius` on all four
   corners**, double-rounding the bottom corners where the image meets the
   card body below it — the reference shows a hard flat edge there (the photo
   runs straight into the white body, only the top two corners are rounded,
   and those are already rounded by the card's own `overflow: hidden` +
   `border-radius`, not by anything on the image itself). Fixed: removed the
   image's own `border-radius` entirely; it now relies on the card's clip,
   same as the bottom of `.body` already implicitly did.

Not changed, deliberately, after re-checking:
- `ResponsiveGrid`'s 768/1024/1280 breakpoints — both reference images are a
  single phone-width mock, so there's still nothing to measure a breakpoint
  from. Left as the inferred standard scale Task 2.7 chose.
- `ToggleSwitch`'s track/thumb sizing and `FormField`'s border color —
  neither control appears in either reference image at all, so there's
  nothing to correct *against*; still flagged as inferred, not measured.
- `StatusBadge`'s padding/sizing — a rough check (badge bounding box in
  `560d4168...png` is ~60×22px against a ~205px-wide card) is consistent
  with the current `space-xs`/`space-sm` padding around 12px caption text
  at whatever this image's own export scale is; not a clear enough
  mismatch to change on top of an already-inferred scale with no ruler.
- `RoleShell`'s customer bottom-nav icon set/order/labels — re-checked
  against `1000065033.jpg`'s own nav bar crop and it already matches
  (Home/Categories/Orders/Profile, house/grid/clipboard/person glyphs,
  orange active state) — no change needed.

## Notes for Task 2.2

- One brand color, two status colors, three surface tones, two text
  tones — small enough that the "global theme/style config" this token
  set feeds into shouldn't need much beyond a flat map of the tables
  above.
- Everything marked **inferred** above is a reasonable starting point,
  not a verified spec — Task 2.22's visual QA pass (compare the built
  sandbox against these same two reference images) is where spacing/
  font/radius actually get corrected against the eye, not against a
  pixel ruler that doesn't exist for these source images.
