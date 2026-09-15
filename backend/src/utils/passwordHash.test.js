// passwordHash unit tests — Task 1.11
//
// No DB/network involved — like statusTransition.test.js (1.8), this
// exercises the real, unmodified passwordHash.js directly against plain
// strings. bcrypt's own hash/compare correctness isn't under test here
// (that's bcrypt's job); this confirms *our* wrapper's contract: salting,
// round-tripping, input validation, and the "bad stored hash" guard.
//
// Same caveat as 1.9/1.10: no npm registry access this session, so this
// hasn't been run under a real `npm test`/Jest yet — verified by hand in
// a scratch sandbox (real bcrypt is a native dependency already vendored
// in package-lock.json, so no fake/stub was needed the way fakeDb.js
// stands in for oracledb). Re-running under real Jest is still
// outstanding, tracked in PROJECT_STATUS.md's "Not started yet".

const { hashPassword, verifyPassword, SALT_ROUNDS } = require('./passwordHash');

describe('passwordHash: hashPassword', () => {
  test('produces a bcrypt-formatted hash', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(typeof hash).toBe('string');
    expect(hash).toMatch(/^\$2[aby]?\$/);
  });

  test('produces a different hash for the same password each call (fresh salt)', async () => {
    const hashA = await hashPassword('same-password');
    const hashB = await hashPassword('same-password');
    expect(hashA).not.toBe(hashB);
  });

  test.each([undefined, null, '', '   ', 123, {}])(
    'rejects invalid plaintext input: %p',
    async (bad) => {
      await expect(hashPassword(bad)).rejects.toThrow(/password is required/i);
    }
  );
});

describe('passwordHash: verifyPassword', () => {
  test('resolves true for the correct plaintext', async () => {
    const hash = await hashPassword('hunter2');
    await expect(verifyPassword('hunter2', hash)).resolves.toBe(true);
  });

  test('resolves false for an incorrect plaintext', async () => {
    const hash = await hashPassword('hunter2');
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  test.each([undefined, null, '', '   ', 123])(
    'rejects invalid plaintext input: %p',
    async (bad) => {
      const hash = await hashPassword('irrelevant');
      await expect(verifyPassword(bad, hash)).rejects.toThrow(/password is required/i);
    }
  );

  test('throws (not just returns false) when hash is missing', async () => {
    await expect(verifyPassword('anything', undefined)).rejects.toThrow(
      /missing or invalid/i
    );
  });

  test('throws (not just returns false) when hash is not bcrypt-formatted', async () => {
    // e.g. a plaintext password accidentally stored, or a future argon2
    // hash — either way this is a caller/data bug, not a wrong password.
    await expect(verifyPassword('anything', 'not-a-real-hash')).rejects.toThrow(
      /malformed/i
    );
  });
});

describe('passwordHash: exported config', () => {
  test('exposes the salt rounds constant used for hashing', () => {
    expect(SALT_ROUNDS).toBe(12);
  });
});
