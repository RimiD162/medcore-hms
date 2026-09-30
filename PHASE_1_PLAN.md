# MedCore HMS — Phase 1: Authentication + RBAC
## Complete Implementation Plan

> **Stack:** React + Vite (Frontend) · Node.js + Express.js (Backend) · PostgreSQL (Database)  
> **Depends on:** Phase 0 — Foundation (AppShell, DB tables: `users`, `roles`, `refresh_tokens`, `audit_logs`)  
> **Goal:** Secure the entire system. Every subsequent phase (2–20) lives behind this authentication gate.  
> **Output:** A fully working login → role-aware dashboard flow with JWT access/refresh token rotation, bcrypt password hashing, protected API routes, and frontend route guards.

---

## 🔐 What Phase 1 Builds

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       PHASE 1 SECURITY BOUNDARY                        │
│                                                                         │
│  PUBLIC (no token needed)          PROTECTED (JWT required)             │
│  ─────────────────────            ─────────────────────────             │
│  POST /api/auth/login              GET  /api/auth/me                    │
│  POST /api/auth/refresh            POST /api/auth/logout                │
│  POST /api/auth/forgot-password    PUT  /api/auth/change-password       │
│  POST /api/auth/reset-password                                          │
│                                   ┌── Role Layer ──────────────────┐   │
│  FRONTEND ROUTES                  │  admin only:  /api/users        │   │
│  ─────────────────                │  all roles:   /api/auth/me      │   │
│  /login        → LoginPage        └────────────────────────────────┘   │
│  /dashboard    → ProtectedRoute                                         │
│  /unauthorized → 403 Page                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ New Files Added in Phase 1

```
medcore-hms/
│
├── backend/src/
│   ├── config/
│   │   └── db.js                         ← (Phase 0 — already exists)
│   │
│   ├── middleware/
│   │   ├── errorHandler.js               ← (Phase 0 — already exists)
│   │   ├── authenticate.js               ← NEW: JWT verification middleware
│   │   └── authorize.js                  ← NEW: Role-based access middleware
│   │
│   ├── modules/
│   │   └── auth/                         ← NEW: Auth feature module
│   │       ├── auth.routes.js            ← Route definitions
│   │       ├── auth.controller.js        ← Request handlers
│   │       ├── auth.service.js           ← Business logic
│   │       └── auth.validation.js        ← Input validation schemas
│   │
│   ├── modules/
│   │   └── users/                        ← NEW: User management module (admin only)
│   │       ├── users.routes.js
│   │       ├── users.controller.js
│   │       └── users.service.js
│   │
│   └── app.js                            ← MODIFY: Mount auth & users routes
│
├── backend/migrations/
│   └── 002_auth_enhancements.sql         ← NEW: Add password reset + lockout columns
│
└── frontend/src/
    ├── api/
    │   ├── axiosClient.js                ← MODIFY: Wire refresh token interceptor
    │   └── authApi.js                    ← NEW: Auth API call functions
    │
    ├── context/
    │   └── AuthContext.jsx               ← MODIFY: Connect to real backend
    │
    ├── pages/
    │   ├── auth/
    │   │   ├── LoginPage.jsx             ← NEW: Full login UI
    │   │   ├── ForgotPasswordPage.jsx    ← NEW: Email reset request page
    │   │   └── ResetPasswordPage.jsx     ← NEW: New password entry page
    │   ├── dashboard/
    │   │   └── DashboardPage.jsx         ← MODIFY: Show real user info + role
    │   └── errors/
    │       └── UnauthorizedPage.jsx      ← NEW: 403 no-permission page
    │
    ├── components/
    │   └── layout/
    │       ├── ProtectedRoute.jsx        ← MODIFY: Use real auth state
    │       └── TopBar.jsx                ← MODIFY: Show real user avatar + logout
    │
    └── hooks/
        └── useAuth.js                    ← MODIFY: Full hook with all auth methods
```

---

## 📋 Phase 1 Task Breakdown (Step by Step)

---

### STEP 1 — Install Phase 1 Backend Dependencies

```bash
cd backend
npm install bcryptjs jsonwebtoken express-validator uuid
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

| Package | Purpose |
| :--- | :--- |
| `bcryptjs` | Secure password hashing with adaptive work factor |
| `jsonwebtoken` | Sign and verify JWT access & refresh tokens |
| `express-validator` | Declarative input validation and sanitization for routes |
| `uuid` | Generate unique IDs for refresh tokens and reset tokens |

---

### STEP 2 — Database Migration: Auth Enhancements

**Task 2.1 — `backend/migrations/002_auth_enhancements.sql`**

Add columns to `users` table needed for full Phase 1 auth features:

```sql
-- ================================================================
-- MedCore HMS: Phase 1 Auth Enhancement Migration
-- ================================================================

-- Add password reset flow columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_reset_token   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_reset_expires  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_login_attempts   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until            TIMESTAMPTZ;

-- Index for fast token lookup on password reset
CREATE INDEX IF NOT EXISTS idx_users_reset_token
  ON users(password_reset_token)
  WHERE password_reset_token IS NOT NULL;

-- ================================================================
-- Seed a default Hospital Admin user for first login
-- Password: Admin@MedCore2026  (bcrypt hash below)
-- Generate fresh hash: node -e "require('bcryptjs').hash('Admin@MedCore2026',12).then(console.log)"
-- ================================================================
INSERT INTO hospitals (id, name, city, phone, email)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'MedCore General Hospital',
  'Mumbai',
  '+91 22 1234 5678',
  'admin@medcorehospital.com'
) ON CONFLICT DO NOTHING;

INSERT INTO users (
  id,
  hospital_id,
  role_id,
  full_name,
  email,
  password_hash,
  is_active,
  is_verified
)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM roles WHERE name = 'admin'),
  'System Administrator',
  'admin@medcore.hms',
  '$2a$12$REPLACE_THIS_WITH_REAL_BCRYPT_HASH',
  TRUE,
  TRUE
) ON CONFLICT (email) DO NOTHING;
```

**Run the migration:**
```bash
psql -U postgres -d medcore_hms_dev -f migrations/002_auth_enhancements.sql
```

**Generate the real bcrypt hash for seeding:**
```bash
node -e "require('bcryptjs').hash('Admin@MedCore2026', 12).then(console.log)"
```

---

### STEP 3 — Backend Auth Module

---

**Task 3.1 — Update `backend/.env` — Add JWT Secrets**

```ini
# JWT Configuration
JWT_ACCESS_SECRET=your_very_long_random_access_secret_min_64_chars
JWT_REFRESH_SECRET=your_very_long_random_refresh_secret_min_64_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Password Security
BCRYPT_SALT_ROUNDS=12

# Account Lockout Policy
MAX_FAILED_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30

# Password Reset
PASSWORD_RESET_TOKEN_EXPIRES_MINUTES=30
```

**Generate secure random secrets (run in terminal):**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run this **twice** — once for `JWT_ACCESS_SECRET`, once for `JWT_REFRESH_SECRET`.

---

**Task 3.2 — `backend/src/modules/auth/auth.validation.js`** — Input Schemas

All user inputs are validated here **before** reaching the controller:

```js
const { body } = require('express-validator');

const loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),
];

const resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Reset token is required.'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Must contain at least one number.'),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Must contain at least one number.'),
];

const createUserValidation = [
  body('full_name').trim().notEmpty().withMessage('Full name is required.'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password min 8 characters.')
    .matches(/[A-Z]/).withMessage('Must contain uppercase letter.')
    .matches(/[0-9]/).withMessage('Must contain a number.'),
  body('role_id').isInt({ min: 1 }).withMessage('A valid role is required.'),
];

module.exports = {
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  createUserValidation,
};
```

---

**Task 3.3 — `backend/src/modules/auth/auth.service.js`** — All Business Logic

This is the **core of Phase 1**. The controller stays thin; all logic lives here.

```
auth.service.js functions:
─────────────────────────────────────────────────────────
login(email, password)
  1. Find user by email (include role name via JOIN)
  2. Check user is active (not deactivated by admin)
  3. Check account is not locked (locked_until > NOW())
  4. bcrypt.compare(password, password_hash)
  5a. If WRONG password:
       - Increment failed_login_attempts
       - If attempts >= MAX_FAILED (5): set locked_until = NOW() + 30min
       - Throw 401 ApiError
  5b. If CORRECT password:
       - Reset failed_login_attempts = 0, locked_until = NULL
       - Update last_login_at = NOW()
       - Generate JWT access token (15min expiry, contains: id, role, hospital_id)
       - Generate JWT refresh token (7 days expiry)
       - Store refresh token hash in refresh_tokens table
       - Write LOGIN event to audit_logs
       - Return: { user (sanitized), accessToken, refreshToken }

refreshAccessToken(refreshToken)
  1. Verify JWT refresh token signature
  2. Lookup token in refresh_tokens table (check is_revoked = false)
  3. Check token not expired
  4. Issue new access token
  5. Rotate refresh token (revoke old, issue new) — prevents token reuse attacks
  6. Return: { accessToken, refreshToken }

logout(refreshToken)
  1. Find refresh_tokens row by token value
  2. Set is_revoked = TRUE
  3. Write LOGOUT event to audit_logs
  4. Return success

getMe(userId)
  1. SELECT user by ID with JOIN on roles table
  2. Return sanitized user object (exclude password_hash)

forgotPassword(email)
  1. Find user by email (do NOT reveal if email exists — always return generic success)
  2. If user found:
       - Generate cryptographically secure random token (crypto.randomBytes(32).hex())
       - Hash the token (SHA-256) before storing in DB
       - Store hash + expiry (NOW() + 30min) in users table
       - In production: send email with reset link containing raw token
       - In development: return token in response body for testing
  3. Always return: { message: 'If your email exists, a reset link was sent.' }

resetPassword(token, newPassword)
  1. Hash incoming raw token (SHA-256)
  2. Find user where password_reset_token = hash AND password_reset_expires > NOW()
  3. If not found: throw 400 ApiError 'Token is invalid or expired'
  4. Hash new password with bcrypt (12 rounds)
  5. Update: password_hash, clear reset token & expiry, reset failed_login_attempts
  6. Revoke ALL existing refresh_tokens for this user (force re-login everywhere)
  7. Write PASSWORD_RESET event to audit_logs

changePassword(userId, currentPassword, newPassword)
  1. Fetch user by ID (include password_hash)
  2. bcrypt.compare(currentPassword, password_hash)
  3. If wrong: throw 401 ApiError
  4. Hash newPassword (bcrypt, 12 rounds)
  5. Update password_hash in DB
  6. Revoke ALL existing refresh_tokens for this user (security: re-login required)
  7. Write PASSWORD_CHANGED event to audit_logs
```

---

**Task 3.4 — `backend/src/modules/auth/auth.controller.js`** — Route Handlers

```js
// Controller stays thin — calls service, sends response
const AuthService = require('./auth.service');
const ApiResponse = require('../../utils/ApiResponse');
const { validationResult } = require('express-validator');
const ApiError = require('../../utils/ApiError');

const handleValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(422, 'Validation failed', errors.array());
  }
};

const login = async (req, res, next) => {
  try {
    handleValidation(req);
    const result = await AuthService.login(req.body.email, req.body.password);

    // Refresh token → httpOnly cookie (XSS-safe)
    res.cookie('medcore_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json(new ApiResponse(200, {
      user: result.user,
      accessToken: result.accessToken,
    }, 'Login successful'));
  } catch (err) { next(err); }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.medcore_refresh_token;
    if (!token) throw new ApiError(401, 'Refresh token not provided');

    const result = await AuthService.refreshAccessToken(token);

    res.cookie('medcore_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json(new ApiResponse(200, { accessToken: result.accessToken }, 'Token refreshed'));
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.medcore_refresh_token;
    if (token) await AuthService.logout(token, req.user?.id);
    res.clearCookie('medcore_refresh_token');
    res.json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await AuthService.getMe(req.user.id);
    res.json(new ApiResponse(200, { user }, 'User profile fetched'));
  } catch (err) { next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    handleValidation(req);
    const result = await AuthService.forgotPassword(req.body.email);
    res.json(new ApiResponse(200, result, 'Password reset request processed'));
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    handleValidation(req);
    await AuthService.resetPassword(req.body.token, req.body.newPassword);
    res.json(new ApiResponse(200, null, 'Password reset successfully. Please login with your new password.'));
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    handleValidation(req);
    await AuthService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.json(new ApiResponse(200, null, 'Password changed. Please login again.'));
  } catch (err) { next(err); }
};

module.exports = { login, refreshToken, logout, getMe, forgotPassword, resetPassword, changePassword };
```

---

**Task 3.5 — `backend/src/modules/auth/auth.routes.js`** — Route Definitions

```js
const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');
const authenticate = require('../../middleware/authenticate');
const {
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} = require('./auth.validation');

// ── Public routes (no token needed) ──────────────────────
router.post('/login',            loginValidation,          AuthController.login);
router.post('/refresh',                                    AuthController.refreshToken);
router.post('/forgot-password',  forgotPasswordValidation, AuthController.forgotPassword);
router.post('/reset-password',   resetPasswordValidation,  AuthController.resetPassword);

// ── Protected routes (JWT required) ──────────────────────
router.get('/me',                          authenticate, AuthController.getMe);
router.post('/logout',                     authenticate, AuthController.logout);
router.put('/change-password', changePasswordValidation, authenticate, AuthController.changePassword);

module.exports = router;
```

**Complete API endpoint table:**

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Login with email + password |
| `POST` | `/api/auth/refresh` | Cookie | Issue new access token via refresh cookie |
| `POST` | `/api/auth/logout` | JWT | Revoke refresh token and clear cookie |
| `GET` | `/api/auth/me` | JWT | Get current logged-in user profile |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset email |
| `POST` | `/api/auth/reset-password` | Public | Submit new password with reset token |
| `PUT` | `/api/auth/change-password` | JWT | Change password from within app |

---

### STEP 4 — Security Middleware

---

**Task 4.1 — `backend/src/middleware/authenticate.js`** — JWT Verification

```
Incoming Request
      │
      ▼
Extract Bearer token from Authorization header
      │
      ├── No token found? ─────────────────────► 401 Unauthorized
      │
      ▼
jwt.verify(token, JWT_ACCESS_SECRET)
      │
      ├── Invalid / expired signature? ─────────► 401 Token invalid or expired
      │
      ▼
SELECT user from DB (verify still active, not deactivated since token issued)
      │
      ├── User not found / deactivated? ────────► 401 Account not found
      │
      ▼
Attach user to req.user = { id, role, full_name, hospital_id, email }
      │
      ▼
next() — proceed to route handler
```

```js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access token required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Verify user still exists & is active (handles mid-session deactivation)
    const { rows } = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.hospital_id, u.is_active, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (!rows.length || !rows[0].is_active) {
      throw new ApiError(401, 'Account not found or deactivated');
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Access token expired'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid access token'));
    }
    next(err);
  }
};

module.exports = authenticate;
```

---

**Task 4.2 — `backend/src/middleware/authorize.js`** — Role-Based Access Control

```
Usage in any route:
  router.get('/reports', authenticate, authorize('admin', 'accountant'), ReportsController.get)

Logic:
  req.user.role (set by authenticate middleware)
        │
        ▼
  Is req.user.role in allowedRoles[]?
        │
  Yes ──┼──► next()                       ✅ Access granted
  No   ─┼──► 403 Forbidden                ❌ Insufficient permissions
```

```js
const ApiError = require('../utils/ApiError');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403,
        `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
      ));
    }
    next();
  };
};

module.exports = authorize;
```

**Usage examples across future phases:**
```js
// Only admin can create/manage users
router.post('/users', authenticate, authorize('admin'), UsersController.create);

// Doctors and nurses can view patient records
router.get('/patients/:id', authenticate, authorize('doctor', 'nurse'), PatientsController.show);

// Only accountant and admin can access billing
router.get('/invoices', authenticate, authorize('admin', 'accountant'), BillingController.list);

// Pharmacist fulfils prescriptions
router.put('/prescriptions/:id/dispense', authenticate, authorize('pharmacist'), PharmacyController.dispense);
```

---

### STEP 5 — User Management Module (Admin Only)

**Task 5.1 — `backend/src/modules/users/users.routes.js`**

```js
// All routes require: authenticate + authorize('admin')

GET    /api/users              List all staff users (paginated, filterable by role/status)
POST   /api/users              Create a new staff account
GET    /api/users/:id          Get a single staff user profile
PUT    /api/users/:id          Update a staff user (name, phone, role)
PATCH  /api/users/:id/status   Toggle is_active (activate / deactivate)
DELETE /api/users/:id          Hard delete (only in development — production: deactivate only)
```

**Task 5.2 — `backend/src/modules/users/users.service.js`**

```
createUser(data)
  1. Check email uniqueness: SELECT FROM users WHERE email = $1
  2. Throw 409 if already exists
  3. bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
  4. INSERT into users with hospital_id from creating admin's req.user.hospital_id
  5. Write CREATE_USER event to audit_logs
  6. Return sanitized user (exclude password_hash)

listUsers(hospitalId, filters)
  1. SELECT users JOIN roles WHERE hospital_id = $1
  2. Apply: role filter, is_active filter, search by name/email
  3. Return paginated result { data, total, page, limit }

updateUser(userId, updates)
  1. Check if email being changed is already taken by another user
  2. UPDATE users SET ... WHERE id = $1
  3. Write UPDATE_USER event to audit_logs

toggleUserStatus(userId, adminId)
  1. Fetch current is_active state
  2. Toggle is_active value
  3. If deactivating: revoke ALL refresh_tokens for that user (force logout)
  4. Write ACTIVATE_USER or DEACTIVATE_USER event to audit_logs
```

---

### STEP 6 — Frontend Authentication Pages

---

**Task 6.1 — Install Frontend Cookie Handling**

```bash
cd frontend
npm install js-cookie
```

---

**Task 6.2 — `frontend/src/api/authApi.js`** — Auth API Functions

```js
import axiosClient from './axiosClient';

export const authApi = {
  login: (email, password) =>
    axiosClient.post('/auth/login', { email, password }),

  logout: () =>
    axiosClient.post('/auth/logout'),

  getMe: () =>
    axiosClient.get('/auth/me'),

  refreshToken: () =>
    axiosClient.post('/auth/refresh'),

  forgotPassword: (email) =>
    axiosClient.post('/auth/forgot-password', { email }),

  resetPassword: (token, newPassword) =>
    axiosClient.post('/auth/reset-password', { token, newPassword }),

  changePassword: (currentPassword, newPassword) =>
    axiosClient.put('/auth/change-password', { currentPassword, newPassword }),
};
```

---

**Task 6.3 — Update `frontend/src/api/axiosClient.js`** — Silent Token Refresh

Add a response interceptor that **automatically retries requests** with a fresh access token when the server returns `401 Token expired`:

```
Request fails with 401 "Access token expired"
           │
           ▼
Call POST /api/auth/refresh (uses httpOnly cookie automatically)
           │
     ┌─────┴──────┐
   Success       Failure (refresh also expired)
     │                   │
     ▼                   ▼
Store new           Clear tokens
accessToken         Redirect to /login
     │
     ▼
Retry original failed request with new token
     │
     ▼
Response returns normally (user never saw an error)
```

---

**Task 6.4 — Update `frontend/src/context/AuthContext.jsx`** — Real Backend Integration

```
Updated AuthContext provides:

  user            → full user object from GET /api/auth/me
  isAuthenticated → boolean
  isLoading       → true while verifying token on app boot
  login(email, password)
    → calls authApi.login()
    → stores accessToken in memory (NOT localStorage for XSS safety)
    → stores user object in state
    → calls useToast().addToast('Welcome back!', 'success')
    → navigates to /dashboard

  logout()
    → calls authApi.logout()
    → clears user state
    → navigates to /login

  checkAuth()
    → called on app boot (in useEffect)
    → calls authApi.getMe() with existing token
    → if 401 → tries refresh → if still fails → redirects to /login
    → sets user and isLoading = false
```

---

**Task 6.5 — `frontend/src/pages/auth/LoginPage.jsx`** — Login UI

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│              ┌────────────────────────────────────┐             │
│              │  ┌──┐  MedCore  HMS                │             │
│              │  └──┘                              │             │
│              │                                    │             │
│              │  Sign in to your workspace         │             │
│              │                                    │             │
│              │  Work Email                        │             │
│              │  ┌──────────────────────────────┐  │             │
│              │  │ name@hospital.com            │  │             │
│              │  └──────────────────────────────┘  │             │
│              │                                    │             │
│              │  Password                 Forgot?  │             │
│              │  ┌──────────────────────────────┐  │             │
│              │  │ ••••••••••••       👁         │  │             │
│              │  └──────────────────────────────┘  │             │
│              │                                    │             │
│              │  ┌ ─ Error Banner (if login fails)  │             │
│              │  │ ❌ Invalid credentials            │             │
│              │  └ ─                               │             │
│              │                                    │             │
│              │  ┌──────────────────────────────┐  │             │
│              │  │      Sign In  →              │  │             │
│              │  └──────────────────────────────┘  │             │
│              │                                    │             │
│              │  🔒 HIPAA Compliant · Encrypted     │             │
│              └────────────────────────────────────┘             │
│                                                                  │
│  Background: subtle hospital pattern / MedCore ochre gradient   │
└──────────────────────────────────────────────────────────────────┘
```

**LoginPage behaviour:**
- Uses `Input` and `Button` design system components from Phase 0
- Show/hide password toggle (eye icon)
- Inline validation before submit (required, valid email format)
- Displays API error as red banner (e.g., *"Invalid credentials"*, *"Account locked until 10:45 AM"*)
- Button shows loading spinner during `isSubmitting` state
- On success: navigates to `state.from.pathname` (where user was trying to go) or `/dashboard`
- If already authenticated: redirects directly to `/dashboard` (no re-login needed)

---

**Task 6.6 — `frontend/src/pages/auth/ForgotPasswordPage.jsx`**

```
Step 1 — Email input:
  "Enter your registered hospital email"
  [email input]
  [Send Reset Link button]

Step 2 — Confirmation state (after API call):
  ✅ "Check your email inbox"
  "We've sent a password reset link to nurse@hospital.com
   The link expires in 30 minutes."
  [← Back to Login]

  (In development: shows the raw reset token for direct testing)
```

---

**Task 6.7 — `frontend/src/pages/auth/ResetPasswordPage.jsx`**

```
Reads token from URL query: /reset-password?token=abc123

Step 1 — Form:
  "Set your new password"
  [New Password input]   (min 8 chars, must have uppercase + number)
  [Confirm Password input]
  [Reset Password button]

Validation:
  - Passwords must match
  - Must meet complexity requirements (shown as live checklist)
  - Token must not be expired (server returns 400 if so)

Step 2 — Success state:
  ✅ "Password reset successful!"
  "You can now log in with your new password."
  [→ Go to Login]
```

---

**Task 6.8 — Update `frontend/src/components/layout/TopBar.jsx`**

Replace placeholder with real user data:

```
┌──────────────────────────────────────────────────────────────────────┐
│  MedCore HMS  ·  Dashboard          🔔 (0)    [ Dr. Ayesha Khan  ▾ ] │
│                                              ┌──────────────────────┐ │
│                                              │ ⚙ Account Settings   │ │
│                                              │ 🔑 Change Password   │ │
│                                              │ ─────────────────── │ │
│                                              │ 🚪 Sign Out          │ │
│                                              └──────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

TopBar now shows:
- Real `user.full_name` from AuthContext
- User's `role` label (e.g., "Doctor · Cardiology")
- Initials avatar (auto-generated from name until photo upload in Phase 18)
- Dropdown menu: Account Settings (Phase 18), Change Password (Phase 1), Sign Out

---

**Task 6.9 — Update `frontend/src/pages/dashboard/DashboardPage.jsx`**

Phase 1 dashboard shows real authenticated user data:

```
┌── Dashboard ──────────────────────────────────────────────────────┐
│                                                                   │
│  Good morning, Dr. Ayesha Khan 👋                                 │
│  Hospital Administrator · MedCore General Hospital                │
│  Last login: 30 Sep 2026, 08:42 AM                                │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │    —     │  │    —     │  │    —     │  │    —     │         │
│  │ Patients │  │ Appts    │  │ Revenue  │  │ Beds     │         │
│  │ (Phase 2)│  │ (Phase 3)│  │ (Phase 9)│  │ (Phase 8)│         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│                                                                   │
│  ┌── System Status ──────────────────────────────────────────┐   │
│  │  ✅ Authentication    ✅ Database      ✅ Role: Admin       │   │
│  │  Phase 1 complete. Awaiting Phase 2 clinical data modules │   │
│  └───────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

---

**Task 6.10 — `frontend/src/pages/errors/UnauthorizedPage.jsx`** — 403 Page

```
┌──────────────────────────────────────────────────┐
│                                                  │
│              🔒  403                            │
│                                                  │
│     You don't have permission to access          │
│     this area of MedCore HMS.                    │
│                                                  │
│     Your role: Nurse                             │
│     Required role(s): Admin, Accountant          │
│                                                  │
│     [← Back to Dashboard]   [Contact Admin]      │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### STEP 7 — Update App.js & Mount Routes

**Task 7.1 — Update `backend/src/app.js`**

```js
// Add cookie parser (needed for httpOnly refresh token cookie)
npm install cookie-parser
```

```js
const cookieParser = require('cookie-parser');
const authRouter = require('./modules/auth/auth.routes');
const usersRouter = require('./modules/users/users.routes');

app.use(cookieParser());

// API Routes
app.use('/api/auth',  authRouter);
app.use('/api/users', usersRouter);  // admin only — protected internally
```

---

### STEP 8 — Role Permission Matrix Reference

Use this table across **all future phases** when adding route protection:

| Route / Feature | admin | doctor | nurse | receptionist | pharmacist | lab_tech | accountant |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Manage system users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View all patients | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Create/edit patient | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Conduct consultation / EMR | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Issue prescriptions | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Record vitals (nursing) | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Dispense pharmacy stock | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Enter lab results | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Create / view invoices | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| View analytics reports | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage hospital settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## ✅ Phase 1 Acceptance Criteria (Definition of Done)

| # | Criteria | How to Verify |
| :--- | :--- | :--- |
| **B1** | `POST /api/auth/login` returns `accessToken` + sets refresh cookie | Postman: correct credentials return 200 with token |
| **B2** | Wrong password returns 401 with generic message | Postman: wrong password returns `Invalid credentials` |
| **B3** | 5 failed logins lock the account for 30 minutes | Postman: 5th failure returns `Account locked until HH:MM` |
| **B4** | `GET /api/auth/me` works with valid Bearer token | Postman: returns logged-in user data |
| **B5** | `POST /api/auth/refresh` issues new access token silently | Postman with refresh cookie: returns new `accessToken` |
| **B6** | `POST /api/auth/logout` revokes refresh token in DB | DB check: `SELECT is_revoked FROM refresh_tokens` = true |
| **B7** | `POST /api/auth/forgot-password` always returns generic message | Same response for real and fake emails |
| **B8** | `POST /api/auth/reset-password` works within 30-minute window | Submit valid token + new password → 200 success |
| **B9** | Expired/invalid reset token returns 400 | Submit old or random token → 400 error |
| **B10** | Admin-only `POST /api/users` rejects doctor/nurse token | Postman with doctor token → 403 Forbidden |
| **F1** | `/login` page submits and navigates to `/dashboard` on success | Browser test with seeded admin credentials |
| **F2** | Wrong credentials show inline error banner | Submit wrong password → red error banner appears |
| **F3** | Loading spinner appears during API call | Slow network → button shows spinner |
| **F4** | Visiting `/dashboard` without login redirects to `/login` | Clear storage → direct URL → redirected |
| **F5** | After login, refresh the page and stay logged in | JWT stored → page refresh → still on dashboard |
| **F6** | TopBar shows real user's name and role | After login → TopBar shows "Dr. Ayesha Khan · Admin" |
| **F7** | Logout clears auth state and redirects to `/login` | Click Sign Out → redirected, dashboard inaccessible |
| **F8** | Token auto-refresh works silently | Wait for 15min access token expiry → app continues working |
| **F9** | 403 page shows for wrong role route | Navigate role-protected URL with wrong role → 403 page |
| **F10** | Forgot password page sends request and shows confirmation | Submit email → confirmation state renders |

---

## 🔒 Security Checklist

| Security Measure | Status | Implementation |
| :--- | :---: | :--- |
| Passwords hashed with bcrypt (12 rounds) | 🎯 | `auth.service.js → login, createUser` |
| JWT secrets are long random strings (64+ bytes) | 🎯 | `.env → JWT_ACCESS_SECRET, JWT_REFRESH_SECRET` |
| Access tokens expire in 15 minutes | 🎯 | `jwt.sign({ expiresIn: '15m' })` |
| Refresh tokens stored as httpOnly cookie | 🎯 | `res.cookie({ httpOnly: true })` |
| Refresh tokens are rotated on every use | 🎯 | Old token revoked, new token issued each refresh |
| All refresh tokens revoked on password change | 🎯 | `DELETE FROM refresh_tokens WHERE user_id = $1` |
| Account lockout after 5 failed login attempts | 🎯 | `failed_login_attempts` counter in DB |
| Password reset tokens stored as SHA-256 hash | 🎯 | Raw token sent by email, hash stored in DB |
| Password reset tokens expire in 30 minutes | 🎯 | `password_reset_expires TIMESTAMPTZ` |
| Forgot password reveals nothing about email existence | 🎯 | Always returns same generic message |
| No password_hash ever returned in API responses | 🎯 | All service functions strip `password_hash` from output |
| Role verification on every protected endpoint | 🎯 | `authorize()` middleware |

---

## 📌 Phase 1 Commit Message

```
feat(phase-1): implement full authentication system and RBAC for MedCore HMS

Backend:
- Add bcryptjs password hashing (12 salt rounds) and jsonwebtoken signing
- Implement POST /api/auth/login with account lockout after 5 failed attempts
- Implement POST /api/auth/refresh with httpOnly cookie and refresh token rotation
- Implement POST /api/auth/logout with refresh token revocation
- Implement GET /api/auth/me with live DB user verification
- Implement forgot-password and reset-password flows with 30-min expiring SHA-256 hashed tokens
- Implement PUT /api/auth/change-password with full session revocation
- Create authenticate.js JWT verification middleware
- Create authorize.js role-based access control middleware
- Add admin-only user management CRUD module (POST/GET/PUT/PATCH /api/users)
- Run migration 002: add password_reset_token, lockout columns to users table
- Seed default hospital admin account

Frontend:
- Build LoginPage with show/hide password, loading state, and inline error handling
- Build ForgotPasswordPage and ResetPasswordPage with password strength checklist
- Update AuthContext to connect to real backend with silent token refresh
- Configure Axios interceptors for 401 auto-refresh and retry
- Build UnauthorizedPage (403) for role-guard violations
- Update TopBar with real user name, role badge, and logout dropdown
- Update DashboardPage to display authenticated user details and system status
```

---

## ➡️ What Phase 1 Unlocks for Phase 2

Once Phase 1 is complete, **Phase 2 (Hospital Core)** can immediately use:

- ✅ `authenticate` middleware — every new route adds this one import
- ✅ `authorize('admin', ...)` — every new route restricts by role immediately
- ✅ `req.user.hospital_id` — all Phase 2+ data is automatically scoped to the correct hospital (multi-tenant ready)
- ✅ `req.user.id` + `req.user.role` — audit logs in every Phase 2+ service can write who did what
- ✅ `users` table with real staff accounts — doctors added via Phase 1 user management are ready for Phase 2 doctor profiles
- ✅ Frontend `useAuth()` hook — every new page reads `user.role` to show/hide UI sections
- ✅ Frontend `ProtectedRoute` — every new Phase 2 route wraps itself and works automatically
