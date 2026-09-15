// adminSettingsController — Task 4.3
//
// Public (no auth) GET /api/admin-settings/registration — the "Request
// Live" screen's data source for `docs/NATRA_MASTER_PROMPT.md`'s
// registration flow step 3, "Show one-time registration fee and NATRA
// payment information". Public for the same reason `restaurant.routes.js`
// (3.3) and its siblings are: the caller here is an owner who has an
// account (unlike a Phase-3 customer) but, at this exact point in the
// flow, may not have logged in yet this session — `authMiddleware`
// gating this would make "see the fee before you commit to anything"
// impossible, and there's nothing sensitive in these five fields anyway
// (an admin who sets them expects every prospective owner to see them).
//
// Deliberately returns ONLY the five `registration_*` fields, not the
// whole `admin_settings` row — `order_timeout_mode`/
// `order_timeout_custom_minutes`/`notify_before_expiry` are Task 6.13's
// platform-internal order-timeout config, irrelevant to (and no business
// being exposed to) a prospective restaurant owner reading this screen.
// `models/adminSettings.js`'s own header comment explains why the model
// itself still exposes the full crudFactory surface despite this
// controller only ever reading a subset of it.
//
// `admin_settings` is a real singleton: migration 0010 seeds its one row
// at `id = 1` as part of the migration itself (not later sample/seed
// data), so in a real DB this row always exists by the time any request
// reaches here. The `notFound` fallback below only matters against
// `fakeDb` (this file's own test, and any future one, has to explicitly
// create that row first — fakeDb never runs migrations) or a genuinely
// broken deployment; it's a safety net, not an expected path.

const adminSettingsCrud = require('../models/adminSettings');
const { notFound } = require('../utils/errors');

// Real DB: enforced by `ck_admin_settings_id` (migration 0010) — this
// table can only ever have the one row, at this id.
const SETTINGS_ROW_ID = 1;

async function getRegistrationInfo(req, res, next) {
  try {
    const settings = await adminSettingsCrud.findById(SETTINGS_ROW_ID);
    if (!settings) {
      throw notFound('Registration settings have not been configured yet');
    }

    res.status(200).json({
      registration_fee_amount: settings.registration_fee_amount,
      registration_method_name: settings.registration_method_name,
      registration_account_number: settings.registration_account_number,
      registration_account_name: settings.registration_account_name,
      registration_instructions: settings.registration_instructions,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRegistrationInfo, SETTINGS_ROW_ID };
