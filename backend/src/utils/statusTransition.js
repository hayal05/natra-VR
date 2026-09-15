// statusTransition — Task 1.7
//
// A generic "is this status change allowed, and what happens when it is"
// utility — an allowed-transitions map plus an on-transition hook. Not
// tied to any one table: `docs/DB_SCHEMA.md` has (at least) two status-ish
// state machines that need the exact same shape of logic —
//   orders.status:        New -> Accepted | Rejected, Accepted -> Completed
//   live_requests.status: pending -> approved | rejected
// — and both will eventually be driven by the same generic factory here,
// configured differently, rather than each hand-rolling its own
// if/else transition-guard logic (Phase 5's Accept/Reject/Complete —
// Tasks 5.14/5.15 — and Phase 6's Approve/Reject — Task 6.7).
//
// Deliberately NOT this module's job (see docs/ROADMAP.md):
//   - actually persisting the change to the DB — that's `onTransition`,
//     supplied by the caller (typically a thin wrapper around one of
//     crudFactory's `update`/`updateForOwner`, Tasks 1.1/1.2)
//   - unit tests                                                -> Task 1.8
//   - deciding *who* is allowed to make a given transition (an owner
//     accepting their own order vs an admin approving a live request) —
//     that's `ownershipMiddleware` (1.4) / auth (1.11-1.14) at the route
//     layer, same separation of concerns crudFactory keeps from
//     ownershipMiddleware
//
// Example (illustrative — the real wiring happens in 5.14/6.7, once
// crudFactory instances for `orders`/`live_requests` exist):
//
//   const orderStatus = statusTransition({
//     transitions: {
//       New: ['Accepted', 'Rejected'],
//       Accepted: ['Completed'],
//       Completed: [],
//       Rejected: [],
//     },
//     timestampField: 'status_updated_at',
//     onTransition: ({ current, to, timestamp }) =>
//       ordersCrud.updateForOwner(current.id, current.restaurant_id, {
//         status: to,
//         status_updated_at: timestamp,
//       }),
//   });
//
//   await orderStatus.transition(order, 'Accepted');

const { badRequest, conflict } = require('./errors');

/**
 * @param {Object} config
 * @param {Object.<string, string[]>} config.transitions - allowed-transitions
 *   map: `{ [fromStatus]: [toStatus, ...] }`. A status with no outgoing
 *   transitions (a terminal state, e.g. `Completed`) should still be listed
 *   with an empty array — see the example above — so it's visible as a
 *   known status (`knownStatuses`) rather than silently absent; a status
 *   missing from the map entirely is treated the same as `[]` at
 *   transition-check time, but won't show up in `knownStatuses`.
 * @param {string} [config.statusField="status"] - the property name read
 *   off the `current` object passed to `transition()`/`canTransition()`
 *   to get the "from" status. Configurable since not every table uses the
 *   same column name — `orders`/`live_requests` both use `status`, but
 *   this same factory is equally meant for `restaurants.live_status`.
 * @param {string} [config.timestampField] - if set, `transition()` builds
 *   a `Date` and passes it to `onTransition` as `timestamp`, under the
 *   assumption the caller will write it to this column (e.g.
 *   `status_updated_at`, which every status-bearing table in
 *   `docs/DB_SCHEMA.md` updates "on every status change"). This module
 *   never touches the DB itself, so it doesn't set the column — it just
 *   saves every caller from separately computing "now" and remembering
 *   the column name is meant to be touched at all.
 * @param {Function} config.onTransition - `({ current, from, to, timestamp,
 *   context }) => any`, called once a transition has passed validation.
 *   Whatever it returns (typically the updated row, if it persists one) is
 *   returned by `transition()`. Required — a statusTransition instance with
 *   no hook can validate but can never actually apply anything, which isn't
 *   a useful configuration to construct silently.
 */
function statusTransition(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('statusTransition: a config object is required');
  }

  const { transitions, statusField = 'status', timestampField, onTransition } = config;

  if (!transitions || typeof transitions !== 'object' || Array.isArray(transitions)) {
    throw new Error('statusTransition: "transitions" must be an object map of fromStatus -> toStatus[]');
  }
  if (Object.keys(transitions).length === 0) {
    throw new Error('statusTransition: "transitions" must have at least one status');
  }
  if (typeof statusField !== 'string' || statusField.length === 0) {
    throw new Error('statusTransition: "statusField" must be a non-empty string');
  }
  if (timestampField !== undefined && (typeof timestampField !== 'string' || timestampField.length === 0)) {
    throw new Error('statusTransition: "timestampField", if provided, must be a non-empty string');
  }
  if (typeof onTransition !== 'function') {
    throw new Error('statusTransition: "onTransition" must be a function');
  }

  // Copy + validate the map at construction time (fail loud on a config
  // typo now, not on the first real transition attempt at runtime), and
  // de-dupe each status's target list so a repeated entry in config
  // doesn't show up twice in `getAllowedTransitions()`.
  const transitionMap = {};
  const knownStatuses = new Set();
  for (const [from, tos] of Object.entries(transitions)) {
    if (!Array.isArray(tos)) {
      throw new Error(`statusTransition: transitions["${from}"] must be an array (got ${typeof tos})`);
    }
    tos.forEach((to) => {
      if (typeof to !== 'string' || to.length === 0) {
        throw new Error(`statusTransition: transitions["${from}"] contains a non-string target (${to})`);
      }
    });
    transitionMap[from] = [...new Set(tos)];
    knownStatuses.add(from);
    tos.forEach((to) => knownStatuses.add(to));
  }

  /**
   * The statuses `from` is allowed to move to, per config. A `from` not
   * present in the map at all (as opposed to present with an empty array)
   * is treated identically — both mean "no allowed transitions" — this
   * just returns `[]` for either rather than throwing, since a caller
   * asking "what can X do next" for an unrecognized status is a
   * reasonable question to get an empty (not exceptional) answer to.
   */
  function getAllowedTransitions(from) {
    return transitionMap[from] ? [...transitionMap[from]] : [];
  }

  function canTransition(from, to) {
    return getAllowedTransitions(from).includes(to);
  }

  /**
   * Throws a 409 `ApiError` (via `../utils/errors`'s `conflict`) if `from
   * -> to` isn't an allowed transition — 409, not 400, because the request
   * itself is well-formed, it's the *current state of the resource* that
   * makes it invalid (the same reasoning REST APIs generally use 409 for:
   * "the request conflicts with the current state of the target
   * resource"). A completely unrecognized `to` value (not reachable from
   * *any* status, e.g. a typo'd status string) gets the same 409 rather
   * than a separate error shape — from this module's perspective both are
   * just "not an allowed transition", and a caller can't learn anything
   * useful from distinguishing "unknown status" from "known but not
   * reachable from here" that `getAllowedTransitions(from)` in the message
   * doesn't already tell them.
   */
  function assertCanTransition(from, to) {
    if (!canTransition(from, to)) {
      const allowed = getAllowedTransitions(from);
      const allowedDescription = allowed.length > 0 ? allowed.join(', ') : '(none — terminal status)';
      throw conflict(`Cannot transition from "${from}" to "${to}" — allowed: ${allowedDescription}`);
    }
  }

  /**
   * Validate, then apply, a status transition on `current`.
   *
   * @param {Object} current - the current row/object. Must have a value at
   *   `current[statusField]`; a `current` with no value there is a
   *   config/caller bug (wrong `statusField`, or the caller fetched the
   *   wrong thing), not a normal 4xx — see the thrown plain `Error` below,
   *   same "loud, not a business-logic error" treatment crudFactory gives
   *   its own construction-time mistakes.
   * @param {string} to - the target status. A missing/non-string `to` is
   *   treated as a genuine bad *request* (400), not a config bug — this is
   *   exactly the shape of mistake a malformed request body produces.
   * @param {*} [context] - opaque extra data passed straight through to
   *   `onTransition` (e.g. `{ reviewerId }` for who's making the change) —
   *   this module never reads or validates it itself.
   * @returns {Promise<*>} whatever `onTransition` returns.
   */
  async function transition(current, to, context) {
    if (!current || typeof current !== 'object') {
      throw new Error('statusTransition: "current" must be an object');
    }
    const from = current[statusField];
    if (from === undefined) {
      throw new Error(`statusTransition: "current" has no value at statusField "${statusField}"`);
    }
    if (typeof to !== 'string' || to.length === 0) {
      throw badRequest('A target status is required');
    }

    assertCanTransition(from, to);

    const timestamp = timestampField ? new Date() : undefined;
    return onTransition({ current, from, to, timestamp, context });
  }

  return {
    statusField,
    timestampField,
    knownStatuses: [...knownStatuses],
    getAllowedTransitions,
    canTransition,
    assertCanTransition,
    transition,
  };
}

module.exports = statusTransition;
