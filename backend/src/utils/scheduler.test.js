// scheduler unit tests — Task 7.3c
//
// Same "no DB/network involved, exercise the generic factory itself"
// approach as statusTransition.test.js (Task 1.8) — a plain jest.fn()
// handler stands in for a real job. Uses `jest.useFakeTimers()` +
// `jest.advanceTimersByTimeAsync` (not the sync `advanceTimersByTime`)
// throughout, since `registerJob`'s tick wrapper is itself async
// (`Promise.resolve().then(() => job.handler())...`) — the sync
// advancer fires the `setInterval` callback but doesn't flush the
// microtask queue a Promise-returning handler needs to actually
// resolve/reject before the next assertion runs.

const createScheduler = require('./scheduler');

let scheduler;

beforeEach(() => {
  jest.useFakeTimers();
  scheduler = createScheduler();
});

afterEach(() => {
  scheduler.stopAll();
  jest.useRealTimers();
});

describe('registerJob: validation', () => {
  test('throws when name is missing, empty, or not a string', () => {
    const noop = () => {};
    expect(() => scheduler.registerJob(undefined, 1000, noop)).toThrow(/non-empty string/);
    expect(() => scheduler.registerJob('', 1000, noop)).toThrow(/non-empty string/);
    expect(() => scheduler.registerJob(42, 1000, noop)).toThrow(/non-empty string/);
  });

  test('throws when a job with the same name is already registered', () => {
    scheduler.registerJob('job1', 1000, () => {}, { runImmediately: false });
    expect(() => scheduler.registerJob('job1', 1000, () => {}, { runImmediately: false })).toThrow(
      /already registered/
    );
  });

  test('throws when intervalMs is missing, zero, negative, or not an integer', () => {
    const noop = () => {};
    expect(() => scheduler.registerJob('job1', undefined, noop)).toThrow(/positive integer/);
    expect(() => scheduler.registerJob('job1', 0, noop)).toThrow(/positive integer/);
    expect(() => scheduler.registerJob('job1', -1000, noop)).toThrow(/positive integer/);
    expect(() => scheduler.registerJob('job1', 1000.5, noop)).toThrow(/positive integer/);
  });

  test('throws when handler is missing or not a function', () => {
    expect(() => scheduler.registerJob('job1', 1000)).toThrow(/"handler" must be a function/);
    expect(() => scheduler.registerJob('job1', 1000, 'nope')).toThrow(/"handler" must be a function/);
  });
});

describe('registerJob: runImmediately', () => {
  test('defaults to true — the handler runs once at registration time, before any interval elapses', async () => {
    const handler = jest.fn();
    scheduler.registerJob('job1', 1000, handler);

    await jest.advanceTimersByTimeAsync(0);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('runImmediately: false skips the initial run — first call only after one full interval', async () => {
    const handler = jest.fn();
    scheduler.registerJob('job1', 1000, handler, { runImmediately: false });

    await jest.advanceTimersByTimeAsync(0);
    expect(handler).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1000);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('registerJob: ticking', () => {
  test('calls the handler again after every intervalMs', async () => {
    const handler = jest.fn();
    scheduler.registerJob('job1', 1000, handler, { runImmediately: false });

    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(1000);

    expect(handler).toHaveBeenCalledTimes(3);
  });

  test('multiple jobs tick independently on their own intervals', async () => {
    const fast = jest.fn();
    const slow = jest.fn();
    scheduler.registerJob('fast', 100, fast, { runImmediately: false });
    scheduler.registerJob('slow', 1000, slow, { runImmediately: false });

    await jest.advanceTimersByTimeAsync(1000);

    expect(fast).toHaveBeenCalledTimes(10);
    expect(slow).toHaveBeenCalledTimes(1);
  });
});

describe('registerJob: overlap guard', () => {
  test('skips a tick while the previous invocation of the same job is still in flight', async () => {
    const handler = jest
      .fn()
      .mockImplementationOnce(() => new Promise((resolve) => setTimeout(resolve, 5000)))
      .mockImplementation(() => {});

    scheduler.registerJob('job1', 1000, handler);

    // The immediate run started a 5s-long invocation. Two more 1s ticks
    // fire while it's still in flight — both should be skipped, not
    // queued or run concurrently.
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(1000);
    expect(handler).toHaveBeenCalledTimes(1);

    // Let the long-running first call finish (its own internal 5s timer).
    await jest.advanceTimersByTimeAsync(3000);

    // Now that it's resolved, the next regular tick runs normally again.
    await jest.advanceTimersByTimeAsync(1000);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  test('a synchronous handler does not permanently block itself (isRunning resets even without a real async gap)', async () => {
    const handler = jest.fn();
    scheduler.registerJob('job1', 1000, handler, { runImmediately: false });

    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(1000);

    expect(handler).toHaveBeenCalledTimes(2);
  });
});

describe('registerJob: error containment', () => {
  test('a rejected handler is caught, logged, and does not stop future ticks', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const handler = jest
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue(undefined);

    scheduler.registerJob('job1', 1000, handler);
    await jest.advanceTimersByTimeAsync(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('job "job1" threw'),
      expect.any(Error)
    );

    await jest.advanceTimersByTimeAsync(1000);
    expect(handler).toHaveBeenCalledTimes(2);

    consoleErrorSpy.mockRestore();
  });

  test('a synchronously-throwing handler is caught the same way', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const handler = jest.fn(() => {
      throw new Error('sync boom');
    });

    scheduler.registerJob('job1', 1000, handler);
    await jest.advanceTimersByTimeAsync(0);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('job "job1" threw'),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});

describe('unregisterJob / stopAll / getRegisteredJobNames / isRegistered', () => {
  test('unregisterJob stops future ticks and returns true; returns false for an unknown name', async () => {
    const handler = jest.fn();
    scheduler.registerJob('job1', 1000, handler, { runImmediately: false });

    expect(scheduler.unregisterJob('job1')).toBe(true);
    expect(scheduler.unregisterJob('job1')).toBe(false);
    expect(scheduler.unregisterJob('never-registered')).toBe(false);

    await jest.advanceTimersByTimeAsync(5000);
    expect(handler).not.toHaveBeenCalled();
  });

  test('stopAll clears every registered job', async () => {
    const a = jest.fn();
    const b = jest.fn();
    scheduler.registerJob('a', 1000, a, { runImmediately: false });
    scheduler.registerJob('b', 1000, b, { runImmediately: false });

    scheduler.stopAll();
    expect(scheduler.getRegisteredJobNames()).toEqual([]);

    await jest.advanceTimersByTimeAsync(5000);
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  test('getRegisteredJobNames / isRegistered reflect current registrations', () => {
    expect(scheduler.getRegisteredJobNames()).toEqual([]);
    expect(scheduler.isRegistered('job1')).toBe(false);

    scheduler.registerJob('job1', 1000, () => {}, { runImmediately: false });

    expect(scheduler.getRegisteredJobNames()).toEqual(['job1']);
    expect(scheduler.isRegistered('job1')).toBe(true);
  });

  test('a fresh createScheduler() instance is independent of others (no shared module-level state)', () => {
    const other = createScheduler();
    scheduler.registerJob('job1', 1000, () => {}, { runImmediately: false });

    expect(scheduler.isRegistered('job1')).toBe(true);
    expect(other.isRegistered('job1')).toBe(false);

    other.stopAll();
  });
});
