# Module 5 — Orders, Payments & Customer-Facing Flow

> **Back to index:** [README.md](./README.md)  
> **Domain:** Order lifecycle, payment recording, operations management UI, customer menu browsing  

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Architecture and Data Flow](#2-architecture-and-data-flow)
3. [Server — Order Model](#3-server--order-model)
4. [Server — Payment Model](#4-server--payment-model)
5. [Server — Order Routes (API Reference)](#5-server--order-routes-api-reference)
6. [Server — Payment Routes (API Reference)](#6-server--payment-routes-api-reference)
7. [Client — OperationsManagementPage](#7-client--operationsmanagementpage)
8. [Client — OperationsSubNav](#8-client--operationssubnav)
9. [Client — OrdersListView](#9-client--orderslistview)
10. [Client — OrderDetailPanel](#10-client--orderdetailpanel)
11. [Client — PaymentsGroupedView](#11-client--paymentsgroupedview)
12. [Client — CustomerMenuPage](#12-client--customermenupage)
13. [Client — api.js (Orders and Payments)](#13-client--apijs-orders-and-payments)
14. [Complete Order-to-Payment Lifecycle](#14-complete-order-to-payment-lifecycle)
15. [Financial Calculation Reference](#15-financial-calculation-reference)
16. [Known Issues and Gaps](#16-known-issues-and-gaps)

---

## 1. Module Overview

The Orders, Payments & Customer-Facing Flow module handles the transactional core of the POS system:

- **Order creation** — draft orders with line items, auto-calculated subtotals and tax
- **Order management** — list, filter, archive, and delete draft orders
- **Order status** — `draft → paid → cancelled` lifecycle
- **Payment recording** — cash, card (digital), and UPI (QR) payments linked to orders
- **Payment reporting** — grouped aggregate view by payment method
- **Customer menu** — browse menu items by category with search and grid/list toggle
- **Operations hub** — unified 3-tab view (Orders · Payments · Customers)

### Files in This Module

| Layer | File | Responsibility |
|-------|------|----------------|
| Server Model | `server/models/Order.js` | Order schema with auto-calc totals |
| Server Model | `server/models/Payment.js` | Payment schema with method enum |
| Server Route | `server/routes/orders.js` | CRUD for orders + bulk archive |
| Server Route | `server/routes/payments.js` | Create payment + grouped aggregate |
| Client Page | `client/src/pages/pos/OperationsManagementPage.jsx` | 3-tab operations hub |
| Client Component | `client/src/components/operations/OperationsSubNav.jsx` | Tab navigation bar |
| Client Component | `client/src/components/operations/OrdersListView.jsx` | Order table with bulk actions |
| Client Component | `client/src/components/operations/OrderDetailPanel.jsx` | Order detail sidebar |
| Client Component | `client/src/components/operations/PaymentsGroupedView.jsx` | Aggregated payment breakdown |
| Client Page | `client/src/pages/customer/CustomerMenuPage.jsx` | Customer product browsing |
| Client Util | `client/src/utils/format.js` | Currency formatting |

---

## 2. Architecture and Data Flow

### Order Creation Flow (Current — Staff-Only)

```
Staff opens order creation (not yet fully implemented)
  │
  ├─► Select products + quantities → build lines array
  ├─► POST /api/orders
  │     body: { lines: [{product: name, qty, price, tax}] }
  │
  ▼
Order.pre('validate') hook
  ├─► Auto-generate orderNumber (countDocuments() + 1)
  │
Order.pre('save') hook
  ├─► Calculate line.subtotal = qty × price
  ├─► Calculate order.subtotal = Σ line.subtotal
  ├─► Calculate order.taxTotal = Σ (line.subtotal × line.tax / 100)
  ├─► Calculate order.total = subtotal + taxTotal
  └─► status defaults to 'draft'
  │
  ▼
res.json({ success, order })
```

### Payment Recording Flow

```
Staff clicks "Record Payment" for an order
  │
  ├─► Select method: cash | card | upi
  ├─► Enter amount
  ├─► Optional: customer name
  ├─► POST /api/payments
  │     body: { order, method, amount, customerName? }
  │
  ▼
Payment.create(...)
  │
  ▼
res.json({ success, payment })
  │
  ⚠ Order.status is NOT updated to 'paid'
  ⚠ Session.totalSales is NOT incremented
  ⚠ Customer.totalSales is NOT incremented
```

### Order Archiving Flow

```
Staff selects orders in OrdersListView
  │
  ▼
PUT /api/orders/bulk/archive
  body: { orderIds: [...], archive: true }
  │
  ▼
Order.updateMany({ _id: { $in: orderIds } }, { status: 'cancelled' })
  │
  ▼
Orders removed from active list in UI
```

### Customer Menu Browsing Flow

```
Customer logs in → redirected to /customer (POSTerminalFloorViewPage)
  │
  ├─► Selects a table → floating bar appears
  ├─► Clicks "Confirm & Proceed to Menu"
  │
  ▼
navigate('/customer/menu', { state: { table, config } })
  │
  ▼
CustomerMenuPage renders
  ├─► Fetch categories (GET /api/categories?active=true)
  ├─► Fetch products  (GET /api/products?active=true)
  ├─► Filter by category or search
  ├─► Toggle grid/list view mode
  │
  ⚠ No "Add to Cart" — products are browse-only
  ⚠ table state from navigation is ignored
```

---

## 3. Server — Order Model

**File:** `server/models/Order.js`  
**Collection:** `orders`

### Schema Definition

```javascript
{
  orderNumber: {
    type: Number,
    unique: true,
    // Auto-generated in pre-validate hook
  },

  lines: [
    {
      product:  { type: String, required: true },  // ⚠ Denormalized name string, NOT ObjectId ref
      qty:      { type: Number, required: true, min: 1 },
      price:    { type: Number, required: true, min: 0 },
      tax:      { type: Number, default: 0 },      // GST % (0/5/12/18/28)
      subtotal: { type: Number, default: 0 },      // Auto-calculated: qty × price
    }
  ],

  status: {
    type: String,
    enum: ['draft', 'paid', 'cancelled'],
    default: 'draft',
  },

  // Computed totals (set by pre-save hook)
  subtotal: { type: Number, default: 0 },   // Sum of all line subtotals (before tax)
  taxTotal: { type: Number, default: 0 },   // Sum of all line tax amounts
  total:    { type: Number, default: 0 },   // subtotal + taxTotal

  timestamps: true   // createdAt, updatedAt
}
```

### Pre-Validate Hook: Order Number Generation

```javascript
OrderSchema.pre('validate', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await Order.countDocuments();
    this.orderNumber = count + 1;
  }
  next();
});
```

**⚠ Race Condition Risk:** `countDocuments() + 1` is NOT atomic. Under concurrent requests, two orders created simultaneously can both read the same `count` and generate duplicate `orderNumber` values. The `unique: true` index will then cause one to fail with a duplicate key error.

**Fix:** Use a counter collection or MongoDB's `$inc` on an atomic counter document:
```javascript
const counter = await Counter.findByIdAndUpdate(
  'orderNumber',
  { $inc: { seq: 1 } },
  { new: true, upsert: true }
);
this.orderNumber = counter.seq;
```

### Pre-Save Hook: Total Calculation

```javascript
OrderSchema.pre('save', function (next) {
  let subtotal = 0;
  let taxTotal = 0;

  this.lines = this.lines.map(line => {
    const lineSub = line.qty * line.price;
    const lineTax = lineSub * (line.tax / 100);
    line.subtotal = lineSub;
    subtotal += lineSub;
    taxTotal  += lineTax;
    return line;
  });

  this.subtotal = subtotal;
  this.taxTotal  = parseFloat(taxTotal.toFixed(2));
  this.total     = parseFloat((subtotal + taxTotal).toFixed(2));
  next();
});
```

This hook recalculates all totals on every `order.save()`. It is safe for updates (e.g., adding a line item).

### Denormalized Product References

`lines[].product` is a `String` (the product name) rather than an ObjectId `ref: 'Product'`. 

**Implications:**
- Product deletion does NOT invalidate historical orders (good for history preservation)
- You cannot populate or join to get current product price/category from an order line (bad for analytics)
- Renaming a product does NOT update order history (names are frozen at order creation time)
- This is consistent with typical receipt/invoice design but limits cross-reference queries

---

## 4. Server — Payment Model

**File:** `server/models/Payment.js`  
**Collection:** `payments`

### Schema Definition

```javascript
{
  method: {
    type: String,
    enum: ['cash', 'digital', 'upi'],
    required: true,
  },

  amount: {
    type: Number,
    required: true,
    min: 0,
  },

  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },

  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  customerName: {
    type: String,
    trim: true,
    default: '',
  },

  timestamps: true   // createdAt = payment time
}
```

### Method Enum

| Value | Description |
|-------|-------------|
| `cash` | Physical cash payment |
| `digital` | Card/bank digital payment |
| `upi` | QR code / UPI app payment |

The method enum must match the terminal's enabled `paymentMethods` flags. However, the route does NOT currently validate that the chosen method is enabled on any terminal. Any method from the enum can be used by any terminal.

### Missing Links

Payment records store:
- `order` ref — which order was paid
- `processedBy` ref — which staff member recorded it
- `customerName` string — optional customer name at time of payment

Payment records do NOT store:
- `session` ref — which session this payment belongs to (critical for session totals)
- `customer` ObjectId ref — cannot link back to Customer record
- `posConfig` ref — cannot filter payments by terminal

This limits the reporting capability significantly.

---

## 5. Server — Order Routes (API Reference)

**File:** `server/routes/orders.js`  
**Mount:** `app.use('/api/orders', orderRoutes)`

### GET /api/orders

**Access:** `protect` + `authorize('manager', 'cashier')`  
**Query:** `?status=draft|paid|cancelled&limit=50&skip=0`

```javascript
const query = {};
if (req.query.status) query.status = req.query.status;

const orders = await Order.find(query)
  .sort({ createdAt: -1 })
  .limit(Number(req.query.limit) || 50)
  .skip(Number(req.query.skip) || 0);

const total = await Order.countDocuments(query);
```

**Response (200):**
```json
{
  "success": true,
  "orders": [
    {
      "_id": "...",
      "orderNumber": 42,
      "lines": [
        { "product": "Cappuccino", "qty": 2, "price": 120, "tax": 5, "subtotal": 240 }
      ],
      "status": "draft",
      "subtotal": 240,
      "taxTotal": 12,
      "total": 252,
      "createdAt": "2026-04-04T10:30:00Z"
    }
  ],
  "total": 156,
  "limit": 50,
  "skip": 0
}
```

---

### GET /api/orders/:id

**Access:** `protect` + `authorize('manager', 'cashier')`

Returns a single order by ID.

---

### POST /api/orders

**Access:** `protect` + `authorize('manager', 'cashier')`  
**Body:**
```json
{
  "lines": [
    { "product": "Espresso",   "qty": 1, "price": 80,  "tax": 5  },
    { "product": "Croissant",  "qty": 2, "price": 60,  "tax": 12 }
  ]
}
```

**Validation:**
- `lines` required, must be non-empty array
- Each line must have `product` (string), `qty` (≥1), `price` (≥0)

**Logic:**
1. `Order.create({ lines })` → triggers pre-validate (orderNumber) + pre-save (totals)
2. `201 { success, order }`

---

### PUT /api/orders/bulk/archive

**Access:** `protect` + `authorize('manager', 'cashier')`  
**Body:** `{ orderIds: string[], archive: boolean }`

```javascript
const newStatus = archive ? 'cancelled' : 'draft';
await Order.updateMany(
  { _id: { $in: orderIds } },
  { status: newStatus }
);
```

Note: "archive" sets status to `'cancelled'`, "unarchive" sets back to `'draft'`. There is no `PUT /api/orders/:id` endpoint to update individual orders (e.g., change status from `draft` to `paid`).

---

### DELETE /api/orders/bulk

**Access:** `protect` + `authorize('manager')`  
**Body:** `{ orderIds: string[] }`

Only allows deleting orders with `status: 'draft'`:

```javascript
const result = await Order.deleteMany({
  _id: { $in: orderIds },
  status: 'draft',   // Safety: cannot delete paid/cancelled orders
});
res.json({ success: true, deleted: result.deletedCount });
```

Paid and cancelled orders are protected from hard deletion by this status check.

---

## 6. Server — Payment Routes (API Reference)

**File:** `server/routes/payments.js`  
**Mount:** `app.use('/api/payments', paymentRoutes)`

### GET /api/payments

**Access:** `protect` + `authorize('manager', 'cashier')`  
**Query:** `?method=cash|digital|upi&limit=50&skip=0`

```javascript
const query = {};
if (req.query.method) query.method = req.query.method;

const payments = await Payment.find(query)
  .populate('order', 'orderNumber total status')
  .populate('processedBy', 'fullName role')
  .sort({ createdAt: -1 })
  .limit(Number(req.query.limit) || 50)
  .skip(Number(req.query.skip) || 0);
```

**Response (200):**
```json
{
  "success": true,
  "payments": [
    {
      "_id": "...",
      "method": "cash",
      "amount": 252,
      "order": { "orderNumber": 42, "total": 252, "status": "draft" },
      "processedBy": { "fullName": "Jane Smith", "role": "cashier" },
      "customerName": "Priya",
      "createdAt": "2026-04-04T11:00:00Z"
    }
  ]
}
```

---

### GET /api/payments/grouped

**Access:** `protect` + `authorize('manager', 'cashier')`

Returns total payments grouped by payment method using MongoDB aggregation.

```javascript
const grouped = await Payment.aggregate([
  {
    $group: {
      _id: '$method',
      total:    { $sum: '$amount' },
      count:    { $sum: 1 },
      payments: { $push: { amount: '$amount', customerName: '$customerName', createdAt: '$createdAt' } }
    }
  },
  { $sort: { total: -1 } }
]);
```

**Response (200):**
```json
{
  "success": true,
  "grouped": [
    {
      "_id": "cash",
      "total": 14200,
      "count": 23,
      "payments": [
        { "amount": 252, "customerName": "Priya", "createdAt": "..." }
      ]
    },
    {
      "_id": "upi",
      "total": 8940,
      "count": 11,
      "payments": [...]
    }
  ]
}
```

---

### POST /api/payments

**Access:** `protect` + `authorize('manager', 'cashier')`  
**Body:**
```json
{
  "order":        "<orderId>",
  "method":       "cash",
  "amount":       252,
  "customerName": "Priya"
}
```

**Validation:**
- `order` required, valid ObjectId
- `method` required, must be `cash | digital | upi`
- `amount` required, must be > 0

**Logic:**
1. Validate order exists and is not already `paid` or `cancelled`
2. `Payment.create({ order, method, amount, customerName, processedBy: req.user._id })`
3. `201 { success, payment }`

**Missing logic (gaps):**
```javascript
// ❌ NOT done — order status unchanged
// await Order.findByIdAndUpdate(order, { status: 'paid' });

// ❌ NOT done — session totals unchanged
// await Session.findByIdAndUpdate(activeSession, { $inc: { totalSales: amount, orderCount: 1 } });

// ❌ NOT done — customer stats unchanged
// if (customerId) await Customer.findByIdAndUpdate(customerId, { $inc: { totalSales: amount } });
```

---

## 7. Client — OperationsManagementPage

**File:** `client/src/pages/pos/OperationsManagementPage.jsx`  
**Route:** `/operations`  
**Access:** manager, cashier

### Layout

```
┌─────────────────────────────────────────────────────┐
│  TopOperationsNav                                    │
├─────────────────────────────────────────────────────┤
│  "Operations" heading                                │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  OperationsSubNav: [Orders] [Payments] [Customers]│
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  (Orders tab active):                                │
│  ┌─────────────────────────────────────────────┐    │
│  │  OrdersListView                              │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  (Payments tab active):                              │
│  ┌─────────────────────────────────────────────┐    │
│  │  PaymentsGroupedView                         │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  (Customers tab active):                             │
│  ┌─────────────────────────────────────────────┐    │
│  │  CustomerDirectory                           │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### State

```javascript
const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'payments' | 'customers'
```

### Tab Definitions

```javascript
const TABS = [
  { key: 'orders',    label: 'Orders'    },
  { key: 'payments',  label: 'Payments'  },
  { key: 'customers', label: 'Customers' },
];
```

### Conditional Rendering

```jsx
{activeTab === 'orders'    && <OrdersListView isManager={isManager} />}
{activeTab === 'payments'  && <PaymentsGroupedView />}
{activeTab === 'customers' && <CustomerDirectory isManager={isManager} />}
```

Each sub-component manages its own data fetching lifecycle independently. Switching tabs triggers a fresh component mount and re-fetch (no global state caching).

---

## 8. Client — OperationsSubNav

**File:** `client/src/components/operations/OperationsSubNav.jsx`

A simple pill-style tab bar used by `OperationsManagementPage`.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `tabs` | array | Array of `{ key, label }` objects |
| `active` | string | Currently active tab key |
| `onChange` | function | Called with new tab key on click |

### Rendering

```jsx
export default function OperationsSubNav({ tabs, active, onChange }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 shadow-card p-1.5 inline-flex gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-5 py-2 rounded-xl text-sm font-display font-semibold transition-all duration-300 ${
            active === tab.key
              ? 'bg-gradient-to-r from-cafe-500 to-cafe-600 text-white shadow-btn'
              : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

Active tab uses the cafe orange gradient. Inactive tabs are grey with hover highlight.

---

## 9. Client — OrdersListView

**File:** `client/src/components/operations/OrdersListView.jsx`

A data-rich order management table with filtering, selection, bulk actions, and inline order detail view.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `isManager` | boolean | Enables delete and status-change controls |

### Internal State

```javascript
const [orders, setOrders]               = useState([]);
const [loading, setLoading]             = useState(true);
const [statusFilter, setStatusFilter]   = useState('all'); // 'all' | 'draft' | 'paid' | 'cancelled'
const [search, setSearch]               = useState('');
const [selected, setSelected]           = useState(new Set());
const [selectedOrder, setSelectedOrder] = useState(null); // For detail panel
const [page, setPage]                   = useState(0);
const LIMIT = 50;
```

### Data Fetching

```javascript
useEffect(() => {
  const params = { limit: LIMIT, skip: page * LIMIT };
  if (statusFilter !== 'all') params.status = statusFilter;

  ordersAPI.getAll(params)
    .then(res => setOrders(res.data.orders))
    .catch(() => toast.error('Failed to load orders'))
    .finally(() => setLoading(false));
}, [statusFilter, page]);
```

### Filter Bar

```
[Search by order # or product]  [Status: All ▾]  [Refresh]
```

Client-side search by:
- Order number string match
- Product name match in any line

Status filter triggers server-side query (`?status=draft|paid|cancelled`).

### Order Table Columns

| Column | Data |
|--------|------|
| # | Checkbox |
| Order No. | `#42` (order number) |
| Items | Count of line items, e.g., "3 items" |
| Total | Formatted currency (₹252) |
| Tax | Tax amount (₹12) |
| Status | Colored badge |
| Date | Relative or absolute date |
| Actions | View detail button |

### Status Badges

```javascript
const STATUS_STYLES = {
  draft:     'bg-amber-50 text-amber-700 border border-amber-200',
  paid:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-stone-100 text-stone-500 border border-stone-200',
};
```

### Bulk Action Bar

Appears in header when `selected.size > 0`:

```jsx
{selected.size > 0 && (
  <div className="flex items-center gap-3">
    <span className="text-xs text-stone-500">{selected.size} selected</span>
    <button onClick={handleBulkArchive}>Archive Selected</button>
    {isManager && (
      <button onClick={handleBulkDelete} className="text-red-600">Delete Drafts</button>
    )}
  </div>
)}
```

### Bulk Archive Handler

```javascript
const handleBulkArchive = async () => {
  const ids = Array.from(selected);
  await ordersAPI.bulkArchive({ orderIds: ids, archive: true });
  setOrders(prev => prev.map(o =>
    ids.includes(o._id) ? { ...o, status: 'cancelled' } : o
  ));
  setSelected(new Set());
  toast.success(`${ids.length} orders archived`);
};
```

### Bulk Delete Handler

```javascript
const handleBulkDelete = async () => {
  const ids = Array.from(selected).filter(id =>
    orders.find(o => o._id === id)?.status === 'draft'
  );
  if (ids.length === 0) { toast.error('Only draft orders can be deleted'); return; }

  await ordersAPI.bulkDelete({ orderIds: ids });
  setOrders(prev => prev.filter(o => !ids.includes(o._id)));
  setSelected(new Set());
  toast.success(`${ids.length} draft orders deleted`);
};
```

---

## 10. Client — OrderDetailPanel

**File:** `client/src/components/operations/OrderDetailPanel.jsx`

A slide-in sidebar panel showing the full details of a selected order.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `order` | object \| null | The selected order, or null to hide panel |
| `onClose` | function | Called to close the panel |
| `onStatusChange` | function | Called when staff changes order status |

### Panel Content

When an order is selected:

1. **Order header**
   - Order number (`#42`)
   - Status badge
   - Created time (formatted)

2. **Line items table**
   ```
   ┌──────────────┬─────┬──────┬──────┬─────┬──────────┐
   │  Product     │ Qty │ Rate │ Tax  │ Sub │ Line Sub │
   ├──────────────┼─────┼──────┼──────┼─────┼──────────┤
   │  Cappuccino  │  2  │ ₹120 │  5%  │ ₹12 │   ₹252   │
   │  Croissant   │  1  │  ₹60 │ 12%  │ ₹7  │    ₹67   │
   └──────────────┴─────┴──────┴──────┴─────┴──────────┘
   ```

3. **Totals summary**
   ```
   Subtotal:  ₹300
   Tax:        ₹19
   Total:     ₹319
   ```

4. **Status controls** (manager only)
   - "Mark as Paid" button (sets status to `paid`)
   - "Cancel Order" button (sets status to `cancelled`)
   
   **Note:** These buttons call `PUT /api/orders/:id` which does NOT currently exist. This is a gap.

5. **Payment info** (if order is paid)
   - Payment method, amount, processed by, timestamp

### Animation

The panel slides in from the right using `translate-x` transition:
```jsx
<div className={`fixed right-0 top-0 h-full w-96 bg-white shadow-glass-lg transform transition-transform duration-300 ${
  order ? 'translate-x-0' : 'translate-x-full'
}`}>
```

---

## 11. Client — PaymentsGroupedView

**File:** `client/src/components/operations/PaymentsGroupedView.jsx`

Shows payments aggregated by method (Cash/Digital/UPI) with expandable details.

### Data Fetching

```javascript
useEffect(() => {
  paymentsAPI.getGrouped()
    .then(res => setGrouped(res.data.grouped))
    .catch(() => toast.error('Failed to load payments'))
    .finally(() => setLoading(false));
}, []);
```

### Component State

```javascript
const [grouped, setGrouped]             = useState([]);
const [loading, setLoading]             = useState(true);
const [expandedMethod, setExpandedMethod] = useState(null); // method key or null
```

### Layout

```
┌─────────────────────────────────────────────────────┐
│  "Payments Breakdown"                                │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  💵 Cash            ₹14,200    23 payments  ▼ │    │
│  ├─────────────────────────────────────────────┤    │
│  │  (expanded)                                  │    │
│  │  Priya     ₹252    Apr 4, 10:00 AM          │    │
│  │  Rahul     ₹480    Apr 4, 11:15 AM          │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │  📱 Digital         ₹8,940    18 payments  ► │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │  📲 UPI / QR        ₹5,340    11 payments  ► │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  TOTAL COLLECTED: ₹28,480                           │
└─────────────────────────────────────────────────────┘
```

### Method Configuration

```javascript
const METHOD_CONFIG = {
  cash:    { label: 'Cash',       icon: '💵', color: 'bg-emerald-50 border-emerald-100', textColor: 'text-emerald-700' },
  digital: { label: 'Card/Bank',  icon: '💳', color: 'bg-blue-50 border-blue-100',       textColor: 'text-blue-700'    },
  upi:     { label: 'UPI / QR',   icon: '📲', color: 'bg-violet-50 border-violet-100',   textColor: 'text-violet-700'  },
};
```

### Expand/Collapse Toggle

```javascript
const handleToggle = (method) => {
  setExpandedMethod(prev => prev === method ? null : method);
};
```

Clicking a method header expands/collapses the individual payment list. Only one method can be expanded at a time (accordion behavior).

### Grand Total

A summary row below all method groups shows:

```javascript
const grandTotal = grouped.reduce((sum, g) => sum + g.total, 0);
```

### Empty State

When `grouped.length === 0` or all totals are 0:
```
No payment records found.
Payments will appear here once orders are processed.
```

---

## 12. Client — CustomerMenuPage

**File:** `client/src/pages/customer/CustomerMenuPage.jsx`  
**Route:** `/customer/menu`  
**Access:** all authenticated roles

The customer-facing product catalog page. Currently browse-only with no cart or checkout functionality.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Our Menu"  + [Grid/List toggle] + [Search]    │
│                                                          │
│  Category tabs: [All] [Drinks] [Food] [Pastries] ...    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  GRID VIEW:          │  LIST VIEW:                       │
│  ┌────┐ ┌────┐      │  Cappuccino    ₹120   +           │
│  │ ☕ │ │ 🥐 │      │  Espresso      ₹80    +           │
│  └────┘ └────┘      │  Croissant     ₹60    +           │
│                      │                                   │
└─────────────────────────────────────────────────────────┘
```

### State

```javascript
const [categories, setCategories]       = useState([]);
const [products, setProducts]           = useState([]);
const [selectedCategory, setSelectedCategory] = useState('all');
const [search, setSearch]               = useState('');
const [viewMode, setViewMode]           = useState('grid'); // 'grid' | 'list'
const [loading, setLoading]             = useState(true);
```

### Data Fetching (Parallel)

```javascript
useEffect(() => {
  Promise.all([
    categoriesAPI.getAll({ active: true }),
    productsAPI.getAll({ active: true }),
  ])
    .then(([catRes, prodRes]) => {
      setCategories(catRes.data.categories);
      setProducts(prodRes.data.products);
    })
    .catch(() => toast.error('Failed to load menu'))
    .finally(() => setLoading(false));
}, []);
```

### Filtered Products

```javascript
const filtered = products.filter(p => {
  const matchesCategory = selectedCategory === 'all'
    || p.category?._id === selectedCategory;
  const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
  return matchesCategory && matchesSearch;
});
```

### Category Tab Bar

```jsx
<div className="flex gap-2 overflow-x-auto pb-2">
  <button
    onClick={() => setSelectedCategory('all')}
    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
      selectedCategory === 'all'
        ? 'bg-cafe-500 text-white'
        : 'bg-white text-stone-600 border border-stone-200 hover:border-cafe-300'
    }`}
  >
    All
  </button>
  {categories.map(cat => (
    <button
      key={cat._id}
      onClick={() => setSelectedCategory(cat._id)}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        selectedCategory === cat._id
          ? 'text-white'
          : 'bg-white text-stone-600 border border-stone-200'
      }`}
      style={selectedCategory === cat._id ? { backgroundColor: cat.color } : {}}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
      {cat.name}
    </button>
  ))}
</div>
```

When a category is selected, its button background uses `style={{ backgroundColor: cat.color }}` (the hex from the Category model).

### Grid View Product Card

```jsx
<div className="bg-white rounded-2xl border border-stone-200 p-4 hover:shadow-card-hover transition-shadow">
  {/* Icon placeholder */}
  <div className="w-12 h-12 rounded-xl bg-cafe-50 flex items-center justify-center mb-3 text-2xl">
    ☕
  </div>
  <h3 className="font-display font-semibold text-stone-900 text-sm">{product.name}</h3>
  <p className="text-stone-400 text-xs mt-0.5">{product.category?.name}</p>
  <div className="flex items-center justify-between mt-3">
    <span className="font-display font-bold text-stone-900">{formatCurrency(product.salePrice)}</span>
    <button
      className="w-8 h-8 rounded-lg bg-cafe-50 text-cafe-600 flex items-center justify-center hover:bg-cafe-100 transition-colors"
      // ⚠ No onClick handler — no cart implemented
    >
      <Plus className="w-4 h-4" />
    </button>
  </div>
</div>
```

The `+` button is visually rendered but has **no `onClick` handler**. Clicking it does nothing — cart functionality is not implemented.

### List View Product Row

```jsx
<div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-stone-200 hover:border-cafe-200 transition-colors">
  <div className="w-10 h-10 rounded-lg bg-cafe-50 flex items-center justify-center text-lg flex-shrink-0">
    ☕
  </div>
  <div className="flex-1 min-w-0">
    <h3 className="font-display font-semibold text-stone-900 text-sm">{product.name}</h3>
    <p className="text-xs text-stone-400">{product.category?.name} · {product.uom}</p>
    {product.variants?.length > 0 && (
      <p className="text-[10px] text-cafe-600 mt-0.5">{product.variants.length} variants</p>
    )}
  </div>
  <div className="text-right flex-shrink-0">
    <p className="font-display font-bold text-stone-900 text-sm">{formatCurrency(product.salePrice)}</p>
    {product.tax > 0 && (
      <p className="text-[10px] text-stone-400">+{product.tax}% GST</p>
    )}
  </div>
  <button className="w-9 h-9 rounded-xl bg-cafe-50 text-cafe-600 flex items-center justify-center hover:bg-cafe-500 hover:text-white transition-colors">
    <Plus className="w-4 h-4" />
  </button>
</div>
```

### Table Context (Not Used)

```javascript
const location = useLocation();
// location.state = { table: { _id, tableNumber, seatsCount }, config: { ... } }
// ⚠ Currently NOT read — table state from POSTerminalFloorViewPage is ignored
```

The navigation state carries the selected table and config, but `CustomerMenuPage` never accesses `location.state`. When a cart is implemented, this data will be needed to associate the order with a specific table.

### Missing Functionality

| Feature | Status | Impact |
|---------|--------|--------|
| Add to cart | ❌ Not implemented | Core ordering flow broken |
| Cart state management | ❌ Not implemented | No way to accumulate items |
| Checkout / place order | ❌ Not implemented | Cannot POST to /api/orders |
| Table association | ❌ Not implemented | Orders have no table reference |
| Payment method selection | ❌ Not implemented | No way to choose cash/UPI/card |
| Order confirmation screen | ❌ Not implemented | No feedback after ordering |

---

## 13. Client — api.js (Orders and Payments)

**File:** `client/src/services/api.js`

### ordersAPI

```javascript
export const ordersAPI = {
  getAll:      (params) => api.get('/orders', { params }),
  getById:     (id)     => api.get(`/orders/${id}`),
  create:      (data)   => api.post('/orders', data),
  bulkArchive: (data)   => api.put('/orders/bulk/archive', data),
  bulkDelete:  (data)   => api.delete('/orders/bulk', { data }),
};
```

**Note on `bulkDelete`:** Uses `api.delete(..., { data })` to send a request body with a DELETE method. This follows Axios's convention for DELETE requests with a body. Some reverse proxies may strip DELETE bodies — test thoroughly in production.

### paymentsAPI

```javascript
export const paymentsAPI = {
  getAll:      (params) => api.get('/payments', { params }),
  getGrouped:  ()       => api.get('/payments/grouped'),
  create:      (data)   => api.post('/payments', data),
};
```

### customersAPI

```javascript
export const customersAPI = {
  getAll:    (params) => api.get('/customers', { params }),
  getById:   (id)     => api.get(`/customers/${id}`),
  create:    (data)   => api.post('/customers', data),
  update:    (id, data) => api.put(`/customers/${id}`, data),
};
```

---

## 14. Complete Order-to-Payment Lifecycle

### Current (Incomplete) Flow

```
[Order Created]  →  [Status: draft]  ──────────────────────────────┐
                                                                     │
[Payment Created] ─────────────────────────────────────────────────►│
                                                                     │
                    ⚠ Order.status stays 'draft' forever            │
                    ⚠ Session totals stay at 0 forever              │
                    ⚠ Customer stats stay at 0 forever              │
```

### Intended (Complete) Flow

```
[Order Created]
  │  status: 'draft'
  │
  ▼
[Staff Reviews Order in OrdersListView]
  │
  ▼
[Staff Records Payment]
  POST /api/payments { order, method, amount }
  │
  ├─► Payment.create()
  ├─► Order.status = 'paid'                      ← Need to add
  ├─► Session.totalSales += amount               ← Need to add
  ├─► Session.orderCount += 1                    ← Need to add
  └─► Customer.totalSales += amount (if linked)  ← Need to add
  │
  ▼
[Order visible in history as 'paid']
  │
  ▼
[Session closed at end of day]
  POST /api/pos/configs/:id/session/close
  │
  ├─► Session.status = 'closed'
  ├─► Session.closingBalance = input
  └─► POSConfig.currentSessionId = null
```

---

## 15. Financial Calculation Reference

### Order Line Calculation (Server-side, pre-save hook)

```
line.subtotal = line.qty × line.price

order.subtotal = Σ (line.qty × line.price)
order.taxTotal = Σ (line.qty × line.price × line.tax / 100)
order.total    = order.subtotal + order.taxTotal
```

### Example Calculation

**Order:**
- 2× Cappuccino @ ₹120 each, 5% GST
- 1× Croissant @ ₹60 each, 12% GST

**Calculations:**
```
Line 1: qty=2, price=120, tax=5
  subtotal = 2 × 120 = 240
  tax_amt  = 240 × 0.05 = 12.00

Line 2: qty=1, price=60, tax=12
  subtotal = 1 × 60 = 60
  tax_amt  = 60 × 0.12 = 7.20

Order:
  subtotal = 240 + 60 = 300
  taxTotal = 12.00 + 7.20 = 19.20
  total    = 300 + 19.20 = 319.20
             → rounded to ₹319.20
```

### Currency Display

```javascript
// formatCurrency('client/src/utils/format.js')
new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,  // No decimal places displayed
}).format(319.20)
// Returns: "₹319"
```

Note: `maximumFractionDigits: 0` means ₹319.20 displays as **₹319**, dropping the paise. This may cause rounding confusion in financial reports.

---

## 16. Known Issues and Gaps

### Issue 1: No PUT Endpoint for Order Status Transitions (Critical)

**Symptom:** There is no `PUT /api/orders/:id` endpoint. The only way to change status is via `PUT /api/orders/bulk/archive` which changes `draft → cancelled`.  
**Impact:**
- Cannot mark an order as `paid`  
- `OrderDetailPanel` "Mark as Paid" button has no working API endpoint to call
- Orders always show `draft` status — the paid/cancelled states are unusable

**Fix:**
```javascript
// Add to server/routes/orders.js:
router.put('/:id', protect, authorize('manager', 'cashier'), async (req, res) => {
  const { status } = req.body;
  if (!['draft', 'paid', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  res.json({ success: true, order });
});
```

---

### Issue 2: Payment Does Not Update Order Status (Critical)

**Symptom:** When `POST /api/payments` succeeds, the associated `Order.status` remains `'draft'`.  
**Impact:** There is no automatic lifecycle transition. An order can have multiple payments recorded against it while still showing `draft` status.

**Fix (in `server/routes/payments.js` POST handler):**
```javascript
// After Payment.create():
await Order.findByIdAndUpdate(req.body.order, { status: 'paid' });
```

---

### Issue 3: Customer Cart Not Implemented (Critical)

**Symptom:** `CustomerMenuPage` has product cards with a `+` button that has no `onClick` handler.  
**Impact:** Customers cannot add items to a cart, view their selection, or submit an order.

**Minimum viable cart implementation:**

```javascript
// Add to CustomerMenuPage state:
const [cart, setCart] = useState([]);   // [{ product, qty, price, tax }]

// Add to cart handler:
const addToCart = (product) => {
  setCart(prev => {
    const exists = prev.find(item => item.product === product.name);
    if (exists) {
      return prev.map(item =>
        item.product === product.name ? { ...item, qty: item.qty + 1 } : item
      );
    }
    return [...prev, {
      product:  product.name,
      qty:      1,
      price:    product.salePrice,
      tax:      product.tax,
    }];
  });
};

// Checkout handler:
const handleCheckout = async () => {
  if (cart.length === 0) return;
  const res = await ordersAPI.create({ lines: cart });
  toast.success(`Order #${res.data.order.orderNumber} placed!`);
  setCart([]);
  navigate('/customer', { replace: true });
};
```

---

### Issue 4: `formatCurrency` Drops Paise

**Symptom:** `maximumFractionDigits: 0` hides decimal amounts. ₹319.20 displays as ₹319.  
**Impact:** Minor financial rounding display issue. In reports, totals may appear rounded.  
**Fix:**
```javascript
// Option 1: Always show 2 decimal places
new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount)
// → ₹319.20

// Option 2: Show decimals only when non-zero (cleaner)
new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format(amount)
// → ₹319.20 (if paise exist) or ₹319 (if whole number)
```

---

### Issue 5: No Pagination UI in OrdersListView

**Symptom:** `GET /api/orders` supports `limit` and `skip` parameters and returns `total` count, but `OrdersListView` does not expose pagination controls.  
**Impact:** Only the first 50 orders are visible. Older orders are inaccessible from the UI.  
**Fix:** Add previous/next pagination buttons that update `page` state and retrigger the data fetch effect.

---

### Issue 6: DELETE with Request Body May Fail in Production

**Symptom:** `ordersAPI.bulkDelete` uses `api.delete('/orders/bulk', { data: { orderIds } })`. Axios sends the IDs as a request body.  
**Risk:** Some HTTP proxies (Nginx, AWS ALB) strip or reject DELETE request bodies per RFC 7231 guidance.  
**Fix:** Change to `PUT /api/orders/bulk/delete` with `{ method: 'DELETE', softDelete: true }` or use query parameters for bulk DELETE.

---

### Issue 7: No Real-Time Updates

**Symptom:** `OrdersListView` only fetches on mount and filter changes. New orders created by other staff members do not appear without manual refresh.  
**Impact:** In a multi-terminal environment, each terminal's view is stale.  
**Fix:** Implement WebSocket (Socket.io) or Server-Sent Events (SSE) for real-time order notifications, or add a polling interval:
```javascript
useInterval(() => {
  ordersAPI.getAll(params).then(res => setOrders(res.data.orders));
}, 10000); // refresh every 10 seconds
```

---

*Back to index: [README.md](./README.md)*

---

## Appendix A — Complete API Endpoint Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/logout` | Any auth | Logout (clears cookie) |
| GET | `/api/auth/me` | Any auth | Get current user |
| GET | `/api/auth/check-username/:username` | Public | Check username availability |
| GET | `/api/auth/check-email/:email` | Public | Check email availability |
| GET | `/api/pos/configs` | manager, cashier | List all terminals |
| POST | `/api/pos/configs` | manager | Create terminal |
| PUT | `/api/pos/configs/:id` | manager | Update terminal config |
| DELETE | `/api/pos/configs/:id` | manager | Deactivate terminal |
| POST | `/api/pos/configs/:id/session/open` | manager, cashier | Open session |
| POST | `/api/pos/configs/:id/session/close` | manager, cashier | Close session |
| GET | `/api/pos/configs/:id/sessions` | manager, cashier | Session history |
| GET | `/api/orders` | manager, cashier | List orders |
| GET | `/api/orders/:id` | manager, cashier | Get order |
| POST | `/api/orders` | manager, cashier | Create order |
| PUT | `/api/orders/bulk/archive` | manager, cashier | Bulk archive/unarchive |
| DELETE | `/api/orders/bulk` | manager | Delete draft orders |
| GET | `/api/payments` | manager, cashier | List payments |
| GET | `/api/payments/grouped` | manager, cashier | Payments by method aggregate |
| POST | `/api/payments` | manager, cashier | Record payment |
| GET | `/api/customers` | manager, cashier | List customers |
| GET | `/api/customers/:id` | manager, cashier | Get customer |
| POST | `/api/customers` | manager, cashier | Create customer |
| PUT | `/api/customers/:id` | manager, cashier | Update customer |
| GET | `/api/products` | any auth | List products |
| GET | `/api/products/:id` | any auth | Get product |
| POST | `/api/products` | manager, cashier | Create product |
| PUT | `/api/products/:id` | manager, cashier | Update product |
| PUT | `/api/products/bulk/archive` | manager | Bulk archive/restore |
| DELETE | `/api/products/bulk` | manager | Delete products |
| GET | `/api/categories` | any auth | List categories |
| POST | `/api/categories` | manager | Create category |
| PUT | `/api/categories/:id` | manager | Update category |
| DELETE | `/api/categories/:id` | manager | Soft-delete category |
| GET | `/api/floors` | manager, cashier | List floors |
| POST | `/api/floors` | manager | Create floor |
| PUT | `/api/floors/:id` | manager | Update floor |
| DELETE | `/api/floors/:id` | manager | Soft-delete (cascades tables) |
| GET | `/api/tables` | manager, cashier, customer | List tables |
| POST | `/api/tables` | manager | Create table |
| PUT | `/api/tables/:id` | manager | Update table |
| POST | `/api/tables/bulk/duplicate` | manager | Duplicate tables |
| DELETE | `/api/tables/bulk` | manager | Bulk soft-delete |

---

## Appendix B — Client Route Summary

| Path | Component | Roles | Status |
|------|-----------|-------|--------|
| `/` | redirect | any | ✅ Working |
| `/login` | AuthPage | public | ✅ Working |
| `/signup` | AuthPage | public | ✅ Working |
| `/unauthorized` | UnauthorizedPage | any | ✅ Working |
| `/dashboard` | Dashboard | all | ✅ Working |
| `/pos/config` | POSConfigurationPage | manager, cashier | ✅ Working |
| `/pos/floor` | FloorManagementPage | manager, cashier | ✅ Working |
| `/operations` | OperationsManagementPage | manager, cashier | ✅ Working |
| `/catalog` | ProductCategoryManagementPage | manager, cashier | ✅ Working |
| `/pos/terminal/:configId` | POSTerminalFloorViewPage | manager, cashier, customer | ✅ Working |
| `/customer` | POSTerminalFloorViewPage | all | ✅ Working |
| `/customer/menu` | CustomerMenuPage | all | ⚠️ Browse only — no cart |
| `/kitchen` | Dashboard (placeholder) | kitchen | ❌ Not implemented |

---

## Appendix C — Environment Variables Reference

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | ✅ Yes | `mongodb+srv://user:pass@cluster.mongodb.net/pos-cafe` | MongoDB connection string |
| `JWT_SECRET` | ✅ Yes | `min-32-char-random-secret` | Secret for JWT signing (min 32 chars recommended) |
| `NODE_ENV` | Optional | `development` \| `production` | Affects cookie `secure` flag |
| `PORT` | Optional | `5000` | Server listen port (default: 5000) |

---

## Appendix D — Mongoose Model Import Map

```javascript
// All models used in server/server.js (indirect via route requires)
const User      = require('./models/User');
const POSConfig = require('./models/POSConfig');
const Session   = require('./models/Session');
const Order     = require('./models/Order');
const Payment   = require('./models/Payment');
const Customer  = require('./models/Customer');
const Product   = require('./models/Product');
const Category  = require('./models/Category');
const Floor     = require('./models/Floor');
const Table     = require('./models/Table');
```

---

*End of Module 5 — Orders, Payments & Customer-Facing Flow*  
*Back to index: [README.md](./README.md)*
