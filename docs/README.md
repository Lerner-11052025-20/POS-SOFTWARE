# Odoo POS Cafe — Complete Technical Documentation

> **Project:** odoo-pos-cafe  
> **Stack:** MERN (MongoDB · Express · React · Node.js)  
> **Version:** 1.0.0  
> **Documented:** April 2026  

---

## Table of Contents

| # | Module | Description | File |
|---|--------|-------------|------|
| 1 | [**Authentication & Role Access**](./module-1-auth.md) | JWT auth, 4 roles, guards, signup/login UI | `module-1-auth.md` |
| 2 | [**POS Terminal & Session Control**](./module-2-pos-terminal.md) | Terminal config, session open/close, payment methods | `module-2-pos-terminal.md` |
| 3 | [**Floor & Table Management**](./module-3-floor-table.md) | Floors, tables, seating blueprint, toggle card | `module-3-floor-table.md` |
| 4 | [**Product, Category & Customer Catalog**](./module-4-catalog.md) | Products, variants, categories, customer directory | `module-4-catalog.md` |
| 5 | [**Orders, Payments & Customer-Facing Flow**](./module-5-orders-payments.md) | Order lifecycle, payments, customer menu | `module-5-orders-payments.md` |

---

## 1. Project Overview

**Odoo POS Cafe** is a full-stack, browser-based Point-of-Sale system designed specifically for cafe and restaurant environments. It provides:

- **Multi-terminal POS configuration** — each terminal (counter, drive-thru, etc.) has its own session, payment method toggles, and floor plan.
- **Floor and table management** — managers configure floors, add tables with seat counts, and enable/disable the floor plan per terminal.
- **Product and category catalog** — full CRUD for menu items with tax rates, unit-of-measure, and per-product variants (size, pack, etc.).
- **Order management** — draft orders are created, billed, and archived; operations staff view orders in a filterable list.
- **Payment recording** — cash, digital (card), and QR/UPI payments are recorded against orders; a grouped view aggregates totals by method.
- **Customer directory** — customer records (name, phone, address, 30 Indian states) are managed with inline create/edit.
- **Customer-facing menu** — customers browse the menu on a table-selection floor view, then on a product catalog page.
- **Role-based access** — four roles (`manager`, `cashier`, `kitchen`, `customer`) are enforced on both the front-end routes and every API endpoint.

---

## 2. Architecture Diagram

```
                ┌─────────────────────────┐
                │   React Client (Vite)   │
                │      port 8080          │
                │  /api  ──proxy──►  5000 │
                └───────────┬─────────────┘
                            │ HTTP / Axios
                ┌───────────▼─────────────┐
                │  Express Server         │
                │  port 5000              │
                │  9 route groups         │
                └───────────┬─────────────┘
                            │ Mongoose 8.x
                ┌───────────▼─────────────┐
                │  MongoDB Atlas / Local   │
                │  10 collections          │
                └─────────────────────────┘
```

---

## 3. Quick-Start Guide

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| MongoDB | Atlas URI or local `mongod` |

### Environment Variables

Create `server/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/pos-cafe
JWT_SECRET=your-super-secret-key-min-32-chars
NODE_ENV=development
PORT=5000
```

### Install & Run

```bash
# Root workspace
npm install          # installs concurrently

# Server dependencies
cd server && npm install

# Client dependencies
cd ../client && npm install

# Back to root — start both together
cd ..
npm run dev          # concurrently: server (nodemon) + client (vite)
```

The client opens at **http://localhost:8080**. All `/api/*` calls proxy to `http://127.0.0.1:5000`.

### Seed Default Categories

```bash
cd server
node seeds/seedCategories.js
```

Seeds 10 default categories (Food, Drink, Pastries, Quick Bites, Desserts, Beverages, Starters, Main Course, Combo Meals, Specials) and skips any that already exist.

---

## 4. Root package.json Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `concurrently "npm run server" "npm run client"` | Start both server + client in parallel |
| `server` | `cd server && npm run dev` | Start server with nodemon |
| `client` | `cd client && npm run dev` | Start Vite dev server |
| `build` | `cd client && npm run build` | Production build to `client/dist/` |

---

## 5. Directory Structure Overview

```
/
├── package.json              ← root (concurrently orchestrator)
├── docs/                     ← THIS DOCUMENTATION
│   ├── README.md
│   ├── module-1-auth.md
│   ├── module-2-pos-terminal.md
│   ├── module-3-floor-table.md
│   ├── module-4-catalog.md
│   └── module-5-orders-payments.md
│
├── client/                   ← React + Vite front-end
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js        ← port 8080, proxy /api → 5000
│   ├── tailwind.config.js    ← custom cafe/cream/espresso theme
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx          ← ReactDOM root, BrowserRouter, AuthProvider, Toaster
│       ├── App.jsx           ← All routes with ProtectedRoute wrappers
│       ├── index.css         ← Global component classes (.auth-input, .glass-card …)
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── services/
│       │   └── api.js        ← axios instance + all API call functions
│       ├── utils/
│       │   ├── format.js     ← formatCurrency (en-IN, INR)
│       │   └── validation.js ← password strength, field error helpers
│       ├── components/
│       │   ├── ProtectedRoute.jsx
│       │   ├── auth/         ← AuthBrandPanel, AuthCard, PasswordStrengthMeter, RoleSelector
│       │   ├── floor/        ← FloorFormModal, FloorPlanToggleCard, FloorPreviewPanel, TablesManagementList
│       │   ├── layout/       ← Navbar
│       │   ├── operations/   ← CustomerDirectory, OperationsSubNav, OrderDetailPanel, OrdersListView, PaymentsGroupedView
│       │   ├── pos/          ← CreatePOSTerminalModal, EmptyPOSState, PaymentMethodConfigPanel, POSTerminalCard, TopOperationsNav
│       │   └── products/     ← CategoryManagementPanel, ProductFormCard, ProductsListView, ProductVariantsTab
│       └── pages/
│           ├── Dashboard.jsx
│           ├── UnauthorizedPage.jsx
│           ├── auth/         ← AuthPage
│           ├── customer/     ← CustomerMenuPage
│           └── pos/          ← FloorManagementPage, OperationsManagementPage, POSConfigurationPage,
│                               POSTerminalFloorViewPage, ProductCategoryManagementPage
│
└── server/                   ← Express + Mongoose back-end
    ├── package.json
    ├── server.js             ← Express bootstrap, 9 route mounts
    ├── config/
    │   └── db.js             ← Mongoose connect
    ├── middleware/
    │   └── auth.js           ← protect (JWT verify) + authorize (role check)
    ├── models/               ← 10 Mongoose models
    │   ├── Category.js
    │   ├── Customer.js
    │   ├── Floor.js
    │   ├── Order.js
    │   ├── Payment.js
    │   ├── POSConfig.js
    │   ├── Product.js
    │   ├── Session.js
    │   ├── Table.js
    │   └── User.js
    ├── routes/               ← 9 Express route files
    │   ├── auth.js
    │   ├── categories.js
    │   ├── customers.js
    │   ├── floors.js
    │   ├── orders.js
    │   ├── payments.js
    │   ├── pos.js
    │   ├── products.js
    │   └── tables.js
    └── seeds/
        └── seedCategories.js
```

---

## 6. Technology Stack Reference

### Client (client/package.json)

| Package | Version | Role |
|---------|---------|------|
| react | 18.3.x | UI library |
| react-dom | 18.3.x | DOM renderer |
| react-router-dom | 6.x | SPA routing |
| axios | latest | HTTP client |
| lucide-react | latest | Icon set |
| react-hot-toast | latest | Toast notifications |
| tailwindcss | 3.4.x | Utility CSS |
| vite | 5.x | Build tool / dev server |
| @vitejs/plugin-react | 4.x | Vite React plugin |
| postcss / autoprefixer | latest | CSS processing |

### Server (server/package.json)

| Package | Version | Role |
|---------|---------|------|
| express | 4.x | HTTP framework |
| mongoose | 8.x | MongoDB ODM |
| jsonwebtoken | latest | JWT sign/verify |
| bcryptjs | latest | Password hashing |
| express-validator | latest | Request validation |
| express-rate-limit | latest | Rate limiting |
| cookie-parser | latest | Cookie middleware |
| cors | latest | Cross-origin headers |
| dotenv | latest | Environment variables |
| nodemon | latest (dev) | Auto-restart server |

---

## 7. API Base URL and Routing

All client API calls go through Vite's `/api` proxy:

```
Client call: GET /api/auth/me
Vite proxy : GET http://127.0.0.1:5000/api/auth/me
```

### Server Route Mounts (server.js)

| Mount Path | Route File | Resource |
|-----------|------------|----------|
| `/api/auth` | routes/auth.js | Authentication |
| `/api/pos` | routes/pos.js | POS terminals & sessions |
| `/api/orders` | routes/orders.js | Orders |
| `/api/payments` | routes/payments.js | Payments |
| `/api/customers` | routes/customers.js | Customer records |
| `/api/products` | routes/products.js | Products |
| `/api/categories` | routes/categories.js | Categories |
| `/api/floors` | routes/floors.js | Floors |
| `/api/tables` | routes/tables.js | Tables |

---

## 8. Authentication Summary

- **Mechanism:** JWT, 7-day expiry, `HS256`
- **Storage:** `localStorage` keys `pos_token` and `pos_user`
- **Transport:** `Authorization: Bearer <token>` header
- **Fallback:** `httpOnly` cookie `token` (same-site `lax`) also set on login
- **Server middleware:** `protect` verifies JWT and loads `req.user`; `authorize(...roles)` checks role membership
- **Client guard:** `ProtectedRoute` component checks `isAuthenticated` and `allowedRoles`

---

## 9. Role Access Matrix

| Route/Feature | manager | cashier | kitchen | customer |
|---------------|:-------:|:-------:|:-------:|:--------:|
| `/dashboard` | ✅ | ✅ | ✅ | ✅ |
| `/pos/config` (POS terminals) | ✅ | ✅ | — | — |
| `/pos/floor` (floor management) | ✅ | ✅ | — | — |
| `/operations` (orders/payments) | ✅ | ✅ | — | — |
| `/catalog` (products/categories) | ✅ | ✅ | — | — |
| `/pos/terminal/:id` | ✅ | ✅ | — | ✅ |
| `/customer` | ✅ | ✅ | ✅ | ✅ |
| `/customer/menu` | ✅ | ✅ | ✅ | ✅ |
| `/kitchen` | — | — | ✅ (placeholder) | — |
| Create/delete terminal (API) | ✅ | — | — | — |
| Open/close session (API) | ✅ | ✅ | — | — |

---

## 10. MongoDB Collections Summary

| Collection | Model File | Key Fields |
|------------|-----------|------------|
| `users` | User.js | fullName, username, email, password (select:false), role, isActive |
| `posconfigs` | POSConfig.js | name, paymentMethods, upiId, currentSessionId, isFloorPlanEnabled |
| `sessions` | Session.js | posConfig, openedBy, status, totalSales, orderCount |
| `orders` | Order.js | orderNumber, lines[], status (draft/paid/cancelled), totals |
| `payments` | Payment.js | method, amount, order, processedBy, customerName |
| `customers` | Customer.js | name, email, phone, address, state, totalSales |
| `products` | Product.js | name, category, salePrice, tax, uom, variants[], isActive |
| `categories` | Category.js | name (unique), color (hex), isActive |
| `floors` | Floor.js | name, posConfig, {name+posConfig} unique |
| `tables` | Table.js | tableNumber, floor, seatsCount, isActive |

---

## 11. Known Gaps and Future Work

| Priority | Gap | Location | Fix Approach |
|----------|-----|----------|-------------|
| 🔴 HIGH | Payment does not update `Order.status` to `paid` | payments route | Add order update in POST /payments |
| 🔴 HIGH | `Session.totalSales` / `orderCount` never updated | pos route + payments route | Increment on payment create |
| 🔴 HIGH | Customer cart and checkout entirely missing | CustomerMenuPage | Add cart state + POST /api/orders |
| 🟠 MEDIUM | `Order.lines[].product` stores a string, not ObjectId | Order model | Change to `ref: 'Product'` |
| 🟠 MEDIUM | `countDocuments()` for order number is race-condition prone | Order model pre-validate hook | Use atomic counter or UUID |
| 🟠 MEDIUM | Dynamic Tailwind classes may be purged in production | PaymentMethodConfigPanel | Add safelist in tailwind.config.js |
| 🟡 LOW | Kitchen module is a placeholder — routes to Dashboard | App.jsx `/kitchen` | Build `KitchenDisplayPage` |
| 🟡 LOW | Auth rate limiter allows 5000 req/15min (too lenient) | server.js `authLimiter` | Reduce to 10–20 req/15min |
| 🟡 LOW | CORS origin hardcoded to `localhost:8080` | server.js | Use `process.env.CLIENT_URL` |
| 🟡 LOW | `Customer.totalSales` / `orderCount` never updated | payments route | Increment on payment create |

---

## 12. Design System Reference

The project uses a custom Tailwind configuration with a cafe-themed palette:

### Color Palette

| Scale | Base Hex | Usage |
|-------|----------|-------|
| `cafe-500` | `#F97316` | Primary accent (buttons, active states) |
| `cafe-600` | `#EA6C0A` | Hover states |
| `cream-50` | `#FFFBF5` | Page backgrounds |
| `espresso-800` | `#1C1108` | Auth panel dark background |
| `espresso-900` | `#120B04` | Deep dark |

### Typography

| Variable | Font | Usage |
|----------|------|-------|
| `font-display` | Plus Jakarta Sans | Headings, labels, buttons |
| `font-body` | Inter | Body text, descriptions |

### Global Component Classes (index.css)

| Class | Description |
|-------|-------------|
| `.auth-input` | Styled text input with focus ring |
| `.auth-input-error` | Red border variant for validation errors |
| `.auth-label` | Small uppercase tracking label |
| `.auth-btn-primary` | Full-width gradient button |
| `.glass-card` | Semi-transparent card with backdrop blur |
| `.role-card` | Selectable role grid card |
| `.role-card-active` | Active/selected role card variant |

### Custom Tailwind Utilities

| Utility | Value |
|---------|-------|
| `shadow-card` | `0 2px 8px rgba(28,17,8,0.06)` |
| `shadow-card-hover` | `0 8px 24px rgba(28,17,8,0.12)` |
| `shadow-btn` | `0 4px 12px rgba(249,115,22,0.35)` |
| `shadow-glass` | `0 8px 32px rgba(28,17,8,0.08)` |
| `animate-fade-in-up` | Keyframe fade + translate(0,8px→0) |
| `animate-slide-down` | Keyframe expand from height-0 |
| `animate-scale-in` | Keyframe scale from 0.95→1 |
| `animate-pulse-soft` | Gentle opacity 0.6↔1 pulse |

---

*See individual module documentation files for full component references, API specifications, data flow diagrams, and known gaps for each domain.*
