// requireAdmin.test.js — Task 6.3
//
// Plain unit tests, no DB/fakeDb needed — `requireAdmin` reads only
// `req.user.role` (already attached by `authMiddleware` before this
// module ever runs) and never touches the database itself.

const { requireAdmin } = require('./requireAdmin');

describe('requireAdmin', () => {
  test('calls next() with no error for an admin user', () => {
    const req = { user: { id: 1, role: 'admin' } };
    const next = jest.fn();

    requireAdmin(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  test('calls next(err) with a 403 for an owner user', () => {
    const req = { user: { id: 1, role: 'owner' } };
    const next = jest.fn();

    requireAdmin(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(403);
    expect(err.publicMessage).toBe('Forbidden');
  });

  test('calls next(err) with a 403 when req.user is missing entirely', () => {
    const req = {};
    const next = jest.fn();

    requireAdmin(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].status).toBe(403);
  });
});
