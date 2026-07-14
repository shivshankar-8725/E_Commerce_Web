<<<<<<< HEAD
# ChipKart — Chips & Snacks Online Ordering Platform (Phases 1–3)

A full-stack ordering platform for selling chips & snacks online.

- **Backend:** Spring Boot 3 (Java 17+), REST, layered (controller → service → repository), PostgreSQL + JPA/Hibernate, Spring Security + JWT, BCrypt.
- **Frontend:** React 18 + Vite + React Router, mobile-friendly.
- **Roles:** `ADMIN` (owner, seeded — no public signup), `CUSTOMER` (self-registers, retail price), `DEALER` (self-registers, **admin-approved**, wholesale price + bulk ordering).

---

## 1. Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Java | 17 or newer (tested on 21) | `java -version` |
| PostgreSQL | 12+ | running locally |
| Node.js | 18+ (tested on 24) | for the React app |

> Maven is **not** required globally — the project ships with the Maven Wrapper (`mvnw` / `mvnw.cmd`), which downloads Maven on first run.

---

## 2. Database setup

Create the database (Hibernate auto-creates the tables on first boot):

```sql
CREATE DATABASE emart;
```

Default DB credentials are in [`backend/src/main/resources/application.properties`](backend/src/main/resources/application.properties):

```
spring.datasource.url=jdbc:postgresql://localhost:5432/emart
spring.datasource.username=postgres
spring.datasource.password=postgres
```

Change them to match your local Postgres (or override with env vars / `-D` flags).

---

## 3. Run the backend

```bash
cd backend
# Windows
mvnw.cmd spring-boot:run
# macOS / Linux
./mvnw spring-boot:run
```

Backend starts on **http://localhost:8080**.

On first boot the app **seeds** (idempotent):
- **Admin account** → mobile `9999999999`, password `Admin@123` (configurable in `application.properties`).
- **Pending demo dealer** → mobile `8888888888`, password `Dealer@123` (left PENDING to test approval).
- **Allowed pincodes** → `452001`, `452010`, `462001`.
- **Demo catalogue** → 3 categories, 5 products (one is out-of-stock for testing).

> ⚠️ Change the admin password (`app.admin.*`) and `app.jwt.secret` before any real deployment.

---

## 3b. Mobile app (React Native / Expo) — P4-APP-01

A customer mobile app lives in [`mobile/`](mobile/) and reuses these same backend APIs (login, shop, cart, place order COD, track). See [`mobile/README.md`](mobile/README.md) for run + Play Store (EAS) build steps. Quick start:
```bash
cd mobile && npm install
EXPO_PUBLIC_API_URL=http://<your-PC-LAN-IP>:8080 npx expo start
```

## 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on **http://localhost:5173** and proxies `/api` + `/uploads` to the backend.

- Customer shop: http://localhost:5173/shop
- Admin login: use the seeded admin credentials → lands on the admin dashboard.

---

## 5. Project structure

```
E_Mart/
├── backend/
│   ├── pom.xml, mvnw, mvnw.cmd
│   └── src/main/java/com/emart/
│       ├── EMartApplication.java
│       ├── config/        SecurityConfig, WebConfig, DataSeeder
│       ├── security/      JwtUtil, JwtAuthFilter, JwtPrincipal, AppUserDetails, CustomUserDetailsService, SecurityUtils
│       ├── entity/        User, Category, Product, Address, Order, OrderItem, AllowedPincode + enums
│       ├── repository/    *Repository (Spring Data JPA)
│       ├── dto/           request/response records
│       ├── service/       Auth, Product, Category, Order, Address, Pincode, Customer, FileStorage
│       ├── controller/    Auth, Product, Category, Order, Address, Pincode, Me
│       └── controller/admin/  AdminProduct, AdminCategory, AdminOrder, AdminCustomer, AdminPincode, AdminDashboard
│   └── src/main/resources/application.properties
└── frontend/
    └── src/
        ├── api/client.js          axios instance (JWT + error handling)
        ├── context/               AuthContext, CartContext
        ├── components/            Navbar, RouteGuards
        ├── pages/                 Login, Register
        ├── pages/customer/        Shop, ProductDetail, Cart, Checkout, Orders, OrderDetail
        └── pages/admin/           AdminDashboard, AdminProducts, AdminCategories, AdminOrders, AdminOrderDetail, AdminCustomers, AdminPincodes
```

---

## 6. API reference

### Public / Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Customer registration (always role CUSTOMER) |
| POST | `/api/auth/register-dealer` | Dealer registration (role DEALER, pending approval, **no token**) |
| POST | `/api/auth/login` | Login (customer, admin, or approved dealer) → JWT |
| GET  | `/api/config` | Public config (dealer minimum order quantity) |
| GET  | `/api/products?categoryId=&search=` | List active products, filter + search |
| GET  | `/api/products/{id}` | Product detail |
| GET  | `/api/categories` | Active categories |
| GET  | `/api/pincodes/check/{pincode}` | Is delivery available? |
| POST | `/api/coupons/apply` | Preview a coupon against the cart (JWT required) (P4-OFFER-01) |

### Online payment (Phase 3, JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-order` | Validate cart + create a Razorpay order (no order placed yet) |
| POST | `/api/payments/verify` | Verify signature → place PAID order, store txn id |
| POST | `/api/payments/failed` | Mark a cancelled/failed payment (no order placed) |

### Customer (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET / POST | `/api/addresses` | List / add address |
| POST | `/api/orders` | Place COD order |
| GET  | `/api/orders` | Order history |
| GET  | `/api/orders/{id}` | Order detail / tracking |
| GET  | `/api/me` | Current user info |

### Admin (JWT + ROLE_ADMIN, else 403)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/admin/products` `/{id}` | Manage products (DELETE = deactivate) |
| PATCH | `/api/admin/products/{id}/stock` | Set stock |
| POST | `/api/admin/products/upload` | Upload product image |
| GET/POST/PUT/DELETE | `/api/admin/categories` `/{id}` | Manage categories (DELETE = deactivate) |
| GET | `/api/admin/orders` `/{id}` | List / view orders |
| PATCH | `/api/admin/orders/{id}/status` | Update status (ACCEPTED/PACKED/OUT_FOR_DELIVERY/DELIVERED) |
| PATCH | `/api/admin/orders/{id}/accept` | Accept order |
| PATCH | `/api/admin/orders/{id}/reject` | Reject with reason (restores stock) |
| GET | `/api/admin/reports/sales?from=&to=&limit=` | Sales report: totals + top products (P4-RPT-01) |
| GET/POST/PUT/DELETE | `/api/admin/coupons` `/{id}` | Manage coupons (DELETE = deactivate) (P4-OFFER-01) |
| GET | `/api/admin/customers?search=` | List / search customers |
| GET | `/api/admin/dealers?status=PENDING\|APPROVED\|REJECTED` | List dealers (Phase 2) |
| PATCH | `/api/admin/dealers/{id}/approve` | Approve a dealer |
| PATCH | `/api/admin/dealers/{id}/reject` | Reject a dealer with reason |
| GET/POST/PUT/DELETE | `/api/admin/pincodes` `/{id}` | Manage delivery area |
| GET | `/api/admin/dashboard/summary` | Today's order count + total |

---

## 7. How to test each user story

> Seeded admin: **mobile `9999999999` / password `Admin@123`**. Allowed pincode for orders: **`452001`**.

### Authentication
- **P1-AUTH-01** Register a customer at `/register` (name, mobile, password). Try the **same mobile twice** → "already registered". Submit blanks / 5-char password → field errors.
- **P1-AUTH-02** Login at `/login`. Wrong password → "Invalid mobile or password." Admin login redirects to `/admin`; customer to `/shop`. Logout clears the session.
- **P1-AUTH-03** Admin has **no signup** (register always makes a CUSTOMER). Login as a customer, then `GET /api/admin/orders` with that token → **403**.

### Customer
- **P1-CUST-01** `/shop` lists active in-stock products with photo, name, price, weight. *Moong Dal* (seeded at 0 stock) shows **Out of stock** and has no Add button.
- **P1-CUST-02** Use the category dropdown and search box. Search for nonsense → friendly empty state.
- **P1-CUST-03** Open a product → photo, description, price, weight; quantity stepper capped at stock; **Add to Cart**.
- **P1-CUST-04** In `/cart` change quantity / remove → subtotal & total update live.
- **P1-CUST-05** At checkout add an address. Enter pincode `123456` → blocked message; `452001` → allowed. Saved addresses are reusable.
- **P1-CUST-06** Place order (COD) → unique order number generated, stock reduced, order appears for admin instantly.
- **P1-CUST-07** Open the order → status timeline PLACED→…→DELIVERED; if rejected, shows **Rejected + reason**.
- **P1-CUST-08** `/orders` lists past orders with date; click to see items, amount, status.

### Admin
- **P1-ADMIN-01** `/admin/products` → add/edit, upload photo, set category/price/weight/stock. Delete = **deactivate**. Invalid inputs rejected.
- **P1-ADMIN-02** Set stock to 0 → product shows out-of-stock; placing an order auto-reduces stock.
- **P1-ADMIN-03** `/admin/categories` → add/edit/deactivate; assign products to a category in the product form.
- **P1-ADMIN-04** `/admin/orders` latest-first; **NEW** (PLACED) rows highlighted; open to see customer, items, address, amount, payment mode.
- **P1-ADMIN-05** In order detail, advance status; changes reflect in customer tracking.
- **P1-ADMIN-06** Accept or **reject with reason** → stock restored, customer sees rejected + reason.
- **P1-ADMIN-07** `/admin/customers` → name, mobile, register date; searchable.
- **P1-ADMIN-08** Dashboard shows today's order count and total amount.

### System
- **P1-SYS-01** `/admin/pincodes` manage allowed pincodes; orders to non-listed/inactive pincodes are blocked.
- **P1-SYS-02** Customer token on any `/api/admin/**` endpoint → 403; missing/invalid token on protected endpoints → 401.

---

## Phase 2 — Dealer system test guide

> Seeded **pending** dealer: **mobile `8888888888` / password `Dealer@123`** (shop "Sharma Kirana Store").
> Default dealer minimum order quantity = **10** per item (`app.dealer.min-order-qty`).

- **P2-DEAL-01 Dealer registration** — Go to `/register-dealer` (linked from Login/Register). Submit name, shop name, mobile, password (+ optional contact/GST). You get a **"pending admin approval"** screen and **no token**. Try logging in immediately → blocked: *"pending admin approval."* Wholesale prices are not visible (you can't log in yet).
- **P2-DEAL-02 Admin approval** — Login as admin → **Dealers** tab (defaults to *Pending*). You see the new/seeded dealer.
  - **Approve** → dealer can now log in; status APPROVED.
  - **Reject** (enter a reason) → dealer login now shows *"Your dealer application was rejected. Reason: …"*.
- **P2-DEAL-03 Wholesale pricing** — Log in as the approved dealer and open `/shop`. Prices show **wholesale** (labelled "wholesale"); the banner confirms dealer mode.
  - **Customer-never-sees-wholesale check:** as a customer (or logged out) call `GET /api/products` → every product's `wholesalePrice` is **`null`**; only `retailPrice` is returned. The wholesale value is only ever sent to an approved-dealer token.
- **P2-DEAL-04 Bulk order + minimum quantity** — As the dealer, "Add to Cart" defaults to 10; the cart blocks checkout until each line ≥ 10 (try reducing below 10 → checkout disabled with a clear message). Large quantities are allowed up to stock. Place the order → in the admin **Orders** list and order detail it is tagged **"Dealer order"**, and line prices are the wholesale prices.

---

## Phase 3 — Online payment (Razorpay test mode)

COD is unchanged. ONLINE adds a pay-first flow; the order is **placed only after the payment is verified server-side**.

### Where to put the keys (never in the frontend)
1. Create a free Razorpay account → **Dashboard → Settings → API Keys → Generate Test Key**. You get a **Key Id** (`rzp_test_…`) and a **Key Secret**.
2. Give them to the backend in **either** way:
   - **Env vars (preferred):**
     ```bash
     # macOS / Linux
     export RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
     export RAZORPAY_KEY_SECRET=yyyyyyyyyyyy
     # Windows PowerShell
     $env:RAZORPAY_KEY_ID="rzp_test_xxxxxxxx"; $env:RAZORPAY_KEY_SECRET="yyyyyyyyyyyy"
     ```
   - **Or** edit [`backend/src/main/resources/application.properties`](backend/src/main/resources/application.properties):
     ```
     app.razorpay.key-id=rzp_test_xxxxxxxx
     app.razorpay.key-secret=yyyyyyyyyyyy
     ```
3. Restart the backend. The frontend automatically enables the **Pay Online** option (it reads `GET /api/config` → `onlinePaymentEnabled`). The **secret stays on the backend**; the browser only ever receives the public Key Id. **If keys are blank, ONLINE is hidden/disabled and COD keeps working.**

### How it works
1. Checkout → choose **Pay Online** → `POST /api/payments/create-order` validates the cart and creates a Razorpay order (no DB order, no stock taken). The validated, priced cart is stored server-side as a `PaymentIntent`.
2. The Razorpay Checkout popup opens with the public Key Id + Razorpay order id.
3. On success Razorpay returns `payment_id`, `order_id`, `signature` → `POST /api/payments/verify` checks the **HMAC signature with the secret**, then places the order as **PAID**, reduces stock, and stores the **transaction id** (payment id). Amount/items come from the stored intent, so the client cannot tamper with them.
4. On cancel/failure → `POST /api/payments/failed`; **no order is placed** and the customer is told.

### How to test (P3-PAY-01/02/03)
> Add test keys first (above). Razorpay **test card**: `4111 1111 1111 1111`, any future expiry, any CVV, any name; or use **UPI success** in test mode.

- **P3-PAY-01** — At checkout you see **COD** and **Pay Online**. COD works exactly as before. Selecting Pay Online opens the Razorpay gateway.
- **P3-PAY-02 success** — Complete the test payment → you land on the order page, status **PLACED**, payment **Paid online**, stock reduced.
- **P3-PAY-02 fail/cancel** — Close the gateway or use a failing method → message *"Your order was not placed"*, **no new order** appears in history, **stock unchanged**.
- **P3-PAY-02 txn id** — Open the order (customer or admin) → the **Txn** id (Razorpay `pay_…`) is shown.
- **P3-PAY-03** — Admin **Orders** list shows a clear payment chip per order: **Paid online** (green) vs **COD**; the order detail shows the chip + txn id. Online-paid orders are visually distinct from COD.
- **Tamper/guard checks** — `POST /api/orders` with `paymentMode=ONLINE` is rejected (online must use the payment flow). `verify` with a bad signature → 400 "payment verification failed", intent marked FAILED, no order.

---

## 8. Notes

- **Dealer approval (Phase 2):** dealers register with `is_approved=false` / `approval_status=PENDING`. Login is allowed only after admin approval; pending/rejected dealers get a clear message (rejected includes the reason). Approval is enforced in `AuthService.login` (after the password is verified) so the message can be specific.
- **Wholesale privacy:** the public product API returns `wholesalePrice=null` for everyone except an approved-dealer token — customers can never see wholesale pricing.
- **Dealer minimum order quantity** is configurable via `app.dealer.min-order-qty` (default 10) and exposed to the frontend at `GET /api/config`. The backend always re-validates it on order placement.
- COD payment stays `PENDING` until the order is marked `DELIVERED`, at which point it becomes `PAID`.
- Product images are stored under `backend/uploads/` and served at `/uploads/**`.

### New columns / tables added (auto-created by Hibernate `ddl-auto=update`)
- **Phase 2** — `users`: `shop_name`, `gst_number`, `contact_person`, `approval_status`, `rejection_reason`; `orders`: `is_dealer_order`
- **Phase 3** — `orders`: `payment_txn_id`, `razorpay_order_id`; new table `payment_intents`
- **Phase 4** — `orders`: `discount_amount`, `coupon_code`; `payment_intents`: `discount_amount`, `coupon_code`; new table `coupons`

---

## Phase 4 (partial)

### P4-RPT-01 Sales reports (admin)
Admin → **Reports**. Pick a date range → total orders, total sales, and top-selling products (rejected orders excluded). API: `GET /api/admin/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=5`.

### P4-OFFER-01 Offers / coupons
Admin → **Coupons** create codes (percentage or flat, optional max-discount cap, min-order amount, validity dates, usage limit). At checkout the customer enters a code → **Apply** validates it server-side against the (role-aware) cart and shows the discount; the discounted total flows through **both COD and online** payment. The coupon's `used_count` increments when the order is placed.

**How to test:**
1. Admin → Coupons → add e.g. `SAVE10` = 10% (optional max ₹50), min order ₹100, valid date range covering today.
2. As a customer, add items, go to checkout, enter `SAVE10` → **Apply** → discount shows, "Total payable" drops. Place the order (COD or online) → order detail shows the **Discount (SAVE10)** line and reduced total; admin order detail shows the same.
3. Rejection cases (clear messages): unknown code → "Invalid coupon code"; an expired/inactive coupon → "expired"/"no longer active"; cart below min → "needs a minimum order of ₹…"; usage limit reached → "reached its usage limit".
4. Tamper safety: discount is always computed on the server from real prices; for online payments the discount is locked into the `payment_intent` so the charged amount and the placed order match.

### P4-NOTI-01 SMS notifications
- **Admin** gets an SMS on **every new order**; the **customer** gets an SMS on **every status change** (Accepted / Packed / Out for delivery / Delivered / Rejected — rejection includes the reason).
- Sending is **async + best-effort**: it runs off the request thread and a failure never affects the order.
- **Default = console mode (no account needed):** with `app.sms.provider=log` (the default) every message is printed to the backend console as `[SMS-DEV] To +91… : …`, so you can test the whole flow immediately.

**Enable real SMS (Twilio):**
1. Create a Twilio account → get **Account SID**, **Auth Token**, and a **From number** (trial gives one; trial can only send to *verified* numbers).
2. Set on the backend (env vars preferred — never commit live keys):
   ```bash
   export SMS_PROVIDER=twilio
   export TWILIO_ACCOUNT_SID=ACxxxx…
   export TWILIO_AUTH_TOKEN=xxxx
   export TWILIO_FROM_NUMBER=+1xxxxxxxxxx
   export ADMIN_NOTIFY_MOBILE=98XXXXXXXX   # who receives "new order" alerts (defaults to seeded admin)
   ```
   (or the matching `app.sms.*` / `app.twilio.*` keys in `application.properties`). Restart the backend.
- Indian 10-digit mobiles are auto-formatted to E.164 using `app.sms.default-country-code` (default `+91`). Other providers (MSG91 etc.) can be added by swapping the call in `SmsService` — the rest of the flow is provider-agnostic.

**How to test (console mode, zero setup):**
1. Run the backend; place an order as a customer → backend log shows `[SMS-DEV] To +919999999999 : ChipKart: New order ORD-… …` (admin alert).
2. As admin, Accept / Pack / mark Out-for-delivery / Deliver, or Reject with a reason → each change logs `[SMS-DEV] To <customer> : ChipKart: Hi …, your order ORD-… is now …` (rejection includes the reason).
3. Switch `SMS_PROVIDER=twilio` with valid keys and a verified recipient to receive real texts.
=======
# E_Commerce_Web
Having the code for e-commerce web
>>>>>>> 5016ecb754bbd0b2fe66a9db92946bf0c7cebfbb
