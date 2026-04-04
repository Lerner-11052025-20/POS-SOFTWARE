# Module 4 — Product, Category & Customer Catalog

> **Back to index:** [README.md](./README.md)  
> **Domain:** Menu products, product variants, categories with color coding, customer directory  

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Architecture and Data Flow](#2-architecture-and-data-flow)
3. [Server — Product Model](#3-server--product-model)
4. [Server — Category Model](#4-server--category-model)
5. [Server — Customer Model](#5-server--customer-model)
6. [Server — Product Routes (API Reference)](#6-server--product-routes-api-reference)
7. [Server — Category Routes (API Reference)](#7-server--category-routes-api-reference)
8. [Server — Customer Routes (API Reference)](#8-server--customer-routes-api-reference)
9. [Server — Seed Script](#9-server--seed-script)
10. [Client — ProductCategoryManagementPage](#10-client--productcategorymanagementpage)
11. [Client — ProductsListView](#11-client--productslistview)
12. [Client — ProductFormCard](#12-client--productformcard)
13. [Client — ProductVariantsTab](#13-client--productvariantstab)
14. [Client — CategoryManagementPanel](#14-client--categorymanagementpanel)
15. [Client — CustomerDirectory](#15-client--customerdirectory)
16. [Tax and Pricing Reference](#16-tax-and-pricing-reference)
17. [Known Issues and Gaps](#17-known-issues-and-gaps)

---

## 1. Module Overview

The Product, Category & Customer Catalog module manages the three core data entities that feed into order creation:

- **Categories** — named groups with color indicators (e.g., Food #F59E0B, Drink #38BDF8). Products belong to one category.
- **Products** — menu items with sale price, tax rate, unit of measure, and optional variants
- **Product Variants** — inline sub-documents on a product (e.g., Pack of 6, Small/Large serving)
- **Customers** — a lightweight CRM: name, email, phone, address, Indian state selector

### Files in This Module

| Layer | File | Responsibility |
|-------|------|----------------|
| Server Model | `server/models/Product.js` | Product schema with embedded variants |
| Server Model | `server/models/Category.js` | Category schema |
| Server Model | `server/models/Customer.js` | Customer CRM schema |
| Server Route | `server/routes/products.js` | Full CRUD + bulk archive |
| Server Route | `server/routes/categories.js` | CRUD with reactivate-or-create |
| Server Route | `server/routes/customers.js` | CRUD for customer records |
| Server Seed | `server/seeds/seedCategories.js` | 10 default categories |
| Client Page | `client/src/pages/pos/ProductCategoryManagementPage.jsx` | Unified catalog management UI |
| Client Component | `client/src/components/products/ProductsListView.jsx` | Product table/list with filters |
| Client Component | `client/src/components/products/ProductFormCard.jsx` | Create/edit product form with tabs |
| Client Component | `client/src/components/products/ProductVariantsTab.jsx` | Inline variants table within product form |
| Client Component | `client/src/components/products/CategoryManagementPanel.jsx` | Color-coded category cards |
| Client Component | `client/src/components/operations/CustomerDirectory.jsx` | Customer search + inline create |

---

## 2. Architecture and Data Flow

### Product Creation Flow

```
Manager/Cashier fills ProductFormCard
  │
  ├─► Tab 1: General Info (name, category, price, tax, UOM)
  ├─► Tab 2: Variants (optional rows: attribute, value, UOM, extra price)
  │
  ▼
productsAPI.create(formData)
  │
  ▼
POST /api/products (protect + authorize('manager','cashier'))
  ├─► express-validator checks
  ├─► Product.create({ name, category, salePrice, tax, uom, variants, isActive })
  └─► res.status(201).json({ success, product })
  │
  ▼
ProductsListView re-fetches or optimistic update
```

### Category Creation Flow

```
Manager types category name + picks color in CategoryManagementPanel
  │
  ▼
categoriesAPI.create({ name, color })
  │
  ▼
POST /api/categories (protect + authorize('manager'))
  ├─► Check for soft-deleted category with same name → reactivate if found
  ├─► Otherwise: Category.create({ name, color, createdBy: req.user._id })
  └─► res.json({ success, category })
```

### Customer Creation Flow

```
Cashier/Manager clicks "+ New Customer" in CustomerDirectory
  │
  ▼
Inline form expands in right panel
  ├─► Fields: name, email, phone, address, state, country (default India)
  │
  ▼
customersAPI.create(formData)
  │
  ▼
POST /api/customers (protect + authorize('manager','cashier'))
  ├─► name required, email unique if provided
  ├─► Customer.create(...)
  └─► res.json({ success, customer })
  │
  ▼
Customer added to list, form closes
```

---

## 3. Server — Product Model

**File:** `server/models/Product.js`  
**Collection:** `products`

### Schema Definition

```javascript
{
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: 1,
    maxLength: 100
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },

  salePrice: {
    type: Number,
    required: true,
    min: 0
  },

  tax: {
    type: Number,
    enum: [0, 5, 12, 18, 28],   // Indian GST slabs
    default: 0
  },

  uom: {
    type: String,
    enum: ['Unit', 'Kg', 'Liter', 'Pack'],
    default: 'Unit'
  },

  variants: [
    {
      attribute:  { type: String, trim: true },  // e.g., "Pack"
      value:      { type: String, trim: true },  // e.g., "6"
      uom:        { type: String, enum: ['Unit','Kg','Liter','Pack'], default: 'Unit' },
      extraPrice: { type: Number, default: 0, min: 0 }
    }
  ],

  isActive: {
    type: Boolean,
    default: true
  },

  timestamps: true
}
```

### GST Tax Slabs

The `tax` field is restricted to the 5 Indian GST slabs: `0%`, `5%`, `12%`, `18%`, `28%`. This matches Indian tax law for food and beverages:
- 0% — fresh produce, milk, bread (unbranded)
- 5% — packaged footwear, coal, branded cereals
- 12% — butter, ghee, frozen meat
- 18% — most restaurant meals, packaged food
- 28% — luxury goods, aerated beverages

### Unit of Measure (UOM)

| Value | Usage |
|-------|-------|
| `Unit` | Default — single item (e.g., "1 Burger") |
| `Kg` | Weight-based items (e.g., "500g Salad") |
| `Liter` | Volume-based (e.g., "1L Juice") |
| `Pack` | Multi-pack items (e.g., "Pack of 6") |

### Product Variants Sub-Document

Each variant is an embedded sub-document (not a separate collection):
- `attribute` — what varies (e.g., "Size", "Pack", "Serving")
- `value` — the specific value (e.g., "Large", "6", "Full")
- `uom` — unit for this variant
- `extraPrice` — additional price on top of `salePrice` (e.g., Large is +₹50)

**Example:**
```json
{
  "name": "Coffee",
  "salePrice": 80,
  "tax": 5,
  "variants": [
    { "attribute": "Size", "value": "Small",  "uom": "Unit", "extraPrice": 0  },
    { "attribute": "Size", "value": "Medium", "uom": "Unit", "extraPrice": 20 },
    { "attribute": "Size", "value": "Large",  "uom": "Unit", "extraPrice": 40 }
  ]
}
```

---

## 4. Server — Category Model

**File:** `server/models/Category.js`  
**Collection:** `categories`

### Schema Definition

```javascript
{
  name: {
    type: String,
    required: true,
    unique: true,    // Case-sensitive unique index
    trim: true,
    maxLength: 50
  },

  color: {
    type: String,
    required: true,
    match: /^#[0-9A-Fa-f]{6}$/,  // Must be 6-digit hex color
    default: '#6B7280'
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  timestamps: true
}
```

### Color Validation

The `color` field must match the regex `/^#[0-9A-Fa-f]{6}$/`. This means:
- Must start with `#`
- Exactly 6 hex characters
- Valid: `#F59E0B`, `#38BDF8`
- Invalid: `#FFF` (shorthand), `rgb(255,0,0)`, `orange`

### Default Categories (from seed)

| Name | Color |
|------|-------|
| Food | `#F59E0B` (amber) |
| Drink | `#38BDF8` (sky blue) |
| Pastries | `#F472B6` (pink) |
| Quick Bites | `#34D399` (emerald) |
| Desserts | `#8B5CF6` (violet) |
| Beverages | `#06B6D4` (cyan) |
| Starters | `#F97316` (orange) |
| Main Course | `#EF4444` (red) |
| Combo Meals | `#D97706` (amber-dark) |
| Specials | `#E11D48` (rose) |

---

## 5. Server — Customer Model

**File:** `server/models/Customer.js`  
**Collection:** `customers`

### Schema Definition

```javascript
{
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: 1,
    maxLength: 100
  },

  email: {
    type: String,
    unique: true,
    sparse: true,   // Unique but allows multiple null/empty values
    trim: true,
    lowercase: true
  },

  phone: {
    type: String,
    trim: true,
    match: /^[+]?[\d\s\-\(\)]{7,15}$/   // Flexible international format
  },

  address: {
    street:  { type: String, trim: true },
    city:    { type: String, trim: true },
    state:   { type: String, trim: true },
    pinCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' }
  },

  // Aggregate fields — never updated in current code
  totalSales:  { type: Number, default: 0 },
  orderCount:  { type: Number, default: 0 },

  isActive: {
    type: Boolean,
    default: true
  },

  timestamps: true
}
```

### Email Uniqueness

```javascript
email: { unique: true, sparse: true }
```

`sparse: true` means the unique index only applies when `email` is not null/empty. Multiple customers can have no email (common for walk-in customers), but two customers cannot share the same email address.

### Address Sub-Document

The address is an embedded sub-document with 5 fields:
- `street` — building/road
- `city` — city name
- `state` — Indian state (30 states listed in `CustomerDirectory` form)
- `pinCode` — 6-digit Indian postal code
- `country` — defaults to `'India'`

### Aggregate Fields (Not Updated)

`totalSales` and `orderCount` are defined but never incremented. This is the same pattern as `Session.totalSales`. When a payment is created, neither the customer record nor the session is updated with the new totals.

---

## 6. Server — Product Routes (API Reference)

**File:** `server/routes/products.js`  
**Mount:** `app.use('/api/products', productRoutes)`

### GET /api/products

**Access:** `protect` (any authenticated user — all roles)  
**Query:** `?category=<categoryId>&active=true&search=<term>`

```javascript
const query = {};
if (req.query.active === 'true') query.isActive = true;
if (req.query.category)          query.category = req.query.category;
if (req.query.search) {
  query.name = { $regex: req.query.search, $options: 'i' };
}
const products = await Product.find(query)
  .populate('category', 'name color')
  .sort({ name: 1 });
```

Returns products sorted alphabetically. Each product includes the populated category `{ name, color }`.

**Response (200):**
```json
{
  "success": true,
  "products": [
    {
      "_id": "...",
      "name": "Cappuccino",
      "category": { "_id": "...", "name": "Drink", "color": "#38BDF8" },
      "salePrice": 120,
      "tax": 5,
      "uom": "Unit",
      "variants": [
        { "attribute": "Size", "value": "Small", "uom": "Unit", "extraPrice": 0 }
      ],
      "isActive": true
    }
  ]
}
```

---

### GET /api/products/:id

**Access:** `protect`

Returns a single product with populated category.

---

### POST /api/products

**Access:** `protect` + `authorize('manager', 'cashier')`  
**Body:**
```json
{
  "name": "Espresso",
  "category": "<categoryId>",
  "salePrice": 80,
  "tax": 5,
  "uom": "Unit",
  "variants": []
}
```

**Validation:**
- `name` — required, non-empty
- `category` — required, must be valid ObjectId
- `salePrice` — required, must be ≥ 0
- `tax` — must be one of `[0, 5, 12, 18, 28]`

Returns `201` on success.

---

### PUT /api/products/:id

**Access:** `protect` + `authorize('manager', 'cashier')`  
**Body:** Any subset of product fields

```javascript
const product = await Product.findByIdAndUpdate(id, body, { new: true, runValidators: true })
  .populate('category', 'name color');
```

Can also be used to toggle `isActive` for a single product.

---

### PUT /api/products/bulk/archive

**Access:** `protect` + `authorize('manager')`  
**Body:** `{ productIds: string[], archive: boolean }`

```javascript
await Product.updateMany(
  { _id: { $in: productIds } },
  { isActive: !archive }
);
```

If `archive: true` → sets `isActive: false` (hides from menu).  
If `archive: false` → sets `isActive: true` (restores to menu).

---

### DELETE /api/products/bulk

**Access:** `protect` + `authorize('manager')`  
**Body:** `{ productIds: string[] }`

```javascript
await Product.deleteMany({ _id: { $in: productIds } });
```

**Note:** This is a **hard delete** (unlike floors/tables/categories which use soft delete). Products are permanently removed. Orders that contain these products will still reference the product name as a string (see Module 5 — denormalized order lines).

---

## 7. Server — Category Routes (API Reference)

**File:** `server/routes/categories.js`  
**Mount:** `app.use('/api/categories', categoryRoutes)`

### GET /api/categories

**Access:** `protect`  
**Query:** `?active=true` (optional)

```javascript
const query = req.query.active === 'true' ? { isActive: true } : {};
const categories = await Category.find(query).sort({ name: 1 });
```

---

### POST /api/categories

**Access:** `protect` + `authorize('manager')`  
**Body:** `{ name: string, color: string }`

**Reactivate-or-Create logic** (same pattern as floors):

```javascript
const existing = await Category.findOne({
  name: { $regex: new RegExp(`^${name}$`, 'i') }
});

if (existing) {
  if (!existing.isActive) {
    existing.isActive = true;
    existing.color = color;
    await existing.save();
    return res.json({ success: true, category: existing, reactivated: true });
  }
  return res.status(409).json({ success: false, message: 'Category already exists' });
}

const category = await Category.create({ name, color, createdBy: req.user._id });
res.status(201).json({ success: true, category });
```

If a deleted category with the same name exists, it is reactivated with the new color instead of creating a duplicate.

---

### PUT /api/categories/:id

**Access:** `protect` + `authorize('manager')`  
**Body:** `{ name?, color? }`

```javascript
const category = await Category.findByIdAndUpdate(id, body, { new: true, runValidators: true });
```

---

### DELETE /api/categories/:id

**Access:** `protect` + `authorize('manager')`

**Cascading consideration** — softly deletes the category:

```javascript
await Category.findByIdAndUpdate(id, { isActive: false });
```

**Note:** Unlike floor/table cascade, **this does NOT deactivate products** in this category. Products will still reference the (now inactive) category ObjectId. The `GET /api/products` query still returns them; they'll just have a category that won't appear in `GET /api/categories?active=true`.

---

## 8. Server — Customer Routes (API Reference)

**File:** `server/routes/customers.js`  
**Mount:** `app.use('/api/customers', customerRoutes)`

### GET /api/customers

**Access:** `protect` + `authorize('manager', 'cashier')`  
**Query:** `?search=<term>` (searches name, email, phone)

```javascript
const query = { isActive: true };
if (req.query.search) {
  const term = req.query.search;
  query.$or = [
    { name:  { $regex: term, $options: 'i' } },
    { email: { $regex: term, $options: 'i' } },
    { phone: { $regex: term, $options: 'i' } },
  ];
}
const customers = await Customer.find(query).sort({ name: 1 }).limit(50);
```

Returns at most 50 customers, sorted alphabetically.

---

### GET /api/customers/:id

**Access:** `protect` + `authorize('manager', 'cashier')`

Returns a single customer by ID.

---

### POST /api/customers

**Access:** `protect` + `authorize('manager', 'cashier')`  
**Body:**
```json
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "phone": "+91 98765 43210",
  "address": {
    "street": "12 MG Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pinCode": "560001",
    "country": "India"
  }
}
```

**Validation:**
- `name` required
- `email` — if provided, checked for uniqueness: `409 'Email already registered'`

---

### PUT /api/customers/:id

**Access:** `protect` + `authorize('manager', 'cashier')`  
**Body:** Any updatable fields

```javascript
const customer = await Customer.findByIdAndUpdate(id, body, { new: true, runValidators: true });
```

---

## 9. Server — Seed Script

**File:** `server/seeds/seedCategories.js`

### Purpose

Creates 10 default cafe categories with predefined hex colors. Safe to run multiple times — uses "update if color changed, skip if identical" logic.

### Default Categories

```javascript
const DEFAULT_CATEGORIES = [
  { name: 'Food',         color: '#F59E0B' },
  { name: 'Drink',        color: '#38BDF8' },
  { name: 'Pastries',     color: '#F472B6' },
  { name: 'Quick Bites',  color: '#34D399' },
  { name: 'Desserts',     color: '#8B5CF6' },
  { name: 'Beverages',    color: '#06B6D4' },
  { name: 'Starters',     color: '#F97316' },
  { name: 'Main Course',  color: '#EF4444' },
  { name: 'Combo Meals',  color: '#D97706' },
  { name: 'Specials',     color: '#E11D48' },
];
```

### Idempotency Logic

For each category:
1. Case-insensitive name match: `{ name: { $regex: /^name$/i } }`
2. If found AND color differs → update color, count as "created"
3. If found AND color same → skip
4. If not found → `Category.create(...)` with `createdBy = first manager user`

### Usage

```bash
cd server
node seeds/seedCategories.js
```

Output:
```
Connected to MongoDB...
Using creator: Admin User (manager)
  ✅  "Food" created (#F59E0B)
  ✅  "Drink" created (#38BDF8)
  ...
Done! Created: 10 | Skipped: 0
```

---

## 10. Client — ProductCategoryManagementPage

**File:** `client/src/pages/pos/ProductCategoryManagementPage.jsx`  
**Route:** `/catalog`  
**Access:** manager, cashier

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  TopOperationsNav                                        │
├─────────────────────────────────────────────────────────┤
│  Page Header: "Product & Category Management"            │
│                                                          │
│  Tab Bar: [Products] [Categories]                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  PRODUCTS TAB:                                           │
│  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │  ProductsListView   │  │   ProductFormCard       │  │
│  │  (left column)      │  │   (right panel,         │  │
│  │                     │  │    hidden until select) │  │
│  └─────────────────────┘  └─────────────────────────┘  │
│                                                          │
│  CATEGORIES TAB:                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  CategoryManagementPanel (full width)            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### State

```javascript
const [activeTab, setActiveTab]         = useState('products'); // 'products' | 'categories'
const [products, setProducts]           = useState([]);
const [categories, setCategories]       = useState([]);
const [editingProduct, setEditingProduct] = useState(null);
const [showProductForm, setShowProductForm] = useState(false);
const [loading, setLoading]             = useState(true);
```

### Data Fetching (Parallel)

```javascript
useEffect(() => {
  Promise.all([
    productsAPI.getAll(),
    categoriesAPI.getAll({ active: true }),
  ])
    .then(([prodRes, catRes]) => {
      setProducts(prodRes.data.products);
      setCategories(catRes.data.categories);
    })
    .catch(() => toast.error('Failed to load catalog'))
    .finally(() => setLoading(false));
}, []);
```

Products and categories are fetched in parallel for performance.

### Product Create/Edit Flow

```javascript
// Open form for new product:
const handleCreateProduct = () => {
  setEditingProduct(null);
  setShowProductForm(true);
};

// Open form for existing product:
const handleEditProduct = (product) => {
  setEditingProduct(product);
  setShowProductForm(true);
};

// After form saves:
const handleProductSaved = (savedProduct) => {
  if (editingProduct) {
    setProducts(prev => prev.map(p => p._id === savedProduct._id ? savedProduct : p));
  } else {
    setProducts(prev => [savedProduct, ...prev]);
  }
  setShowProductForm(false);
  setEditingProduct(null);
};
```

### Bulk Archive Handler

```javascript
const handleBulkArchive = async (productIds, archive) => {
  await productsAPI.bulkArchive({ productIds, archive });
  setProducts(prev =>
    prev.map(p => productIds.includes(p._id) ? { ...p, isActive: !archive } : p)
  );
  toast.success(archive ? 'Products archived' : 'Products restored');
};
```

---

## 11. Client — ProductsListView

**File:** `client/src/components/products/ProductsListView.jsx`

A filterable, searchable, selectable product list that feeds into `ProductCategoryManagementPage`.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `products` | array | Full product list |
| `categories` | array | Categories for filter dropdown |
| `onEdit` | function | Called with product when edit clicked |
| `onBulkArchive` | function | Called with (ids, archive) for bulk ops |
| `isManager` | boolean | Controls bulk delete access |

### Filter State

```javascript
const [search, setSearch]           = useState('');
const [categoryFilter, setCategoryFilter] = useState('all');
const [statusFilter, setStatusFilter]   = useState('active'); // 'all' | 'active' | 'archived'
const [selected, setSelected]       = useState(new Set());
```

### Computed Filtered List

```javascript
const filtered = products.filter(p => {
  const matchesSearch   = p.name.toLowerCase().includes(search.toLowerCase());
  const matchesCategory = categoryFilter === 'all' || p.category?._id === categoryFilter;
  const matchesStatus   = statusFilter === 'all'
    ? true
    : statusFilter === 'active' ? p.isActive : !p.isActive;
  return matchesSearch && matchesCategory && matchesStatus;
});
```

### Product Row

Each row shows:
- Checkbox
- Product name + category badge (colored dot + category name)
- Price (formatted as ₹XX)
- Tax rate (e.g., "5%")
- UOM
- Active badge (green "Active" / grey "Archived")
- Variant count badge (if variants > 0)
- Edit button

### Bulk Actions Bar

Appears when `selected.size > 0`:
- **Archive Selected** — calls `onBulkArchive(ids, true)`
- **Restore Selected** — calls `onBulkArchive(ids, false)`
- **Delete Selected** (manager only) — calls `productsAPI.bulkDelete(ids)`, then filters from list

### Empty State

Shows a custom empty illustration + message when `filtered.length === 0`:
- "No products match your filters" if filters are applied
- "No products yet — create your first menu item" if list is completely empty

---

## 12. Client — ProductFormCard

**File:** `client/src/components/products/ProductFormCard.jsx`

A two-tab form for creating and editing products.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `product` | object \| null | `null` for create; product object for edit |
| `categories` | array | Available categories for the dropdown |
| `onSave` | function | Called with saved product after API success |
| `onCancel` | function | Called when Discard/Cancel is clicked |
| `isManager` | boolean | Controls delete access |

### Tabs

1. **General Info** — the main product fields
2. **Variants** — delegates to `ProductVariantsTab`

### Form State

```javascript
const [form, setForm] = useState({
  name:      product?.name      || '',
  category:  product?.category?._id || '',
  salePrice: product?.salePrice || '',
  tax:       product?.tax       || 0,
  uom:       product?.uom       || 'Unit',
  isActive:  product?.isActive  ?? true,
});
const [variants, setVariants] = useState(product?.variants || []);
const [activeTab, setActiveTab] = useState('general');
const [errors, setErrors]       = useState({});
const [saving, setSaving]       = useState(false);
```

### Validation (client-side)

```javascript
const validate = () => {
  const errs = {};
  if (!form.name.trim())     errs.name = 'Product name is required';
  if (!form.category)        errs.category = 'Category is required';
  if (form.salePrice === '') errs.salePrice = 'Price is required';
  if (Number(form.salePrice) < 0) errs.salePrice = 'Price cannot be negative';
  return errs;
};
```

### Save Handler

```javascript
const handleSave = async () => {
  const errs = validate();
  if (Object.keys(errs).length > 0) { setErrors(errs); return; }

  setSaving(true);
  try {
    const payload = { ...form, salePrice: Number(form.salePrice), variants };
    let res;
    if (product?._id) {
      res = await productsAPI.update(product._id, payload);
    } else {
      res = await productsAPI.create(payload);
    }
    onSave(res.data.product);
    toast.success(product ? 'Product updated' : 'Product created');
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to save product');
  } finally {
    setSaving(false);
  }
};
```

### General Info Tab Fields

| Field | Type | Options |
|-------|------|---------|
| Name | text input | — |
| Category | select dropdown | All active categories |
| Sale Price (₹) | number input | ≥ 0 |
| Tax Rate | select dropdown | 0%, 5%, 12%, 18%, 28% |
| Unit of Measure | select dropdown | Unit, Kg, Liter, Pack |
| Active | toggle switch | true/false |

### Category Color Indicator

The category dropdown uses a custom option rendering with a colored dot:

```jsx
<select value={form.category} onChange={...}>
  <option value="">-- Select Category --</option>
  {categories.map(cat => (
    <option key={cat._id} value={cat._id}>{cat.name}</option>
  ))}
</select>
// A separate colored dot indicator shows the selected category's color:
{selectedCategory && (
  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedCategory.color }} />
)}
```

---

## 13. Client — ProductVariantsTab

**File:** `client/src/components/products/ProductVariantsTab.jsx`

Manages the `variants` array on a product. Rendered inside `ProductFormCard` as the second tab.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `variants` | array | Current variants array |
| `onChange` | function | Called with updated variants array on any change |

### State Operations

All state operations are pure array transformations passed back via `onChange`:

```javascript
// Add empty row
const addRow = () => {
  onChange([...variants, { attribute: '', value: '', uom: 'Unit', extraPrice: 0 }]);
};

// Update a field in a row
const updateRow = (index, field, val) => {
  const updated = variants.map((v, i) => i === index ? { ...v, [field]: val } : v);
  onChange(updated);
};

// Remove a row
const removeRow = (index) => {
  onChange(variants.filter((_, i) => i !== index));
};
```

### Variant Row Fields

Each variant row (rendered as a responsive grid):

```
┌───────────────┬──────────────┬────────┬─────────────┬───┐
│  Attribute    │  Value       │  UOM   │  Extra (₹)  │ ✕ │
├───────────────┼──────────────┼────────┼─────────────┼───┤
│  text input   │  text input  │ select │ number input│ 🗑  │
└───────────────┴──────────────┴────────┴─────────────┴───┘
```

On mobile: stacked vertically with labels above each field.

### UOM Options

```javascript
const UOM_OPTIONS = ['Unit', 'Kg', 'Liter', 'Pack'];
```

### Empty State

When `variants.length === 0`:
```
🧩
No variants yet
Variants let you define product variations like pack sizes ...
```

---

## 14. Client — CategoryManagementPanel

**File:** `client/src/components/products/CategoryManagementPanel.jsx`

A full-width panel showing all categories as colored card tiles with add/edit/delete capability.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `categories` | array | All category documents |
| `onCategoriesChange` | function | Called with updated categories after mutation |
| `isManager` | boolean | Controls add/edit/delete access |

### Internal State

```javascript
const [editingCategory, setEditingCategory] = useState(null); // null | category object
const [showForm, setShowForm]               = useState(false);
const [formData, setFormData]               = useState({ name: '', color: '#F97316' });
const [saving, setSaving]                   = useState(false);
```

### Category Card Layout

Each category is a card tile:

```
┌──────────────────────────┐
│  ████ (color swatch)     │
│  Category Name           │
│  N products              │
│  [Edit] [Delete]         │
└──────────────────────────┘
```

The color swatch is a 48px square `div` with `style={{ backgroundColor: category.color }}` and `rounded-xl`.

### Color Picker

When creating or editing, a predefined palette of 12 colors is shown as clickable swatches:

```javascript
const PRESET_COLORS = [
  '#F59E0B', '#38BDF8', '#F472B6', '#34D399',
  '#8B5CF6', '#06B6D4', '#F97316', '#EF4444',
  '#D97706', '#E11D48', '#10B981', '#6366F1',
];
```

The user can also type a custom hex into a color input `<input type="color" />`.

### Create/Edit Handler

```javascript
const handleSave = async () => {
  if (!formData.name.trim()) { toast.error('Category name required'); return; }
  setSaving(true);
  try {
    if (editingCategory) {
      const res = await categoriesAPI.update(editingCategory._id, formData);
      onCategoriesChange(categories.map(c =>
        c._id === editingCategory._id ? res.data.category : c
      ));
      toast.success('Category updated');
    } else {
      const res = await categoriesAPI.create(formData);
      onCategoriesChange([...categories, res.data.category]);
      toast.success('Category created');
    }
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', color: '#F97316' });
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to save category');
  } finally {
    setSaving(false);
  }
};
```

### Delete Handler

```javascript
const handleDelete = async (categoryId) => {
  await categoriesAPI.delete(categoryId);
  onCategoriesChange(categories.filter(c => c._id !== categoryId));
  toast.success('Category removed');
};
```

---

## 15. Client — CustomerDirectory

**File:** `client/src/components/operations/CustomerDirectory.jsx`

Located in the Operations Management page (Module 5), but part of this module's domain. Manages the customer list with search and inline create/edit.

### Layout

```
┌────────────────────────────┬──────────────────────────────┐
│  Search bar                │                               │
│  + [+ New Customer]        │  CustomerFormPanel            │
│                            │  (appears when creating/      │
│  Customer List:            │   editing)                    │
│  ┌ Name      Phone ──────┐ │                               │
│  │ Priya     +91...      │ │                               │
│  │ Rahul     +91...      │ │                               │
│  └───────────────────────┘ │                               │
└────────────────────────────┴──────────────────────────────┘
```

### State

```javascript
const [customers, setCustomers]         = useState([]);
const [search, setSearch]               = useState('');
const [selectedCustomer, setSelectedCustomer] = useState(null);
const [showForm, setShowForm]           = useState(false);
const [editingCustomer, setEditingCustomer] = useState(null);
const [loading, setLoading]             = useState(true);
```

### Search

Debounced search triggers `GET /api/customers?search=<term>`:

```javascript
useEffect(() => {
  const timeout = setTimeout(async () => {
    const res = await customersAPI.getAll({ search });
    setCustomers(res.data.customers);
  }, 300);
  return () => clearTimeout(timeout);
}, [search]);
```

### Customer Form Fields

When `showForm` is `true`, the right panel shows an inline form:

| Field | Type | Notes |
|-------|------|-------|
| Name | text | Required |
| Email | email | Optional, unique |
| Phone | tel | Optional |
| Street | text | Optional |
| City | text | Optional |
| State | select | 30 Indian states |
| PIN Code | text | Optional |
| Country | text | Default "India" |

### Indian States List

The state dropdown contains all 28 states + 8 union territories of India:

```javascript
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  // Union Territories:
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];
```

### Customer Row

Each customer in the list shows:
- First letter avatar (colored circle)
- Full name (bold)
- Email (muted, truncated)
- Phone number
- Action buttons: Edit, View (opens right panel with details)

---

## 16. Tax and Pricing Reference

### GST Slabs

```
Tax 0%  (Exempt)  → Basic vegetables, milk, eggs, fresh produce
Tax 5%            → Branded cereals, packaged food, coffee
Tax 12%           → Butter, ghee, processed cheese
Tax 18%           → Restaurant meals, AC restaurants, packaged beverages
Tax 28% (Luxury)  → Aerated drinks, caffeinated water, tobacco
```

### Price Calculation in Orders

When an order line is created:
- `price` = product's `salePrice` (or `salePrice + variant.extraPrice`)
- `tax` = product's tax percentage
- Per-line tax amount = `price × qty × (tax/100)`
- Order totals are computed in `Order.js` pre-save hook (Module 5)

### Currency Display

All prices use the `formatCurrency` utility:

```javascript
// client/src/utils/format.js
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
```

Examples:
- `formatCurrency(1200)` → `"₹1,200"`
- `formatCurrency(24500)` → `"₹24,500"`
- `formatCurrency(0)` → `"₹0"`

---

## 17. Known Issues and Gaps

### Issue 1: Category Delete Does Not Deactivate Products

**Symptom:** When a category is soft-deleted, all products in that category remain `isActive: true` and still appear in the menu.  
**Impact:** Menu shows products with no valid/active category, which may cause UI display issues (null category name/color).

**Fix:**
```javascript
// In DELETE /api/categories/:id handler:
await Category.findByIdAndUpdate(id, { isActive: false });
await Product.updateMany({ category: id }, { isActive: false }); // cascade
```

---

### Issue 2: Product Hard Delete Breaks Order History

**Symptom:** `DELETE /api/products/bulk` permanently removes product documents. However, since `Order.lines[].product` stores the product name as a **string** (not an ObjectId ref), order history is unaffected in the current code.

**Larger Context:** If `Order.lines[].product` is later changed to an ObjectId ref (recommended fix), product deletion would break order history display. The denormalized string approach is actually safer for historical records, but makes live catalog queries impossible.

**Recommended Fix (long term):**
1. Keep `Order.lines[].product` as a string (denormalized name) for history preservation
2. Add `productId` as an optional ObjectId ref alongside `product` string for live linking

---

### Issue 3: Customer totalSales/orderCount Never Updated

**Symptom:** `Customer.totalSales = 0` and `Customer.orderCount = 0` always.  
**Cause:** `POST /api/payments` does not update the customer record.

**Fix (in payments route):**
```javascript
if (customerId) {
  await Customer.findByIdAndUpdate(customerId, {
    $inc: { totalSales: amount, orderCount: 1 }
  });
}
```

---

### Issue 4: No Product Image Support

**Symptom:** Products have no image field. The menu page and product cards show only text/icons.  
**Impact:** Customer-facing menu looks sparse compared to typical cafe menu apps.  
**Fix:** Add `imageUrl: { type: String }` to Product schema, add image upload to `ProductFormCard`.

---

### Issue 5: Category-Product Count Not Tracked

**Symptom:** `CategoryManagementPanel` shows "N products" per category, but this is computed client-side by counting `products.filter(p => p.category._id === cat._id).length` — requires the full product list to be loaded.  
**Fix:** For large catalogs, add a `GET /api/categories` response that includes product count as an aggregation field.

---

*Next: [Module 5 — Orders, Payments & Customer-Facing Flow](./module-5-orders-payments.md)*
