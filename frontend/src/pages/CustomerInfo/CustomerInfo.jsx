import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import EmptyState from '../../components/EmptyState';
import FormField from '../../components/FormField';
import RoleShell from '../../components/RoleShell';
import { useOrderCart } from '../../hooks';
import styles from './CustomerInfo.module.css';

// Field length caps mirror `docs/DB_SCHEMA.md`'s `orders` table exactly
// (`customer_name VARCHAR2(120)`, `customer_location_text VARCHAR2(255)`,
// `customer_note VARCHAR2(500)`) — enforced client-side via `maxLength`
// so a customer finds out here, while still editing, rather than at
// Task 3.15's submit endpoint bouncing an otherwise-complete order back
// with a validation error. `customer_phone VARCHAR2(30)` has no
// client-side length cap here on purpose — see the phone-format note
// below.
const NAME_MAX_LENGTH = 120;
const LOCATION_MAX_LENGTH = 255;
const NOTE_MAX_LENGTH = 500;

// Every required field just needs *something* in it — no format
// enforcement beyond that, deliberately. `docs/DB_SCHEMA.md`'s own
// column notes call `customer_location_text` "free text" (no GPS
// anywhere in this project), and phone numbers in Ethiopia are commonly
// typed with our without a country code, with or without spaces/dashes
// (the same variety Task 1.10's backend `normalizePhone` utility already
// has to tolerate for Track Order/Order History). Rejecting a real phone
// number here for not matching an invented pattern would be a worse
// failure mode than accepting a typo an owner can call to confirm.
function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Enter your name.';
  if (!values.phone.trim()) errors.phone = 'Enter your phone number.';
  if (!values.locationText.trim()) errors.locationText = 'Enter your delivery location.';
  return errors;
}

/**
 * CustomerInfo — the Customer Info form, Task 3.12.
 * `docs/NATRA_MASTER_PROMPT.md`'s "Customer info" section: name, phone,
 * location (free text, no GPS), and an optional note — exactly the four
 * fields `docs/DB_SCHEMA.md`'s `orders` table names
 * (`customer_name`/`customer_phone`/`customer_location_text`/
 * `customer_note`), so this form has no open design questions the way
 * 3.4/3.5/3.9 each had: it's a direct `FormField`-per-field screen.
 *
 * Reached from Order Builder's (Task 3.10) "Continue" button, at
 * `/order/customer-info`. Rather than read a food/restaurant selection
 * out of router `state` the way Food Details → Order Builder does, this
 * screen reads the cart directly via `useOrderCart` (Task 3.10, extended
 * by this task with `customerInfo`) — Order Builder's own "Continue"
 * doesn't need to hand off anything through `state` any more, since
 * everything this screen needs (whether there's an order in progress at
 * all) is already sitting in the same sessionStorage-backed cart Order
 * Builder itself reads.
 *
 * **An empty cart** (no items — e.g. this URL visited directly, or after
 * a refresh with nothing in progress) renders the same
 * "browse restaurants" `EmptyState` Order Builder's own empty-cart case
 * uses, rather than showing a pointless form with nothing to attach it
 * to — same reasoning, applied to this screen instead of duplicated with
 * different copy.
 *
 * **Local `useState` while typing** (`values`, `touched`, matching the
 * "form owns its own draft, commits on submit" pattern every other
 * form-shaped control in this codebase uses, e.g. `QuantityStepper`'s
 * own draft-while-focused text — Task 2.9), seeded from
 * `cart.customerInfo` if the customer has already filled this in once
 * (e.g. navigated back from Task 3.13's payment method screen) rather
 * than always starting blank. `touched` tracks which fields have been
 * blurred at least once, so a required-field error doesn't appear the
 * instant the screen loads before the customer has had a chance to type
 * anything — it only shows after a field's own blur, or after a submit
 * attempt (which marks every field touched at once).
 *
 * On submit: validates all three required fields, and if clean, commits
 * the whole object to the cart via `setCustomerInfo` (this task's
 * addition to `useOrderCart`) and navigates to `/order/payment-method` —
 * Task 3.13's Payment Method selection screen, which reads the cart's
 * `restaurantId` directly rather than needing anything handed off via
 * router `state`.
 */
export default function CustomerInfo() {
  const navigate = useNavigate();
  const { cart, setCustomerInfo } = useOrderCart();

  const [values, setValues] = useState(() => ({
    name: cart.customerInfo?.name ?? '',
    phone: cart.customerInfo?.phone ?? '',
    locationText: cart.customerInfo?.locationText ?? '',
    note: cart.customerInfo?.note ?? '',
  }));
  const [touched, setTouched] = useState({});

  const errors = validate(values);

  const handleChange = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched({ name: true, phone: true, locationText: true, note: true });
    if (Object.keys(errors).length > 0) return;

    setCustomerInfo({
      name: values.name.trim(),
      phone: values.phone.trim(),
      locationText: values.locationText.trim(),
      // An empty note is stored as `null`, not `''` — matching
      // `customer_note`'s own nullable column rather than a distinct
      // "empty string" state neither the schema nor Task 3.15's submit
      // endpoint has any reason to tell apart from "no note".
      note: values.note.trim() || null,
    });
    navigate('/order/payment-method');
  };

  const isEmpty = cart.items.length === 0;

  return (
    <RoleShell role="customer">
      <div className={styles.page}>
        <h1 className={styles.heading}>Your details</h1>

        {isEmpty ? (
          <EmptyState
            title="Your order is empty"
            description="Add a food from any restaurant to start an order."
            action={
              <button type="button" className={styles.primaryButton} onClick={() => navigate('/')}>
                Browse restaurants
              </button>
            }
          />
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <FormField
              label="Name"
              required
              value={values.name}
              onChange={handleChange('name')}
              onBlur={handleBlur('name')}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Your full name"
              error={touched.name ? errors.name : undefined}
            />

            <FormField
              label="Phone"
              type="tel"
              required
              value={values.phone}
              onChange={handleChange('phone')}
              onBlur={handleBlur('phone')}
              placeholder="09XXXXXXXX"
              helperText="We'll only use this to confirm your order."
              error={touched.phone ? errors.phone : undefined}
            />

            <FormField
              as="textarea"
              label="Delivery location"
              required
              value={values.locationText}
              onChange={handleChange('locationText')}
              onBlur={handleBlur('locationText')}
              maxLength={LOCATION_MAX_LENGTH}
              placeholder="Neighborhood, landmark, house/building details…"
              error={touched.locationText ? errors.locationText : undefined}
            />

            <FormField
              as="textarea"
              label="Note"
              value={values.note}
              onChange={handleChange('note')}
              onBlur={handleBlur('note')}
              maxLength={NOTE_MAX_LENGTH}
              placeholder="Anything the restaurant should know (optional)"
              helperText="Optional — allergies, gate code, delivery timing, etc."
            />

            <button type="submit" className={styles.primaryButton}>
              Continue
            </button>
          </form>
        )}
      </div>
    </RoleShell>
  );
}
