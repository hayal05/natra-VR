// notifyBeforeExpiryJob.test.js — Task 7.4c
//
// Same shape as `orderExpiryJob.test.js` (7.3e): this module's entire
// job is a load-time side effect (`scheduler.registerJob(...)`, once,
// on require) — both `../scheduler` and `./notifyBeforeExpiry` are
// mocked so these tests can inspect exactly what gets registered and
// confirm the registered handler calls through to
// `runNotifyBeforeExpiryPass`, without a real timer or a real DB pass.
// Same `jest.resetModules()` + fresh `require` per test, for the same
// "the side effect only happens on first require" reason.

describe('notifyBeforeExpiryJob', () => {
  let registerJob;
  let runNotifyBeforeExpiryPass;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.NOTIFY_BEFORE_EXPIRY_CHECK_INTERVAL_MS;

    registerJob = jest.fn();
    jest.doMock('../scheduler', () => ({ registerJob }));

    runNotifyBeforeExpiryPass = jest.fn().mockResolvedValue({
      candidateCount: 0,
      notifiedCount: 0,
      skippedCount: 0,
      failedCount: 0,
    });
    jest.doMock('./notifyBeforeExpiry', () => ({ runNotifyBeforeExpiryPass }));
  });

  afterEach(() => {
    delete process.env.NOTIFY_BEFORE_EXPIRY_CHECK_INTERVAL_MS;
  });

  test('registers exactly one job, named "notify-before-expiry", on require', () => {
    // eslint-disable-next-line global-require
    require('./notifyBeforeExpiryJob');

    expect(registerJob).toHaveBeenCalledTimes(1);
    const [name, , handler] = registerJob.mock.calls[0];
    expect(name).toBe('notify-before-expiry');
    expect(typeof handler).toBe('function');
  });

  test('defaults the check interval to 60000ms when NOTIFY_BEFORE_EXPIRY_CHECK_INTERVAL_MS is unset', () => {
    // eslint-disable-next-line global-require
    const job = require('./notifyBeforeExpiryJob');

    const [, intervalMs] = registerJob.mock.calls[0];
    expect(intervalMs).toBe(60000);
    expect(job.CHECK_INTERVAL_MS).toBe(60000);
  });

  test('honors a valid NOTIFY_BEFORE_EXPIRY_CHECK_INTERVAL_MS override', () => {
    process.env.NOTIFY_BEFORE_EXPIRY_CHECK_INTERVAL_MS = '15000';

    // eslint-disable-next-line global-require
    const job = require('./notifyBeforeExpiryJob');

    const [, intervalMs] = registerJob.mock.calls[0];
    expect(intervalMs).toBe(15000);
    expect(job.CHECK_INTERVAL_MS).toBe(15000);
  });

  test.each(['0', '-5', '1.5', 'abc', ''])(
    'falls back to the 60000ms default for an unusable override (%p)',
    (raw) => {
      process.env.NOTIFY_BEFORE_EXPIRY_CHECK_INTERVAL_MS = raw;

      // eslint-disable-next-line global-require
      const job = require('./notifyBeforeExpiryJob');

      const [, intervalMs] = registerJob.mock.calls[0];
      expect(intervalMs).toBe(60000);
      expect(job.CHECK_INTERVAL_MS).toBe(60000);
    }
  );

  test('the registered handler calls runNotifyBeforeExpiryPass and returns its result', async () => {
    const passResult = { candidateCount: 3, notifiedCount: 2, skippedCount: 1, failedCount: 0 };
    runNotifyBeforeExpiryPass.mockResolvedValue(passResult);

    // eslint-disable-next-line global-require
    require('./notifyBeforeExpiryJob');
    const [, , handler] = registerJob.mock.calls[0];

    const result = await handler();

    expect(runNotifyBeforeExpiryPass).toHaveBeenCalledTimes(1);
    expect(result).toBe(passResult);
  });

  test('the registered handler propagates a rejection from runNotifyBeforeExpiryPass (scheduler.js owns catching it)', async () => {
    const err = new Error('db down');
    runNotifyBeforeExpiryPass.mockRejectedValue(err);

    // eslint-disable-next-line global-require
    require('./notifyBeforeExpiryJob');
    const [, , handler] = registerJob.mock.calls[0];

    await expect(handler()).rejects.toBe(err);
  });

  test('a quiet (all-zero) tick logs nothing', async () => {
    runNotifyBeforeExpiryPass.mockResolvedValue({
      candidateCount: 0,
      notifiedCount: 0,
      skippedCount: 0,
      failedCount: 0,
    });
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // eslint-disable-next-line global-require
    require('./notifyBeforeExpiryJob');
    const [, , handler] = registerJob.mock.calls[0];
    await handler();

    expect(consoleLogSpy).not.toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });

  test('a tick with real notifications/failures logs a summary line', async () => {
    runNotifyBeforeExpiryPass.mockResolvedValue({
      candidateCount: 3,
      notifiedCount: 2,
      skippedCount: 0,
      failedCount: 1,
    });
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // eslint-disable-next-line global-require
    require('./notifyBeforeExpiryJob');
    const [, , handler] = registerJob.mock.calls[0];
    await handler();

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy.mock.calls[0][0]).toMatch(/2 notified/);
    expect(consoleLogSpy.mock.calls[0][0]).toMatch(/1 failed/);
    consoleLogSpy.mockRestore();
  });

  test('a tick that only skips (no notifications, no failures) logs nothing', async () => {
    runNotifyBeforeExpiryPass.mockResolvedValue({
      candidateCount: 2,
      notifiedCount: 0,
      skippedCount: 2,
      failedCount: 0,
    });
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // eslint-disable-next-line global-require
    require('./notifyBeforeExpiryJob');
    const [, , handler] = registerJob.mock.calls[0];
    await handler();

    expect(consoleLogSpy).not.toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });
});
