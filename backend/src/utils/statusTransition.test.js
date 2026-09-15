// statusTransition unit tests — Task 1.8
//
// No DB/network involved at all — statusTransition (Task 1.7) never
// touches persistence itself, it validates a proposed status change and
// hands off to a caller-supplied `onTransition` hook. So unlike
// crudFactory.test.js (1.3), there's no fakeDb here: these tests run the
// real, unmodified statusTransition.js directly, with plain hand-written
// fake hooks standing in for "the thing that would persist the change".
//
// Uses a dummy "widget" status machine (Draft/Published/Archived) for the
// bulk of the coverage — not `orders`/`live_requests` — same "exercise the
// utility's own logic, not a particular production table's shape"
// reasoning crudFactory.test.js used for its "widgets"/"gadgets" tables.
// A couple of tests further down use a second, differently-shaped config
// to confirm the factory genuinely generalizes (custom statusField, no
// timestampField), since that's the entire point of 1.7 existing as a
// generic factory rather than one-off logic per table.

const statusTransition = require('./statusTransition');

describe('statusTransition: config validation', () => {
  test('throws when config is missing', () => {
    expect(() => statusTransition()).toThrow(/config object is required/);
  });

  test('throws when transitions is missing, not an object, or an array', () => {
    expect(() => statusTransition({ onTransition: () => {} })).toThrow(/"transitions" must be an object/);
    expect(() => statusTransition({ transitions: 'nope', onTransition: () => {} })).toThrow(
      /"transitions" must be an object/
    );
    expect(() => statusTransition({ transitions: [], onTransition: () => {} })).toThrow(
      /"transitions" must be an object/
    );
  });

  test('throws when transitions has no statuses at all', () => {
    expect(() => statusTransition({ transitions: {}, onTransition: () => {} })).toThrow(
      /at least one status/
    );
  });

  test('throws when a transition target list is not an array', () => {
    expect(() => statusTransition({ transitions: { Draft: 'Published' }, onTransition: () => {} })).toThrow(
      /transitions\["Draft"\] must be an array/
    );
  });

  test('throws when a transition target is not a non-empty string', () => {
    expect(() => statusTransition({ transitions: { Draft: [1] }, onTransition: () => {} })).toThrow(
      /non-string target/
    );
    expect(() => statusTransition({ transitions: { Draft: [''] }, onTransition: () => {} })).toThrow(
      /non-string target/
    );
  });

  test('throws when statusField is not a non-empty string', () => {
    expect(() =>
      statusTransition({ transitions: { Draft: ['Published'] }, statusField: '', onTransition: () => {} })
    ).toThrow(/"statusField" must be a non-empty string/);
    expect(() =>
      statusTransition({ transitions: { Draft: ['Published'] }, statusField: 5, onTransition: () => {} })
    ).toThrow(/"statusField" must be a non-empty string/);
  });

  test('throws when timestampField is provided but not a non-empty string', () => {
    expect(() =>
      statusTransition({
        transitions: { Draft: ['Published'] },
        timestampField: '',
        onTransition: () => {},
      })
    ).toThrow(/"timestampField", if provided, must be a non-empty string/);
  });

  test('throws when onTransition is missing or not a function', () => {
    expect(() => statusTransition({ transitions: { Draft: ['Published'] } })).toThrow(
      /"onTransition" must be a function/
    );
    expect(() =>
      statusTransition({ transitions: { Draft: ['Published'] }, onTransition: 'nope' })
    ).toThrow(/"onTransition" must be a function/);
  });

  test('accepts a minimal valid config', () => {
    expect(() => statusTransition({ transitions: { Draft: ['Published'] }, onTransition: () => {} })).not.toThrow();
  });
});

describe('statusTransition: allowed-transitions map — dummy "widget" status machine', () => {
  const widgetStatus = statusTransition({
    transitions: {
      Draft: ['Published', 'Archived'],
      Published: ['Archived'],
      Archived: [],
    },
    onTransition: async ({ to }) => ({ to }),
  });

  test('knownStatuses collects every key and every listed target, deduplicated', () => {
    expect([...widgetStatus.knownStatuses].sort()).toEqual(['Archived', 'Draft', 'Published']);
  });

  test('getAllowedTransitions returns the configured list for a status with transitions', () => {
    expect(widgetStatus.getAllowedTransitions('Draft')).toEqual(['Published', 'Archived']);
  });

  test('getAllowedTransitions returns [] for a terminal status listed with an empty array', () => {
    expect(widgetStatus.getAllowedTransitions('Archived')).toEqual([]);
  });

  test('getAllowedTransitions returns [] for a status not present in the map at all', () => {
    expect(widgetStatus.getAllowedTransitions('Bogus')).toEqual([]);
  });

  test('getAllowedTransitions returns a defensive copy — mutating it does not affect the instance', () => {
    const list = widgetStatus.getAllowedTransitions('Draft');
    list.push('Hacked');
    expect(widgetStatus.getAllowedTransitions('Draft')).toEqual(['Published', 'Archived']);
  });

  test('a repeated target in config is de-duplicated', () => {
    const deduped = statusTransition({
      transitions: { Draft: ['Published', 'Published', 'Archived'] },
      onTransition: () => {},
    });
    expect(deduped.getAllowedTransitions('Draft')).toEqual(['Published', 'Archived']);
  });

  test('canTransition is true for an allowed move', () => {
    expect(widgetStatus.canTransition('Draft', 'Published')).toBe(true);
    expect(widgetStatus.canTransition('Draft', 'Archived')).toBe(true);
    expect(widgetStatus.canTransition('Published', 'Archived')).toBe(true);
  });

  test('canTransition is false for a disallowed move, an unknown target, or a terminal status', () => {
    expect(widgetStatus.canTransition('Draft', 'Bogus')).toBe(false);
    expect(widgetStatus.canTransition('Published', 'Draft')).toBe(false);
    expect(widgetStatus.canTransition('Archived', 'Draft')).toBe(false);
  });

  test('canTransition is false for a same-status "transition" not explicitly listed', () => {
    expect(widgetStatus.canTransition('Draft', 'Draft')).toBe(false);
  });

  test('assertCanTransition does not throw for an allowed move', () => {
    expect(() => widgetStatus.assertCanTransition('Draft', 'Published')).not.toThrow();
  });

  test('assertCanTransition throws a 409 ApiError for a disallowed move, listing what was allowed', () => {
    try {
      widgetStatus.assertCanTransition('Draft', 'Bogus');
      throw new Error('expected assertCanTransition to throw');
    } catch (err) {
      expect(err.status).toBe(409);
      expect(err.publicMessage).toMatch(/Cannot transition from "Draft" to "Bogus"/);
      expect(err.publicMessage).toMatch(/Published, Archived/);
    }
  });

  test('assertCanTransition on a terminal status describes it as terminal, not just an empty list', () => {
    expect(() => widgetStatus.assertCanTransition('Archived', 'Draft')).toThrow(
      /none — terminal status/
    );
  });
});

describe('statusTransition: transition() — happy path', () => {
  test('calls onTransition with current/from/to/context and returns its result', async () => {
    const calls = [];
    const widgetStatus = statusTransition({
      transitions: { Draft: ['Published'], Published: [] },
      onTransition: async (args) => {
        calls.push(args);
        return { updated: true, to: args.to };
      },
    });

    const current = { id: 7, status: 'Draft' };
    const result = await widgetStatus.transition(current, 'Published', { userId: 42 });

    expect(result).toEqual({ updated: true, to: 'Published' });
    expect(calls).toHaveLength(1);
    expect(calls[0].current).toBe(current); // passed through, not cloned
    expect(calls[0].from).toBe('Draft');
    expect(calls[0].to).toBe('Published');
    expect(calls[0].context).toEqual({ userId: 42 });
  });

  test('context is optional and defaults to undefined', async () => {
    let seenContext = 'not called';
    const widgetStatus = statusTransition({
      transitions: { Draft: ['Published'] },
      onTransition: async ({ context }) => {
        seenContext = context;
      },
    });
    await widgetStatus.transition({ status: 'Draft' }, 'Published');
    expect(seenContext).toBeUndefined();
  });
});

describe('statusTransition: transition() — timestampField', () => {
  test('builds and passes a Date as `timestamp` when timestampField is set', async () => {
    let seenTimestamp = null;
    const orderLikeStatus = statusTransition({
      transitions: { New: ['Accepted'] },
      timestampField: 'status_updated_at',
      onTransition: async ({ timestamp }) => {
        seenTimestamp = timestamp;
      },
    });
    const before = Date.now();
    await orderLikeStatus.transition({ status: 'New' }, 'Accepted');
    const after = Date.now();

    expect(seenTimestamp).toBeInstanceOf(Date);
    expect(seenTimestamp.getTime()).toBeGreaterThanOrEqual(before);
    expect(seenTimestamp.getTime()).toBeLessThanOrEqual(after);
  });

  test('passes timestamp as undefined when timestampField is not set', async () => {
    let seenTimestamp = 'not called';
    const widgetStatus = statusTransition({
      transitions: { Draft: ['Published'] },
      onTransition: async ({ timestamp }) => {
        seenTimestamp = timestamp;
      },
    });
    await widgetStatus.transition({ status: 'Draft' }, 'Published');
    expect(seenTimestamp).toBeUndefined();
  });
});

describe('statusTransition: transition() — invalid transitions', () => {
  test('rejects a disallowed move with a 409 ApiError and never calls onTransition', async () => {
    const onTransition = jest.fn();
    const widgetStatus = statusTransition({
      transitions: { Draft: ['Published'], Published: [] },
      onTransition,
    });

    await expect(widgetStatus.transition({ status: 'Published' }, 'Draft')).rejects.toMatchObject({
      status: 409,
    });
    expect(onTransition).not.toHaveBeenCalled();
  });

  test('rejects transitioning to the current status when not explicitly allowed', async () => {
    const onTransition = jest.fn();
    const widgetStatus = statusTransition({ transitions: { Draft: ['Published'] }, onTransition });

    await expect(widgetStatus.transition({ status: 'Draft' }, 'Draft')).rejects.toMatchObject({
      status: 409,
    });
    expect(onTransition).not.toHaveBeenCalled();
  });
});

describe('statusTransition: transition() — malformed input', () => {
  const widgetStatus = statusTransition({
    transitions: { Draft: ['Published'] },
    onTransition: async () => ({}),
  });

  test('throws a plain Error (not an ApiError) when current is not an object', async () => {
    await expect(widgetStatus.transition(null, 'Published')).rejects.toThrow(
      /"current" must be an object/
    );
    await expect(widgetStatus.transition('Draft', 'Published')).rejects.toThrow(
      /"current" must be an object/
    );
    // plain Error, not a 409/400 ApiError — this is a caller bug, not a
    // normal request-validation or state-conflict outcome
    await expect(widgetStatus.transition(null, 'Published')).rejects.not.toMatchObject({ status: expect.anything() });
  });

  test('throws a plain Error when current has no value at statusField', async () => {
    await expect(widgetStatus.transition({ id: 1 }, 'Published')).rejects.toThrow(
      /no value at statusField "status"/
    );
  });

  test.each([undefined, null, '', 42, {}])('throws a 400 badRequest when "to" is %p', async (badTo) => {
    await expect(widgetStatus.transition({ status: 'Draft' }, badTo)).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe('statusTransition: generalizes beyond one table shape', () => {
  test('respects a custom statusField (e.g. restaurants.live_status)', async () => {
    let seenFrom = null;
    const liveStatus = statusTransition({
      transitions: {
        not_requested: ['pending'],
        pending: ['approved', 'rejected'],
        approved: [],
        rejected: [],
      },
      statusField: 'live_status',
      onTransition: async ({ from, to }) => {
        seenFrom = from;
        return { from, to };
      },
    });

    const result = await liveStatus.transition({ id: 3, live_status: 'not_requested' }, 'pending');
    expect(seenFrom).toBe('not_requested');
    expect(result).toEqual({ from: 'not_requested', to: 'pending' });
  });

  test('two instances do not share transition config or state', () => {
    const a = statusTransition({ transitions: { X: ['Y'] }, onTransition: () => {} });
    const b = statusTransition({ transitions: { P: ['Q'], Q: [] }, onTransition: () => {} });

    expect([...a.knownStatuses].sort()).toEqual(['X', 'Y']);
    expect([...b.knownStatuses].sort()).toEqual(['P', 'Q']);
    expect(a.canTransition('P', 'Q')).toBe(false); // 'P'/'Q' aren't even in a's map
  });

  test('a config with no timestampField never has one, even alongside one that does', async () => {
    const withTimestamp = statusTransition({
      transitions: { New: ['Accepted'] },
      timestampField: 'status_updated_at',
      onTransition: async ({ timestamp }) => timestamp,
    });
    const withoutTimestamp = statusTransition({
      transitions: { New: ['Accepted'] },
      onTransition: async ({ timestamp }) => timestamp,
    });

    await expect(withTimestamp.transition({ status: 'New' }, 'Accepted')).resolves.toBeInstanceOf(Date);
    await expect(withoutTimestamp.transition({ status: 'New' }, 'Accepted')).resolves.toBeUndefined();
  });
});
