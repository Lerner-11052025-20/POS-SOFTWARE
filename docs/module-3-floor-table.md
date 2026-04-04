# Module 3 — Floor & Table Management

> **Back to index:** [README.md](./README.md)  
> **Domain:** Floors, tables, seating blueprints, floor plan toggle, customer table selection  

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Architecture and Data Flow](#2-architecture-and-data-flow)
3. [Server — Floor Model](#3-server--floor-model)
4. [Server — Table Model](#4-server--table-model)
5. [Server — Floor Routes (API Reference)](#5-server--floor-routes-api-reference)
6. [Server — Table Routes (API Reference)](#6-server--table-routes-api-reference)
7. [Client — FloorManagementPage](#7-client--floormanagementpage)
8. [Client — FloorPlanToggleCard](#8-client--floorplantoggiecard)
9. [Client — FloorFormModal](#9-client--floorformmodal)
10. [Client — TablesManagementList](#10-client--tablesmanagementlist)
11. [Client — FloorPreviewPanel](#11-client--floorpreviewpanel)
12. [Client — POSTerminalFloorViewPage](#12-client--posterminaifloorviewpage)
13. [Data Relationships and Hierarchy](#13-data-relationships-and-hierarchy)
14. [Known Issues and Gaps](#14-known-issues-and-gaps)

---

## 1. Module Overview

The Floor & Table Management module handles the physical space configuration of the cafe:

- **Floors** are named areas (e.g., "Ground Floor", "Garden", "VIP Hall") scoped to a specific POS terminal
- **Tables** belong to a floor and have a table number + seat count
- **Floor plan** mode is opt-in per terminal via the `isFloorPlanEnabled` toggle
- **Seating blueprint** gives a visual preview of all active/inactive tables in a grid
- **POSTerminalFloorViewPage** is the customer/cashier interface for selecting a table before placing an order

### Files in This Module

| Layer | File | Responsibility |
|-------|------|----------------|
| Server Model | `server/models/Floor.js` | Floor schema with posConfig ref |
| Server Model | `server/models/Table.js` | Table schema with floor ref |
| Server Route | `server/routes/floors.js` | Floor CRUD with cascade delete |
| Server Route | `server/routes/tables.js` | Table CRUD with bulk ops |
| Client Page | `client/src/pages/pos/FloorManagementPage.jsx` | Master floor management UI |
| Client Component | `client/src/components/floor/FloorPlanToggleCard.jsx` | Terminal selector + enable/disable toggle |
| Client Component | `client/src/components/floor/FloorFormModal.jsx` | Create/edit floor modal |
| Client Component | `client/src/components/floor/TablesManagementList.jsx` | Table CRUD per floor |
| Client Component | `client/src/components/floor/FloorPreviewPanel.jsx` | Visual seating blueprint |
| Client Page | `client/src/pages/pos/POSTerminalFloorViewPage.jsx` | Customer/cashier table selection |

---

## 2. Architecture and Data Flow

### Floor Creation Flow

```
Manager clicks "+ Add Floor" on FloorManagementPage
  │
  ▼
FloorFormModal opens (create mode)
  ├─► User types floor name
  ├─► Client validation: name ≥ 2 chars
  │
  ▼
floorsAPI.create({ name, posConfig: selectedConfig._id })
  │
  ▼
POST /api/floors (protect + authorize('manager'))
  ├─► Name + posConfig unique index check
  ├─► Reactivate soft-deleted floor if name matches (upsert-like logic)
  ├─► OR create new Floor document
  └─► res.json({ success, floor })
  │
  ▼
onSuccess() → refetch floors list for current config
```

### Floor Delete Flow (with Cascade)

```
Manager clicks delete on a floor
  │
  ▼
floorsAPI.delete(floorId)
  │
  ▼
DELETE /api/floors/:id (protect + authorize('manager'))
  ├─► Floor.findByIdAndUpdate(id, { isActive: false })  ← soft delete
  └─► Table.updateMany({ floor: id }, { isActive: false })  ← cascade to tables
```

### Table Creation Flow

```
Manager types table number + seats in TablesManagementList inline form
  │
  ▼
tablesAPI.create({ tableNumber, floor: floorId, seatsCount })
  │
  ▼
POST /api/tables (protect + authorize('manager'))
  ├─► {tableNumber, floor} unique index check → 409 if duplicate
  ├─► Table.create(...)
  └─► res.json({ success, table })
  │
  ▼
FloorPreviewPanel re-renders with new table
```

### Table Bulk Duplicate Flow

```
Manager clicks "Duplicate Selected" in TablesManagementList
  ├─► Selects a set of table IDs via checkboxes
  │
  ▼
tablesAPI.bulkDuplicate({ tableIds: [...] })
  │
  ▼
POST /api/tables/bulk/duplicate (protect + authorize('manager'))
  ├─► Find source tables
  ├─► For each: increment tableNumber to find next available
  ├─► Table.insertMany(clones)
  └─► res.json({ success, tables: newTables })
```

### Customer Table Selection Flow

```
Customer/cashier opens /customer (POSTerminalFloorViewPage)
  │
  ├─► Fetch all POS configs (posAPI.getConfigs)
  ├─► Select config from dropdown
  ├─► Fetch floors for this config (floorsAPI.getByConfig)
  ├─► Fetch tables for selected floor (tablesAPI.getByFloor)
  │
  ▼
User clicks a table card
  │
  ├─► setSelectedTable(table)
  ├─► Floating bar appears at bottom: "Table {number} selected — Proceed to Menu"
  │
  ▼
navigate('/customer/menu', { state: { table, config } })
  │
  ▼
CustomerMenuPage (note: currently ignores the passed table state)
```

---

## 3. Server — Floor Model

**File:** `server/models/Floor.js`  
**Collection:** `floors`

### Schema Definition

```javascript
{
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
    maxLength: 50,
  },

  posConfig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'POSConfig',
    required: true,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  timestamps: true   // createdAt, updatedAt
}
```

### Compound Unique Index

```javascript
FloorSchema.index({ name: 1, posConfig: 1 }, { unique: true });
```

A floor name is unique **per terminal** (posConfig). The same name can exist on different terminals ("Ground Floor" on Counter 1 AND Counter 2 are separate floors). This is enforced at the database level.

### Soft Delete

`isActive: false` is used instead of physical deletion. When a floor is deactivated, its tables are also deactivated (via cascade in the route).

---

## 4. Server — Table Model

**File:** `server/models/Table.js`  
**Collection:** `tables`

### Schema Definition

```javascript
{
  tableNumber: {
    type: Number,
    required: true,
    min: 1,
  },

  floor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Floor',
    required: true,
  },

  seatsCount: {
    type: Number,
    required: true,
    min: 1,
    max: 20,
    default: 4,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  timestamps: true
}
```

### Compound Unique Index

```javascript
TableSchema.index({ tableNumber: 1, floor: 1 }, { unique: true });
```

Table numbers are unique **per floor**. Table 1 can exist on "Ground Floor" AND on "Garden" (they're different floors). The combination `(tableNumber, floor)` must be unique.

### `seatsCount` Range

- Minimum: 1 seat
- Maximum: 20 seats
- Default: 4 seats
- The `FloorPreviewPanel` renders up to 4 seat indicators per table (capped at `Math.min(4, seatsCount)`)

---

## 5. Server — Floor Routes (API Reference)

**File:** `server/routes/floors.js`  
**Mount:** `app.use('/api/floors', floorRoutes)`

### GET /api/floors

**Access:** `protect` + `authorize('manager', 'cashier')`  
**Query:** `?posConfig=<configId>` (optional filter)

```javascript
const query = { isActive: true };
if (req.query.posConfig) query.posConfig = req.query.posConfig;
const floors = await Floor.find(query).sort({ name: 1 });
```

**Response (200):**
```json
{
  "success": true,
  "floors": [
    { "_id": "...", "name": "Garden", "posConfig": "...", "isActive": true },
    { "_id": "...", "name": "Ground Floor", "posConfig": "...", "isActive": true }
  ]
}
```

---

### POST /api/floors

**Access:** `protect` + `authorize('manager')`  
**Body:** `{ name: string, posConfig: string }`

**Reactivate-or-Create logic:**

```javascript
// Check for soft-deleted floor with same name + posConfig
const existing = await Floor.findOne({
  name: { $regex: new RegExp(`^${name}$`, 'i') },
  posConfig,
  isActive: false,
});

if (existing) {
  existing.isActive = true;
  await existing.save();
  return res.json({ success: true, floor: existing, reactivated: true });
}

// Create new
const floor = await Floor.create({ name, posConfig });
res.status(201).json({ success: true, floor });
```

If a previously deleted floor with the same name exists, it is **reactivated** instead of creating a duplicate. This is a safe idempotent behavior.

---

### PUT /api/floors/:id

**Access:** `protect` + `authorize('manager')`  
**Body:** `{ name?: string }`

```javascript
const floor = await Floor.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });
```

Returns `404` if floor not found.

---

### DELETE /api/floors/:id

**Access:** `protect` + `authorize('manager')`

**Cascade delete logic:**

```javascript
await Floor.findByIdAndUpdate(id, { isActive: false });
// Cascade to all tables on this floor
await Table.updateMany({ floor: id }, { isActive: false });
res.json({ success: true, message: 'Floor and its tables deactivated' });
```

Note: this soft-deletes the floor and all its tables atomically in sequence (not in a transaction — MongoDB multi-document operations without session are not atomic).

---

## 6. Server — Table Routes (API Reference)

**File:** `server/routes/tables.js`  
**Mount:** `app.use('/api/tables', tableRoutes)`

### GET /api/tables

**Access:** `protect` + `authorize('manager', 'cashier', 'customer')`  
**Query:** `?floor=<floorId>` (required in most client calls)

```javascript
const query = { isActive: true };
if (req.query.floor) query.floor = req.query.floor;
const tables = await Table.find(query).sort({ tableNumber: 1 });
```

Returns tables sorted by table number ascending.

---

### POST /api/tables

**Access:** `protect` + `authorize('manager')`  
**Body:** `{ tableNumber: number, floor: string, seatsCount?: number }`

**Validation:**
- `tableNumber` required, must be positive integer
- `floor` required, valid ObjectId

**Duplicate check:** The compound unique index `( tableNumber, floor )` enforces uniqueness at DB level. Mongoose will throw a `11000` duplicate key error which is caught and returned as `409`.

---

### PUT /api/tables/:id

**Access:** `protect` + `authorize('manager')`  
**Body:** `{ tableNumber?, seatsCount?, isActive? }`

```javascript
const table = await Table.findByIdAndUpdate(id, body, { new: true, runValidators: true });
```

Can be used to toggle `isActive` (enable/disable a specific table without deleting it).

---

### POST /api/tables/bulk/duplicate

**Access:** `protect` + `authorize('manager')`  
**Body:** `{ tableIds: string[], floor: string }`

**Logic:**

```javascript
const sourceTables = await Table.find({ _id: { $in: tableIds } });
const existingNumbers = await Table.find({ floor }).select('tableNumber');
const usedNumbers = new Set(existingNumbers.map(t => t.tableNumber));

const newTables = [];
for (const src of sourceTables) {
  let nextNumber = Math.max(...usedNumbers) + 1;
  while (usedNumbers.has(nextNumber)) nextNumber++;
  usedNumbers.add(nextNumber);
  newTables.push({ tableNumber: nextNumber, floor: src.floor, seatsCount: src.seatsCount });
}

const created = await Table.insertMany(newTables);
res.json({ success: true, tables: created });
```

Copies selected tables with auto-incremented table numbers, preserving seat counts.

---

### DELETE /api/tables/bulk

**Access:** `protect` + `authorize('manager')`  
**Body:** `{ tableIds: string[] }`

```javascript
await Table.updateMany({ _id: { $in: tableIds } }, { isActive: false });
res.json({ success: true, message: `${tableIds.length} tables deactivated` });
```

Soft-deletes multiple tables in a single operation.

---

## 7. Client — FloorManagementPage

**File:** `client/src/pages/pos/FloorManagementPage.jsx`  
**Route:** `/pos/floor`  
**Access:** manager, cashier

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Navbar (sticky top)                                     │
├──────────────┬──────────────────────────────────────────┤
│              │                                           │
│ LEFT COLUMN  │  RIGHT COLUMN                             │
│              │                                           │
│ FloorPlan    │  Floor Tab List:                         │
│ ToggleCard   │  [Floor 1] [Floor 2] [+ Add Floor]       │
│              │                                           │
│ Floor List   │  (selected floor):                        │
│              │    FloorsPreviewPanel  TablesManagementList│
│              │                                           │
│              │                                           │
└──────────────┴──────────────────────────────────────────┘
```

On mobile the left column collapses and everything is vertically stacked.

### State

```javascript
const [configs, setConfigs]             = useState([]);
const [selectedConfig, setSelectedConfig] = useState(null);
const [floors, setFloors]               = useState([]);
const [selectedFloor, setSelectedFloor] = useState(null);
const [tables, setTables]               = useState([]);
const [showFloorModal, setShowFloorModal] = useState(false);
const [editingFloor, setEditingFloor]   = useState(null);
const [loading, setLoading]             = useState(true);
```

### Data Fetching Chain

```
1. useEffect (mount) → posAPI.getConfigs()
    │  setConfigs, setSelectedConfig(first)
    │
    ▼
2. useEffect([selectedConfig]) → floorsAPI.getByConfig(selectedConfig._id)
    │  setFloors, setSelectedFloor(first)
    │
    ▼
3. useEffect([selectedFloor]) → tablesAPI.getByFloor(selectedFloor._id)
    │  setTables
```

Three chained effects ensure data loads in the correct order: terminals → floors → tables.

### Floor Plan Toggle Handler

```javascript
const handleFloorPlanToggle = async (enabled) => {
  try {
    const res = await posAPI.updateConfig(selectedConfig._id, { isFloorPlanEnabled: enabled });
    setConfigs(prev => prev.map(c =>
      c._id === selectedConfig._id ? res.data.config : c
    ));
    setSelectedConfig(res.data.config);
    toast.success(enabled ? 'Floor plan enabled' : 'Floor plan disabled');
  } catch {
    toast.error('Failed to update floor plan setting');
  }
};
```

### Floor CRUD Callbacks

```javascript
// After FloorFormModal succeeds (create or edit):
const handleFloorSuccess = async () => {
  setShowFloorModal(false);
  setEditingFloor(null);
  // Refetch floors for current config
  const res = await floorsAPI.getByConfig(selectedConfig._id);
  setFloors(res.data.floors);
  if (!selectedFloor && res.data.floors.length > 0) {
    setSelectedFloor(res.data.floors[0]);
  }
};

// Delete floor:
const handleDeleteFloor = async (floorId) => {
  await floorsAPI.delete(floorId);
  const remaining = floors.filter(f => f._id !== floorId);
  setFloors(remaining);
  setSelectedFloor(remaining[0] || null);
  setTables([]);
};
```

---

## 8. Client — FloorPlanToggleCard

**File:** `client/src/components/floor/FloorPlanToggleCard.jsx`

### Purpose

A card in the left column that serves two functions:
1. **Config selector** — dropdown to switch between POS terminals
2. **Floor plan toggle** — a visual toggle switch to enable/disable the floor plan for the selected terminal

### Props

| Prop | Type | Description |
|------|------|-------------|
| `configs` | array | All POSConfig documents |
| `selectedConfig` | object | Currently active config |
| `onConfigChange` | function | Called with new config ID when dropdown changes |
| `onToggle` | function | Called with `boolean` when toggle is clicked |
| `isManager` | boolean | If false, toggle is disabled (grayed out, `cursor-not-allowed`) |

### Toggle Visual States

```
isFloorPlanEnabled = TRUE:
  Background: bg-emerald-50/50  Border: border-emerald-100
  Text: text-emerald-700 "Floor Plan Profile"
  Toggle: bg-emerald-500, knob translate-x-6

isFloorPlanEnabled = FALSE:
  Background: bg-stone-50  Border: border-stone-200  opacity-80
  Text: text-stone-500
  Toggle: bg-stone-300, knob translate-x-1
```

### Non-manager Behavior

When `!isManager`:
- Toggle button has `disabled` attribute
- Applied classes: `opacity-50 cursor-not-allowed grayscale`
- Tooltip (title) not shown — the visual graying communicates read-only state

---

## 9. Client — FloorFormModal

**File:** `client/src/components/floor/FloorFormModal.jsx`

A modal for creating or editing a floor. Used for both create (no `editingFloor` prop) and edit (with `editingFloor` prop).

### Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | boolean | Controls visibility |
| `onClose` | function | Called to close modal |
| `onSuccess` | function | Called after successful create/update |
| `configId` | string | The posConfig ID (used for create only) |
| `editingFloor` | object \| null | If set, pre-fills the name field for editing |

### Mode Detection

```javascript
// Create mode: editingFloor is null
await floorsAPI.create({ name, posConfig: configId });

// Edit mode: editingFloor is an object
await floorsAPI.update(editingFloor._id, { name });
```

### Validation

```javascript
if (name.trim().length < 2) {
  setError('Floor name must be at least 2 characters');
  return;
}
```

### Styling Notes

- Uses `bg-gradient-to-r from-cafe-500 via-amber-400 to-cafe-500` accent line at top
- Branded language: "Architect Your Floor Plan" (create) / "Refine Your Floor Plan" (edit)
- Submit button: "Finalize Floor" (create) / "Update Entity" (edit)
- Uses `animate-zoom-in` entrance animation

---

## 10. Client — TablesManagementList

**File:** `client/src/components/floor/TablesManagementList.jsx`

The main table CRUD interface within a floor. Renders a list of all tables with inline add, bulk actions, and toggle per row.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `floor` | object | The currently selected floor |
| `tables` | array | All active tables for this floor |
| `onTablesChange` | function | Called with updated tables array after any mutation |
| `isManager` | boolean | Controls edit/delete/add access |

### Internal State

```javascript
const [selected, setSelected]         = useState(new Set());  // selected table IDs
const [addForm, setAddForm]           = useState({ tableNumber: '', seatsCount: 4 });
const [showAddForm, setShowAddForm]   = useState(false);
const [loading, setLoading]           = useState(false);
```

### Add Table Inline Form

```jsx
{showAddForm && (
  <form onSubmit={handleAdd} className="flex items-center gap-3 p-4 bg-cafe-50 rounded-xl border border-cafe-100">
    <input type="number" min="1"
      value={addForm.tableNumber}
      onChange={e => setAddForm(p => ({...p, tableNumber: e.target.value}))}
      placeholder="Table #"
      className="auth-input w-24 text-sm"
      required
    />
    <input type="number" min="1" max="20"
      value={addForm.seatsCount}
      onChange={e => setAddForm(p => ({...p, seatsCount: Number(e.target.value)}))}
      placeholder="Seats"
      className="auth-input w-20 text-sm"
    />
    <button type="submit" className="btn-cafe-sm">Add</button>
    <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
  </form>
)}
```

### Table Row

Each table row shows:
- Checkbox (for bulk selection)
- Table number badge
- Seat count badge (chair icon + number)
- Active/inactive toggle switch
- Delete button (individual, manager only)

### Toggle Active Handler

```javascript
const handleToggleActive = async (tableId, newState) => {
  await tablesAPI.update(tableId, { isActive: newState });
  onTablesChange(tables.map(t => t._id === tableId ? { ...t, isActive: newState } : t));
};
```

### Bulk Actions

Two bulk action buttons appear in the header when `selected.size > 0`:

**Bulk Duplicate:**
```javascript
const handleBulkDuplicate = async () => {
  const res = await tablesAPI.bulkDuplicate({
    tableIds: Array.from(selected),
    floor: floor._id
  });
  onTablesChange([...tables, ...res.data.tables]);
  setSelected(new Set());
  toast.success(`${res.data.tables.length} tables duplicated`);
};
```

**Bulk Delete:**
```javascript
const handleBulkDelete = async () => {
  await tablesAPI.bulkDelete({ tableIds: Array.from(selected) });
  onTablesChange(tables.filter(t => !selected.has(t._id)));
  setSelected(new Set());
  toast.success('Tables removed');
};
```

### Select All / Deselect All

A "Select All" checkbox in the header header toggles all table IDs in/out of the `selected` Set.

---

## 11. Client — FloorPreviewPanel

**File:** `client/src/components/floor/FloorPreviewPanel.jsx`

A visual "seating blueprint" showing all tables in a grid layout. Read-only — no interactions.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `tables` | array | All tables for the selected floor |
| `floorName` | string | Floor name for the subtitle |

### Rendering Logic

- Maximum 15 tables shown in the grid; if more exist, an overflow badge shows `+N` more
- Active tables: white background, emerald border, hover scale-105
- Inactive tables: grey background, grey border, `grayscale` filter
- Each table cell displays:
  - Table number (bold)
  - Up to 4 dot indicators for seats (capped at `Math.min(4, table.seatsCount)`)

```jsx
{tables.slice(0, 15).map((table) => (
  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border-2 ${
    table.isActive
      ? 'bg-white border-emerald-100 text-emerald-800 hover:scale-105'
      : 'bg-stone-100 border-stone-200 text-stone-400 grayscale'
  }`}>
    <span className="text-[10px] font-black">{table.tableNumber}</span>
    <div className="flex gap-0.5 mt-0.5">
      {[...Array(Math.min(4, table.seatsCount))].map((_, i) => (
        <div key={i} className={`w-1 h-1 rounded-full ${table.isActive ? 'bg-emerald-400' : 'bg-stone-300'}`} />
      ))}
    </div>
  </div>
))}
```

### Legend

Below the grid, a simple 2-item legend:
- 🟢 dot = "Available Unit"
- □ square = "Maintenance Mode"

---

## 12. Client — POSTerminalFloorViewPage

**File:** `client/src/pages/pos/POSTerminalFloorViewPage.jsx`  
**Route:** `/customer` and `/pos/terminal/:configId`  
**Access:** manager, cashier, kitchen, customer (all roles)

This is the customer-facing table selection interface. It's also the first screen a customer sees after logging in.

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Header: "Select Your Table"                          │
│  Config dropdown (if multiple terminals)              │
│  Floor tabs: [Ground Floor] [Garden] [VIP Hall]       │
├──────────────────────────────────────────────────────┤
│                                                        │
│  Table Grid:                                           │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │  1  │ │  2  │ │  3  │ │  4  │                  │
│  │🪑🪑│ │🪑🪑│ │     │ │🪑🪑│                  │
│  │ 4s  │ │ 4s  │ │ OFF │ │ 4s  │                  │
│  └─────┘ └─────┘ └─────┘ └─────┘                  │
│                                                        │
├──────────────────────────────────────────────────────┤
│  Floating Bottom Bar (appears when table selected):   │
│  "Table 2 selected — Confirm & Proceed to Menu →"    │
└──────────────────────────────────────────────────────┘
```

### State

```javascript
const [configs, setConfigs]             = useState([]);
const [selectedConfigId, setSelectedConfigId] = useState(null);
const [floors, setFloors]               = useState([]);
const [selectedFloorId, setSelectedFloorId] = useState(null);
const [tables, setTables]               = useState([]);
const [selectedTable, setSelectedTable] = useState(null);
const [loading, setLoading]             = useState(true);
const [activeTab, setActiveTab]         = useState('register'); // 'register' | 'orders'
```

### Data Fetching

Same three-step chain as `FloorManagementPage`:

```javascript
// Step 1: on mount
await posAPI.getConfigs()

// Step 2: when selectedConfigId changes
await floorsAPI.getByConfig(selectedConfigId)

// Step 3: when selectedFloorId changes
await tablesAPI.getByFloor(selectedFloorId)
```

### Table Card Rendering

Each table is a clickable card:

```jsx
<button
  onClick={() => setSelectedTable(table)}
  className={`p-4 rounded-2xl border-2 transition-all text-left ${
    selectedTable?._id === table._id
      ? 'border-cafe-500 bg-cafe-50 shadow-cafe'
      : 'border-stone-200 hover:border-cafe-300 hover:bg-stone-50'
  } ${!table.isActive && 'opacity-40 cursor-not-allowed'}`}
  disabled={!table.isActive}
>
  <div className="text-2xl font-black text-stone-800">T{table.tableNumber}</div>
  <div className="text-xs text-stone-400 mt-1">{table.seatsCount} seats</div>
</button>
```

Inactive tables are dimmed and disabled.

### Floating Selection Bar

```jsx
{selectedTable && (
  <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50">
    <div className="bg-espresso-900 text-white px-6 py-4 rounded-2xl shadow-glass flex items-center gap-4 animate-slide-up">
      <span className="font-bold">Table {selectedTable.tableNumber} selected</span>
      <button
        onClick={() => navigate('/customer/menu', { state: { table: selectedTable, config: selectedConfig } })}
        className="bg-cafe-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-cafe-600 transition-colors"
      >
        Confirm & Proceed to Menu →
      </button>
    </div>
  </div>
)}
```

### Register / Orders Tabs

The header shows two tabs: "Register" and "Orders". Currently both are stubs:
- "Register" tab → shows the table grid (active)
- "Orders" tab → placeholder (not implemented)

### Navigation to Customer Menu

On confirm:
```javascript
navigate('/customer/menu', {
  state: {
    table: selectedTable,
    config: selectedConfig,
  }
});
```

**Important:** `CustomerMenuPage` (Module 5) currently does NOT read or use `location.state.table`. The table selection is saved to navigation state but ignored. This is a gap in the customer ordering flow.

---

## 13. Data Relationships and Hierarchy

```
POSConfig (terminal)
  └── Floor (1:many, posConfig ref)
        └── Table (1:many, floor ref)

POSConfig.isFloorPlanEnabled = true|false
  └── Determines whether FloorManagementPage and POSTerminalFloorViewPage
      show the floor plan UI

Floor.isActive = false
  └── Cascades Table.isActive = false (all tables on this floor)

Session (linked to POSConfig)
  └── posConfig ref
  └── No direct link to Floor or Table
      (table assignment in orders is not yet implemented)
```

### Entity Relationship Diagram (Simplified)

```
┌─────────────┐    1      ┌──────────┐    1      ┌─────────┐
│  POSConfig  │─────────-►│  Floor   │──────────►│  Table  │
│             │   N       │          │   N       │         │
│  - name     │           │  - name  │           │ - num   │
│  - methods  │           │  - config│           │ - floor │
│  - session  │           │  - active│           │ - seats │
│  - floorEn  │           └──────────┘           │ - active│
└─────────────┘                                   └─────────┘
      │
      │ 1:N
      ▼
┌─────────────┐
│   Session   │
│  - posConfig│
│  - status   │
│  - totals   │
└─────────────┘
```

---

## 14. Known Issues and Gaps

### Issue 1: Table Selected in Navigation State Is Ignored

**Symptom:** When a customer selects a table and navigates to `/customer/menu`, the `location.state.table` is passed but `CustomerMenuPage` never reads it.  
**Impact:** The table context is lost. Orders cannot be associated with a specific table.

**Fix:**
```javascript
// In CustomerMenuPage:
const location = useLocation();
const { table, config } = location.state || {};
// Use `table._id` when creating an order
```

---

### Issue 2: Floor Delete is Not Atomic

**Symptom:** The route calls `Floor.findByIdAndUpdate()` followed by `Table.updateMany()` sequentially without a MongoDB transaction.  
**Risk:** If the server crashes between the two operations, some tables may remain active after their floor is deactivated.  
**Fix:** Wrap in a Mongoose session/transaction:

```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  await Floor.findByIdAndUpdate(id, { isActive: false }, { session });
  await Table.updateMany({ floor: id }, { isActive: false }, { session });
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
}
```

---

### Issue 3: Register and Orders Tabs Are Stubs

**Symptom:** The "Register" and "Orders" tabs on `POSTerminalFloorViewPage` only the table grid is active; the "Orders" tab is empty.  
**Impact:** Cashiers cannot see active orders from the table selection screen.  
**Fix:** Implement the Orders tab to show `GET /api/orders?status=draft&...` filtered by table or floor.

---

### Issue 4: No Table Status in Order Flow

**Symptom:** Tables have `isActive` (enabled/disabled for service) but no `status` field like `available | occupied | reserved`.  
**Impact:** There's no way to visually see which tables are currently occupied/have open orders from the floor view.  
**Fix:** Add `status: { type: String, enum: ['available', 'occupied', 'reserved'], default: 'available' }` to the Table model. Update status when an order is placed/completed.

---

### Issue 5: Config Selector Not Shown When Single Terminal

**Symptom:** On `POSTerminalFloorViewPage`, if only one terminal exists, the dropdown is shown anyway.  
**Impact:** Minor UX issue — the dropdown has only one option.  
**Fix:** Conditionally render the dropdown only when `configs.length > 1`.

---

*Next: [Module 4 — Product, Category & Customer Catalog](./module-4-catalog.md)*
