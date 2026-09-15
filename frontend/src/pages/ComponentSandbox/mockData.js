// Mock data for Task 2.21's component sandbox page. Nothing here is real —
// no seed-script/API data is imported, on purpose: the sandbox has to keep
// working even when the backend/DB aren't reachable (this sandbox itself
// has had no npm-registry or DB access most sessions — see
// docs/PROJECT_STATUS.md), and its whole point is rendering each of the 16
// kit components in isolation, not exercising a real data flow.
//
// `placeholderImage` generates a tiny inline SVG data URI (solid color +
// centered label) instead of pointing at an external image host — same
// "no network dependency" reasoning, and the same kind of placeholder
// `backend/src/scripts/seedRestaurants.js` (Task 0.13) already generates
// with `sharp` for logos/covers, just done client-side here since this is
// frontend-only mock data with no upload step involved.
export function placeholderImage(width, height, label, bg = '#f2690c', fg = '#ffffff') {
  const fontSize = Math.round(Math.min(width, height) / 6);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<rect width="100%" height="100%" fill="${bg}"/>` +
    `<text x="50%" y="50%" fill="${fg}" font-family="sans-serif" font-size="${fontSize}" ` +
    `font-weight="600" text-anchor="middle" dominant-baseline="middle">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Restaurant + Popular-Food mock rows — the two named EntityCard shapes
// (docs/NATRA_MASTER_PROMPT.md's "Customer home UI"), reused for
// EntityCard's own section, HorizontalScroller, and ResponsiveGrid so the
// same believable data shows up consistently across sections rather than
// a different throwaway array per component.
export const MOCK_RESTAURANTS = [
  {
    id: 1,
    name: 'Abeba Kitchen',
    status: 'Open',
    meta: 'Bole • 1.2 km',
    image: placeholderImage(320, 180, 'Abeba Kitchen', '#f2690c'),
    logo: placeholderImage(72, 72, 'AK', '#0e1a2b'),
  },
  {
    id: 2,
    name: 'Merkato Grill',
    status: 'Closed',
    meta: 'Merkato • 3.5 km',
    image: placeholderImage(320, 180, 'Merkato Grill', '#1da143'),
    logo: placeholderImage(72, 72, 'MG', '#0e1a2b'),
  },
  {
    id: 3,
    name: 'Sheger Bites',
    status: 'Open',
    meta: 'Kazanchis • 0.8 km',
    image: placeholderImage(320, 180, 'Sheger Bites', '#fa4f50'),
    logo: placeholderImage(72, 72, 'SB', '#0e1a2b'),
  },
  {
    id: 4,
    name: 'Piassa Diner',
    status: 'Open',
    meta: 'Piassa • 2.1 km',
    image: placeholderImage(320, 180, 'Piassa Diner', '#707a8a'),
    logo: placeholderImage(72, 72, 'PD', '#0e1a2b'),
  },
];

export const MOCK_FOODS = [
  { id: 1, name: 'Doro Wat', restaurant: 'Abeba Kitchen', price: '250 ETB', image: placeholderImage(300, 200, 'Doro Wat', '#f2690c') },
  { id: 2, name: 'Tibs', restaurant: 'Merkato Grill', price: '220 ETB', image: placeholderImage(300, 200, 'Tibs', '#1da143') },
  { id: 3, name: 'Shiro', restaurant: 'Sheger Bites', price: '150 ETB', image: placeholderImage(300, 200, 'Shiro', '#fa4f50') },
  { id: 4, name: 'Kitfo', restaurant: 'Piassa Diner', price: '280 ETB', image: placeholderImage(300, 200, 'Kitfo', '#707a8a') },
  { id: 5, name: 'Fir Fir', restaurant: 'Abeba Kitchen', price: '180 ETB', image: placeholderImage(300, 200, 'Fir Fir', '#f2690c') },
  { id: 6, name: 'Macchiato', restaurant: 'Sheger Bites', price: '40 ETB', image: placeholderImage(300, 200, 'Macchiato', '#1da143') },
];

// StatusBadge's own section deliberately shows both mapped values (Open/
// Closed, from DESIGN_TOKENS.md's measured colors) and a few of this
// codebase's other, still-unmapped status vocabularies
// (orders.status/live_requests.status/restaurants.live_status, per
// docs/DB_SCHEMA.md) — so the sandbox actually shows the documented
// "falls through to neutral" behavior StatusBadge.jsx's own header
// comment describes, not just the two colored cases.
export const MOCK_STATUSES = ['Open', 'Closed', 'New', 'Accepted', 'Completed', 'Rejected', 'pending', 'not_requested'];

// FilterBar mock groups.
export const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'drinks', label: 'Drinks' },
];

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

// FormField's `select` demo.
export const ROLE_OPTIONS = [
  { value: 'owner', label: 'Restaurant Owner' },
  { value: 'admin', label: 'Admin' },
];

// ListWithPagination mock rows — shaped like an owner's order list (Task
// 5.12), the first of the three named ListWithPagination uses. 14 rows at
// a page size of 4 gives 4 pages, enough to exercise the
// Previous/Next-disabled-at-the-edges behavior in both directions.
const ORDER_CUSTOMERS = ['Abel T.', 'Selam G.', 'Yonas M.', 'Hana K.', 'Dawit A.', 'Ruth B.'];
const ORDER_STATUSES = ['New', 'Accepted', 'Completed', 'Rejected'];

export const MOCK_ORDERS = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  code: `NTR-${10032 + i}`,
  customer: ORDER_CUSTOMERS[i % ORDER_CUSTOMERS.length],
  status: ORDER_STATUSES[i % ORDER_STATUSES.length],
  total: `${150 + i * 15} ETB`,
}));

export const ORDERS_PAGE_SIZE = 4;

// Mirrors backend/src/utils/paginate.js's buildPaginationMeta shape
// exactly (total/limit/offset/page/totalPages/hasNextPage/hasPrevPage) —
// not imported from there (frontend/backend are separate packages with no
// shared module today), but ListWithPagination.jsx's own doc comment says
// its `meta` prop is that exact contract, so the sandbox's mock meta has
// to actually match it, not just look plausible.
export function buildMockMeta(page, pageSize, total) {
  const totalPages = Math.ceil(total / pageSize) || 0;
  return {
    total,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
