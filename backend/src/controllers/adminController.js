const { z } = require('zod');

const { getDashboardSummary } = require('../services/adminDashboardSummary');
const { listRestaurantsForAdmin } = require('../services/adminRestaurantsList');
const {
  listLiveRequestsForAdmin,
  getLiveRequestForAdmin,
  getLatestLiveRequestForRestaurant,
} = require('../services/adminLiveRequestsList');
const { approveLiveRequest, rejectLiveRequest } = require('../services/updateLiveRequestStatus');
const { listOrdersForAdmin } = require('../services/adminOrdersList');
const { recomputePopularityStats } = require('../services/popularityAggregation');
const restaurantsCrud = require('../models/restaurants');
const ordersCrud = require('../models/orders');
const orderItemsCrud = require('../models/orderItems');
const paymentMethodsCrud = require('../models/paymentMethods');
const adminSettingsCrud = require('../models/adminSettings');
const { SETTINGS_ROW_ID } = require('./adminSettingsController');
const { badRequest, notFound } = require('../utils/errors');

async function getDashboardSummaryHandler(req, res, next) {
  try { res.status(200).json(await getDashboardSummary()); } catch (err) { next(err); }
}

async function listRestaurantsHandler(req, res, next) {
  try {
    const { rows, meta } = await listRestaurantsForAdmin(req.query);
    res.status(200).json({ restaurants: rows, meta });
  } catch (err) { next(err); }
}

async function getRestaurantDetailHandler(req, res, next) {
  try {
    const restaurant = await restaurantsCrud.getOrThrow(req.params.id);
    const liveRequest = await getLatestLiveRequestForRestaurant(req.params.id);
    res.status(200).json({ restaurant, live_request: liveRequest });
  } catch (err) { next(err); }
}

async function listLiveRequestsHandler(req, res, next) {
  try {
    const { rows, meta } = await listLiveRequestsForAdmin(req.query);
    res.status(200).json({ live_requests: rows, meta });
  } catch (err) { next(err); }
}

async function getLiveRequestDetailHandler(req, res, next) {
  try {
    const liveRequest = await getLiveRequestForAdmin(req.params.id);
    res.status(200).json({ live_request: liveRequest });
  } catch (err) { next(err); }
}

function parseOrThrow(schema, body) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw badRequest(firstIssue ? firstIssue.message : 'Invalid request payload');
  }
  return parsed.data;
}

const updateLiveRequestStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
}).strict();

async function updateLiveRequestStatusHandler(req, res, next) {
  try {
    const { status } = parseOrThrow(updateLiveRequestStatusSchema, req.body);
    const liveRequest = await getLiveRequestForAdmin(req.params.id);
    const transition = status === 'approved' ? approveLiveRequest : rejectLiveRequest;
    const updated = await transition(liveRequest, req.user.id);
    res.status(200).json({ live_request: updated });
  } catch (err) { next(err); }
}

const isSuspendedSchema = z.number().refine((v) => v === 0 || v === 1, {
  message: 'is_suspended must be a boolean',
});

function toIsSuspendedNumber(value) {
  if (typeof value !== 'boolean') throw badRequest('is_suspended must be a boolean');
  return value ? 1 : 0;
}

const updateRestaurantSuspensionSchema = z.object({
  is_suspended: isSuspendedSchema,
}).strict();

async function updateRestaurantSuspensionHandler(req, res, next) {
  try {
    const is_suspended = toIsSuspendedNumber(req.body.is_suspended);
    const { is_suspended: validated } = parseOrThrow(updateRestaurantSuspensionSchema, { is_suspended });
    const updated = await restaurantsCrud.update(req.params.id, { is_suspended: validated });
    if (!updated) throw notFound('restaurants not found');
    res.status(200).json({ restaurant: updated });
  } catch (err) { next(err); }
}

async function listOrdersHandler(req, res, next) {
  try {
    const { rows, meta } = await listOrdersForAdmin(req.query);
    res.status(200).json({ orders: rows, meta });
  } catch (err) { next(err); }
}

async function getOrderDetailHandler(req, res, next) {
  try {
    const order = await ordersCrud.getOrThrow(req.params.id);
    const [items, paymentMethod] = await Promise.all([
      orderItemsCrud.findAll({ order_id: order.id }),
      paymentMethodsCrud.findById(order.payment_method_id),
    ]);
    res.status(200).json({ order, items, payment_method: paymentMethod });
  } catch (err) { next(err); }
}

const REGISTRATION_METHOD_NAME_MAX_LENGTH = 60;
const REGISTRATION_ACCOUNT_NUMBER_MAX_LENGTH = 60;
const REGISTRATION_ACCOUNT_NAME_MAX_LENGTH = 120;
const REGISTRATION_INSTRUCTIONS_MAX_LENGTH = 500;
const MAX_REGISTRATION_FEE_AMOUNT = 99999999.99;

const registrationFeeAmountSchema = z.number({ invalid_type_error: 'registration_fee_amount must be a number' })
  .nonnegative('registration_fee_amount cannot be negative')
  .max(MAX_REGISTRATION_FEE_AMOUNT, `registration_fee_amount cannot exceed ${MAX_REGISTRATION_FEE_AMOUNT}`)
  .refine((value) => Number(value.toFixed(2)) === value, {
    message: 'registration_fee_amount can have at most 2 decimal places',
  });

const registrationMethodNameSchema = z.string().trim().min(1, 'registration_method_name is required').max(REGISTRATION_METHOD_NAME_MAX_LENGTH);
const registrationAccountNumberSchema = z.string().trim().min(1, 'registration_account_number is required').max(REGISTRATION_ACCOUNT_NUMBER_MAX_LENGTH);
const registrationAccountNameSchema = z.string().trim().min(1, 'registration_account_name is required').max(REGISTRATION_ACCOUNT_NAME_MAX_LENGTH);
const registrationInstructionsSchema = z.string().trim().max(REGISTRATION_INSTRUCTIONS_MAX_LENGTH, `registration_instructions must be at most ${REGISTRATION_INSTRUCTIONS_MAX_LENGTH} characters`).nullable();

const ORDER_TIMEOUT_MODES = ['off', '15m', '30m', '1h', 'custom'];
const MAX_ORDER_TIMEOUT_CUSTOM_MINUTES = 99999;
const orderTimeoutModeSchema = z.enum(ORDER_TIMEOUT_MODES, {
  errorMap: () => ({ message: `order_timeout_mode must be one of: ${ORDER_TIMEOUT_MODES.join(', ')}` }),
});
const orderTimeoutCustomMinutesSchema = z.number({ invalid_type_error: 'order_timeout_custom_minutes must be a number' })
  .int('order_timeout_custom_minutes must be a whole number of minutes')
  .positive('order_timeout_custom_minutes must be a positive number of minutes')
  .max(MAX_ORDER_TIMEOUT_CUSTOM_MINUTES, `order_timeout_custom_minutes cannot exceed ${MAX_ORDER_TIMEOUT_CUSTOM_MINUTES}`)
  .nullable();
const notifyBeforeExpirySchema = z.number()
  .refine((v) => v === 0 || v === 1, { message: 'notify_before_expiry must be a boolean' })
  .optional();

function toNotifyBeforeExpiryNumber(value) {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') throw badRequest('notify_before_expiry must be a boolean');
  return value ? 1 : 0;
}

const updateAdminSettingsSchema = z.object({
  registration_fee_amount: registrationFeeAmountSchema.optional(),
  registration_method_name: registrationMethodNameSchema.optional(),
  registration_account_number: registrationAccountNumberSchema.optional(),
  registration_account_name: registrationAccountNameSchema.optional(),
  registration_instructions: registrationInstructionsSchema.optional(),
  order_timeout_mode: orderTimeoutModeSchema.optional(),
  order_timeout_custom_minutes: orderTimeoutCustomMinutesSchema.optional(),
  notify_before_expiry: notifyBeforeExpirySchema,
}).strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided to update' })
  .superRefine((data, ctx) => {
    if (data.order_timeout_mode === 'custom' && (data.order_timeout_custom_minutes ?? null) === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "order_timeout_custom_minutes is required when order_timeout_mode is 'custom'",
        path: ['order_timeout_custom_minutes'],
      });
    }
  });

async function getSettingsHandler(req, res, next) {
  try {
    const settings = await adminSettingsCrud.findById(SETTINGS_ROW_ID);
    if (!settings) throw notFound('Platform settings have not been configured yet');
    res.status(200).json({ settings });
  } catch (err) { next(err); }
}

async function updateSettingsHandler(req, res, next) {
  try {
    const notify_before_expiry = toNotifyBeforeExpiryNumber(req.body.notify_before_expiry);
    const data = parseOrThrow(updateAdminSettingsSchema, { ...req.body, notify_before_expiry });
    if (data.notify_before_expiry === undefined) delete data.notify_before_expiry;
    const updated = await adminSettingsCrud.update(SETTINGS_ROW_ID, data);
    if (!updated) throw notFound('Platform settings have not been configured yet');
    res.status(200).json({ settings: updated });
  } catch (err) { next(err); }
}

async function recomputePopularityHandler(req, res, next) {
  try {
    await recomputePopularityStats();
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = {
  getDashboardSummaryHandler,
  listRestaurantsHandler,
  getRestaurantDetailHandler,
  listLiveRequestsHandler,
  getLiveRequestDetailHandler,
  updateLiveRequestStatusHandler,
  updateLiveRequestStatusSchema,
  updateRestaurantSuspensionHandler,
  updateRestaurantSuspensionSchema,
  listOrdersHandler,
  getOrderDetailHandler,
  getSettingsHandler,
  updateSettingsHandler,
  updateAdminSettingsSchema,
  recomputePopularityHandler,
};
