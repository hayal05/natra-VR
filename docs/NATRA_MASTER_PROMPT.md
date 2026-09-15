# NATRA — Master UI/UX & Development Prompt

Build NATRA, a modern, simple, solid food-ordering marketplace for virtual/home-based restaurants.

IMPORTANT: The supplied reference UI image is the PRIMARY visual reference. Keep its visual language, layout quality, proportions, card style, spacing, colors, and simplicity. Do not redesign NATRA into a generic food-delivery application.

## Product concept
NATRA is a marketplace where independent/home-based restaurants register and receive food orders. Restaurants are responsible for preparing and delivering/handing over their own orders.

NATRA must NOT contain:
- Driver accounts or driver tracking
- GPS/maps for delivery
- Platform-managed delivery
- Delivery fees
- Payment gateway
- Customer accounts/login

## Roles
1. Customer
2. Restaurant Owner
3. Admin

## Customer
Customers do not create accounts. They can browse, search, order, track orders, and view previous orders using their phone number.

## Customer home UI
Use the supplied reference image as the visual foundation.

Structure:
1. NATRA header and search
2. Restaurants section
3. Categories
4. Popular Foods

Restaurants are horizontally scrollable cards, not a vertical list. Cards follow the supplied reference:
- Cover image
- Circular restaurant logo overlapping image
- Restaurant name
- Open/Closed status
- Distance/service-area information where appropriate
- Service-area count where appropriate
- See All

Popular Foods appears below restaurants and uses a responsive grid:
- 2 columns on mobile
- More columns on desktop
- Ranked dynamically by actual completed sales/order volume
- Food image
- Food name
- Restaurant name
- Price
- Order Now

## Categories
Categories can be horizontal scrolling chips. Restaurant owners create and manage their own categories.

## Restaurant profile
Tapping a restaurant opens its profile with the menu already visible below the profile header.

Header:
- Cover image
- Logo
- Restaurant name
- Open/Closed status
- Phone number
- Location
- Description
- Service areas

## Restaurant menu
Use a single-column list of larger food cards:
- Large food image
- Food name
- Price
- Buy Now

Hidden foods disappear from the customer menu and cannot be ordered.

## Food details
When Buy Now is selected, show:
- Large food image
- Food name
- Short description
- Price
- Quantity selector (- / number / +)
- Buy Now

## Order builder
After Buy Now:
- Selected food(s)
- Quantity
- Prices
- Subtotal/total
- Add another item

Add another item opens foods from the SAME restaurant only. Multiple different foods and quantities are allowed. One order can NEVER contain foods from different restaurants.

Then collect:
- Customer name
- Phone number
- Specific location (free text, no GPS)
- Optional note

## Payment
No payment gateway.

Each restaurant configures its own payment methods. Show all configured methods, such as Telebirr, CBE Birr, Bank Transfer. Customer selects one and uploads a payment screenshot.

Each payment method may contain:
- Account/phone number
- Account name
- Payment instructions

Restaurant manually verifies the screenshot.

## Order confirmation
After Submit Order, generate a unique Order ID such as #NTR-48291.

Show:
- Success message
- Unique Order ID
- Track Order button

Keep the confirmation screen simple.

## Tracking and order history
Tracking requires:
- Order ID
- Phone number

Statuses ONLY:
- New
- Accepted
- Completed
- Rejected

Customers can view previous orders using phone number only. The detailed previous-order layout remains flexible.

## Restaurant order notifications
For a new order use:
- Browser notification
- Sound
- Dashboard notification

Example:
“New order from Bole, behind Edna Mall — 2 items — 450 ETB”

Browser notification disappears after a few seconds but the order remains in the dashboard with a new-order badge/count.

## Restaurant order actions
New:
- Accept
- Reject
- Call Customer

Accepted:
- Complete

Accepted status produces:
- Customer status: “Order Accepted”
- Customer notification

Completed:
- Customer sees “Completed”
- No action buttons

Rejected:
- Customer sees “Rejected”
- Customer notification
- No rejection reason required

Call Customer opens the phone dialer using the registered phone number.

## Order details
Restaurant sees immediately:
- Order ID
- Customer name
- Phone
- Food items and quantities
- Total
- Selected payment method
- Payment screenshot
- Specific customer location
- Date/time
- Status

Payment screenshot is a small thumbnail and opens full-screen when tapped.

## Restaurant owner navigation
Exactly four main sections:
1. Dashboard
2. Orders
3. Restaurant
4. Account

## Restaurant dashboard
Focus on:
- New orders
- Order counts
- Sales summary
- Restaurant status
- Quick actions

Quick actions:
- Add Food
- Open/Close Restaurant
- View Orders

## Restaurant management
Restaurant section:
- Profile
- Logo
- Cover image
- Description
- Categories
- Menu
- Opening hours
- Service areas
- Payment methods
- Open/Closed status

## Add Food
Fields:
- Food name
- Photo
- Short description
- Price
- Category

Existing food actions:
- Edit
- Delete
- Hide/Show

## Service areas
Owner-managed free-text areas:
- Add Area
- Edit Area
- Delete Area

No GPS, predefined list, or individual admin approval.

## Opening hours
Separate opening/closing times for each day. Each day can be marked Closed.

## Restaurant status
Simple Open/Closed toggle. No confirmation.

Live and Open/Closed are separate:
- Live = approved/active on NATRA
- Open = accepting orders
- Closed = visible/browsable, but Buy Now disabled

## Restaurant registration
Required account fields only:
- Full name
- Phone number
- Email
- Password

Owner can request Live after registration.

Flow:
1. Create account
2. Request Live
3. Show one-time registration fee and NATRA payment information
4. Owner pays manually
5. Upload payment screenshot
6. Submit
7. Admin reviews screenshot
8. Admin approves
9. Restaurant becomes instantly Live
10. Owner can finish configuration after going Live

No second setup approval.

## NATRA registration payment
One-time fee, no recurring subscription.

Admin configures:
- Registration fee
- Payment method
- Account/phone number
- Account name
- Optional instructions

## Admin
Keep admin lightweight.

Sections:
- Dashboard
- Restaurants
- Orders
- Platform Settings

Dashboard:
- Total restaurants
- Live restaurants
- Pending Live requests
- Total orders
- Recent activity

Restaurant management:
- View restaurants
- View details
- Review Live requests
- View payment screenshot
- Approve
- Reject
- Suspend
- Reactivate

Admin does NOT need to edit/delete restaurant profile or menu content, manage hours, service areas, delivery, or drivers.

Order management:
- View all orders
- Search
- Filter by restaurant
- Filter by status
- Filter by date
- View order details

## Order timeout
Admin-configurable:
- Off
- 15 minutes
- 30 minutes
- 1 hour
- Custom

Action:
- Keep pending/New
- Automatically expire

Optional notify-before-expiry toggle.

## Design system
Match the supplied reference UI:
- Modern
- Clean
- Minimal
- Friendly
- Orange/white NATRA branding
- Rounded cards
- Soft spacing
- Strong food imagery
- Clear typography
- Compact interface
- Touch-friendly controls

Avoid:
- Overengineering
- Excessive gradients/animations
- Huge cards
- Excessive whitespace
- Generic enterprise UI
- Unnecessary features

## Responsive design
Support:
- Mobile
- Tablet
- Desktop
- Large desktop

Restaurants remain horizontally scrollable. Popular Foods becomes a responsive grid. Restaurant menu remains a single-column large-card layout with appropriate desktop width. Avoid blank spaces, fixed-width layouts, broken cards, and unintended overflow.

## Oracle Cloud infrastructure
Use Oracle Cloud Infrastructure:
- Oracle Cloud VM
- Ubuntu Linux
- GitHub for source/version control
- Oracle Autonomous AI Database as primary relational database
- Oracle Object Storage for images and uploaded files

Architecture:
Customer / Restaurant Owner / Admin
→ NATRA Web App
→ Backend API
→ Oracle Autonomous AI Database
→ Oracle Object Storage for media

Production application runs on the Oracle Cloud VM.

## Database
Use Oracle Autonomous AI Database for:
- Users/restaurant owners
- Restaurants
- Restaurant statuses
- Profiles
- Service areas
- Categories
- Food items
- Visibility
- Opening hours
- Payment methods
- Orders/order items
- Customer order information
- Order status
- Payment verification
- Registration payment requests
- Admin settings
- Notifications
- Popularity/order statistics

Store large media in Object Storage, not directly in relational database unless technically necessary.

## Popularity
Popular Foods should be calculated from real completed sales/order data. Highest completed quantity sold should rank higher. The exact time-window/recency formula can be refined later.

## Security
Implement role-based access:
- Customer: public browsing/order/tracking
- Restaurant Owner: own restaurant/menu/orders/payment settings only
- Admin: platform-wide management

Protect customer information and payment screenshots. Hash passwords. Never store secrets in GitHub.

## GitHub and deployment
Keep source code in GitHub. Production deployment runs on the Oracle VM. Use environment variables/secrets for database, Object Storage, authentication, and production configuration.

## Performance
Use:
- Image compression
- Responsive image sizes
- Lazy loading
- Thumbnails
- Pagination/infinite loading where appropriate
- Database indexing
- Efficient searches and order queries

## Final UX flows

Customer:
Home
→ Restaurants / Popular Foods
→ Restaurant Profile
→ Menu
→ Food
→ Food Details
→ Buy Now
→ Order Builder
→ Add Another Item (same restaurant)
→ Customer Information
→ Payment Method
→ Payment Screenshot
→ Submit
→ Order ID
→ Track Order

Restaurant:
Register
→ Request Live
→ Pay Registration Fee
→ Upload Screenshot
→ Admin Review
→ Approved
→ Instantly Live
→ Dashboard
→ Configure Restaurant
→ Receive Orders
→ Accept/Reject
→ Complete

Admin:
Dashboard
→ Restaurant Management
→ Review Live Requests
→ Verify Screenshot
→ Approve/Reject
→ Order Management
→ Platform Settings

## Final instruction
Build NATRA as one cohesive, production-quality product. Keep it simple, fast, clean, and solid. Do not introduce features that contradict the finalized business rules. The supplied reference UI is the visual source of truth for the customer-facing interface.
