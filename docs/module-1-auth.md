# Module 1 — Authentication & Role Access

> **Back to index:** [README.md](./README.md)  
> **Domain:** Identity, access control, login/signup, JWT lifecycle, role-based routing  

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Architecture and Data Flow](#2-architecture-and-data-flow)
3. [Server — User Model](#3-server--user-model)
4. [Server — Auth Middleware](#4-server--auth-middleware)
5. [Server — Auth Routes (API Reference)](#5-server--auth-routes-api-reference)
6. [Client — AuthContext](#6-client--authcontext)
7. [Client — api.js (Auth section)](#7-client--apijs-auth-section)
8. [Client — ProtectedRoute](#8-client--protectedroute)
9. [Client — AuthPage](#9-client--authpage)
10. [Client — AuthCard (Login/Signup Form)](#10-client--authcard-loginsignup-form)
11. [Client — AuthBrandPanel](#11-client--authbrandpanel)
12. [Client — RoleSelector](#12-client--roleselector)
13. [Client — PasswordStrengthMeter](#13-client--passwordstrengthmeter)
14. [Client — UnauthorizedPage](#14-client--unauthorizedpage)
15. [Utilities — validation.js](#15-utilities--validationjs)
16. [Role Redirect Logic](#16-role-redirect-logic)
17. [Route Guard Matrix](#17-route-guard-matrix)
18. [Security Notes and Known Issues](#18-security-notes-and-known-issues)

---

## 1. Module Overview

The Authentication & Role Access module handles the complete identity lifecycle of the application:

- **User registration** (signup) — validates username uniqueness, password strength, role selection
- **User login** — bcrypt password verify, JWT issue, dual storage (localStorage + httpOnly cookie)
- **Session persistence** — `GET /api/auth/me` rehydrates client state on page reload
- **Route protection** — `ProtectedRoute` component blocks unauthenticated or wrong-role navigation
- **Unauthorized handling** — `UnauthorizedPage` with role-aware redirect back to the user's workspace
- **Logout** — clears token from both storages, redirects to `/login`

### Files in This Module

| Layer | File | Responsibility |
|-------|------|----------------|
| Server Model | `server/models/User.js` | Schema, bcrypt hooks, token generation |
| Server Middleware | `server/middleware/auth.js` | `protect` (JWT verify) + `authorize` (role check) |
| Server Route | `server/routes/auth.js` | 6 endpoints |
| Client Context | `client/src/context/AuthContext.jsx` | Global auth state, login/signup/logout |
| Client Service | `client/src/services/api.js` (authAPI) | Axios calls to auth endpoints |
| Client Component | `client/src/components/ProtectedRoute.jsx` | Route-level access guard |
| Client Page | `client/src/pages/auth/AuthPage.jsx` | Two-panel auth layout |
| Client Component | `client/src/components/auth/AuthCard.jsx` | Login and signup form logic |
| Client Component | `client/src/components/auth/AuthBrandPanel.jsx` | Animated left panel with role previews |
| Client Component | `client/src/components/auth/RoleSelector.jsx` | 2×2 grid role picker (signup only) |
| Client Component | `client/src/components/auth/PasswordStrengthMeter.jsx` | Visual password strength bar |
| Client Page | `client/src/pages/UnauthorizedPage.jsx` | Access-denied screen with role redirect |
| Client Util | `client/src/utils/validation.js` | Field error helpers, password strength scorer |

---

## 2. Architecture and Data Flow

### Signup Flow

```
User fills AuthCard (signup mode)
  │
  ├─► RoleSelector → sets role in form state
  ├─► PasswordStrengthMeter → live feedback
  │
  ▼
AuthContext.signup(formData)
  │
  ▼
POST /api/auth/signup
  ├─► express-validator checks
  ├─► check username uniqueness
  ├─► check email uniqueness
  ├─► User.create() → bcrypt pre-save hook hashes password
  ├─► user.generateToken() → returns JWT (7 days)
  ├─► res.cookie('token', jwt, { httpOnly, sameSite: 'lax' })
  └─► res.json({ success, token, user: safeObject })
  │
  ▼
AuthContext stores token in localStorage ('pos_token', 'pos_user')
  │
  ▼
navigate(getRoleRedirectPath(role))
```

### Login Flow

```
User fills AuthCard (login mode)
  │
  ▼
AuthContext.login(identifier, password)
  │
  ▼
POST /api/auth/login
  ├─► find user by email OR username (case-insensitive)
  ├─► user.comparePassword(input) → bcrypt.compare
  ├─► check user.isActive
  ├─► user.generateToken() → JWT
  ├─► set httpOnly cookie
  └─► res.json({ success, token, user: safeObject })
  │
  ▼
localStorage: pos_token = JWT,  pos_user = JSON.stringify(safeUser)
  │
  ▼
navigate(getRoleRedirectPath(role))
```

### Token Verification on App Load

```
App mounts → AuthContext useEffect
  │
  ▼
reads localStorage 'pos_token'
  │
  ├─► no token → setUser(null), setLoading(false)
  │
  └─► token found → GET /api/auth/me (Bearer header)
        ├─► protect middleware verifies JWT
        ├─► loads req.user from DB
        └─► res.json({ success, user: safeObject })
            │
            ▼
        setUser(data.user), setLoading(false)
```

### Logout Flow

```
User clicks logout button (Navbar or TopOperationsNav)
  │
  ▼
AuthContext.logout()
  │
  ├─► POST /api/auth/logout (clears server-side cookie)
  ├─► localStorage.removeItem('pos_token')
  ├─► localStorage.removeItem('pos_user')
  ├─► setUser(null)
  └─► navigate('/login')
```

---

## 3. Server — User Model

**File:** `server/models/User.js`  
**Collection:** `users`

### Schema Definition

```javascript
{
  fullName:   { type: String, required, trim, minLength: 2, maxLength: 50 },
  username:   { type: String, required, unique, trim, lowercase, minLength: 3, maxLength: 30, match: /^[a-zA-Z0-9_]+$/ },
  email:      { type: String, required, unique, trim, lowercase },
  password:   { type: String, required, select: false, minLength: 6 },
  role:       { type: String, enum: ['manager','cashier','kitchen','customer'], default: 'cashier' },
  isActive:   { type: Boolean, default: true },
  timestamps: true   // createdAt, updatedAt
}
```

### Key Details

- **`password: { select: false }`** — the password hash is NEVER returned in a normal query. You must explicitly use `.select('+password')` when you need to verify it (login route does this).
- **`username` constraints** — lowercase, alphanumeric + underscore only, unique index, 3–30 chars.
- **`email`** — lowercased on storage, unique index.
- **`role` enum** — exactly `'manager'`, `'cashier'`, `'kitchen'`, or `'customer'`. Default is `'cashier'`.

### Mongoose Hooks

#### Pre-save: Password Hashing

```javascript
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
```

Runs automatically on every `User.save()` call when `password` is modified (new user or password change). Salt rounds: `12` (computationally expensive, appropriate for production).

### Instance Methods

#### `comparePassword(candidatePassword)`

```javascript
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
```

Used in the login route after loading the user with `.select('+password')`.

#### `generateToken()`

```javascript
UserSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
```

Issues a signed JWT with the user's MongoDB `_id` as the payload. Expires in 7 days.

#### `toSafeObject()`

```javascript
UserSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    fullName: this.fullName,
    username: this.username,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};
```

Returns a plain object without the password hash. Used in every route response.

---

## 4. Server — Auth Middleware

**File:** `server/middleware/auth.js`

### `protect` Middleware

Verifies the JWT from either the `Authorization: Bearer` header or the `token` httpOnly cookie.

```javascript
const protect = async (req, res, next) => {
  let token;

  // Priority 1: Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Priority 2: httpOnly cookie fallback
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized — no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user)      return res.status(401).json({ ... 'User not found' });
    if (!req.user.isActive) return res.status(403).json({ ... 'Account is deactivated' });

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized — invalid token' });
  }
};
```

**Error responses:**
- `401` — missing token, invalid token, expired token, user not found
- `403` — user exists but `isActive === false`

### `authorize(...roles)` Middleware

A higher-order factory that returns a middleware checking `req.user.role`:

```javascript
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`,
      });
    }
    next();
  };
};
```

**Usage pattern in routes:**

```javascript
router.post('/configs', protect, authorize('manager'), createConfig);
router.get('/configs', protect, authorize('manager', 'cashier'), getConfigs);
```

`protect` must always run before `authorize` since `authorize` reads `req.user`.

---

## 5. Server — Auth Routes (API Reference)

**File:** `server/routes/auth.js`  
**Mount:** `app.use('/api/auth', authRoutes)`

### POST /api/auth/signup

**Access:** Public  
**Body:** `{ fullName, username, email, password, role? }`

**Validation (express-validator):**
- `fullName` — non-empty, 2–50 chars, trim
- `username` — 3–30 chars, alphanumeric+underscore only
- `email` — valid email format
- `password` — min 6 chars

**Logic:**
1. Run express-validator; return `400` with error array if invalid
2. Check `User.findOne({ username })` → `409 'Username already taken'` if exists
3. Check `User.findOne({ email })` → `409 'Email already registered'` if exists
4. `User.create(body)` → triggers bcrypt pre-save hook
5. `user.generateToken()` → JWT
6. `res.cookie('token', token, { httpOnly: true, maxAge: 7d, sameSite: 'lax', secure: NODE_ENV=production })`
7. `res.status(201).json({ success: true, token, user: user.toSafeObject() })`

**Success Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": {
    "_id": "...",
    "fullName": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "cashier",
    "isActive": true,
    "createdAt": "2026-04-04T..."
  }
}
```

---

### POST /api/auth/login

**Access:** Public  
**Body:** `{ identifier, password }` — `identifier` can be email OR username

**Logic:**
1. `User.findOne({ $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }] }).select('+password')`
2. `400` if no user found (message: "Invalid credentials" — intentionally vague)
3. `await user.comparePassword(password)` → `400 'Invalid credentials'` if mismatch
4. `403 'Account deactivated'` if `!user.isActive`
5. Generate token, set cookie, return safe user

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { ... safe user object ... }
}
```

---

### POST /api/auth/logout

**Access:** Protected (`protect` middleware)  
**Body:** None

**Logic:**
1. `res.cookie('token', '', { maxAge: -1 })` — expires the cookie immediately
2. `res.json({ success: true, message: 'Logged out successfully' })`

---

### GET /api/auth/me

**Access:** Protected (`protect` middleware)

**Logic:**
1. `protect` already loaded `req.user`
2. `res.json({ success: true, user: req.user.toSafeObject() })`

Used by `AuthContext` on every page load to verify the stored token is still valid.

---

### GET /api/auth/check-username/:username

**Access:** Public  
**Params:** `username` (string)

**Logic:**
1. `User.findOne({ username: username.toLowerCase().trim() })`
2. `res.json({ available: !user })` — `true` if available, `false` if taken

Used by the signup form for real-time username availability feedback.

---

### GET /api/auth/check-email/:email

**Access:** Public  
**Params:** `email` (string)

**Logic:**
1. `User.findOne({ email: email.toLowerCase().trim() })`
2. `res.json({ available: !user })`

---

## 6. Client — AuthContext

**File:** `client/src/context/AuthContext.jsx`

### State

```javascript
const [user, setUser]       = useState(null);
const [loading, setLoading] = useState(true);
```

`loading` starts `true` until `GET /api/auth/me` resolves (or fails), so the UI can show a spinner instead of flashing to /login.

### Initialization Effect

```javascript
useEffect(() => {
  const token = localStorage.getItem('pos_token');
  if (!token) { setLoading(false); return; }

  authAPI.getMe()
    .then(res => setUser(res.data.user))
    .catch(() => {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
    })
    .finally(() => setLoading(false));
}, []);
```

### `login(identifier, password)`

```javascript
const login = async (identifier, password) => {
  const res = await authAPI.login({ identifier, password });
  const { token, user } = res.data;
  localStorage.setItem('pos_token', token);
  localStorage.setItem('pos_user', JSON.stringify(user));
  setUser(user);
  return user;
};
```

Returns the user object so the calling component can redirect immediately.

### `signup(formData)`

```javascript
const signup = async (formData) => {
  const res = await authAPI.signup(formData);
  const { token, user } = res.data;
  localStorage.setItem('pos_token', token);
  localStorage.setItem('pos_user', JSON.stringify(user));
  setUser(user);
  return user;
};
```

### `logout()`

```javascript
const logout = async () => {
  try { await authAPI.logout(); } catch {}
  localStorage.removeItem('pos_token');
  localStorage.removeItem('pos_user');
  setUser(null);
};
```

Best-effort server call — proceeds with local cleanup even if the server call fails.

### `getRoleRedirectPath(role)`

```javascript
const getRoleRedirectPath = (role) => {
  const paths = {
    manager:  '/dashboard',
    cashier:  '/pos/floor',
    kitchen:  '/kitchen',
    customer: '/customer',
  };
  return paths[role] || '/dashboard';
};
```

### Exposed Context Value

```javascript
{
  user,          // null | { _id, fullName, username, email, role, isActive, createdAt }
  loading,       // boolean — true during initial token check
  login,         // async (identifier, password) => user
  signup,        // async (formData) => user
  logout,        // async () => void
  isAuthenticated, // boolean — !!user
  getRoleRedirectPath, // (role) => path string
}
```

---

## 7. Client — api.js (Auth Section)

**File:** `client/src/services/api.js`

### Axios Instance

```javascript
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
```

### Interceptors

**Request interceptor** — attaches JWT from localStorage:
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**Response interceptor** — auto-redirect on 401:
```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### authAPI Object

```javascript
export const authAPI = {
  signup:         (data)  => api.post('/auth/signup', data),
  login:          (data)  => api.post('/auth/login', data),
  logout:         ()      => api.post('/auth/logout'),
  getMe:          ()      => api.get('/auth/me'),
  checkUsername:  (name)  => api.get(`/auth/check-username/${name}`),
  checkEmail:     (email) => api.get(`/auth/check-email/${email}`),
};
```

---

## 8. Client — ProtectedRoute

**File:** `client/src/components/ProtectedRoute.jsx`

```jsx
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | ReactNode | Yes | The protected page component |
| `allowedRoles` | string[] | No | If omitted, any authenticated user passes |

**Behavior:**
- While `loading = true` → renders a spinner (prevents flash of /login redirect)
- Unauthenticated → redirects to `/login`, preserving intended destination in `location.state.from`
- Wrong role → redirects to `/unauthorized`
- Authorized → renders `children`

### Usage in App.jsx

```jsx
<Route path="/pos/config" element={
  <ProtectedRoute allowedRoles={['manager', 'cashier']}>
    <POSConfigurationPage />
  </ProtectedRoute>
} />

<Route path="/catalog" element={
  <ProtectedRoute allowedRoles={['manager', 'cashier']}>
    <ProductCategoryManagementPage />
  </ProtectedRoute>
} />

<Route path="/kitchen" element={
  <ProtectedRoute allowedRoles={['kitchen']}>
    <Dashboard />   {/* placeholder */}
  </ProtectedRoute>
} />

<Route path="/customer" element={
  <ProtectedRoute allowedRoles={['manager', 'cashier', 'kitchen', 'customer']}>
    <POSTerminalFloorViewPage />
  </ProtectedRoute>
} />
```

---

## 9. Client — AuthPage

**File:** `client/src/pages/auth/AuthPage.jsx`

A two-column layout page:

```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│   AuthBrandPanel    │     AuthCard        │
│  (left, hidden      │  (login/signup      │
│   on mobile)        │   form)             │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

The page receives `selectedRole` state from `AuthCard` (when user is in signup mode) and passes it down to `AuthBrandPanel` so the animated brand panel can show that role's features instead of auto-rotating.

```jsx
export default function AuthPage() {
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block">
        <AuthBrandPanel selectedRole={selectedRole} />
      </div>
      <div className="flex items-center justify-center p-8">
        <AuthCard onRoleSelect={setSelectedRole} />
      </div>
    </div>
  );
}
```

**Routing:**
- `/login` → `AuthPage`
- `/signup` → `AuthPage`
- Both are unprotected routes accessible without a token.

---

## 10. Client — AuthCard (Login/Signup Form)

**File:** `client/src/components/auth/AuthCard.jsx`

The most complex auth component. Manages:
- Mode switching between Login and Signup (`mode: 'login' | 'signup'`)
- Form state for all fields (fullName, username, email, password, role)
- Real-time field validation (blur-based)
- Async username/email availability checks (debounced)
- Password strength meter display
- Submit handling with error display

### Form State (Signup)

```javascript
const [form, setForm] = useState({
  fullName: '',
  username: '',
  email: '',
  password: '',
  role: '',
});
const [errors, setErrors] = useState({});
const [fieldStatus, setFieldStatus] = useState({
  username: null,   // null | 'checking' | 'available' | 'taken'
  email: null,
});
```

### Login Form State

```javascript
const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
const [loginError, setLoginError] = useState('');
const [showPassword, setShowPassword] = useState(false);
```

### Validation Logic (Signup)

Triggered on `onBlur` for each field:

| Field | Rules |
|-------|-------|
| `fullName` | Non-empty, 2–50 chars |
| `username` | 3–30 chars, `/^[a-zA-Z0-9_]+$/`, triggers `checkUsername` API call |
| `email` | Valid email format, triggers `checkEmail` API call |
| `password` | Min 6 chars |
| `role` | Must be one of the 4 enum values |

### Username/Email Availability

```javascript
const checkUsernameAvailability = async (username) => {
  if (username.length < 3) return;
  setFieldStatus(prev => ({ ...prev, username: 'checking' }));
  try {
    const res = await authAPI.checkUsername(username);
    setFieldStatus(prev => ({ ...prev, username: res.data.available ? 'available' : 'taken' }));
  } catch {
    setFieldStatus(prev => ({ ...prev, username: null }));
  }
};
```

Visual indicator appears next to username field:
- 🔄 `checking` → spinning loader
- ✅ `available` → green checkmark
- ❌ `taken` → red X with "Username taken" message

### Submit Handler (Signup)

```javascript
const handleSignup = async (e) => {
  e.preventDefault();
  if (!validateAll()) return;   // client-side checks
  if (fieldStatus.username === 'taken') return;
  if (fieldStatus.email === 'taken') return;

  setLoading(true);
  try {
    const user = await signup(form);
    toast.success(`Welcome, ${user.fullName}!`);
    navigate(getRoleRedirectPath(user.role));
  } catch (err) {
    setSubmitError(err.response?.data?.message || 'Signup failed');
  } finally {
    setLoading(false);
  }
};
```

### Submit Handler (Login)

```javascript
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const user = await login(loginForm.identifier, loginForm.password);
    toast.success(`Welcome back, ${user.fullName}!`);
    navigate(getRoleRedirectPath(user.role));
  } catch (err) {
    setLoginError(err.response?.data?.message || 'Invalid credentials');
  } finally {
    setLoading(false);
  }
};
```

### Child Components Used in AuthCard

```jsx
{/* Signup only */}
<RoleSelector value={form.role} onChange={(role) => { setForm(...); onRoleSelect(role); }} error={errors.role} />
<PasswordStrengthMeter password={form.password} />
```

---

## 11. Client — AuthBrandPanel

**File:** `client/src/components/auth/AuthBrandPanel.jsx`

The left-panel decoration shown on large screens (`lg:block`). Purely visual — not involved in auth logic.

### Features

- **Auto-rotating role cards** — cycles through all 4 roles every 4 seconds with fade transition
- **Role spotlight** — shows headline, description, and 3 feature tags for each role
- **Role synchronization** — if `selectedRole` prop is set (user is in signup and picked a role), the panel freezes on that role's card instead of auto-rotating
- **Dot indicators** — clickable dots to manually jump to a role preview
- **Stats preview** — 4 fixed-value stat cards (Active Tables: 12, Kitchen Queue: 3, Payments Today: ₹24.5K, Avg. Order: ₹580) — purely decorative, not live data

### Role Data Definition

```javascript
const ROLE_DATA = [
  { key: 'cashier',  headline: 'Open session. Serve faster. Bill confidently.',    icon: Utensils,   features: ['Floor & Table Management','One-tap Billing','Multi-payment Support'] },
  { key: 'kitchen',  headline: 'Track tickets in real time. Reduce confusion.',    icon: ChefHat,    features: ['Live Order Queue','Status Tracking','Priority Management'] },
  { key: 'customer', headline: 'Transparent orders. Faster service.',              icon: Coffee,     features: ['Order Tracking','Self-ordering','Live Status Updates'] },
  { key: 'manager',  headline: 'Control operations. Monitor performance.',         icon: ShieldCheck,features: ['Full Configuration','Sales Analytics','Staff Management'] },
];
```

### Animation

The panel uses CSS animations from `index.css` and Tailwind custom keyframes:
- `animate-float-slow`, `animate-drift`, `animate-float-medium` — background blobs
- `animate-rotate-slow` — decorative SVG circle
- `animate-fade-in-up` — card entrance

---

## 12. Client — RoleSelector

**File:** `client/src/components/auth/RoleSelector.jsx`

A 2×2 grid of clickable role cards rendered inside the signup form.

### Roles Defined

```javascript
const ROLES = [
  { value: 'cashier',  label: 'POS Staff / Cashier', shortLabel: 'Cashier',  description: 'Manage tables, orders, and billing.',         icon: Utensils,   accent: 'cafe'    },
  { value: 'kitchen',  label: 'Kitchen Staff',        shortLabel: 'Kitchen',  description: 'Receive tickets and update preparation.',      icon: ChefHat,    accent: 'amber'   },
  { value: 'customer', label: 'Customer',             shortLabel: 'Customer', description: 'Track orders and self-order easily.',          icon: Coffee,     accent: 'emerald' },
  { value: 'manager',  label: 'Manager / Admin',      shortLabel: 'Manager',  description: 'Configure, monitor, and optimize.',            icon: ShieldCheck,accent: 'violet'  },
];
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `value` | string | Currently selected role value |
| `onChange` | function | Called with the selected role string |
| `error` | string | Validation error message (displayed below grid) |

### Selection State

Each card has an `isActive` check comparing `value` to its own `role.value`. On selection:
- Orange background gradient replaces grey
- Orange check badge appears top-right with scale animation
- Icon turns white
- AuthBrandPanel syncs to show that role's spotlight

---

## 13. Client — PasswordStrengthMeter

**File:** `client/src/components/auth/PasswordStrengthMeter.jsx`

Renders below the password field in signup mode. Returns `null` if `password` is empty.

### Visual Output

- A colored progress bar (0–100% width)
- A label on the left (`Weak`, `Fair`, `Good`, `Strong`)
- A hint on the right (`Add uppercase, numbers, symbols` or `Great password!`)

### Color Map

| Color | Bar class | Label class |
|-------|-----------|-------------|
| red | `bg-red-500` | `text-red-600` |
| amber | `bg-amber-500` | `text-amber-600` |
| yellow | `bg-yellow-500` | `text-yellow-600` |
| emerald | `bg-emerald-500` | `text-emerald-600` |

---

## 14. Client — UnauthorizedPage

**File:** `client/src/pages/UnauthorizedPage.jsx`

**Route:** `/unauthorized`  
**Access:** Any authenticated user whose role is denied on a route

Displays a large ShieldX icon, the user's current role, and a single button that redirects to the user's correct workspace via `getRoleRedirectPath(user.role)`.

```jsx
<button onClick={() => navigate(user ? getRoleRedirectPath(user.role) : '/login', { replace: true })}>
  Go to My Workspace
</button>
```

If `user` is null (edge case), it redirects to `/login`.

---

## 15. Utilities — validation.js

**File:** `client/src/utils/validation.js`

### `getFieldError(field, value)`

```javascript
export function getFieldError(field, value) {
  switch (field) {
    case 'fullName':
      if (!value.trim())                 return 'Full name is required';
      if (value.trim().length < 2)       return 'At least 2 characters';
      if (value.trim().length > 50)      return 'Max 50 characters';
      return '';
    case 'username':
      if (!value.trim())                 return 'Username is required';
      if (value.length < 3)              return 'At least 3 characters';
      if (value.length > 30)             return 'Max 30 characters';
      if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, underscore';
      return '';
    case 'email':
      if (!value.trim())                 return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
      return '';
    case 'password':
      if (!value)                        return 'Password is required';
      if (value.length < 6)              return 'At least 6 characters';
      return '';
    case 'role':
      if (!value)                        return 'Please select a role';
      return '';
    default:
      return '';
  }
}
```

### `getPasswordStrength(password)`

Returns an object `{ score: 0–4, label: string, color: string, percent: 0–100 }`.

Scoring criteria (each adds 1 to score):
1. Length ≥ 8
2. Contains uppercase letter
3. Contains number
4. Contains special character

```javascript
Score 0 → { label: 'Weak',   color: 'red',     percent: 10  }
Score 1 → { label: 'Weak',   color: 'red',     percent: 25  }
Score 2 → { label: 'Fair',   color: 'amber',   percent: 50  }
Score 3 → { label: 'Good',   color: 'yellow',  percent: 75  }
Score 4 → { label: 'Strong', color: 'emerald', percent: 100 }
```

---

## 16. Role Redirect Logic

After login or signup, the user is navigated to their role's default landing page:

| Role | Default Path | Page |
|------|-------------|------|
| `manager` | `/dashboard` | Dashboard with all feature cards |
| `cashier` | `/pos/floor` | Floor Management (their primary workspace) |
| `kitchen` | `/kitchen` | Dashboard placeholder (kitchen module not built) |
| `customer` | `/customer` | POS Terminal Floor View (table selection) |

---

## 17. Route Guard Matrix

Defined in `client/src/App.jsx` using `<ProtectedRoute allowedRoles={[...]} />`:

| Route Path | Allowed Roles | Target Component |
|-----------|--------------|-----------------|
| `/` | any auth | redirects to role path |
| `/login` | public | AuthPage |
| `/signup` | public | AuthPage |
| `/unauthorized` | any auth | UnauthorizedPage |
| `/dashboard` | all 4 roles | Dashboard |
| `/pos/config` | manager, cashier | POSConfigurationPage |
| `/pos/floor` | manager, cashier | FloorManagementPage |
| `/operations` | manager, cashier | OperationsManagementPage |
| `/catalog` | manager, cashier | ProductCategoryManagementPage |
| `/pos/terminal/:configId` | manager, cashier, customer | POSTerminalFloorViewPage |
| `/customer` | all 4 roles | POSTerminalFloorViewPage |
| `/customer/menu` | all 4 roles | CustomerMenuPage |
| `/kitchen` | kitchen | Dashboard (placeholder) |

---

## 18. Security Notes and Known Issues

### Implemented Security Measures

- **bcrypt salt rounds 12** — strong password hashing, resists brute-force
- **`select: false` on password** — password hash never leaks in API responses
- **httpOnly cookie** — prevents JavaScript from reading the cookie token
- **JWT expiry** — tokens expire after 7 days automatically
- **Role-based API protection** — every protected endpoint uses both `protect` + `authorize`
- **Intentionally vague login errors** — returns "Invalid credentials" for both "user not found" and "wrong password" to prevent user enumeration
- **`isActive` check** — deactivated accounts cannot log in even with valid password
- **express-validator** — server-side input validation on signup prevents malformed data

### Known Security Issues

| Issue | Severity | Details |
|-------|----------|---------|
| Auth rate limiter too lenient | Medium | `authLimiter` is set to 5000 requests per 15 minutes — should be ≤10–20 for `/api/auth/login` and `/api/auth/signup` to prevent credential stuffing |
| CORS hardcoded | Low | `origin: 'http://localhost:8080'` is hardcoded in `server.js`. In production this will fail or must be manually updated. Should use `process.env.CLIENT_URL`. |
| JWT stored in localStorage | Low-Medium | Susceptible to XSS attacks. The httpOnly cookie is set but the Bearer token in localStorage is the primary mechanism. Consider switching fully to httpOnly cookies. |
| No refresh token mechanism | Low | Single 7-day token. If the JWT_SECRET is rotated, all sessions are invalidated with no graceful recovery. |
| Username check endpoint is public | Informational | `GET /api/auth/check-username/:username` can be used to enumerate valid usernames without authentication. Rate limiting would mitigate this. |

---

*Next: [Module 2 — POS Terminal & Session Control](./module-2-pos-terminal.md)*
