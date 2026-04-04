# Module 2 — POS Terminal & Session Control

> **Back to index:** [README.md](./README.md)  
> **Domain:** Terminal configuration, session lifecycle (open/close), payment method setup, navigation headers  

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Architecture and Data Flow](#2-architecture-and-data-flow)
3. [Server — POSConfig Model](#3-server--posconfig-model)
4. [Server — Session Model](#4-server--session-model)
5. [Server — POS Routes (API Reference)](#5-server--pos-routes-api-reference)
6. [Client — POSConfigurationPage](#6-client--posconfigurationpage)
7. [Client — POSTerminalCard](#7-client--posterminaicard)
8. [Client — CreatePOSTerminalModal](#8-client--createposterminalmodal)
9. [Client — EmptyPOSState](#9-client--emptyposstate)
10. [Client — PaymentMethodConfigPanel](#10-client--paymentmethodconfigpanel)
11. [Client — TopOperationsNav](#11-client--topoperationsnav)
12. [Client — Navbar](#12-client--navbar)
13. [State Management and Data Flow](#13-state-management-and-data-flow)
14. [Known Issues and Gaps](#14-known-issues-and-gaps)

---

## 1. Module Overview

The POS Terminal & Session Control module manages the lifecycle and configuration of individual Point-of-Sale terminals (counters) within the cafe system.

**Core Responsibilities:**

- **Terminal creation** — a manager creates named terminals (e.g., "Counter 1", "Drive-Thru")
- **Payment method configuration** — each terminal can independently enable/disable Cash, Digital (Card), and QR/UPI payments
- **Floor plan toggle** — the `isFloorPlanEnabled` flag per terminal determines whether the floor + table interface is shown
- **Session lifecycle** — a cashier or manager opens a session (marks terminal as "active") and closes it at end of day
- **Session history** — past sessions with opening/closing balance and timestamps are stored

### Files in This Module

| Layer | File | Responsibility |
|-------|------|----------------|
| Server Model | `server/models/POSConfig.js` | Terminal schema, payment method sub-doc |
| Server Model | `server/models/Session.js` | Session open/close lifecycle |
| Server Route | `server/routes/pos.js` | CRUD terminals + session open/close/history |
| Client Page | `client/src/pages/pos/POSConfigurationPage.jsx` | Master configuration UI |
| Client Component | `client/src/components/pos/POSTerminalCard.jsx` | Individual terminal card with actions |
| Client Component | `client/src/components/pos/CreatePOSTerminalModal.jsx` | New terminal creation modal |
| Client Component | `client/src/components/pos/EmptyPOSState.jsx` | Zero-state placeholder |
| Client Component | `client/src/components/pos/PaymentMethodConfigPanel.jsx` | Payment method toggles sidebar |
| Client Component | `client/src/components/pos/TopOperationsNav.jsx` | Main navigation bar for operations |
| Client Component | `client/src/components/layout/Navbar.jsx` | Alternate navigation bar (floor pages) |

---

## 2. Architecture and Data Flow

### Terminal Creation Flow

```
Manager clicks "+ New Terminal"
  │
  ▼
CreatePOSTerminalModal opens
  │
  ├─► User types terminal name
  ├─► Client validation: non-empty, ≥2 chars
  │
  ▼
posAPI.createConfig({ name })
  │
  ▼
POST /api/pos/configs (protect + authorize('manager'))
  ├─► express-validator: name required
  ├─► Check for existing config with same name (case-insensitive)
  ├─► POSConfig.create({ name, paymentMethods: { cash: true, digital: false, qrPayment: false } })
  └─► res.json({ success, config })
  │
  ▼
onCreated(config) → parent adds config to list state
```

### Session Open Flow

```
User clicks "Open Session" on POSTerminalCard
  │
  ▼
posAPI.openSession(configId, { openingBalance })
  │
  ▼
POST /api/pos/configs/:id/session/open (protect + authorize('manager','cashier'))
  ├─► Check POSConfig.currentSessionId not already open
  ├─► Session.create({ posConfig: id, openedBy: req.user._id, status: 'open', openingBalance })
  ├─► POSConfig.findByIdAndUpdate(id, {
  │     currentSessionId: session._id,
  │     lastSessionOpenedAt: Date.now()
  │   })
  └─► res.json({ success, session })
  │
  ▼
card displays "Session Active" with pulsing green dot
```

### Session Close Flow

```
User clicks "Close Session" on POSTerminalCard
  │
  ▼
posAPI.closeSession(configId, { closingBalance })
  │
  ▼
POST /api/pos/configs/:id/session/close (protect + authorize('manager','cashier'))
  ├─► Find open session via POSConfig.currentSessionId
  ├─► Session.findByIdAndUpdate(sessionId, {
  │     status: 'closed',
  │     closedAt: Date.now(),
  │     closingBalance,
  │     closedBy: req.user._id
  │   })
  ├─► POSConfig.findByIdAndUpdate(id, {
  │     currentSessionId: null,
  │     lastClosingSaleAmount: closingBalance
  │   })
  └─► res.json({ success, session })
  │
  ▼
card switches back to "Open Session" button
```

### Payment Method Configuration Flow

```
User selects a terminal card
  │
  ▼
PaymentMethodConfigPanel opens in sidebar
  ├─► Shows current toggles from config.paymentMethods
  ├─► User toggles cash/digital/QR
  ├─► If QR enabled → UPI ID input appears
  │
  ▼
posAPI.updateConfig(configId, { paymentMethods: {...}, upiId })
  │
  ▼
PUT /api/pos/configs/:id (protect + authorize('manager'))
  ├─► Validate: if qrPayment enabled, upiId required
  ├─► POSConfig.findByIdAndUpdate(id, body, { new: true })
  └─► res.json({ success, config })
  │
  ▼
parent state updates, panel shows saved confirmation
```

---

## 3. Server — POSConfig Model

**File:** `server/models/POSConfig.js`  
**Collection:** `posconfigs`

### Schema Definition

```javascript
{
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
    maxLength: 50
  },

  paymentMethods: {
    cash:       { type: Boolean, default: true  },  // Cash is ON by default
    digital:    { type: Boolean, default: false },  // Card/digital OFF by default
    qrPayment:  { type: Boolean, default: false },  // UPI/QR OFF by default
  },

  upiId: {
    type: String,
    trim: true,
    default: '',
  },

  currentSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null,
  },

  isFloorPlanEnabled: {
    type: Boolean,
    default: false,   // Floor plan is OFF by default, manager must enable
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  lastSessionOpenedAt:   { type: Date, default: null },
  lastClosingSaleAmount: { type: Number, default: 0 },

  timestamps: true    // createdAt, updatedAt
}
```

### Key Design Decisions

- **`currentSessionId` as ObjectId ref** — populated in `GET /api/pos/configs` so the client can check `config.currentSessionId.status === 'open'` to determine active session state.
- **Default payment** — only `cash: true` by default. Manager must explicitly enable digital/QR.
- **`isFloorPlanEnabled` default false** — floor plan feature is opt-in per terminal.
- **`lastClosingSaleAmount`** — stored on config for quick access in the card UI, updated when session is closed with `closingBalance`.
- **Soft delete via `isActive`** — configs are not deleted from DB.

---

## 4. Server — Session Model

**File:** `server/models/Session.js`  
**Collection:** `sessions`

### Schema Definition

```javascript
{
  posConfig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'POSConfig',
    required: true
  },

  openedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },

  openingBalance: { type: Number, default: 0 },
  closingBalance:  { type: Number, default: 0 },
  closedAt:        { type: Date,   default: null },

  // AGGREGATE FIELDS — currently never updated by payment/order routes
  totalSales:  { type: Number, default: 0 },
  orderCount:  { type: Number, default: 0 },

  timestamps: true    // createdAt = session open time
}
```

### Critical Gap

`totalSales` and `orderCount` are initialized to `0` and **never updated anywhere** in the current codebase. When a payment is created (`POST /api/payments`), the route does NOT:
- Find the associated session
- Increment `session.totalSales += payment.amount`
- Increment `session.orderCount += 1`

This means session reporting shows `₹0` for all-time sales regardless of actual payment activity.

**Fix required:**
```javascript
// In POST /api/payments handler, after saving payment:
await Session.findByIdAndUpdate(
  activeSessionId,
  { $inc: { totalSales: payment.amount, orderCount: 1 } }
);
```

---

## 5. Server — POS Routes (API Reference)

**File:** `server/routes/pos.js`  
**Mount:** `app.use('/api/pos', posRoutes)`

### GET /api/pos/configs

**Access:** `protect` + `authorize('manager', 'cashier')`

Returns all active POS terminal configurations, with `currentSessionId` populated.

```javascript
const configs = await POSConfig.find({ isActive: true })
  .populate('currentSessionId', 'status openedBy openingBalance createdAt')
  .sort({ createdAt: -1 });
```

**Response (200):**
```json
{
  "success": true,
  "configs": [
    {
      "_id": "...",
      "name": "Counter 1",
      "paymentMethods": { "cash": true, "digital": false, "qrPayment": false },
      "upiId": "",
      "currentSessionId": {
        "_id": "...",
        "status": "open",
        "openedBy": "...",
        "openingBalance": 500,
        "createdAt": "2026-04-04T10:30:00Z"
      },
      "isFloorPlanEnabled": true,
      "lastSessionOpenedAt": "2026-04-04T10:30:00Z",
      "lastClosingSaleAmount": 24500,
      "isActive": true
    }
  ]
}
```

---

### POST /api/pos/configs

**Access:** `protect` + `authorize('manager')`  
**Body:** `{ name: string }`

**Validation:**
- `name` required, non-empty

**Logic:**
1. Check for existing config with same name (case-insensitive regex): `409 'Terminal with this name already exists'`
2. `POSConfig.create({ name })`
3. `201 { success, config }`

---

### PUT /api/pos/configs/:id

**Access:** `protect` + `authorize('manager')`  
**Body:** `{ name?, paymentMethods?: { cash, digital, qrPayment }, upiId?, isFloorPlanEnabled? }`

**Logic:**
1. Find config by ID
2. If `paymentMethods.qrPayment === true` and `!upiId` → `400 'UPI ID required when QR payment is enabled'`
3. `POSConfig.findByIdAndUpdate(id, body, { new: true, runValidators: true })`
4. `200 { success, config }`

---

### DELETE /api/pos/configs/:id

**Access:** `protect` + `authorize('manager')`

**Logic:**
1. Check if session is currently open → `400 'Cannot delete terminal with active session'`
2. `POSConfig.findByIdAndUpdate(id, { isActive: false })` — soft delete
3. `200 { success, message: 'Terminal deactivated' }`

---

### POST /api/pos/configs/:id/session/open

**Access:** `protect` + `authorize('manager', 'cashier')`  
**Body:** `{ openingBalance?: number }` (default 0)

**Logic:**
1. `POSConfig.findById(id).populate('currentSessionId')`
2. If `config.currentSessionId?.status === 'open'` → `400 'Session already open'`
3. `session = Session.create({ posConfig: id, openedBy: req.user._id, status: 'open', openingBalance })`
4. `POSConfig.findByIdAndUpdate(id, { currentSessionId: session._id, lastSessionOpenedAt: new Date() })`
5. `200 { success, session }`

---

### POST /api/pos/configs/:id/session/close

**Access:** `protect` + `authorize('manager', 'cashier')`  
**Body:** `{ closingBalance?: number }` (default 0)

**Logic:**
1. Find config with populated session
2. If no open session → `400 'No active session to close'`
3. `Session.findByIdAndUpdate(sessionId, { status: 'closed', closedAt: new Date(), closingBalance, closedBy: req.user._id })`
4. `POSConfig.findByIdAndUpdate(id, { currentSessionId: null, lastClosingSaleAmount: closingBalance })`
5. `200 { success, session }`

---

### GET /api/pos/configs/:id/sessions

**Access:** `protect` + `authorize('manager', 'cashier')`

Returns paginated session history for a terminal, newest first.

```javascript
const sessions = await Session.find({ posConfig: id })
  .populate('openedBy', 'fullName role')
  .populate('closedBy', 'fullName role')
  .sort({ createdAt: -1 })
  .limit(20);
```

**Response (200):**
```json
{
  "success": true,
  "sessions": [
    {
      "_id": "...",
      "status": "closed",
      "openingBalance": 500,
      "closingBalance": 25000,
      "totalSales": 0,
      "orderCount": 0,
      "openedBy": { "fullName": "Jane Smith", "role": "cashier" },
      "closedBy": { "fullName": "Jane Smith", "role": "cashier" },
      "createdAt": "2026-04-04T10:30:00Z",
      "closedAt": "2026-04-04T18:45:00Z"
    }
  ]
}
```

---

## 6. Client — POSConfigurationPage

**File:** `client/src/pages/pos/POSConfigurationPage.jsx`  
**Route:** `/pos/config`  
**Access:** manager, cashier

### Layout

```
┌─────────────────────────────────┬───────────────────────────┐
│  TopOperationsNav               │                           │
├─────────────────────────────────┤                           │
│  "POS Terminals" heading        │  PaymentMethodConfigPanel │
│  [+ New Terminal] (manager only)│  (appears when a card is  │
│                                 │   selected)               │
│  ┌──────┐ ┌──────┐ ┌──────┐   │                           │
│  │ Card │ │ Card │ │ Card │   │                           │
│  └──────┘ └──────┘ └──────┘   │                           │
└─────────────────────────────────┴───────────────────────────┘
```

On mobile the panel slides in as an overlay.

### State

```javascript
const [configs, setConfigs]             = useState([]);
const [selectedConfig, setSelectedConfig] = useState(null);
const [loading, setLoading]             = useState(true);
const [showCreateModal, setShowCreateModal] = useState(false);
```

### Data Fetching

```javascript
useEffect(() => {
  posAPI.getConfigs()
    .then(res => {
      setConfigs(res.data.configs);
      // Auto-select first terminal
      if (res.data.configs.length > 0) setSelectedConfig(res.data.configs[0]);
    })
    .catch(() => toast.error('Failed to load terminals'))
    .finally(() => setLoading(false));
}, []);
```

### Session Management Handlers

```javascript
const handleOpenSession = async (configId) => {
  try {
    const res = await posAPI.openSession(configId, { openingBalance: 0 });
    setConfigs(prev => prev.map(c =>
      c._id === configId ? { ...c, currentSessionId: res.data.session } : c
    ));
    toast.success('Session opened successfully');
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to open session');
  }
};

const handleCloseSession = async (configId) => {
  try {
    await posAPI.closeSession(configId, { closingBalance: 0 });
    setConfigs(prev => prev.map(c =>
      c._id === configId ? { ...c, currentSessionId: null } : c
    ));
    toast.success('Session closed');
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to close session');
  }
};
```

### Terminal Creation

When `CreatePOSTerminalModal` calls `onCreated(config)`:

```javascript
const handleTerminalCreated = (newConfig) => {
  setConfigs(prev => [newConfig, ...prev]);
  setSelectedConfig(newConfig);
  setShowCreateModal(false);
  toast.success(`Terminal "${newConfig.name}" created`);
};
```

### Payment Method Save

When `PaymentMethodConfigPanel` calls `onSave(updatedConfig)`:

```javascript
const handleConfigUpdate = (updatedConfig) => {
  setConfigs(prev => prev.map(c =>
    c._id === updatedConfig._id ? updatedConfig : c
  ));
  setSelectedConfig(updatedConfig);
};
```

### Rendering Logic

- If `loading` → spinning placeholder cards
- If `configs.length === 0` and `loading` done → `<EmptyPOSState isManager={isManager} />`
- Otherwise → grid of `<POSTerminalCard>` components + `<PaymentMethodConfigPanel>` sidebar
- `[+ New Terminal]` button only visible when `user.role === 'manager'`

---

## 7. Client — POSTerminalCard

**File:** `client/src/components/pos/POSTerminalCard.jsx`

A card representing a single POS terminal configuration. Communicates back to the page via callback props.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `config` | object | The full POSConfig document (including populated `currentSessionId`) |
| `isSelected` | boolean | Whether this card is highlighted (selected for config panel) |
| `onSelect` | function | Called when user clicks the card body |
| `onOpenSession` | function | Called when "Open Session" button is clicked |
| `onCloseSession` | function | Called when "Close Session" button is clicked |
| `isManager` | boolean | Controls visibility of Settings menu item |
| `delay` | number | Animation delay in ms for staggered entrance |

### Session Status Detection

```javascript
const hasActiveSession = config.currentSessionId && config.currentSessionId.status === 'open';
const sessionStatus = hasActiveSession ? 'active' : config.lastSessionOpenedAt ? 'ready' : 'new';
```

| `sessionStatus` | Badge label | Badge color |
|----------------|-------------|-------------|
| `active` | Session Active | emerald (green) with pulsing dot |
| `ready` | Ready | amber (yellow) |
| `new` | New Terminal | blue |

### Overflow Menu (⋯ button)

Opens a dropdown with 3 options:
1. **Settings** (manager only) → navigate to `/pos/config/:id/settings` (route not yet defined)
2. **Kitchen Display** → navigate to `/kitchen` (placeholder)
3. **Customer Display** → navigate to `/customer`

### Action Button

The bottom section renders either:
- **"Open Session"** → `bg-gradient cafe-500→cafe-600`, calls `onOpenSession()`
- **"Close Session"** → `bg-red-50 text-red-600`, calls `onCloseSession()`

Based purely on `hasActiveSession` flag.

### Payment Method Chips

Below session meta, shows enabled payment method badges:

```javascript
const enabledPayments = [
  config.paymentMethods?.cash      && 'Cash',
  config.paymentMethods?.digital   && 'Digital',
  config.paymentMethods?.qrPayment && 'UPI',
].filter(Boolean);
```

Rendered as grey pill badges next to a ⚡ icon.

---

## 8. Client — CreatePOSTerminalModal

**File:** `client/src/components/pos/CreatePOSTerminalModal.jsx`

A centered modal overlay with backdrop blur. Opens when the manager clicks "+ New Terminal".

### Props

| Prop | Type | Description |
|------|------|-------------|
| `onClose` | function | Called on backdrop click, Cancel button, or successful create |
| `onCreated` | function | Called with newly-created config object on success |

### Behavior

- Locks page scroll with `document.body.style.overflow = 'hidden'` on mount; restores on unmount
- Autofocuses the name field via `inputRef.current?.focus()`
- Client validation: non-empty and length ≥ 2
- On submit: calls `posAPI.createConfig({ name })`, on success calls `onCreated(res.data.config)`
- Shows inline error on API failure (e.g., duplicate name collision from server)
- Loading state shows "Creating..." with spinner `<Loader2 className="animate-spin" />`
- Submit button disabled when name is empty or loading

### Input Constraints

- `minLength: 2`
- Placeholder: `"e.g., Odoo Cafe, Drive-Thru, Counter 2"`
- Terminal name identifies the terminal across all sessions and reports

---

## 9. Client — EmptyPOSState

**File:** `client/src/components/pos/EmptyPOSState.jsx`

Shown when `configs.length === 0` and loading is complete.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `onCreateClick` | function | Called when "Create First Terminal" button is clicked |
| `isManager` | boolean | If `false`, hides the create button and shows a message suggesting the user contact their manager |

### Text Variants

- **Manager:** "Create your first POS terminal to start managing orders, payments, and sessions."
- **Non-manager:** "No POS terminals have been configured yet. Ask your manager to set up the first terminal."

---

## 10. Client — PaymentMethodConfigPanel

**File:** `client/src/components/pos/PaymentMethodConfigPanel.jsx`

A sidebar panel that appears when a terminal card is selected. Allows managers to toggle payment methods and save changes.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `config` | object | The currently selected POSConfig document |
| `onSave` | function | Called with the updated config object after successful save |
| `isManager` | boolean | If `false`, all controls are disabled (read-only) |

### Internal State

```javascript
const [methods, setMethods] = useState({
  cash:      config.paymentMethods?.cash      ?? true,
  digital:   config.paymentMethods?.digital   ?? false,
  qrPayment: config.paymentMethods?.qrPayment ?? false,
});
const [upiId, setUpiId]   = useState(config.upiId || '');
const [isDirty, setIsDirty] = useState(false);
const [saving, setSaving]   = useState(false);
```

`isDirty` is computed by comparing current `methods` and `upiId` against original `config` values. The save button only appears when `isDirty && isManager`.

### Toggle Component

Each payment method is a row with:
- Icon + label
- Description text
- Toggle switch

The toggle uses dynamic Tailwind class construction:

```javascript
// ⚠️ PRODUCTION BUILD RISK
const colors = {
  cash:      { bg: 'bg-emerald-50',  border: 'border-emerald-200', icon: 'text-emerald-600' },
  digital:   { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: 'text-blue-600'    },
  qrPayment: { bg: 'bg-violet-50',  border: 'border-violet-200',  icon: 'text-violet-600'  },
};
```

These are defined as full static strings so Tailwind can detect them — however, review any part where class names are built with string interpolation, e.g.:

```javascript
`border-${color}-300`  // ⚠️ this type of dynamic construction may be purged
```

### UPI ID Field

```jsx
{methods.qrPayment && (
  <div className="mt-3 ml-4">
    <label className="text-xs font-semibold text-stone-600">UPI ID</label>
    <input
      type="text"
      value={upiId}
      onChange={(e) => { setUpiId(e.target.value); setIsDirty(true); }}
      placeholder="yourname@upi"
      disabled={!isManager}
      className="auth-input mt-1"
    />
  </div>
)}
```

### Save Handler

```javascript
const handleSave = async () => {
  setSaving(true);
  try {
    const res = await posAPI.updateConfig(config._id, {
      paymentMethods: methods,
      upiId: methods.qrPayment ? upiId : '',
    });
    onSave(res.data.config);
    setIsDirty(false);
    toast.success('Payment settings saved');
  } catch (err) {
    toast.error(err.response?.data?.message || 'Save failed');
  } finally {
    setSaving(false);
  }
};
```

---

## 11. Client — TopOperationsNav

**File:** `client/src/components/pos/TopOperationsNav.jsx`

The primary navigation bar for all manager/cashier pages (`/pos/config`, `/operations`, `/catalog`, `/dashboard`).

### Navigation Items

```javascript
const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard',      icon: LayoutGrid  },
  { label: 'POS Config', path: '/pos/config',    icon: Settings    },
  { label: 'Catalog',   path: '/catalog',        icon: Package     },
  { label: 'Operations', path: '/operations',    icon: ShoppingBag },
  { label: 'Reporting', path: '/pos/reporting',  icon: BarChart3, badge: 'Soon' },
];
```

"Reporting" is marked with a `'Soon'` badge and the click handler is disabled:

```javascript
onClick={() => !item.badge && navigate(item.path)}
```

### Active State Detection

```javascript
const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
```

Active tabs show `text-cafe-700 bg-cafe-50` and an underline `div` with `h-0.5 bg-cafe-500`.

### User Dropdown

A dropdown menu (right side) with:
- User avatar (first letter of name)
- Full name + email in dropdown header
- "My Account" → navigate to `/dashboard`
- Divider
- "Sign out" → calls `logout()` + navigate to `/login`

Clicking outside closes the dropdown via a fixed full-screen transparent overlay:

```jsx
<div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `user` | object | The current authenticated user (from AuthContext) |

---

## 12. Client — Navbar

**File:** `client/src/components/layout/Navbar.jsx`

An alternate sticky header used on the Floor Management page and potentially other pages.

### Differences from TopOperationsNav

| Feature | Navbar | TopOperationsNav |
|---------|--------|-----------------|
| Design | Link-based nav | Button-based nav |
| User menu | Simple avatar + logout button | Dropdown with user info |
| Nav items | Dashboard, Config, Operations, Catalog, Floor Plan | Dashboard, POS Config, Catalog, Operations, Reporting |
| Mobile | Hidden on `sm:` | Hidden on `md:` |

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | `'Odoo POS Cafe'` | Brand name shown in header |
| `subtitle` | string | `''` | Subtitle (defaults to `"${user.role} workspace"`) |

### Logout

Uses a simple icon button (LogOut icon from lucide-react):

```jsx
<button onClick={handleLogout} title="Secure Logout">
  <LogOut className="w-4 h-4" />
</button>
```

---

## 13. State Management and Data Flow

The page-level state lives entirely in `POSConfigurationPage`. No global store (Redux/Zustand) is used — React local state + context only.

### Config Selection and Panel Sync

```
User clicks terminal card
    │
    ▼
onSelect() → setSelectedConfig(config)
    │
    ▼
PaymentMethodConfigPanel re-renders with new config
    ├─► useEffect on config prop change reinitializes local state
    └─► isDirty resets to false
```

When `POSConfigurationPage` receives an updated config from `PaymentMethodConfigPanel.onSave`:

```javascript
setConfigs(prev => prev.map(c => c._id === updatedConfig._id ? updatedConfig : c));
setSelectedConfig(updatedConfig);
```

This ensures the card immediately reflects the new payment method chips without a refetch.

### Session State Sync

After open/close session, the config list is updated in-place:

```javascript
// After open:
setConfigs(prev => prev.map(c =>
  c._id === configId ? { ...c, currentSessionId: { status: 'open', ...sessionData } } : c
));

// After close:
setConfigs(prev => prev.map(c =>
  c._id === configId ? { ...c, currentSessionId: null } : c
));
```

The `POSTerminalCard` immediately shows the correct button and status badge.

---

## 14. Known Issues and Gaps

### Issue 1: Session Totals Never Updated (Critical)

**Symptom:** `Session.totalSales` and `Session.orderCount` are always `0`.  
**Cause:** `POST /api/payments` route creates a `Payment` document but never touches `Session`.  
**Impact:** Session closing reports show ₹0 in sales regardless of actual activity.

**Fix:**
```javascript
// server/routes/payments.js — inside POST / handler
// After payment.save():
if (activeSessionId) {
  await Session.findByIdAndUpdate(activeSessionId, {
    $inc: { totalSales: amount, orderCount: 1 }
  });
}
```

---

### Issue 2: Dynamic Tailwind Classes May Be Purged (Medium)

**Symptom:** In production (`npm run build`), some colored borders/backgrounds in `PaymentMethodConfigPanel` may disappear.  
**Cause:** Tailwind's JIT engine scans source for complete class strings. If any class is built via string interpolation (e.g., `` `bg-${color}-50` ``), the class won't appear in the scan and gets removed from the bundle.

**Fix (Option A):** Refactor to use static class strings:
```javascript
const colorMap = {
  cash:      { bg: 'bg-emerald-50', border: 'border-emerald-200' },
  digital:   { bg: 'bg-blue-50',    border: 'border-blue-200'    },
  qrPayment: { bg: 'bg-violet-50',  border: 'border-violet-200'  },
};
```

**Fix (Option B):** Add a safelist in `tailwind.config.js`:
```javascript
safelist: [
  { pattern: /bg-(emerald|blue|violet)-(50|100|200)/ },
  { pattern: /border-(emerald|blue|violet)-(100|200|300)/ },
  { pattern: /text-(emerald|blue|violet)-(600|700)/ },
]
```

---

### Issue 3: Settings Route Not Defined

**Symptom:** Overflow menu "Settings" navigates to `/pos/config/:id/settings` which has no route defined.  
**Impact:** 404 / blank page when clicking Settings from terminal card.  
**Fix:** Either add a `/pos/config/:id/settings` route with a settings page, or remove the menu item.

---

### Issue 4: Kitchen Display Link

**Symptom:** Overflow menu "Kitchen Display" navigates to `/kitchen` which renders `<Dashboard />` (placeholder).  
**Impact:** Kitchen staff see the standard dashboard, not a real order queue display.  
**Fix:** Build a `KitchenDisplayPage` with real-time order queue (WebSocket or polling).

---

*Next: [Module 3 — Floor & Table Management](./module-3-floor-table.md)*
