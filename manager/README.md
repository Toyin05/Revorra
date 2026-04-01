# Revorra — Full-Stack Earning Platform

> **For Kilo AI / any new session:** This README contains everything you need to understand the Revorra project — architecture, features, current status, known bugs, and how to continue development. Read this fully before making any changes.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Tech Stack](#tech-stack)
4. [Deployed URLs](#deployed-urls)
5. [Local Development Setup](#local-development-setup)
6. [Environment Variables](#environment-variables)
7. [Database](#database)
8. [Features Built](#features-built)
9. [API Endpoints](#api-endpoints)
10. [Frontend Architecture](#frontend-architecture)
11. [Current Status & Known Bugs](#current-status--known-bugs)
12. [Workflow & Conventions](#workflow--conventions)

---

## Project Overview

Revorra is a mobile-first earning platform where users earn Euros by completing tasks, referring friends, playing games, and sharing sponsored posts. Users withdraw their earnings via bank transfer after obtaining a coupon code from admin via WhatsApp/Telegram.

**Three separate apps in one monorepo:**
- `revorra-backend` — REST API (Node.js + Express + Prisma)
- `users` — User-facing React frontend
- `manager` — Admin dashboard React frontend

**GitHub:** `https://github.com/Toyin05/Revorra.git`

---

## Project Structure

```
C:\Users\pc\Documents\Projects\Revorra\
├── revorra-backend/          # Node.js + Express + Prisma backend
│   ├── prisma/
│   │   ├── schema.prisma     # Full DB schema
│   │   └── migrations/       # Migration history
│   ├── src/
│   │   ├── app.js            # Express app, route registration, CORS
│   │   ├── server.js         # Server entry point
│   │   ├── config/
│   │   │   └── prisma.js     # Prisma client singleton
│   │   ├── controllers/
│   │   │   └── authController.js
│   │   ├── middlewares/
│   │   │   └── authMiddleware.js  # authenticateToken, requireAdmin
│   │   ├── routes/
│   │   │   ├── adminRoutes.js     # All /api/admin/* routes
│   │   │   ├── authRoutes.js      # /api/auth/*
│   │   │   ├── taskRoutes.js      # /api/tasks/*
│   │   │   ├── walletRoutes.js    # /api/wallet/*
│   │   │   ├── withdrawalRoutes.js # /api/withdrawals/*
│   │   │   ├── couponRoutes.js    # /api/coupons/*
│   │   │   ├── gameRoutes.js      # /api/games/*
│   │   │   ├── vtuRoutes.js       # /api/vtu/*
│   │   │   ├── referralRoutes.js  # /api/referrals/*
│   │   │   └── announcementRoutes.js # /api/announcements/*
│   │   └── services/
│   │       ├── walletService.js   # creditWallet(), debitWallet()
│   │       ├── referralService.js # distributeReferralRewards()
│   │       └── vtuService.js      # TopupWizard API integration
│   ├── .env                  # Local env vars (DO NOT COMMIT)
│   └── package.json
│
├── users/                    # User-facing React frontend
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js          # Authenticated axios instance
│   │   │   ├── authApi.ts        # register, login, getProfile
│   │   │   ├── taskApi.js        # getTasks, completeTask
│   │   │   ├── walletApi.js      # getWallet, getTransactions
│   │   │   ├── withdrawalApi.js  # submitWithdrawal, getHistory
│   │   │   ├── couponApi.js      # getCouponLink
│   │   │   ├── gameApi.js        # spin, tictactoe, getStatus
│   │   │   ├── vtuApi.js         # airtime, data, history
│   │   │   └── referralApi.js    # getReferrals, getMyReferrals
│   │   ├── components/
│   │   │   ├── app-sidebar.tsx   # Main navigation sidebar
│   │   │   ├── BackButton.tsx    # Dynamic back arrow button
│   │   │   └── DashboardLayout.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # User auth state, login, register, logout
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx     # Home dashboard with balances
│   │   │   ├── Tasks.tsx         # Task list + complete task
│   │   │   ├── Sponsored.tsx     # Sponsored posts
│   │   │   ├── Referrals.tsx     # Referral link + stats + list
│   │   │   ├── Withdraw.tsx      # Withdrawal form (redesigned)
│   │   │   ├── History.tsx       # Transaction history
│   │   │   ├── SpinWin.tsx       # Spin the wheel game
│   │   │   ├── TicTacToe.tsx     # TicTacToe game
│   │   │   ├── VTU.tsx           # Airtime/Data purchase
│   │   │   ├── Profile.tsx       # User profile
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx      # Reads ?ref= param for referral auto-fill
│   │   └── App.tsx               # Routes
│   ├── .env                  # VITE_API_URL=http://localhost:5000/api
│   ├── vercel.json           # SPA routing fix
│   └── package.json
│
└── manager/                  # Admin dashboard React frontend
    ├── src/
    │   ├── api/
    │   │   ├── adminAxios.js     # Admin authenticated axios instance
    │   │   ├── statsApi.js
    │   │   ├── usersAdminApi.js  # getUsers, getUserDetails, suspendUser, deleteUser
    │   │   ├── taskAdminApi.js
    │   │   ├── taskApprovalApi.js # approveCompletion, rejectCompletion
    │   │   ├── withdrawalAdminApi.js
    │   │   ├── couponAdminApi.js  # getCouponLink, updateCouponLink
    │   │   ├── announcementAdminApi.js
    │   │   └── settingsApi.js
    │   ├── components/
    │   │   ├── AdminSidebar.tsx
    │   │   └── AdminRoute.jsx    # Protects admin routes
    │   ├── context/
    │   │   └── AdminAuthContext.tsx
    │   └── pages/
    │       ├── AdminDashboardPage.tsx
    │       ├── AdminUsersPage.tsx     # Users table + view/suspend/delete
    │       ├── AdminTasksPage.tsx     # Task completions + approve/reject
    │       ├── AdminWithdrawalsPage.tsx
    │       ├── AdminCouponsPage.tsx   # Coupon link manager + generate codes
    │       ├── AdminAnnouncementsPage.tsx
    │       ├── AdminSettings.tsx      # TopupWizard token, EUR/NGN rate
    │       └── AdminRegister.tsx
    ├── .env                  # VITE_API_URL=http://localhost:5000/api
    ├── vercel.json           # SPA routing fix
    └── package.json
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js (ESM modules) |
| ORM | Prisma v5.22.0 |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) |
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| HTTP Client | Axios |
| VTU Provider | TopupWizard API |
| Deployment | Railway (backend), Vercel (frontends) |

---

## Deployed URLs

| Service | URL |
|---------|-----|
| Backend API | `https://revorra-production.up.railway.app` |
| Users Frontend | `https://revorra.vercel.app` |
| Admin Dashboard | `https://revorra-admin.vercel.app` |

---

## Local Development Setup

### Prerequisites
- Node.js v18+
- PostgreSQL running locally (password: `12345678`)
- Local database: `revorra` on port 5432

### Start Backend
```powershell
cd C:\Users\pc\Documents\Projects\Revorra\revorra-backend
npx kill-port 5000
npm run dev
```
Server runs on `http://localhost:5000`

### Start Users Frontend
```powershell
cd C:\Users\pc\Documents\Projects\Revorra\users
npm run dev
```
Runs on `http://localhost:8080`

### Start Admin Dashboard
```powershell
cd C:\Users\pc\Documents\Projects\Revorra\manager
npm run dev
```
Runs on `http://localhost:5173`

### Prisma Studio (DB GUI)
```powershell
cd C:\Users\pc\Documents\Projects\Revorra\revorra-backend
npx prisma studio
```
Opens at `http://localhost:5555`

### Push Schema Changes to Railway DB
```powershell
cd C:\Users\pc\Documents\Projects\Revorra\revorra-backend
$env:DATABASE_URL="postgresql://postgres:sUTwVZIEAEKemhleqTuPeMjGCfmWExcX@centerbeam.proxy.rlwy.net:25519/railway"
npx prisma db push
```

---

## Environment Variables

### `revorra-backend/.env` (Local)
```env
PORT=5000
NODE_ENV=development

# Local Database
DATABASE_URL="postgresql://postgres:12345678@localhost:5432/revorra?schema=public"

# JWT
JWT_SECRET=super_secure_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Admin defaults
ADMIN_EMAIL=admin@revorra.com
ADMIN_PASSWORD=hashed_password_here

# VTU - TopupWizard
TOPUPWIZARD_TOKEN=TW_lae1uinjmovc6an5yje8m0hbhfp5b0
TOPUPWIZARD_BASE_URL=https://topupwizard.com/api
EUR_TO_NGN_RATE=1600

# CORS
FRONTEND_URL=http://localhost:8080
ADMIN_URL=http://localhost:5173
```

### Railway Environment Variables (Production Backend)
```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:sUTwVZIEAEKemhleqTuPeMjGCfmWExcX@centerbeam.proxy.rlwy.net:25519/railway
JWT_SECRET=super_secure_secret_key_change_in_production
JWT_EXPIRES_IN=7d
TOPUPWIZARD_TOKEN=TW_lae1uinjmovc6an5yje8m0hbhfp5b0
TOPUPWIZARD_BASE_URL=https://topupwizard.com/api
EUR_TO_NGN_RATE=1600
FRONTEND_URL=https://revorra.vercel.app
ADMIN_URL=https://revorra-admin.vercel.app
```

### `users/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

### `manager/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

### Vercel Environment Variables (Both Frontends)
```
VITE_API_URL=https://revorra-production.up.railway.app/api
```

---

## Database

### Connection Strings
- **Local:** `postgresql://postgres:12345678@localhost:5432/revorra`
- **Railway (Production):** `postgresql://postgres:sUTwVZIEAEKemhleqTuPeMjGCfmWExcX@centerbeam.proxy.rlwy.net:25519/railway`

### Key Tables

| Table | Description |
|-------|-------------|
| `users` | All registered users including admins |
| `wallets` | One wallet per user with 3 balance types |
| `tasks` | Tasks created by admin |
| `task_completions` | User task submissions (PENDING/APPROVED/REJECTED) |
| `sponsored_shares` | Sponsored post completions |
| `referrals` | Referral relationships between users |
| `transactions` | All wallet credit/debit records |
| `withdrawal_requests` | User withdrawal requests |
| `coupons` | Generated coupon codes |
| `coupon_requests` | Old coupon request flow (being phased out) |
| `vtu_transactions` | Airtime/data purchase records |
| `game_plays` | Game play history and rewards |
| `announcements` | Admin-created popup announcements |
| `user_activities` | User activity log |
| `devices` | Device fingerprints for fraud detection |
| `platform_settings` | Key-value store for dynamic config (EUR/NGN rate, TopupWizard token, coupon redirect link) |

### Important `platform_settings` Keys
| Key | Description |
|-----|-------------|
| `EUR_TO_NGN_RATE` | Euro to Naira conversion rate (default: 1600) |
| `TOPUPWIZARD_TOKEN` | TopupWizard API token |
| `COUPON_REQUEST_LINK` | WhatsApp/Telegram link for coupon requests |
| `PLATFORM_NAME` | Platform display name |

### Wallet Types
Each user has one `Wallet` record with these fields:
- `referralBalance` — earned from referrals
- `taskBalance` — earned from tasks and sponsored posts
- `onehubBalance` — earned from games + welcome bonus, also used for VTU
- `lockedReferralBalance`, `lockedTaskBalance`, `lockedOnehubBalance` — locked amounts

---

## Features Built

### Authentication
- Register with email, username, password, optional referral code
- Login with email or username + password
- JWT token-based auth (7-day expiry)
- Admin registration at `POST /api/auth/admin/register`
- Welcome bonus of €1.50 credited to OneHub wallet on registration

### Referral System
- Username IS the referral code
- Direct referral reward: €0.50 (Referral wallet)
- Indirect referral reward: €0.20 (Referral wallet)
- Referral link: `{origin}/register?ref={username}`
- Register page auto-fills referral code from `?ref=` URL param

### Task Engine
- Admin creates tasks with title, description, reward (€), link, task type (REGULAR/SPONSORED)
- Users see tasks, visit link, upload proof (image or text link)
- Admin reviews proof in admin dashboard and approves/rejects
- On approval: task reward credited to Task wallet
- Task cooldown and daily limit fraud protection

### Sponsored Posts
- Same as tasks but type SPONSORED
- User shares a WhatsApp link/message as proof

### Wallet System
- 3 wallets per user: Referral (€), Task (€), OneHub (€)
- All amounts stored and displayed in Euros
- Total balance = sum of all 3 wallets

### Coupon & Withdrawal Flow (NEW FLOW)
1. User opens Withdraw page
2. User selects wallet (Referral, Task, or OneHub)
3. User enters amount (must meet minimum)
4. User clicks "Get Coupon Code" → redirected to WhatsApp/Telegram (link set by admin)
5. User chats admin, admin generates coupon code from admin dashboard
6. Admin sends code to user via WhatsApp/Telegram
7. User enters coupon code + bank details on Withdraw page
8. User clicks Cashout → withdrawal request sent to admin
9. Admin approves/rejects/marks as paid in admin dashboard

**Withdrawal minimums:**
- Task wallet: €89
- Referral wallet: €35
- OneHub wallet: €16

**No withdrawal PIN** — removed by client request (users forget it)

**One coupon unlocks all 3 wallet types** — no wallet-type restriction on coupon

### Games
- **Spin the Wheel:** 2 plays/day, rewards €0, €0.20, €0.30, €0.40, or €0.50 (40% chance of €0), credited to OneHub wallet
- **TicTacToe:** 2 plays/day, win = €0.10-€0.30 reward, AI is easy (70% random moves)
- Game plays tracked per day, reset at midnight

### Announcements
- Admin creates popup announcements with title, message, image (optional), CTA link
- Users see announcements on dashboard load
- Amounts in announcements use € (Euro), NOT ₦ (Naira)

### VTU (Airtime & Data)
- Real integration with TopupWizard API
- Networks: MTN, Airtel, Glo, 9Mobile
- Airtime amounts: ₦100 (€0.06), ₦200 (€0.13), ₦500 (€0.31), ₦1000 (€0.63), ₦2000 (€1.25), ₦5000 (€3.13)
- Deducts from OneHub wallet
- Real-time delivery confirmed
- TopupWizard wallet balance: ₦493 (as of March 2026)
- TopupWizard token: `TW_lae1uinjmovc6an5yje8m0hbhfp5b0`
- TopupWizard webhook endpoint: `POST /api/vtu/webhook` (for transaction status updates)

### Admin Features
- Dashboard stats: total users, total earnings, pending tasks, pending withdrawals
- Users management: view all users, view details modal, suspend/unsuspend, delete user
- Task management: view completions, approve with wallet credit, reject
- Withdrawal management: view requests, approve, reject, mark as paid
- Coupon management: generate codes, set WhatsApp/Telegram redirect link
- Announcement management: create, edit, delete popups
- Settings: update TopupWizard token, EUR/NGN rate (stored in `platform_settings` DB table)

### Fraud Protection
- Daily earning limit: €5 per user
- Task cooldown between completions
- IP address tracking on registration
- Device fingerprint tracking
- Suspicious user flagging

---

## API Endpoints

All routes prefixed with `/api`.

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | None | Register new user |
| POST | `/auth/login` | None | Login |
| GET | `/auth/me` | User | Get current user + wallet |
| POST | `/auth/admin/register` | None | Register admin account |

**Register body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "phone": "08012345678",
  "referralCode": "referrer_username",
  "deviceFingerprint": "unique-device-id"
}
```

### Tasks
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/tasks` | User | Get all active tasks |
| GET | `/tasks/:id` | User | Get single task |
| POST | `/tasks/:id/complete` | User | Submit task completion |
| GET | `/tasks/history` | User | Get user's task history |

**Complete task body:**
```json
{
  "proof": "https://proof-link.com or base64 image"
}
```

### Wallet
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/wallet` | User | Get wallet balances |
| GET | `/wallet/transactions` | User | Get transaction history |

### Withdrawals
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/withdrawals` | User | Submit withdrawal request |
| GET | `/withdrawals/history` | User | Get withdrawal history |

**Withdrawal body:**
```json
{
  "walletType": "TASK",
  "amount": 89.00,
  "couponCode": "COUP-XXXX",
  "method": "bank_transfer",
  "bankName": "GTBank",
  "accountNumber": "0123456789",
  "accountName": "John Doe"
}
```

### Games
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/games/spin` | User | Play spin wheel |
| GET | `/games/spin/status` | User | Get spin plays remaining today |
| POST | `/games/tictactoe` | User | Play TicTacToe |
| GET | `/games/tictactoe/status` | User | Get TicTacToe plays remaining |
| GET | `/games/history` | User | Game play history |

### VTU
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/vtu/tw-balance` | User | Get TopupWizard wallet balance |
| GET | `/vtu/data-plans/:network` | User | Get data plans for network |
| POST | `/vtu/validate-mobile` | User | Validate phone number |
| POST | `/vtu/airtime` | User | Purchase airtime |
| POST | `/vtu/data` | User | Purchase data |
| POST | `/vtu/webhook` | None | TopupWizard webhook |
| GET | `/vtu/history` | User | VTU transaction history |

**Airtime body:**
```json
{
  "network": "MTN",
  "phoneNumber": "08012345678",
  "amount": 0.313
}
```

### Referrals
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/referrals` | User | Get referral stats |
| GET | `/referrals/my-referrals` | User | Get list of referred users |

### Announcements
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/announcements/active` | User | Get active announcements |

### Settings (Public)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/settings/coupon-link` | None | Get coupon redirect link |

### Admin Routes (all require Admin JWT)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin/stats` | Dashboard stats |
| GET | `/admin/revenue` | Revenue analytics |
| GET | `/admin/users` | All users list |
| GET | `/admin/users/:id` | Single user details |
| DELETE | `/admin/users/:id` | Delete user (cascades all related data) |
| PATCH | `/admin/users/:id/suspend` | Toggle user suspension |
| GET | `/admin/tasks` | All tasks |
| POST | `/admin/tasks` | Create task |
| PATCH | `/admin/tasks/:id` | Edit task |
| DELETE | `/admin/tasks/:id` | Delete task |
| GET | `/admin/task-completions` | All task completions |
| POST | `/admin/task-completions/:id/approve` | Approve task + credit wallet |
| POST | `/admin/task-completions/:id/reject` | Reject task |
| GET | `/admin/withdrawals` | All withdrawal requests |
| POST | `/admin/withdrawals/:id/approve` | Approve withdrawal |
| POST | `/admin/withdrawals/:id/reject` | Reject withdrawal |
| POST | `/admin/withdrawals/:id/paid` | Mark withdrawal as paid |
| GET | `/admin/coupons` | All generated coupons |
| POST | `/admin/coupons` | Generate new coupon code |
| GET | `/admin/coupon-link` | Get coupon redirect link |
| POST | `/admin/coupon-link` | Update coupon redirect link |
| GET | `/admin/announcements` | All announcements |
| POST | `/admin/announcements` | Create announcement |
| PATCH | `/admin/announcements/:id` | Edit announcement |
| DELETE | `/admin/announcements/:id` | Delete announcement |
| GET | `/admin/settings` | Get platform settings |
| POST | `/admin/settings` | Update platform settings |
| GET | `/admin/vtu/transactions` | All VTU transactions |
| GET | `/admin/fraud/suspicious-users` | Flagged users |

---

## Frontend Architecture

### Users Frontend (`users/`)

**Axios instance** (`src/api/axios.js`):
```javascript
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
// Interceptor adds: Authorization: Bearer {token from localStorage}
```

**Auth Context** (`src/context/AuthContext.tsx`):
- Stores `user` and `wallet` state
- `register(data)` → calls `/auth/register`, saves token, fetches wallet
- `login(data)` → calls `/auth/login`, saves token, fetches wallet
- `logout()` → clears localStorage
- Auto-fetches wallet on every mount if user is logged in

**Route Protection:** `ProtectedRoute` component checks for token in localStorage

**Key pages:**
- `Register.tsx` — reads `?ref=` param from URL, auto-fills referral code
- `Dashboard.tsx` — shows total balance + 3 wallet balances + recent activity
- `Withdraw.tsx` — redesigned with wallet selector cards, amount input, coupon code input, bank details, "Get Coupon Code" redirect button
- `Referrals.tsx` — referral link uses `window.location.origin` (dynamic, not hardcoded)
- `SpinWin.tsx` — wheel segments: €0, €0.20, €0.30, €0.40, €0.50 only
- `TicTacToe.tsx` — AI makes 70% random moves (easy difficulty)
- `VTU.tsx` — airtime/data purchase with network logos

### Admin Frontend (`manager/`)

**Axios instance** (`src/api/adminAxios.js`):
```javascript
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
// Interceptor adds admin token from localStorage key 'token'
// NO console.log of token (security)
```

**Admin Auth Context** — stores admin user, login/logout
**Route Protection** — `AdminRoute.jsx` checks for admin token and role

**Key pages:**
- `AdminUsersPage.tsx` — users table with Name, Username, Email, Phone, Join Date, balances, Status badge (Active/Suspended), Actions (View modal, Suspend/Unsuspend, Delete with confirmation)
- `AdminTasksPage.tsx` — task completions list, approve/reject with proof viewer
- `AdminCouponsPage.tsx` — Section 1: coupon redirect link manager with platform selector (WhatsApp/Telegram/Other); Section 2: generate coupon codes
- `AdminSettings.tsx` — update TopupWizard token + EUR/NGN rate

---

## Current Status & Known Bugs

### ✅ Working
- User registration and login (local + production)
- JWT auth
- Referral link with dynamic URL + auto-fill on register page
- Task creation from admin
- Task proof submission (image + text)
- Announcement popups
- VTU airtime/data purchase (real TopupWizard integration, tested and confirmed)
- Admin settings (TopupWizard token, EUR/NGN rate)
- History page dates (showing correctly with time)
- Withdrawal page UI redesign (wallet cards, no PIN)
- Admin users table with Join Date
- Admin coupon link manager
- No token exposed in console
- Referral link shows correctly with dynamic origin
- Game status endpoints added (`/games/spin/status`, `/games/tictactoe/status`)
- Backend deployed to Railway
- Both frontends deployed to Vercel
- DB schema pushed to Railway

### ❌ Still Broken / In Progress

**Backend:**
1. **Task approve/reject still returning 400** — the approve endpoint was rewritten but still fails. Likely the `walletService.js` import path or the task status check. Need to check exact error message from Railway logs.

2. **Task complete returning 400** — `POST /api/tasks/:id/complete` fails with 400. Need to debug exact validation error.

**Users Frontend:**
3. **Games 401** — TicTacToe and SpinWin are not using authenticated axios instance. They call backend directly without token. Fix: replace plain `axios` calls with `axiosInstance` in both game pages.

4. **Spin wheel amounts wrong** — still shows €1-€10 instead of €0-€0.50. Needs segment array update.

5. **Welcome bonus not showing immediately** — after login/register, dashboard shows €0.00 until hard refresh. The AuthContext login/register needs to call `GET /api/wallet` immediately after auth and update state.

6. **Referral link double https** — shows `https://http://localhost:8080/...`. Fix: use `window.location.origin` alone (it already includes protocol).

7. **Withdrawal 404** — `POST /api/withdrawals` returns 404 locally. Either `withdrawalRoutes.js` is not registered in `app.js` or the route is `/submit` instead of `/`.

8. **Sponsored post disappears on refresh** — state not persisted, need to fetch from API on mount.

**Admin Frontend:**
9. **User details modal 404** — eye icon calls `GET /api/admin/users/:id` but endpoint may not be properly added yet.

10. **Generate coupon button returning 400** — `POST /api/admin/coupons` body format may be wrong.

11. **Name column shows `-`** — users table Name column empty because `user.full_name` doesn't exist; should use `user.username`.

12. **Phone shows `-`** — backend returns `user.phone` but frontend may not be mapping it.

13. **Coupon Requests page still in sidebar** — needs to be removed from navigation.

### ⚠️ Not Yet Implemented
- Actual bank transfer processing (withdrawal is request-only; admin manually pays)
- TopupWizard webhook URL not set in TopupWizard dashboard (set it to `https://revorra-production.up.railway.app/api/vtu/webhook`)
- NODE_ENV still set to `development` on Railway (should be `production`)

---

## Workflow & Conventions

### Development Flow
1. Make changes locally
2. Test on localhost
3. Push to GitHub: `git add . && git commit -m "message" && git push`
4. Railway auto-deploys backend from GitHub
5. Vercel auto-deploys both frontends from GitHub

### AI Tooling
- **Claude (claude.ai)** — architecture decisions, debugging, generating detailed prompts
- **Kilo AI (inside VS Code)** — actual code implementation from Claude's prompts

### Code Style
- Backend uses ES modules (`import/export`, not `require`)
- All monetary amounts in Euros (float) in database
- All API responses follow format: `{ success: true/false, data: {...}, message: "..." }`
- Prisma model names are PascalCase, DB columns are snake_case

### Important Notes for Kilo AI
- Never use `console.log` to log JWT tokens or sensitive data
- All monetary values are in Euros unless explicitly dealing with TopupWizard (which is Naira)
- `platform_settings` table is a key-value store — use `prisma.platformSetting.upsert()` to set values
- The `PlatformSetting` model must have a `key` field with `@unique` constraint
- When deleting a user, you must delete in this order to avoid FK constraint errors: UserActivity → Device → TaskCompletion → Transaction → VTUTransaction → GamePlay → WithdrawalRequest → CouponRequest → Referral → SponsoredShare → Wallet → User
- TicTacToe AI logic is on the FRONTEND (not backend)
- Spin wheel reward logic is on the BACKEND (`POST /api/games/spin`)
- Games use `playedAt` field (not `createdAt`) for daily play count tracking

### Earning Amounts
| Action | Amount | Wallet |
|--------|--------|--------|
| Welcome bonus | €1.50 | OneHub |
| Direct referral | €0.50 | Referral |
| Indirect referral | €0.20 | Referral |
| Task (varies) | €0.10 - €5.00 | Task |
| Sponsored post (varies) | €0.10 - €5.00 | Task |
| Spin wheel (max) | €0.50 | OneHub |
| TicTacToe win (max) | €0.30 | OneHub |

### Coupon Flow (Current Design)
```
User clicks "Get Coupon Code" on Withdraw page
    ↓
Redirected to WhatsApp/Telegram link (set by admin)
    ↓
User chats admin, requests coupon
    ↓
Admin opens Admin Dashboard → Coupons page
    ↓
Admin generates coupon code
    ↓
Admin sends code to user via WhatsApp/Telegram
    ↓
User enters code on Withdraw page + bank details
    ↓
User clicks Cashout
    ↓
Admin sees withdrawal request in Admin Dashboard → Withdrawals
    ↓
Admin approves and manually transfers money
    ↓
Admin marks as Paid
```

---

## Quick Reference — Common Commands

```powershell
# Kill and restart backend
npx kill-port 5000 && npm run dev

# Kill and restart users frontend  
npx kill-port 8080 && npm run dev

# Kill and restart admin frontend
npx kill-port 5173 && npm run dev

# Push local schema changes to Railway DB
$env:DATABASE_URL="postgresql://postgres:sUTwVZIEAEKemhleqTuPeMjGCfmWExcX@centerbeam.proxy.rlwy.net:25519/railway"
npx prisma db push

# Generate Prisma client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev --name migration_name

# Deploy migrations to Railway
npx prisma migrate deploy
```

---

*Last updated: April 2026 | Platform: Revorra Earning Platform*
