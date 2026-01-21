# vibeLink 🔗

[![Vibe with Gemini](https://img.shields.io/badge/Vibe%20with-Gemini-8E44AD?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)
[![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular)](https://angular.io/)
[![Bun](https://img.shields.io/badge/Bun-1.0-000000?style=for-the-badge&logo=bun)](https://bun.sh/)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-17-2196F3?style=for-the-badge&logo=primeng)](https://primeng.org/)

**vibeLink** is a modern, full-stack URL shortener designed for performance, observability, and ease of use. Built with the cutting-edge power of **Bun**, **Elysia**, and **Angular 21**.

## 🚀 Features

-   **⚡ High-Performance Redirects:** Powered by Bun and Elysia for sub-millisecond response times.
-   **📊 Advanced Analytics:** Track clicks, unique visitors, device types, browsers, OS, and referrers.
-   **🕵️ System Observability:** Built-in system logs dashboard to monitor server health and activity.
-   **🎨 Modern Admin UI:** Beautiful, responsive interface built with PrimeNG and PrimeFlex.
-   **⏱️ Smart Redirects:** Configure intermediate "landing" pages with countdown timers for ads or notices.
-   **🛡️ Link Management:** Full CRUD capabilities with instant active/inactive toggling.
-   **🎲 Auto-Aliases:** One-click generation of secure, 8-character alphanumeric short codes.
-   **📦 Data Portability:** Export analytics to CSV and reset link statistics on demand.

## 🛠️ Tech Stack

*   **Frontend:** Angular 21, PrimeNG, Signals
*   **Backend:** Bun, Elysia.js
*   **Database:** SQLite, Prisma ORM
*   **Styling:** PrimeFlex, SCSS

## 🏁 Getting Started

### Quick Start (Recommended)

Run the entire stack with a single command. This orchestrator handles port configuration and starts both services.

```bash
bun start
```
*   **Admin UI:** `http://localhost:4200`
*   **API/Redirects:** `http://localhost:3000`

### Manual Setup

If you prefer running services individually:

**1. Backend**
```bash
cd server
bun install
bunx prisma migrate dev
bun run dev
```

**2. Frontend**
```bash
cd client
npm install
npm start
```

## 📝 Configuration

You can customize the ports using environment variables:

```bash
SERVER_PORT=3001 CLIENT_PORT=4300 bun start
```

## 📄 License

MIT
