// authController — Tasks 1.12 (signup) + 1.13 (login/JWT issuance) +
// 1.14d (GET /me, the first route protected by authMiddleware) +
// 5.22 (PATCH /me profile edit + PATCH /me/password change)
//
// Deliberately NOT this file's job (see docs/TASKS.md):
//   - auth middleware itself (verify token, build req.user)   -> Task 1.14a-c
//     (backend/src/middleware/authMiddleware.js)
//
// Request-shape validation lives here via zod (already a `package.json`
// dependency, unused until now), not in `models/users.js`/`crudFactory` —
// crudFactory's job is "safe SQL for an allow-listed column set", not
// "is this a valid email" or "is this password long enough". That split
// mirrors `crudFactory.js`'s own header note: "schema" there means
// table/column shape, request-shape validation stays a controller-layer
// concern.
//
// 5.22's `updateProfile`/`changePassword` reuse this exact split rather
// than inventing a new one: same zod-schema-then-model-call shape
// signup/login already establish, same `toPublicUser` strip before
// responding, same lowercased-email-uniqueness-check pattern signup's
// own duplicate-email handling already has to do. Both are scoped to
// `req.user.id` (from authMiddleware) — there's no "update someone else's
// account" path here, on purpose; an owner/admin editing another user's
// row isn't a feature this task (or anything in TASKS.md) asks for.

const jwt = require('jsonwebtoken');
const { z } = require('zod');

const users = require('../models/users');
const restaurants = require('../models/restaurants');
const { withTransaction } = require('../config/db');
const { hashPassword, verifyPassword } = require('../utils/passwordHash');
const { badRequest, unauthorized, conflict } = require('../utils/errors');

// bcrypt silently truncates/ignores input past 72 bytes — capping here
// means a caller finds out at signup that their password is too long,
// not later at login when a 90-char password quietly hashes the same as
// its first 72 bytes.
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

const signupSchema = z.object({
  role: z.enum(['owner', 'admin']),
  full_name: z.string().trim().min(1, 'full_name is required').max(120),
  email: z.string().trim().email('email must be a valid email address').max(160),
  phone: z.string().trim().min(1, 'phone is required').max(30),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    .max(MAX_PASSWORD_LENGTH, `password must be at most ${MAX_PASSWORD_LENGTH} characters`),
});

// Login only needs enough shape-checking to call the DB/bcrypt safely —
// no length/role rules here, since a wrong-length or wrong-role value on
// login just fails at the credential check below with the same generic
// message any other wrong credential gets (see INVALID_CREDENTIALS_MESSAGE).
const loginSchema = z.object({
  email: z.string().trim().email('email must be a valid email address').max(160),
  password: z.string().min(1, 'password is required'),
});

// Oracle's unique-constraint violation error number (ORA-00001), for the
// `uq_users_email` constraint (backend/migrations/0006_users_restaurants
// .up.sql). Caught below as a fallback in case two signups for the same
// email race past the pre-check — belt-and-suspenders, not the primary
// check (fakeDb, used in this file's tests, doesn't enforce uniqueness at
// all, which is exactly why the pre-check exists and is what's actually
// under test).
const ORA_UNIQUE_CONSTRAINT_VIOLATION = 1;

// One message for every way login can fail (unknown email, wrong
// password) — returning a different message for "no such email" than for
// "wrong password" would let login be used to enumerate which emails have
// accounts, which a signup-duplicate check (1.12) already tells you
// separately but a login endpoint has no reason to also confirm.
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

// Never send `password_hash` (or, needless to say, a raw password) back
// to a client — not from signup, not from login, not from anything later
// that also reads a `users` row (profile endpoints, etc).
function toPublicUser(user) {
  const { password_hash, ...publicUser } = user;
  return publicUser;
}

// JWT payload carries only what auth middleware (1.14) will need to
// identify the caller — the user's id (as `sub`, the conventional JWT
// "subject" claim) and `role` (owner vs admin, since several later
// routes branch on that) — never `password_hash` or any other column.
function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function signup(req, res, next) {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw badRequest(firstIssue ? firstIssue.message : 'Invalid signup payload');
    }

    const { role, full_name, phone, password } = parsed.data;
    // Emails are case-insensitive identifiers for login purposes — lower-
    // casing before both the uniqueness check and the insert means
    // "a@x.com" and "A@X.com" collide as the same account rather than
    // silently creating two.
    const email = parsed.data.email.toLowerCase();

    const existing = await users.findAll({ email });
    if (existing.length > 0) {
      throw conflict('An account with this email already exists');
    }

    const password_hash = await hashPassword(password);

    let created;
    try {
      created = await withTransaction(async (connection) => {
        const user = await users.create(
          { role, full_name, email, phone, password_hash },
          { connection }
        );

        // Owners must have a restaurant row before attachOwnerRestaurant
        // can resolve their restaurant for the Request Live flow. The
        // initial name is only a draft value; the existing Restaurant
        // settings screen lets the owner replace it after approval.
        if (role === 'owner') {
          await restaurants.create(
            {
              owner_id: user.id,
              name: `${full_name}'s Restaurant`,
              phone,
              live_status: 'not_requested',
              is_suspended: 0,
              is_open: 0,
            },
            { connection }
          );
        }

        await connection.commit();
        return user;
      });
    } catch (err) {
      if (err.errorNum === ORA_UNIQUE_CONSTRAINT_VIOLATION) {
        throw conflict('An account with this email already exists');
      }
      throw err;
    }

    res.status(201).json({ user: toPublicUser(created) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw badRequest(firstIssue ? firstIssue.message : 'Invalid login payload');
    }

    const email = parsed.data.email.toLowerCase();
    const { password } = parsed.data;

    // Same lowercased-email lookup signup (1.12) uses to check for a
    // duplicate — here it's finding the one row to check credentials
    // against, rather than checking none exists.
    const [user] = await users.findAll({ email });
    if (!user) {
      throw unauthorized(INVALID_CREDENTIALS_MESSAGE);
    }

    // verifyPassword (1.11) itself throws (not returns false) if
    // `user.password_hash` is missing/malformed — that's a genuine data
    // bug (e.g. a row that somehow got created without a proper hash),
    // not a wrong-password case, and is deliberately left to propagate to
    // the central error handler as a 500 rather than being folded into
    // "invalid credentials" here.
    const passwordMatches = await verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
      throw unauthorized(INVALID_CREDENTIALS_MESSAGE);
    }

    const token = signToken(user);
    res.status(200).json({ user: toPublicUser(user), token });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me — Task 1.14d, the first route protected by
// authMiddleware (1.14a-c). No DB call of its own: authMiddleware has
// already looked the user up and attached the public (no
// password_hash) shape as req.user by the time a request reaches
// here, so this handler's only job is to hand that back. Exists mainly
// to give the middleware a real, callable endpoint to be exercised
// through (see authController.test.js's new describe block) rather than
// only via authMiddleware.test.js's direct function calls — and because
// "confirm who I'm logged in as" is a route most real clients need
// regardless.
function me(req, res) {
  res.status(200).json({ user: req.user });
}

// updateProfile — Task 5.22, PATCH /api/auth/me
//
// All three fields optional (a caller editing just their phone number
// shouldn't have to resend name/email too) but at least one must be
// present — an empty `{}` body reaching here is a caller bug, not a
// no-op success, so it's rejected the same way crudFactory's own
// `_updateWhere` rejects an empty update (see crudFactory.js's own
// comment on that).
const updateProfileSchema = z
  .object({
    full_name: z.string().trim().min(1, 'full_name is required').max(120).optional(),
    email: z.string().trim().email('email must be a valid email address').max(160).optional(),
    phone: z.string().trim().min(1, 'phone is required').max(30).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

async function updateProfile(req, res, next) {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw badRequest(firstIssue ? firstIssue.message : 'Invalid profile payload');
    }

    const data = { ...parsed.data };
    if (data.email !== undefined) {
      // Same case-insensitive-identifier reasoning signup's own
      // lowercasing has — without it "A@X.com" would sail past the
      // uniqueness check below against an existing "a@x.com" row.
      data.email = data.email.toLowerCase();

      if (data.email !== req.user.email) {
        const existing = await users.findAll({ email: data.email });
        // `existing` can only ever be this user's own row or nobody's —
        // `req.user.email` is already lowercased (every email in this
        // table is), so reaching here means data.email genuinely differs
        // from the caller's own — but the exact-match `findAll` used
        // here doesn't know that, so any hit is by definition someone
        // else's account.
        if (existing.length > 0) {
          throw conflict('An account with this email already exists');
        }
      }
    }

    let updated;
    try {
      updated = await users.update(req.user.id, data);
    } catch (err) {
      if (err.errorNum === ORA_UNIQUE_CONSTRAINT_VIOLATION) {
        throw conflict('An account with this email already exists');
      }
      throw err;
    }

    res.status(200).json({ user: toPublicUser(updated) });
  } catch (err) {
    next(err);
  }
}

// changePassword — Task 5.22, PATCH /api/auth/me/password
//
// Same length rules signup's own password field enforces
// (MIN_PASSWORD_LENGTH/MAX_PASSWORD_LENGTH above) — a changed password
// shouldn't be allowed to be weaker than what signup would ever have
// accepted in the first place.
const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'current_password is required'),
  new_password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `new_password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    .max(MAX_PASSWORD_LENGTH, `new_password must be at most ${MAX_PASSWORD_LENGTH} characters`),
});

// One message for a wrong current password, distinct from login's own
// INVALID_CREDENTIALS_MESSAGE — this isn't a login attempt an outside
// party could use to enumerate emails (the caller is already
// authenticated as this exact account via authMiddleware), so there's
// no reason to keep the message deliberately vague the way login's is.
const WRONG_CURRENT_PASSWORD_MESSAGE = 'Current password is incorrect';

async function changePassword(req, res, next) {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw badRequest(firstIssue ? firstIssue.message : 'Invalid password-change payload');
    }

    const { current_password: currentPassword, new_password: newPassword } = parsed.data;

    // req.user (from authMiddleware) is the public shape — no
    // password_hash — so the real row has to be re-fetched here to get
    // something verifyPassword can actually check against.
    const userRow = await users.findById(req.user.id);
    if (!userRow) {
      // Same "token names an account that no longer exists" case
      // authMiddleware itself already guards on every other protected
      // route — unreachable in practice since authMiddleware would have
      // 401'd first, kept here only as defense-in-depth rather than
      // assumed-unreachable dead code.
      throw unauthorized('Authentication required');
    }

    const currentMatches = await verifyPassword(currentPassword, userRow.password_hash);
    if (!currentMatches) {
      throw unauthorized(WRONG_CURRENT_PASSWORD_MESSAGE);
    }

    const password_hash = await hashPassword(newPassword);
    await users.update(req.user.id, { password_hash });

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, me, updateProfile, changePassword, toPublicUser };
