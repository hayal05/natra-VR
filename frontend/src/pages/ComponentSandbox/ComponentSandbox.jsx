import { useState } from 'react';

import EntityCard from '../../components/EntityCard';
import StatusBadge from '../../components/StatusBadge';
import ImageViewer from '../../components/ImageViewer';
import HorizontalScroller from '../../components/HorizontalScroller';
import ResponsiveGrid from '../../components/ResponsiveGrid';
import EmptyState from '../../components/EmptyState';
import QuantityStepper from '../../components/QuantityStepper';
import FormField from '../../components/FormField';
import ToggleSwitch from '../../components/ToggleSwitch';
import ImageUploadField from '../../components/ImageUploadField';
import SearchBar from '../../components/SearchBar';
import FilterBar from '../../components/FilterBar';
import Modal from '../../components/Modal';
import ListWithPagination from '../../components/ListWithPagination';
import RoleShell from '../../components/RoleShell';
import Wizard from '../../components/Wizard';

import {
  MOCK_RESTAURANTS,
  MOCK_FOODS,
  MOCK_STATUSES,
  CATEGORY_OPTIONS,
  SORT_OPTIONS,
  ROLE_OPTIONS,
  MOCK_ORDERS,
  ORDERS_PAGE_SIZE,
  buildMockMeta,
  placeholderImage,
} from './mockData';

import styles from './ComponentSandbox.module.css';

// Task 2.21 — one page listing all 16 named components from
// docs/TASKS.md's Phase 2, each rendered against representative mock data
// so they can actually be looked at (every 2.x component so far was
// "verified by hand" or against a throwaway build-only file per its own
// PROJECT_STATUS.md log entry — none had had a real, live, in-app render
// until this page). This is a dev-only route, not a customer/owner/admin
// screen — see the comment in App.jsx where it's mounted.
//
// This is the "Storybook" half of 2.21's "component sandbox page/
// Storybook" phrasing without an actual Storybook dependency: this
// sandbox has had no npm-registry access most sessions (see
// docs/PROJECT_STATUS.md's running "Same sandbox-network gap" notes on
// 2.10 onward), so adding a real `@storybook/*` devDependency wasn't a
// safe bet to build the whole task around — a plain route + this file is
// zero-dependency and works the same whether or not registry access is
// available this session. Revisiting this as a real Storybook setup,
// once registry access is confirmed available, is a reasonable follow-up
// — not assumed done by this task, same "flagged, not silently decided"
// pattern the rest of Phase 2's log entries use for their own open
// questions.
//
// Task 2.22 (visual QA pass against the reference UI images) is where
// this page actually gets *used* for its intended purpose — this task is
// just building it.

const SECTIONS = [
  { id: 'entity-card', label: 'EntityCard', task: '2.3' },
  { id: 'status-badge', label: 'StatusBadge', task: '2.4' },
  { id: 'image-viewer', label: 'ImageViewer', task: '2.5' },
  { id: 'horizontal-scroller', label: 'HorizontalScroller', task: '2.6' },
  { id: 'responsive-grid', label: 'ResponsiveGrid', task: '2.7' },
  { id: 'empty-state', label: 'EmptyState', task: '2.8' },
  { id: 'quantity-stepper', label: 'QuantityStepper', task: '2.9' },
  { id: 'form-field', label: 'FormField', task: '2.10' },
  { id: 'toggle-switch', label: 'ToggleSwitch', task: '2.11' },
  { id: 'image-upload-field', label: 'ImageUploadField', task: '2.12' },
  { id: 'search-bar', label: 'SearchBar', task: '2.13' },
  { id: 'filter-bar', label: 'FilterBar', task: '2.14' },
  { id: 'modal', label: 'Modal', task: '2.15' },
  { id: 'list-with-pagination', label: 'ListWithPagination', task: '2.16' },
  { id: 'role-shell', label: 'RoleShell', task: '2.17\u20132.19' },
  { id: 'wizard', label: 'Wizard', task: '2.20' },
];

function Section({ id, task, title, note, children }) {
  return (
    <section id={id} className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>{title}</h2>
        <span className={styles.taskTag}>Task {task}</span>
      </div>
      {note && <p className={styles.sectionNote}>{note}</p>}
      <div className={styles.preview}>{children}</div>
    </section>
  );
}

export default function ComponentSandbox() {
  // --- Local demo state, one slice per interactive component below ---
  const [quantity, setQuantity] = useState(2);
  const [toggleOn, setToggleOn] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchSubmittedValue, setSearchSubmittedValue] = useState(null);
  const [categoryValue, setCategoryValue] = useState('all');
  const [sortValue, setSortValue] = useState('recommended');
  const [formValues, setFormValues] = useState({
    name: '',
    notes: '',
    role: '',
  });
  const [uploadValue, setUploadValue] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [wizardScreenshotPicked, setWizardScreenshotPicked] = useState(false);
  const [wizardResult, setWizardResult] = useState(null);
  const [wizardActiveStep, setWizardActiveStep] = useState(0);

  const pagedOrders = MOCK_ORDERS.slice(
    (ordersPage - 1) * ORDERS_PAGE_SIZE,
    ordersPage * ORDERS_PAGE_SIZE,
  );
  const ordersMeta = buildMockMeta(ordersPage, ORDERS_PAGE_SIZE, MOCK_ORDERS.length);

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <p className={styles.sidebarTitle}>Component Sandbox</p>
        <p className={styles.sidebarSubtitle}>Task 2.21 &middot; dev only</p>
        <ul className={styles.sidebarList}>
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a className={styles.sidebarLink} href={`#${section.id}`}>
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1>NATRA Component Sandbox</h1>
          <p>
            All 16 named components from Phase 2 of docs/TASKS.md, each rendered here
            against mock data (see mockData.js — no backend/DB call happens on this
            page). This is where every component gets its first real, live render;
            Task 2.22&apos;s visual QA pass is where this page gets compared against
            docs/reference_ui/ and the design tokens get corrected against it.
          </p>
        </div>

        <Section
          id="entity-card"
          task="2.3"
          title="EntityCard"
          note="Slot-based card shell — the same component renders both the Restaurants row card (image + logo + badge + metaLine, no cta) and the Popular Food card (image + title + subtitle + metaLine + cta, no logo/badge)."
        >
          <div className={styles.previewRow}>
            <div className={styles.cardSlot}>
              <EntityCard
                image={MOCK_RESTAURANTS[0].image}
                imageAlt={MOCK_RESTAURANTS[0].name}
                logo={MOCK_RESTAURANTS[0].logo}
                logoAlt=""
                title={MOCK_RESTAURANTS[0].name}
                badge={<StatusBadge status={MOCK_RESTAURANTS[0].status} />}
                metaLine={MOCK_RESTAURANTS[0].meta}
                onClick={() => {}}
              />
            </div>
            <div className={styles.cardSlot}>
              <EntityCard
                image={MOCK_FOODS[0].image}
                imageAlt={MOCK_FOODS[0].name}
                title={MOCK_FOODS[0].name}
                subtitle={MOCK_FOODS[0].restaurant}
                metaLine={MOCK_FOODS[0].price}
                cta={<span className={styles.demoButton}>Order Now</span>}
                onClick={() => {}}
              />
            </div>
          </div>
        </Section>

        <Section
          id="status-badge"
          task="2.4"
          title="StatusBadge"
          note="Open/Closed use the measured success/error colors from docs/DESIGN_TOKENS.md. Every other status this codebase has (orders.status, live_requests.status, restaurants.live_status) isn't in the reference images, so it falls through to the neutral tone rather than a fabricated color — visible below."
        >
          <div className={styles.previewRow}>
            {MOCK_STATUSES.map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </div>
        </Section>

        <Section
          id="image-viewer"
          task="2.5"
          title="ImageViewer"
          note="Click the thumbnail to open the full-screen overlay (portal-rendered to document.body, so it appears over the whole page, not just this preview box)."
        >
          <div className={styles.previewRow}>
            <ImageViewer
              src={placeholderImage(800, 600, 'Payment Screenshot', '#0e1a2b')}
              thumbnailSrc={placeholderImage(120, 120, 'Screenshot', '#0e1a2b')}
              alt="Mock payment screenshot"
            />
          </div>
        </Section>

        <Section
          id="horizontal-scroller"
          task="2.6"
          title="HorizontalScroller"
          note="Two named uses: a fixed-width EntityCard row (itemWidth) and a content-sized chip row (no itemWidth)."
        >
          <div className={styles.previewStack} style={{ maxWidth: 'none' }}>
            <p className={styles.frameLabel}>Restaurants row</p>
            <HorizontalScroller itemWidth="220px" ariaLabel="Restaurants">
              {MOCK_RESTAURANTS.map((restaurant) => (
                <EntityCard
                  key={restaurant.id}
                  image={restaurant.image}
                  imageAlt={restaurant.name}
                  logo={restaurant.logo}
                  title={restaurant.name}
                  badge={<StatusBadge status={restaurant.status} />}
                  metaLine={restaurant.meta}
                />
              ))}
            </HorizontalScroller>

            <p className={styles.frameLabel}>Categories row</p>
            <HorizontalScroller gap="var(--space-sm)" ariaLabel="Categories">
              {CATEGORY_OPTIONS.map((option) => (
                <span key={option.value} className={styles.demoButtonSecondary}>
                  {option.label}
                </span>
              ))}
            </HorizontalScroller>
          </div>
        </Section>

        <Section
          id="responsive-grid"
          task="2.7"
          title="ResponsiveGrid"
          note="2 columns on mobile, more on wider screens (fixed column counts per breakpoint, not auto-fill) — resize the window to see it respond."
        >
          <div className={styles.gridDemo}>
            <ResponsiveGrid ariaLabel="Popular foods">
              {MOCK_FOODS.map((food) => (
                <EntityCard
                  key={food.id}
                  image={food.image}
                  imageAlt={food.name}
                  title={food.name}
                  subtitle={food.restaurant}
                  metaLine={food.price}
                  cta={<span className={styles.demoButton}>Order Now</span>}
                />
              ))}
            </ResponsiveGrid>
          </div>
        </Section>

        <Section
          id="empty-state"
          task="2.8"
          title="EmptyState"
          note="Generic centered shell — icon/title/description/action are all optional slots, none baked in for any one of this app's several empty-content cases."
        >
          <div className={styles.previewStack}>
            <EmptyState
              icon={<span style={{ fontSize: 40 }}>🍽️</span>}
              title="No orders yet"
              description="Orders placed by customers will show up here once your restaurant goes live."
              action={<button className={styles.demoButton}>Browse restaurants</button>}
            />
          </div>
        </Section>

        <Section
          id="quantity-stepper"
          task="2.9"
          title="QuantityStepper"
          note="Controlled value/onChange. min defaults to 1; max is set to 10 here just to demonstrate the button-disable-at-the-edge behavior."
        >
          <div className={styles.previewRow}>
            <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={10} />
          </div>
          <p className={styles.stateReadout}>value = {quantity}</p>
        </Section>

        <Section
          id="form-field"
          task="2.10"
          title="FormField"
          note="One instance per `as` variant (input/textarea/select), all controlled from the same local state object."
        >
          <div className={styles.previewStack}>
            <FormField
              label="Full name"
              value={formValues.name}
              onChange={(event) => setFormValues((v) => ({ ...v, name: event.target.value }))}
              placeholder="Abel Tesfaye"
              required
            />
            <FormField
              as="textarea"
              label="Notes"
              value={formValues.notes}
              onChange={(event) => setFormValues((v) => ({ ...v, notes: event.target.value }))}
              helperText="Optional — shown to the restaurant, not the customer."
            />
            <FormField
              as="select"
              label="Role"
              value={formValues.role}
              onChange={(event) => setFormValues((v) => ({ ...v, role: event.target.value }))}
              options={ROLE_OPTIONS}
              placeholder="Select a role"
            />
          </div>
        </Section>

        <Section
          id="toggle-switch"
          task="2.11"
          title="ToggleSwitch"
          note="First named use is opening-hours' per-day 'closed' toggle (Task 5.5)."
        >
          <div className={styles.previewRow}>
            <ToggleSwitch checked={toggleOn} onChange={setToggleOn} label="Closed all day" />
          </div>
          <p className={styles.stateReadout}>checked = {String(toggleOn)}</p>
        </Section>

        <Section
          id="image-upload-field"
          task="2.12"
          title="ImageUploadField"
          note="Compresses/re-encodes to JPEG client-side via <canvas> before handing back a File — pick any image to see the preview swap in."
        >
          <div className={styles.previewStack}>
            <ImageUploadField
              label="Restaurant logo"
              value={uploadValue}
              onChange={(file) => {
                setUploadValue(URL.createObjectURL(file));
                setUploadError('');
              }}
              onError={setUploadError}
              helperText="PNG, JPG, WEBP, or GIF."
              error={uploadError}
            />
          </div>
        </Section>

        <Section
          id="search-bar"
          task="2.13"
          title="SearchBar"
          note="From the reference UI's home screen. onChange fires per keystroke; onSubmit fires only on Enter — both are wired here so you can see the difference. Two variants (added Task 2.22's visual QA pass, see SearchBar's own doc comment): surface (default, plain white — for a search field on a white screen) and onPrimary (matches the actual reference header, which is a tinted orange fill, not white)."
        >
          <div className={styles.previewStack}>
            <SearchBar
              value={searchValue}
              onChange={setSearchValue}
              onSubmit={setSearchSubmittedValue}
            />
          </div>
          <div
            className={styles.previewStack}
            style={{ background: 'var(--color-primary)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)' }}
          >
            <SearchBar
              variant="onPrimary"
              value={searchValue}
              onChange={setSearchValue}
              onSubmit={setSearchSubmittedValue}
            />
          </div>
          <p className={styles.stateReadout}>
            value = &quot;{searchValue}&quot; &middot; last submitted ={' '}
            {searchSubmittedValue ? `"${searchSubmittedValue}"` : 'none yet (press Enter)'}
          </p>
        </Section>

        <Section
          id="filter-bar"
          task="2.14"
          title="FilterBar"
          note="One chip group (Categories, reusing HorizontalScroller) and one dropdown group (Sort, a native <select> — no reference-image equivalent for this one)."
        >
          <div className={styles.previewStack} style={{ maxWidth: 'none' }}>
            <FilterBar
              groups={[
                {
                  id: 'category',
                  type: 'chips',
                  label: 'Category',
                  options: CATEGORY_OPTIONS,
                  value: categoryValue,
                  onChange: setCategoryValue,
                },
                {
                  id: 'sort',
                  type: 'dropdown',
                  label: 'Sort',
                  placeholder: 'Sort by',
                  options: SORT_OPTIONS,
                  value: sortValue,
                  onChange: setSortValue,
                },
              ]}
            />
          </div>
          <p className={styles.stateReadout}>
            category = {categoryValue} &middot; sort = {sortValue}
          </p>
        </Section>

        <Section
          id="modal"
          task="2.15"
          title="Modal"
          note="The base overlay meant to host ImageViewer/confirmations (docs/TASKS.md 2.15) — ImageViewer above still uses its own overlay for now; folding it onto Modal is a flagged follow-up, not done by this task."
        >
          <button className={styles.demoButton} onClick={() => setIsModalOpen(true)}>
            Open confirmation modal
          </button>
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Suspend this restaurant?"
            footer={
              <div className={styles.modalFooter}>
                <button className={styles.demoButtonSecondary} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button className={styles.demoButton} onClick={() => setIsModalOpen(false)}>
                  Suspend
                </button>
              </div>
            }
          >
            <p>Customers won&apos;t be able to order from this restaurant until it&apos;s reactivated.</p>
          </Modal>
        </Section>

        <Section
          id="list-with-pagination"
          task="2.16"
          title="ListWithPagination"
          note="meta uses the exact shape backend/src/utils/paginate.js's buildPaginationMeta returns. 14 mock orders at a page size of 4 (see mockData.js) give 4 pages, enough to see Previous/Next disable at both edges."
        >
          <div className={styles.previewStack} style={{ maxWidth: '520px' }}>
            <ListWithPagination
              items={pagedOrders}
              getItemKey={(order) => order.id}
              meta={ordersMeta}
              onPageChange={setOrdersPage}
              ariaLabel="Mock orders"
              emptyState={<EmptyState title="No orders" />}
              renderItem={(order) => (
                <div className={styles.previewRow} style={{ justifyContent: 'space-between', width: '100%' }}>
                  <span>
                    {order.code} &middot; {order.customer}
                  </span>
                  <StatusBadge status={order.status} />
                  <span>{order.total}</span>
                </div>
              )}
            />
          </div>
        </Section>

        <Section
          id="role-shell"
          task={'2.17\u20132.19'}
          title="RoleShell"
          note="All three variants — customer bottom-nav (2.17), owner bottom-nav (2.18), admin sidebar (2.19). Each frame below uses a CSS transform to contain RoleShell's position:fixed nav within the preview box instead of the real viewport — see ComponentSandbox.module.css's comment on .phoneFrame."
        >
          <div className={styles.previewRow} style={{ alignItems: 'flex-start' }}>
            <div>
              <p className={styles.frameLabel}>Customer (role=&quot;customer&quot;)</p>
              <div className={styles.phoneFrame}>
                <RoleShell role="customer">
                  <div className={styles.frameContent}>
                    <h3>Home</h3>
                    <p>Screen content renders here; the bottom nav is fixed chrome around it.</p>
                  </div>
                </RoleShell>
              </div>
            </div>

            <div>
              <p className={styles.frameLabel}>Owner (role=&quot;owner&quot;)</p>
              <div className={styles.phoneFrame}>
                <RoleShell role="owner">
                  <div className={styles.frameContent}>
                    <h3>Dashboard</h3>
                    <p>Same bottom-nav chrome shape as customer, different destinations.</p>
                  </div>
                </RoleShell>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-lg)' }}>
            <p className={styles.frameLabel}>Admin (role=&quot;admin&quot;)</p>
            <div className={styles.desktopFrame}>
              <RoleShell role="admin">
                <div className={styles.frameContent}>
                  <h3>Dashboard</h3>
                  <p>Fixed left sidebar instead of a bottom bar — a different layout, not a re-skin.</p>
                </div>
              </RoleShell>
            </div>
          </div>
        </Section>

        <Section
          id="wizard"
          task="2.20"
          title="Wizard"
          note="Named Stepper/Wizard in docs/TASKS.md; named Wizard in code to avoid colliding with QuantityStepper. Manages its own active-step state. Step 2's Next is disabled until the checkbox below is checked, demonstrating the caller-supplied isNextDisabled prop."
        >
          <div className={styles.previewStack} style={{ maxWidth: '480px' }}>
            <Wizard
              steps={[
                { key: 'fee', label: 'Payment Info' },
                { key: 'upload', label: 'Upload Screenshot' },
              ]}
              isNextDisabled={wizardActiveStep === 1 && !wizardScreenshotPicked}
              onStepChange={setWizardActiveStep}
              onComplete={() => setWizardResult('Wizard completed — screenshot submitted.')}
            >
              {(activeStep) =>
                activeStep === 0 ? (
                  <div className={styles.wizardStepBody}>
                    <p>Registration fee: 500 ETB, payable via Telebirr to 0912 345 678.</p>
                  </div>
                ) : (
                  <div className={styles.wizardStepBody}>
                    <label>
                      <input
                        type="checkbox"
                        checked={wizardScreenshotPicked}
                        onChange={(event) => setWizardScreenshotPicked(event.target.checked)}
                      />
                      I&apos;ve selected a payment screenshot
                    </label>
                  </div>
                )
              }
            </Wizard>
          </div>
          <p className={styles.stateReadout}>{wizardResult ?? 'Not submitted yet.'}</p>
        </Section>
      </main>
    </div>
  );
}
