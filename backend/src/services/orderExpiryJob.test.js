// orderExpiryJob.test.js — Task 7.3e
//
// This module's entire job is a load-time side effect (calling
// `scheduler.registerJob(...)` once, when required) — not a function
// with a return value to assert on the usual way. Both `../scheduler`
// (the singleton) and `./orderExpiry` (the action) are mocked so these
// tests can inspect exactly what gets registered and confirm the
// registered handler actually calls through to `runOrderExpiryPass`,
// without a real scheduler timer or a real order-expiry pass running.
//
// `jest.resetModules()` in `beforeEach` + a fresh `require('./orderExpiryJob')`
// per test is required specifically because this module's side effect
// only happens once, at its own first `require()` — reusing the same
// cached module instance across tests would only ever see the first
// test's `registerJob` call.

describe('orderExpiryJob', () => {
  let registerJob;
  let runOrderExpiryPass;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.ORDER_EXPIRY_CHECK_INTERVAL_MS;

    registerJob = jest.fn();
    jest.doMock('../scheduler', () => ({ registerJob }));

    runOrderExpiryPass = jest.fn().mockResolvedValue({
      candidateCount: 0,
      expiredCount: 0,
      skippedCount: 0,
      failedCount: 0,
    });
    jest.doMock('./orderExpiry', () => ({ runOrderExpiryPass }));
  });

  afterEach(() => {
    delete process.env.ORDER_EXPIRY_CHECK_INTERVAL_MS;
  });

  test('registers exactly one job, named "order-expiry", on require', () => {
    // eslint-disable-next-line global-require
    require('./orderExpiryJob');

    expect(registerJob).toHaveBeenCalledTimes(1);
    const [name, , handler] = registerJob.mock.calls[0];
    expect(name).toBe('order-expiry');
    expect(typeof handler).toBe('function');
  });

  test('defaults the check interval to 60000ms when ORDER_EXPIRY_CHECK_INTERVAL_MS is unset', () => {
    // eslint-disable-next-line global-require
    const job = require('./orderExpiryJob');

    const [, intervalMs] = registerJob.mock.calls[0];
    expect(intervalMs).toBe(60000);
    expect(job.CHECK_INTERVAL_MS).toBe(60000);
  });

  test('honors a valid ORDER_EXPIRY_CHECK_INTERVAL_MS override', () => {
    process.env.ORDER_EXPIRY_CHECK_INTERVAL_MS = '15000';

    // eslint-disable-next-line global-require
    const job = require('./orderExpiryJob');

    const [, intervalMs] = registerJob.mock.calls[0];
    expect(intervalMs).toBe(15000);
    expect(job.CHECK_INTERVAL_MS).toBe(15000);
  });

  test.each(['0', '-5', '1.5', 'abc', ''])(
    'falls back to the 60000ms default for an unusable override (%p)',
    (raw) => {
      process.env.ORDER_EXPIRY_CHECK_INTERVAL_MS = raw;

      // eslint-disable-next-line global-require
      const job = require('./orderExpiryJob');

      const [, intervalMs] = registerJob.mock.calls[0];
      expect(intervalMs).toBe(60000);
      expect(job.CHECK_INTERVAL_MS).toBe(60000);
    }
  );

  test('the registered handler calls runOrderExpiryPass and returns its result', async () => {
    const passResult = { candidateCount: 3, expiredCount: 2, skippedCount: 1, failedCount: 0 };
    runOrderExpiryPass.mockResolvedValue(passResult);

    // eslint-disable-next-line global-require
    require('./orderExpiryJob');
    const [, , handler] = registerJob.mock.calls[0];

    const result = await handler();

    expect(runOrderExpiryPass).toHaveBeenCalledTimes(1);
    expect(result).toBe(passResult);
  });

  test('the registered handler propagates a rejection from runOrderExpiryPass (scheduler.js owns catching it)', async () => {
    const err = new Error('db down');
    runOrderExpiryPass.mockRejectedValue(err);

    // eslint-disable-next-line global-require
    require('./orderExpiryJob');
    const [, , handler] = registerJob.mock.calls[0];

    await expect(handler()).rejects.toBe(err);
  });

  test('a quiet (all-zero) tick logs nothing', async () => {
    runOrderExpiryPass.mockResolvedValue({
      candidateCount: 0,
      expiredCount: 0,
      skippedCount: 0,
      failedCount: 0,
    });
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // eslint-disable-next-line global-require
    require('./orderExpiryJob');
    const [, , handler] = registerJob.mock.calls[0];
    await handler();

    expect(consoleLogSpy).not.toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });

  test('a tick with real expiries/failures logs a summary line', async () => {
    runOrderExpiryPass.mockResolvedValue({
      candidateCount: 3,
      expiredCount: 2,
      skippedCount: 0,
      failedCount: 1,
    });
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // eslint-disable-next-line global-require
    require('./orderExpiryJob');
    const [, , handler] = registerJob.mock.calls[0];
    await handler();

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy.mock.calls[0][0]).toMatch(/2 expired/);
    expect(consoleLogSpy.mock.calls[0][0]).toMatch(/1 failed/);
    consoleLogSpy.mockRestore();
  });
});
