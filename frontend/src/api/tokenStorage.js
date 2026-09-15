// tokenStorage — a tiny wrapper around localStorage for the owner/admin
// auth token (Task 3.1).
//
// The backend's actual auth (backend/src/controllers/authController.js,
// Tasks 1.12/1.13/1.14) is bearer-JWT, not cookie/session-based: login
// returns `{ user, token }` as a plain JSON body, and every protected
// route reads `Authorization: Bearer <token>` (authMiddleware.js) — the
// backend never sets a cookie at all. So the token has to live somewhere
// on the client that this module's own request/response cycle controls;
// localStorage (not sessionStorage) is the choice here since there's no
// stated requirement anywhere in NATRA_MASTER_PROMPT.md/ROADMAP.md for an
// owner/admin session to end when the tab closes, and a mobile-web owner
// checking orders shouldn't have to log in again every time they reopen
// the app.
//
// Customers (Phase 3) never call any of this — they have no account/login
// at all per the schema doc, so this module is dormant until Phase 4's
// owner registration/login screens exist to call `set`/`clear`.
//
// Every method is wrapped in try/catch: localStorage can throw (Safari
// private-mode quota errors, storage disabled by the user/browser, etc.)
// and none of that should be able to crash a request over an auth
// nicety — worst case is just "treated as logged out."
const STORAGE_KEY = 'natra.authToken';

function safeRead(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export const tokenStorage = {
  get() {
    return safeRead(() => localStorage.getItem(STORAGE_KEY), null);
  },
  set(token) {
    return safeRead(() => {
      localStorage.setItem(STORAGE_KEY, token);
      return true;
    }, false);
  },
  clear() {
    return safeRead(() => {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    }, false);
  },
};
