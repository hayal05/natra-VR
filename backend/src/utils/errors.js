// Shared error type for the backend "kit" (crudFactory, statusTransition,
// auth, etc. — Phase 1). `backend/src/app.js`'s central error handler
// already reads `err.status` / `err.publicMessage`; every generic handler
// added in Phase 1 should throw one of these instead of a bare `Error` so
// that convention stays consistent everywhere, not just in the handlers
// that happen to remember to set those two fields by hand.

class ApiError extends Error {
  constructor(status, publicMessage, { cause } = {}) {
    super(publicMessage);
    this.name = 'ApiError';
    this.status = status;
    this.publicMessage = publicMessage;
    if (cause) this.cause = cause;
  }
}

const badRequest = (message) => new ApiError(400, message);
const unauthorized = (message = 'Unauthorized') => new ApiError(401, message);
const notFound = (message = 'Not found') => new ApiError(404, message);
const conflict = (message) => new ApiError(409, message);

module.exports = { ApiError, badRequest, unauthorized, notFound, conflict };
