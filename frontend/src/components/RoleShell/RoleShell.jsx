import { NavLink } from 'react-router-dom';

import { useOwnerNewOrderAlerts, useOwnerOrderBadgeCount } from '../../hooks';
import styles from './RoleShell.module.css';

/**
 * RoleShell — the outer app frame (scrollable content area + a fixed
 * role-specific navigation chrome), so individual screens only have to
 * render their own content and never re-implement the nav bar around it.
 *
 * Three variants are named across TASKS.md (2.17 customer bottom-nav,
 * 2.18 owner 4-tab nav, 2.19 admin sidebar, this entry) because the three
 * roles' navigation shapes genuinely differ (docs/NATRA_MASTER_PROMPT.md:
 * the customer has no "sections" concept at all, just the four tabs
 * below; "Restaurant owner navigation" names its own, different four;
 * "Admin" lists a fourth, different set again, and reads as a heavier,
 * more desktop-oriented tool rather than a phone-first one — "Keep admin
 * lightweight" is about scope/feature count, not about being another
 * touch-first bottom-nav screen). 2.17/2.18 share one bottom-nav render
 * path via the `role` prop since owner's 4-tab set really is the same
 * chrome shape as customer's, just different destinations. Admin's
 * sidebar is a genuinely different layout (a fixed left rail, content
 * offset to its right, not a bottom bar with content padded above it),
 * so it's its own render branch below rather than forced into the
 * bottom-nav markup with a "make it vertical" CSS hack.
 *
 * All three tab/link sets are hardcoded per role rather than passed in
 * as a prop — unlike e.g. ListWithPagination's `items`/`renderItem`,
 * each is a fixed navigation menu identical across every screen for that
 * role, not content that varies per use site, so there's nothing a
 * caller would ever need to override.
 *
 * Customer tabs (`role="customer"`, the default): Home, Categories,
 * Orders, Login — order taken directly from the reference UI
 * (`docs/reference_ui/1000065033.jpg`'s bottom bar), whose fourth tab
 * was "Profile" with a person icon. "Orders" routes to `/track` (Task
 * 3.17's Track Order screen, already scaffolded in App.jsx). The fourth
 * tab is relabeled "Login", uses a login glyph (`LoginIcon`, below), and
 * routes to `/login` (Task 8.7f's new unified login chooser, `App.jsx`)
 * rather than the reference UI's "Profile" and an unbuilt `/profile` —
 * the product spec is explicit customers have no accounts, so there's
 * nothing a "Profile" screen would ever show a customer; what this tab
 * actually reaches is the fork onto `OwnerLogin`/`AdminLogin`, the two
 * logins that *do* exist. `/categories` is still not a real route in
 * App.jsx yet; wiring it up remains Phase 3's job, not this
 * component-kit task's.
 *
 * Owner tabs (`role="owner"`): Dashboard, Orders, Restaurant, Account —
 * this exact set and order is `docs/NATRA_MASTER_PROMPT.md`'s
 * "Restaurant owner navigation" section verbatim ("Exactly four main
 * sections"), the only nav content for this role the spec actually
 * names — there's no reference-image bottom bar for the owner role to
 * measure icons/order from the way the customer variant had. "Dashboard"
 * routes to `/owner/dashboard`; "Orders"/"Restaurant"/"Account" point at
 * `/owner/orders`, `/owner/restaurant`, `/owner/account` — all four now
 * real routes in App.jsx (Task 5.1 wired them up, each wrapped in
 * `RoleShell role="owner"` itself), though only Dashboard has real
 * content today; the other three are Task 5.1's own placeholder shells,
 * with their real content still Phase 5's job (see each page's own doc
 * comment for exactly which later task).
 *
 * Admin links (`role="admin"`): Dashboard, Restaurants, Orders, Platform
 * Settings — again `docs/NATRA_MASTER_PROMPT.md`'s "Admin" section
 * verbatim, and the same four names TASKS.md's own Task 6.2 ("`RoleShell`
 * admin sidebar nav (Dashboard, Restaurants, Orders, Platform Settings)")
 * already commits to. "Dashboard" routes to `/admin/dashboard` (already
 * scaffolded in App.jsx, alongside `/admin/login`); "Restaurants",
 * "Orders", "Platform Settings" point at `/admin/restaurants`,
 * `/admin/orders`, `/admin/settings` — none of which exist yet, wiring
 * them up is Phase 6's job (see TASKS.md's Phase 6 list), not this one's.
 * The sidebar's fixed 220px width was originally a single-breakpoint,
 * always-visible starting point for a desktop-first admin tool, with
 * TASKS.md's Task 8.3 ("Responsive pass: admin screens at all
 * breakpoints") flagged as where narrow-screen adaptation would get
 * addressed later. **Task 8.3g is that later** — below 768px `.sidebar`
 * is now hidden and the same four admin destinations render as a
 * bottom tab bar instead (the `.adminMobileNav`-classed `<nav>` right
 * after `.contentSidebar` below), reusing the exact bottom-nav markup/
 * classes already built for the customer/owner roles rather than a
 * genuinely new hamburger/off-canvas component — the "guessing at a
 * mobile admin UX nothing in the spec asks for" concern this comment
 * used to raise is resolved by not inventing a new UX at all, just
 * reusing the one the other two roles already have. See
 * RoleShell.module.css's own 8.3g comment for the breakpoint/variable
 * reasoning.
 *
 * **Bottom-nav width at wide viewports (Task 8.1i)** — the four
 * customer/owner tabs render inside a new `.navInner` wrapper capped at
 * 480px and centered, rather than each tab's own `flex: 1` dividing up
 * the full viewport width the way they used to: on a wide desktop
 * window that meant four icon+label pairs spread edge-to-edge with huge
 * gaps between them, not just "a bit wide" but a genuinely broken tap
 * target layout. `.nav` itself is unchanged — still the full-bleed
 * fixed bar it always was, same "chrome runs edge-to-edge, its content
 * doesn't" split this file's callers (Home.jsx, RestaurantProfile.jsx)
 * already use for their own headers/covers.
 *
 * Active-link styling comes from NavLink's own `isActive` in both the
 * bottom-nav and sidebar renders, not a prop this component tracks
 * itself, so it stays correct automatically as routing changes rather
 * than needing the caller to tell it which item is active.
 *
 * **Owner "Orders" badge (Task 5.21)** — the bottom-nav render also
 * reads `useOwnerOrderBadgeCount` (`../../hooks/useOwnerOrderBadge.js`)
 * and, for `role === 'owner'` only, overlays a small numbered badge on
 * the "Orders" tab's icon whenever that count is above zero. This shell
 * itself never increments/detects anything — `OwnerDashboard.jsx`'s own
 * new-order polling (Task 5.20a) does that — so the badge shows up on
 * every owner screen this component wraps (Orders, Restaurant, Account,
 * ...), not just the Dashboard, and clears when `OwnerOrders.jsx`
 * mounts. See that hook's own header comment for the full persistence/
 * cross-tab design.
 */
const NAV_ITEMS_BY_ROLE = {
  customer: [
    { key: 'home', label: 'Home', to: '/', icon: HomeIcon, end: true },
    { key: 'categories', label: 'Categories', to: '/categories', icon: CategoriesIcon },
    { key: 'orders', label: 'Orders', to: '/track', icon: OrdersIcon },
    { key: 'login', label: 'Login', to: '/login', icon: LoginIcon },
  ],
  owner: [
    { key: 'dashboard', label: 'Dashboard', to: '/owner/dashboard', icon: DashboardIcon },
    { key: 'orders', label: 'Orders', to: '/owner/orders', icon: OrdersIcon },
    { key: 'restaurant', label: 'Restaurant', to: '/owner/restaurant', icon: StorefrontIcon },
    { key: 'account', label: 'Account', to: '/owner/account', icon: ProfileIcon },
  ],
  admin: [
    { key: 'dashboard', label: 'Dashboard', to: '/admin/dashboard', icon: DashboardIcon },
    { key: 'restaurants', label: 'Restaurants', to: '/admin/restaurants', icon: StorefrontIcon },
    { key: 'orders', label: 'Orders', to: '/admin/orders', icon: OrdersIcon },
    // Task 8.3g — `mobileLabel` is only read by the new bottom-tab
    // render below, not the sidebar (which always uses `label`, the
    // full name from docs/NATRA_MASTER_PROMPT.md's own "Admin" list).
    // "Platform Settings" is fine as a sidebar link's full-width text
    // but too long for a narrow bottom tab next to three single-word
    // siblings — same "shorten for the tab, keep the full name in the
    // sidebar/its own page heading" call every other role's tab set
    // never had to make, since none of their four names were ever
    // two words. Route/icon/active-state are unaffected; this is a
    // label-only difference.
    { key: 'settings', label: 'Platform Settings', mobileLabel: 'Settings', to: '/admin/settings', icon: SettingsIcon },
  ],
};

export default function RoleShell({ role = 'customer', children, className }) {
  const navItems = NAV_ITEMS_BY_ROLE[role];
  // Task 5.21 — a persistent count of new orders the owner hasn't yet
  // looked at, read here (not fetched here — see `useOwnerOrderBadge.js`'s
  // own header comment) so it shows on the "Orders" tab from *any* owner
  // screen this shell wraps, not just `OwnerDashboard` where it's
  // actually detected/incremented. Always called (hooks can't be
  // conditional), but only ever rendered for `role === 'owner'` below —
  // customers/admin have no such badge and the hook itself is harmless
  // (just an idle localStorage read) to call unconditionally.
  const ownerOrderBadgeCount = useOwnerOrderBadgeCount();

  // Task 7.5c — the real, table-backed replacement for Task 5.20a's
  // `OwnerDashboard`-only polling: see `useOwnerNewOrderAlerts.js`'s own
  // header comment for the full design. Called unconditionally (hooks
  // can't be conditional) but only ever does anything for `role ===
  // 'owner'` — `enabled` gates both the network request and every
  // effect (browser Notification/sound/badge) the hook can fire, so a
  // customer/admin `RoleShell` never polls at all.
  useOwnerNewOrderAlerts({ enabled: role === 'owner' });

  if (role === 'admin') {
    return (
      <div className={[styles.shellSidebar, className].filter(Boolean).join(' ')}>
        <nav className={styles.sidebar} aria-label="Primary">
          <div className={styles.sidebarBrand}>NATRA Admin</div>

          <ul className={styles.sidebarList}>
            {navItems.map(({ key, label, to, icon: Icon }) => (
              <li key={key}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    [styles.sidebarLink, isActive ? styles.sidebarLinkActive : null]
                      .filter(Boolean)
                      .join(' ')
                  }
                >
                  <Icon className={styles.sidebarIcon} />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className={styles.contentSidebar}>{children}</main>

        {/* Task 8.3g — below 768px `.sidebar` above is hidden via CSS
            (RoleShell.module.css's own 8.3g comment) and this renders
            in its place instead: the same four admin destinations as
            a bottom tab bar, reusing the exact `.nav`/`.navInner`/
            `.navItem`/`.icon`/`.label` markup and classes already
            built and verified for the customer/owner bottom nav
            (2.17/2.18, 8.1i/8.2h) rather than a new hamburger/
            off-canvas component this scope doesn't call for. No
            `useState`/toggle here — `.adminMobileNav`'s own CSS is
            the only thing that ever shows or hides this element, at
            the same shared 767/768px breakpoint `.sidebar`'s own rule
            uses, so the two are always exactly complementary with no
            transition state to manage. Deliberately does *not* reuse
            the owner-only `showBadge`/`ownerOrderBadgeCount` branching
            the render below has — that badge is Task 5.21's own
            owner-specific feature (an owner's own new-order count),
            with no admin equivalent named anywhere in
            docs/NATRA_MASTER_PROMPT.md's "Admin" section, so this
            admin tab bar renders plain icon+label tabs only, same as
            it would for any role without that badge.

            Task 10.4e (project owner, decided) — this two-render split
            stays as is: bottom tabs <768px, sidebar >=768px, one shared
            breakpoint. The alternative (bottom tabs at every width)
            was considered and not chosen. The sidebar's own restyle
            and this bar's active-tab underline were Task 10.4f. */}
        <nav className={[styles.nav, styles.adminMobileNav].join(' ')} aria-label="Primary">
          {/* Task 10.4f — `.navInnerAdmin` opts this bar into the same
              short orange active-tab bar the owner bar has (10.3g); the
              admin reference image shows it too. */}
          <div className={[styles.navInner, styles.navInnerAdmin].join(' ')}>
            {navItems.map(({ key, label, mobileLabel, to, icon: Icon }) => (
              <NavLink
                key={key}
                to={to}
                className={({ isActive }) =>
                  [styles.navItem, isActive ? styles.navItemActive : null]
                    .filter(Boolean)
                    .join(' ')
                }
              >
                <Icon className={styles.icon} />
                <span className={styles.label}>{mobileLabel ?? label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className={[styles.shell, className].filter(Boolean).join(' ')}>
      <main className={styles.content}>{children}</main>

      {/* Task 8.1i — `.navInner` is new: it's what the four tabs actually
          flex inside, capped and centered, rather than each tab
          stretching to fill an entire wide viewport on its own (four
          `flex: 1` items dividing up e.g. 2560px would put huge gaps
          between a tiny icon+label and its neighbor — not just "a bit
          wide", genuinely broken as a tap target layout). `.nav` itself
          stays the full-bleed fixed bar it already was, same "chrome
          runs edge-to-edge, its content doesn't" split `.header`/
          `.headerInner` (Home.jsx, Task 8.1a) and `.info`/`.coverInner`
          (RestaurantProfile, Task 8.1b) already established — this is
          the shared bottom-nav render path (`role="customer"` and
          `role="owner"` both use it), so the same fix covers both;
          Task 8.2h just re-verifies it against the owner screens. */}
      <nav className={styles.nav} aria-label="Primary">
        {/* Task 10.3g — owner-only active-tab underline (see
            `.navInnerOwner` in the CSS). The reference's owner bar shows
            a short orange bar under the active tab; the customer
            reference (Task 10.2e) shows none, so it's opt-in per role
            rather than added to the shared `.navItemActive` rule. */}
        <div
          className={[styles.navInner, role === 'owner' ? styles.navInnerOwner : null]
            .filter(Boolean)
            .join(' ')}
        >
          {navItems.map(({ key, label, to, icon: Icon, end }) => {
            // Task 5.21 — only the owner role's "Orders" tab ever shows
            // this; customer/owner other tabs and every admin sidebar link
            // pass `showBadge = false` and render exactly as before.
            const showBadge = role === 'owner' && key === 'orders' && ownerOrderBadgeCount > 0;
            return (
              <NavLink
                key={key}
                to={to}
                end={end}
                className={({ isActive }) =>
                  [styles.navItem, isActive ? styles.navItemActive : null]
                    .filter(Boolean)
                    .join(' ')
                }
              >
                <span className={styles.iconWrap}>
                  <Icon className={styles.icon} />
                  {showBadge && (
                    <span className={styles.navBadge} aria-hidden="true">
                      {ownerOrderBadgeCount > 99 ? '99+' : ownerOrderBadgeCount}
                    </span>
                  )}
                </span>
                <span className={styles.label}>
                  {label}
                  {showBadge && (
                    <span className={styles.srOnly}>
                      {' '}
                      ({ownerOrderBadgeCount} new order{ownerOrderBadgeCount === 1 ? '' : 's'})
                    </span>
                  )}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// Inline icon set for the four tabs above. Kept as small, self-contained
// stroke-based SVGs (`currentColor`, so active/inactive color comes for
// free from the surrounding NavLink's own text color) rather than adding
// an icon-library dependency for four glyphs — frontend/package.json
// (Task 2.2) has no icon package, and nothing else in the component kit
// has needed one yet either.

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function CategoriesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function OrdersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
    </svg>
  );
}

function ProfileIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1-3.5 4-5.5 7.5-5.5s6.5 2 7.5 5.5" />
    </svg>
  );
}

function LoginIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10" />
      <path d="M14.5 16 19 12l-4.5-4" />
      <path d="M19 12H9" />
    </svg>
  );
}

function DashboardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="3.5" width="8" height="6" rx="1.5" />
      <rect x="12.5" y="3.5" width="8" height="10" rx="1.5" />
      <rect x="3.5" y="11.5" width="8" height="9" rx="1.5" />
      <rect x="12.5" y="15.5" width="8" height="5" rx="1.5" />
    </svg>
  );
}

function StorefrontIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4h16l1.5 5a2.5 2.5 0 0 1-4.5 1.5A2.5 2.5 0 0 1 12.5 12a2.5 2.5 0 0 1-4.5-1.5A2.5 2.5 0 0 1 3 9L4 4Z" />
      <path d="M5 10.5V20h14v-9.5" />
      <path d="M9.5 20v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V20" />
    </svg>
  );
}

function SettingsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M3 12h2.5M18.5 12H21M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  );
}
