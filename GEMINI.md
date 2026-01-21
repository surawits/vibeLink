# vibeLink - Project Context

## Project Overview

**vibeLink** is a professional-grade, full-stack URL shortener. It features advanced visitor analytics, system observability, and a modern admin interface.

### Architecture
- **Client:** Angular 21 with PrimeNG. Uses Standalone Components, Signals, and a "Registration-style" form layout with a colored top bar.
- **Server:** Bun runtime with Elysia.js. High-performance API with built-in request logging and analytics.
- **Database:** SQLite with Prisma ORM.

## Key Features

- **Advanced Analytics:** Captures IP, Browser, OS, Device type, and Referrer for every redirect.
- **System Observability:** Dedicated "System Logs" dashboard in the UI to monitor server activity and debug messages.
- **Custom Redirection:** Toggle between direct redirects and intermediate "landing" pages with customizable countdown timers.
- **Link Management:** Full CRUD (Create, Read, Update, Delete) with active/inactive status toggling.
- **Data Portability:** Export visit logs to CSV and reset statistics as needed.
- **Auto-Alias:** Built-in 8-character alphanumeric alias generator (~221 trillion combinations).

## Project Structure

```text
D:\Work\vibeLink\
├── client/                # Angular Frontend
│   ├── src/
│   │   ├── app/           # Core logic (app.ts, link.service.ts)
│   │   └── environments/  # Dynamic URL configurations
│   └── angular.json       # Build & budget settings
└── server/                # Bun + Elysia Backend
    ├── prisma/            # Schema (Link, LinkLog, SystemLog)
    ├── index.ts           # API & Logging logic
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

### Quick Help
Run the following to see available commands:
```bash
npm run help
# OR
bun run help
```

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
- **UI:** Registration-style grid forms. Side-by-side Label:Input layout.
- **State:** Signals for links, logs, and dialog states.
- **Service:** `LinkService` manages all API calls and exposes `baseUrl` from environment.
- **Logging:** Extensive `[App]` prefixed console logs for debugging.

### Server (Bun/Elysia)
- **Logging:** Use `logSystem(message, level, context)` for database-backed debugging.
- **Redirects:** Serves custom HTML error pages for 404/403 scenarios.
- **Database:** Transactional reset logic for maintaining data integrity between links and logs.

## Important URLs
- **Admin UI:** `http://localhost:4200`
- **Redirect Base:** `http://localhost:3000`
- **System Logs API:** `http://localhost:3000/api/system-logs`