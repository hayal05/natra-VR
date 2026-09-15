import { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import { setUnauthorizedHandler } from './api/client';
import AddFood from './pages/AddFood';
import AdminDashboard from './pages/AdminDashboard';
import AdminLiveRequestDetail from './pages/AdminLiveRequestDetail';
import AdminLiveRequests from './pages/AdminLiveRequests';
import AdminLogin from './pages/AdminLogin';
import AdminOrders from './pages/AdminOrders';
import AdminRestaurantDetail from './pages/AdminRestaurantDetail';
import AdminRestaurants from './pages/AdminRestaurants';
import AdminSettings from './pages/AdminSettings';
import ComponentSandbox from './pages/ComponentSandbox';
import CustomerInfo from './pages/CustomerInfo';
import FoodDetails from './pages/FoodDetails';
import Home from './pages/Home';
import LiveStatus from './pages/LiveStatus';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import OrderBuilder from './pages/OrderBuilder';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderDetail from './pages/OrderDetail';
import OrderHistory from './pages/OrderHistory';
import OwnerAccount from './pages/OwnerAccount';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerLogin from './pages/OwnerLogin';
import OwnerMenu from './pages/OwnerMenu';
import OwnerOrders from './pages/OwnerOrders';
import OwnerRegistration from './pages/OwnerRegistration';
import OwnerRestaurant from './pages/OwnerRestaurant';
import PaymentMethod from './pages/PaymentMethod';
import PaymentScreenshot from './pages/PaymentScreenshot';
import RequestLive from './pages/RequestLive';
import RestaurantProfile from './pages/RestaurantProfile';
import TrackOrder from './pages/TrackOrder';

// Task 8.7d replaced the `*` route's own element (see the `<Route
// path="*">` below) with a real `NotFound` screen (`src/pages/NotFound`)
// — the raw dev `Placeholder` component that used to live here (an
// unstyled `<div>` with a "— not built yet." string, `<Route
// path="*" element={<Placeholder label="Not Found" />} />`'s only
// remaining caller) is removed outright rather than left as unused dead
// code, since nothing else in this file still renders it. Kept only as
// this comment, for the doc comments below each owner/admin route that
// still mention "replacing the former inline `Placeholder`" this route
// used to point at — those are historical notes about what each route
// used to render, not references to code that still exists.

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Task 8.7e — registers what `api/client.js`'s `request()` calls when
  // any authenticated request comes back 401 (expired/invalid/missing
  // token). Re-registers on every navigation (the `[navigate, location]`
  // deps) purely so the closure always reads the *current* pathname when
  // deciding which role's login to send the person to — the handler
  // itself only actually runs on a 401, not on every render this effect
  // fires. Guards against redirecting a person who's already sitting on
  // the destination login screen (e.g. a stray authenticated call
  // firing right as `OwnerLogin`/`AdminLogin` itself mounts) so this
  // can never turn into a navigate-to-self loop.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      const loginPath = location.pathname.startsWith('/admin') ? '/admin/login' : '/owner/login';
      if (location.pathname === loginPath) return;
      navigate(loginPath, { replace: true, state: { sessionExpired: true } });
    });
  }, [navigate, location]);

  return (
    <Routes>
      {/* Customer routes (Phase 3) */}
      <Route path="/" element={<Home />} />
      <Route path="/restaurant/:id" element={<RestaurantProfile />} />
      <Route path="/food/:id" element={<FoodDetails />} />
      {/* Order Builder (Task 3.10) — real screen now. Reached from Food
          Details' (Task 3.9) Buy Now button, carrying the selected
          foodId/restaurantId/quantity via router `state`; see
          OrderBuilder.jsx's own doc comment for the full reasoning,
          including why its cart is sessionStorage-backed via
          useOrderCart rather than plain component state. */}
      <Route path="/order/builder" element={<OrderBuilder />} />
      {/* Customer Information (Task 3.12) — real screen now. Reads the
          in-progress order straight out of useOrderCart (Task 3.10,
          extended by this task with `customerInfo`) rather than needing
          anything handed off via router `state`. */}
      <Route path="/order/customer-info" element={<CustomerInfo />} />
      {/* Payment method selection (Task 3.13) — real screen now. Reads
          `cart.restaurantId` straight out of useOrderCart (Task 3.10) to
          fetch that restaurant's active payment methods; see
          PaymentMethod.jsx's own doc comment for the full reasoning. */}
      <Route path="/order/payment-method" element={<PaymentMethod />} />
      {/* Payment screenshot upload (Task 3.14) — real screen now. Reads
          `cart.paymentMethodId`/`items` straight out of useOrderCart;
          uploads via the new public
          `POST /api/uploads/payment-screenshot` and commits the
          returned URL back to the cart. See PaymentScreenshot.jsx's own
          doc comment for the full reasoning. */}
      <Route path="/order/payment-screenshot" element={<PaymentScreenshot />} />
      {/* Order confirmation (Task 3.16) — real screen now. This is also
          where the built-up order in useOrderCart is actually submitted
          via POST /api/orders (Task 3.15) — no earlier screen does that;
          see OrderConfirmation.jsx's own doc comment for the full
          reasoning, including why the submit fires from this screen and
          not from Payment Screenshot's own "Continue". */}
      <Route path="/order/confirm" element={<OrderConfirmation />} />
      {/* Track Order (Task 3.17) — real screen now. Order ID + phone form
          wired to the new GET /api/orders/track; reached from RoleShell's
          own "Orders" bottom-nav tab (already pointed at /track since
          Task 2.17) or Order Confirmation's "Track order" button. See
          TrackOrder.jsx's own doc comment for the full reasoning. */}
      <Route path="/track" element={<TrackOrder />} />
      {/* Order History (Task 3.18) — real screen now. Phone-only form
          wired to the new GET /api/orders/history; reached from Track
          Order's own "View order history" link (this task also added a
          reciprocal "Track a specific order" link back). Deliberately
          NOT wired into RoleShell's "Orders" bottom-nav tab, which stays
          pointed at /track: the reference UI's bottom bar
          (docs/reference_ui/1000065033.jpg) has exactly four fixed
          slots with no fifth for this screen, and NATRA_MASTER_PROMPT.md
          names Track Order and Order History as two distinct customer
          needs, not one screen one tab could represent — so this route
          is reached via the in-page cross-links instead, same as how
          Order Confirmation's own "Track order" button already reaches
          /track without a dedicated nav entry. See OrderHistory.jsx's
          own doc comment for the full screen-level reasoning. */}
      <Route path="/history" element={<OrderHistory />} />

      {/* Unified login (Task 8.7f) — the customer bottom-nav's "Profile"
          tab (RoleShell.jsx) has no profile screen of its own to send a
          customer to (the product spec is explicit customers have no
          accounts) and now carries a login icon instead, so it routes
          here rather than the never-built `/profile`. This screen is
          just a fork onto the two logins that already exist below —
          `/owner/login` and `/admin/login` — not a third auth
          implementation. */}
      <Route path="/login" element={<Login />} />

      {/* Restaurant owner routes (Phase 4-5) */}
      {/* Owner registration (Task 4.1) — real screen now. The endpoint
          side of this task (POST /api/auth/signup) already existed from
          Task 1.12; this is the new frontend form for it. On success,
          navigates to /owner/login (Task 4.2, also real now) with a
          `justRegistered` state flag that screen reads for an
          "account created" banner. See OwnerRegistration.jsx's own doc
          comment for the full reasoning, including why this screen
          deliberately does NOT also log the new owner in. */}
      <Route path="/owner/register" element={<OwnerRegistration />} />
      {/* Owner login (Task 4.2) — real screen now. POST /api/auth/login
          (Task 1.13) already existed and already returns { user, token };
          this is the new frontend form for it, storing the returned
          token via tokenStorage (Task 3.1, dormant until now) and
          reading OwnerRegistration's (4.1) `justRegistered`/`email`
          router state for a "account created" banner. Navigates to
          /owner/dashboard (still a placeholder below, until Phase 5
          builds a real one) on success. See OwnerLogin.jsx's own doc
          comment for the full reasoning. */}
      <Route path="/owner/login" element={<OwnerLogin />} />
      {/* Owner Dashboard (Task 5.1) — real screen now, and the first
          owner screen wrapped in `RoleShell role="owner"`. Replaces the
          former inline `Placeholder` this route used to point at (which
          only ever had one working link, "Request to go Live") — that
          same link is preserved here, plus a new "Check Live status"
          link this task's own nav wiring makes reachable for the first
          time outside the post-submission redirect. Dashboard widgets
          (new-orders count, sales summary, quick actions) are Tasks
          5.17-5.19's job, not this one's. See OwnerDashboard.jsx's own
          doc comment for the full reasoning. */}
      <Route path="/owner/dashboard" element={<OwnerDashboard />} />
      {/* Orders / Restaurant / Account (Task 5.1) — the other three
          tabs `RoleShell`'s owner nav (Task 2.18) has pointed at since
          it was built, with nothing at any of the three routes until
          now. Each is wrapped in `RoleShell role="owner"` so the full
          4-tab nav is reachable end-to-end, with its real content
          explicitly left to a later task — see each page's own doc
          comment (OwnerOrders.jsx: Tasks 5.12-5.16; OwnerRestaurant.jsx:
          Tasks 5.2-5.11; OwnerAccount.jsx: Task 5.22) for what's
          deliberately not built yet and why. */}
      <Route path="/owner/orders" element={<OwnerOrders />} />
      {/* Order detail (Task 5.13) — real screen now, reached by tapping a
          row on OwnerOrders.jsx (5.12b), which had explicitly flagged "no
          tap-through to a detail view (that's Task 5.13's job)" until
          now. See OrderDetail.jsx's own doc comment for the full
          reasoning, including the new GET /api/orders/:id route this
          task's backend half added. */}
      <Route path="/owner/orders/:id" element={<OrderDetail />} />
      <Route path="/owner/restaurant" element={<OwnerRestaurant />} />
      <Route path="/owner/account" element={<OwnerAccount />} />
      {/* Menu management (Task 5.9b) — real list screen now, reached via
          a link from OwnerRestaurant.jsx rather than a fifth RoleShell
          owner nav tab (docs/NATRA_MASTER_PROMPT.md names exactly four).
          See OwnerMenu.jsx's own doc comment for the full reasoning. */}
      <Route path="/owner/restaurant/menu" element={<OwnerMenu />} />
      {/* Add Food (Task 5.10) — real screen now, replacing the former
          Placeholder this route pointed at. See AddFood.jsx's own doc
          comment for the full reasoning, including the new
          POST /api/uploads/food-photo route this task added and why
          the photo upload is deferred to submit rather than immediate-
          on-pick the way OwnerRestaurant.jsx's logo/cover fields are. */}
      <Route path="/owner/restaurant/menu/new" element={<AddFood />} />
      {/* Edit Food (Task 5.11) — "reuse Add Food form" per docs/TASKS.md,
          so this is the same <AddFood /> component, not a second one;
          it reads the :id param to switch into edit mode (fetch the
          existing food, PATCH instead of POST on submit). See
          AddFood.jsx's own doc comment for the full reasoning. */}
      <Route path="/owner/restaurant/menu/:id/edit" element={<AddFood />} />
      {/* Request Live (Task 4.3) — real screen now, the first real use
          of the Wizard component (Task 2.20, previously only previewed
          against mock data in ComponentSandbox). Step 1 shows the fee/
          NATRA payment info fetched from the new public
          GET /api/admin-settings/registration; Step 2 is an explicit
          placeholder — the real payment-screenshot upload UI is Task
          4.4's job, not this one's. See RequestLive.jsx's own doc
          comment for the full reasoning, including the known
          no-restaurant-creation-endpoint gap this task doesn't need to
          resolve but Task 4.5 will. */}
      <Route path="/owner/request-live" element={<RequestLive />} />
      {/* Pending-state screen (Task 4.6) — real screen now. Reached
          after Request Live's (4.3-4.5) submission succeeds; fetches
          the owner's own restaurant's latest live_requests row via the
          new GET /api/live-requests/latest and renders one of four
          states (no request yet / pending / approved / rejected). See
          LiveStatus.jsx's own doc comment for the full reasoning,
          including why an approved-state render exists here already
          even though nothing yet drives it for real (that's Task 4.7's
          manual-DB-flip job to exercise). */}
      <Route path="/owner/live-status" element={<LiveStatus />} />

      {/* Admin routes (Phase 6) */}
      {/* Admin login (Task 6.1) — real screen now. POST /api/auth/login
          (Task 1.13) already exists and is role-agnostic; this screen's
          job is collecting email/password, calling it, and — unlike
          OwnerLogin — rejecting a successful-but-wrong-role login
          client-side before ever storing a token. See AdminLogin.jsx's
          own doc comment for the full reasoning. */}
      <Route path="/admin/login" element={<AdminLogin />} />
      {/* Admin Dashboard/Restaurants/Orders/Settings (Task 6.2) — the
          other three sidebar links `RoleShell` admin nav (Task 2.19)
          has pointed at since it was built, plus Dashboard's own former
          inline `Placeholder`, now all four real routes each wrapped in
          `RoleShell role="admin"` so the full sidebar is reachable
          end-to-end — same "nav wiring now, real content later" split
          Task 5.1 used for the owner role. Each page's own doc comment
          names exactly which later task (6.3, 6.4-6.8, 6.9-6.11,
          6.12-6.13) fills in its real content. */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      {/* Restaurant management list (Task 6.4b) — real screen now,
          wired to 6.4a's new `GET /api/admin/restaurants` via
          `ListWithPagination` (Task 2.16) plus a debounced `SearchBar`
          (Task 3.6's own pattern) for the name filter. Live-request
          review, approve/reject, and suspend/reactivate remain Tasks
          6.6-6.8's job — see AdminRestaurants.jsx's own doc comment for
          the full reasoning. */}
      <Route path="/admin/restaurants" element={<AdminRestaurants />} />
      {/* Restaurant detail (Task 6.5b) — real screen now, reached by
          tapping a row on AdminRestaurants.jsx (6.4b), which had
          explicitly flagged "no tap-through to a detail view (that's
          Task 6.5's job)" until now. Read-only — see
          AdminRestaurantDetail.jsx's own doc comment for the full
          reasoning, including the new GET /api/admin/restaurants/:id
          route Task 6.5a's backend half added and why Live-request
          review/approve/reject/suspend stay out of this screen. */}
      <Route path="/admin/restaurants/:id" element={<AdminRestaurantDetail />} />
      {/* Live-request review, frontend (Tasks 6.6d-6.6f) — real query
          layer, page shell, row rendering, and tap-through to a detail/
          review screen now, wired to 6.6b's `GET /api/admin/live-requests`
          and 6.6c's `GET /api/admin/live-requests/:id`; see
          AdminLiveRequests.jsx's/AdminLiveRequestDetail.jsx's own doc
          comments for the full reasoning. Not yet linked from anywhere in
          the UI — Task 6.2's fixed four-item sidebar has no "Live
          Requests" entry, so both routes exist ahead of a real entry
          point being wired up. */}
      <Route path="/admin/live-requests" element={<AdminLiveRequests />} />
      <Route path="/admin/live-requests/:id" element={<AdminLiveRequestDetail />} />
      <Route path="/admin/orders" element={<AdminOrders />} />
      {/* Order detail, read-only admin mode (Task 6.11b) — reached by
          tapping a row on AdminOrders.jsx (6.9/6.10b), which had
          explicitly flagged "no tap-through yet (that's Task 6.11's
          job)" until now. Reuses OrderDetail.jsx (5.13) directly via its
          new `role` prop, rather than a second near-identical screen —
          see that component's own doc comment (its "Task 6.11b" section)
          for the full reasoning, including the new
          GET /api/admin/orders/:id route Task 6.11a's backend half
          added and why the Accept/Reject/Complete/Call Customer action
          row never renders here. */}
      <Route path="/admin/orders/:id" element={<OrderDetail role="admin" />} />
      <Route path="/admin/settings" element={<AdminSettings />} />

      {/* Dev tooling (Task 2.21) — not a customer/owner/admin screen, so it
          deliberately sits outside all three RoleShell variants rather than
          under /owner or /admin. Renders all 16 Phase 2 kit components
          against mock data; see src/pages/ComponentSandbox for details. */}
      <Route path="/dev/components" element={<ComponentSandbox />} />

      {/* Catch-all (Task 8.7d) — a real `NotFound` screen now, replacing
          the raw dev `Placeholder` this route used to point at (see this
          file's own comment above, right before this component's route
          list starts, for the full removal reasoning). See
          `NotFound.jsx`'s own doc comment for why it sits outside every
          `RoleShell` variant and links to `/` rather than back in
          history. */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
