import { tokenStorage } from './tokenStorage';

// Task 0.3 scaffolded this file assuming cookie/session auth
// (`credentials: 'include'`/`'omit'`). That was never actually correct
// against this backend: Tasks 1.12–1.14 built owner/admin auth as
// bearer-JWT (login returns `{ user, token }` as a JSON body; every
// protected route reads `Authorization: Bearer <token>` via
// `authMiddleware.js`) — the backend never sets or reads a cookie for
// auth at all. It went unnoticed through Phase 1/2 because nothing on
// the frontend had made an authenticated request yet. Fixed here, as
// part of actually building this client for real use starting in Phase
// 3: `auth: true` (still the default) now means "attach a bearer token
// via tokenStorage if one exists," not "send cookies." Harmless either
// way for Phase 3's own calls, since customers never have a token to
// attach (no accounts, per the schema doc) — this matters starting
// Phase 4/5/6's owner/admin screens.
//
// (`backend/src/app.js`'s `cors({ credentials: true })` is a leftover
// from that same original cookie assumption — harmless since nothing
// ever relied on it, but worth knowing it's vestigial rather than load-
// bearing if a future session goes looking for why auth works without
// it.)
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ''}/api`;

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// Task 8.7e — `authMiddleware.js` (Task 1.14) deliberately returns one
// generic 401 for every failure shape (missing/expired/malformed/
// signed-with-a-different-secret token), and until now nothing on the
// frontend did anything with that beyond letting it surface as a plain
// `ApiError` — every owner/admin screen using `useApiQuery`/
// `useMutation` would just render its normal error UI (8.7b's
// network/server-error state) for what's actually "you're logged out,
// go log back in." `setUnauthorizedHandler` lets `App.jsx` (the one
// place with `react-router`'s `navigate`/`location`, which this plain
// module has no access to) register what happens instead; a plain
// module-level variable rather than a React context/event emitter
// because there's only ever one real subscriber (the whole app has one
// router) and every request already funnels through this single
// `request()` function.
let unauthorizedHandler = null;

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

async function request(path, { method = 'GET', body, headers = {}, auth = true, signal } = {}) {
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (auth) {
    const token = tokenStorage.get();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const opts = { method, headers: finalHeaders, signal };

  if (body !== undefined) {
    if (body instanceof FormData) {
      // Task 3.14 — the first multipart request this client makes
      // (payment screenshot upload). `Content-Type` must NOT be set by
      // hand for FormData: the browser needs to generate its own
      // `multipart/form-data; boundary=...` value, which it only does
      // when it's the one setting the header. Deleting the default
      // JSON content-type here (rather than never adding it in the
      // first place) keeps the "always start from a JSON header" logic
      // above simple for the common case, with this as the one
      // documented exception.
      delete finalHeaders['Content-Type'];
      opts.body = body;
    } else {
      opts.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, opts);

  // A 204 (e.g. every DELETE route in this codebase — see
  // foodController.js's `remove` and its siblings) has no body and often
  // no content-type header at all; `isJson` correctly comes out false
  // and `data` stays `null` rather than this throwing on `res.json()`
  // against an empty body.
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    // Task 8.7e — only `auth: true` calls ever attach a token in the
    // first place (see above), so a 401 here means *this specific
    // request* expected one and the backend rejected it — never a
    // login-form's own "wrong password" 401 (`OwnerLogin`/`AdminLogin`
    // both call `/auth/login` with `auth: false`, so they never reach
    // this branch and keep showing their existing inline
    // "Invalid email or password" message exactly as before). Clearing
    // the token here, in the one chokepoint every authenticated request
    // already passes through, means a stale/expired token can't keep
    // getting re-attached and re-rejected on every subsequent call
    // before the redirect below actually lands.
    if (res.status === 401 && auth) {
      tokenStorage.clear();
      unauthorizedHandler?.();
    }

    // Matches backend/src/app.js's central error handler exactly:
    // `{ error: err.publicMessage || 'Internal server error' }` is the
    // only shape any failure response ever takes in this codebase, so
    // there's no case where `data?.error` is the wrong field to read.
    throw new ApiError(data?.error || res.statusText, res.status, data);
  }

  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

export { ApiError };
