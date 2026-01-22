# vibeLink - Project Context

## Project Overview

**vibeLink** is a professional-grade, full-stack URL shortener. It features advanced visitor analytics, system observability, user management, and a modern admin interface.

### Architecture
- **Client:** Angular 21 with PrimeNG. Uses Standalone Components, Signals, and a "Registration-style" form layout with a colored top bar (Blue-700).
- **Server:** Bun runtime with Elysia.js. High-performance API with built-in request logging, analytics, and authentication.
- **Database:** SQLite with Prisma ORM.

## Key Features

### Link Management
- **Shortening:** Create short links with custom aliases or auto-generated 8-char codes.
- **QR Codes:** Generate and download QR codes for any link directly from the dashboard.
- **Advanced Analytics:** Captures IP, Browser, OS, Device type, and Referrer.
- **Visual Charts:** Traffic trends (Line Chart) and Device distribution (Doughnut Chart) powered by Chart.js.
- **Custom Redirection:** 
    - **Admins:** Can configure intermediate landing pages with custom delays.
    - **Users:** Enforced 5-second intermediate page delay (configurable by admin).
- **Link Expiration:** Set `Expiration Date` and `Max Clicks` limits for links.
- **Data Portability:** Export visit logs to CSV and reset statistics.

### User Management (RBAC)
- **Role-Based Access:** 
    - **Admin:** Full access to all links (`/admin/links`), user management (`/users/manage`), and system logs.
    - **User:** Restricted access. Can only view/manage their own links. Cannot delete account.
- **User CRUD:** Admins can Create, List, Update, and Delete users.
- **Password Policy:** 
    - Enforced complexity (Upper, Lower, Number, Special, Min 8 chars).
    - Forced password change on first login or after admin reset.
    - History check (cannot reuse current password).
- **Password Reset:** Admins can reset user passwords to a default (`InitPass123!`).

### System Observability
- **System Logs:** Dedicated dashboard to monitor server activity and debug messages.

### Performance
- **Caching:** In-memory LRU cache for instant redirects (`lru-cache`).
- **Batched Writes:** Analytics logs are buffered and flushed to the database in batches to reduce I/O.
- **Indexes:** Optimized database indexes on `userId` and `linkId`.

## Project Structure

```text
D:\Work\vibeLink\
├── client/                # Angular Frontend
│   ├── src/
│   │   ├── app/           # Core logic 
│   │   │   ├── admin-links.ts      # Admin view for all system links
│   │   │   ├── user-maintenance.ts # User CRUD component
│   │   │   ├── dashboard.ts        # Main user dashboard (Charts, Tables)
│   │   │   ├── link.service.ts     # API Client for links
│   │   │   └── ...
│   │   └── environments/  # Dynamic URL configurations
│   └── angular.json       # Build & budget settings
└── server/                # Bun + Elysia Backend
    ├── prisma/            # Schema (User, Link, LinkLog, SystemConfig)
    ├── index.ts           # Server entry point (Caching, Batched Logs)
    ├── link-management.ts # Link CRUD & Redirect Logic
    ├── user-management.ts # User CRUD & Auth Logic
    └── package.json       # Dev & build scripts
```

## Getting Started

### Easy Start (Recommended)
Run the entire stack with a single command. This handles port configuration and starts both the server and client.

```bash
bun start
```
*   **Server Port:** Default 3000 (Configurable via SERVER_PORT env)
*   **Client Port:** Default 4200 (Configurable via CLIENT_PORT env)

### Default Credentials
*   **Email:** `admin@vibelink.local`
*   **Initial Password:** `AdminPassword123!` (Forces change on first login)

### Manual Setup (Advanced)

If you prefer to run services individually:

### 1. Backend Setup (Server)
```bash
cd server
bun install
bunx prisma migrate dev
bun run dev  # Starts server with --watch mode
```
*API runs on `http://localhost:3000`*

### 2. Frontend Setup (Client)
```bash
cd client
npm install
npm start    # Starts Angular dev server
```
*Admin UI runs on `http://localhost:4200`*

## Development Conventions

### Client (Angular)
- **UI:** Registration-style grid forms (PrimeNG Dialogs). Top Bar: `bg-blue-700` text-white.
- **State:** Signals for links, logs, and dialog states.
- **Auth:** `AuthService` handles session and role checks (`AdminGuard`, `AuthGuard`).
- **Error Handling:** Inline `p-message` in dialogs for validation errors, plus global Toasts.

### Server (Bun/Elysia)
- **Modularization:** Routes split into `link-management.ts` and `user-management.ts`.
- **Logging:** Use `logSystem(message, level, context)` for database-backed debugging.
- **Security:** Strict ownership checks on PUT/DELETE operations.
- **Database:** Prisma ORM with SQLite. `SystemConfig` table for dynamic settings.

## Important URLs
- **Admin UI:** `http://localhost:4200`
- **Redirect Base:** `http://localhost:3000`
- **System Logs API:** `http://localhost:3000/api/system-logs`