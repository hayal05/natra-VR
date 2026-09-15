const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const foodRoutes = require('./routes/food.routes');
const customerFoodRoutes = require('./routes/customerFood.routes');
const customerFoodDetailRoutes = require('./routes/customerFoodDetail.routes');
const categoryRoutes = require('./routes/category.routes');
const customerCategoryRoutes = require('./routes/customerCategory.routes');
const serviceAreaRoutes = require('./routes/serviceArea.routes');
const paymentMethodRoutes = require('./routes/paymentMethod.routes');
const openingHoursRoutes = require('./routes/openingHours.routes');
const restaurantRoutes = require('./routes/restaurant.routes');
const customerSearchRoutes = require('./routes/customerSearch.routes');
const uploadRoutes = require('./routes/upload.routes');
const orderRoutes = require('./routes/order.routes');
const adminSettingsRoutes = require('./routes/adminSettings.routes');
const liveRequestRoutes = require('./routes/liveRequest.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN || '*',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  // MUST be mounted before the owner-scoped '/api/foods' router below —
  // '/api/foods/popular' is a prefix match for '/api/foods' too, and
  // Express tries app.use(...) mounts in registration order. If the
  // owner-scoped router (which has its own 'GET /:id') were reached
  // first, it would match the literal segment "popular" as an :id and
  // 401 via authMiddleware before this public route ever ran. See
  // customerFood.routes.js's own header comment for the full writeup —
  // same shadowing concern as '/api/categories/live' below.
  app.use('/api/foods/popular', customerFoodRoutes);
  // Same shadowing concern as '/api/foods/popular' above — MUST be
  // mounted before the owner-scoped '/api/foods' router. See
  // customerFoodDetail.routes.js's own header comment (Task 3.9) for the
  // full writeup, including why this is a separate router/segment from
  // both '/api/foods/popular' and the owner-scoped 'GET /:id'.
  app.use('/api/foods/detail', customerFoodDetailRoutes);
  app.use('/api/foods', foodRoutes);
  // MUST be mounted before the owner-scoped '/api/categories' router below
  // — '/api/categories/live' is a prefix match for '/api/categories' too,
  // and Express tries app.use(...) mounts in registration order. If the
  // owner-scoped router (which has its own 'GET /:id') were reached first,
  // it would match the literal segment "live" as an :id and 401 via
  // authMiddleware before this public route ever ran. See
  // customerCategory.routes.js's own header comment for the full writeup.
  app.use('/api/categories/live', customerCategoryRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/service-areas', serviceAreaRoutes);
  app.use('/api/payment-methods', paymentMethodRoutes);
  app.use('/api/opening-hours', openingHoursRoutes);
  app.use('/api/restaurants', restaurantRoutes);
  // No shadowing concern here (unlike '/api/foods/popular' and
  // '/api/categories/live' above) — there is no owner-scoped
  // '/api/search' router this needs to be mounted before or after.
  app.use('/api/search', customerSearchRoutes);
  // Task 3.14 — payment screenshot upload. Its own top-level segment
  // (not nested under a not-yet-existing '/api/orders') since a
  // customer uploads the screenshot on its own screen, one step before
  // "submit order" (Task 3.15) exists at all — see upload.routes.js's
  // own header comment.
  app.use('/api/uploads', uploadRoutes);
  // Task 3.15c — submit order. No shadowing concern (see
  // order.routes.js's own header comment) — first and only router for
  // this path.
  app.use('/api/orders', orderRoutes);
  // Task 4.3 — public read of the registration fee/NATRA payment info
  // the "Request Live" screen shows. No shadowing concern (see this
  // router's own header comment) — first and only router for this path.
  app.use('/api/admin-settings', adminSettingsRoutes);
  // Task 4.5c — owner-authenticated Request Live submit endpoint. No
  // shadowing concern — first and only router for this path.
  app.use('/api/live-requests', liveRequestRoutes);
  // Task 6.3a — admin dashboard summary (totals + recent activity feed).
  // No shadowing concern (see admin.routes.js's own header comment) —
  // first and only router for this path.
  app.use('/api/admin', adminRoutes);
  // Task 7.5b — GET (list)/PATCH (mark-read) for the caller's own
  // notifications. No shadowing concern (see notification.routes.js's
  // own header comment) — first and only router for this path.
  app.use('/api/notifications', notificationRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Central error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({
      error: err.publicMessage || 'Internal server error',
    });
  });

  return app;
}

module.exports = createApp;
