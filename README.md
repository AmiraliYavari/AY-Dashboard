# AY-Dashboard

A full-stack sales and finance admin dashboard with a Persian (RTL) interface.

**Stack:** React + Vite · Node.js + Express · PostgreSQL (Docker) · TypeScript throughout

## Features

- JWT authentication
- Financial overview: revenue, expenses, net profit, outstanding invoices
- Revenue trend and income-by-category charts
- Invoice management with status filters
- Customer management (create, edit, delete, search)

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Getting Started

### 1. Start the database

```bash
docker compose up -d
```

The `ay_dashboard` database is created and the schema is applied automatically on first start.

### 2. Start the backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

The API runs at `http://localhost:4000` (health check: `/api/health`).

### 3. Start the frontend

In a new terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173` and sign in with the seeded admin account:

| Email | Password |
|---|---|
| `admin@ay-dashboard.local` | `admin123` |

> Change the default password and set a strong `JWT_SECRET` in `backend/.env` before deploying anywhere.

## Project Structure

```
AY-Dashboard/
├── docker-compose.yml     # PostgreSQL service
├── backend/               # Express API (TypeScript)
│   ├── src/               # routes, controllers, middleware
│   └── db/                # schema.sql, seed.ts
└── frontend/              # React app (TypeScript)
    └── src/               # pages, components, context
```

## Useful Commands

| Task | Command |
|---|---|
| Stop the database (data is kept) | `docker compose down` |
| Reset the database completely | `docker compose down -v && docker compose up -d` |
| Type-check the backend | `cd backend && npx tsc --noEmit` |
| Build the backend | `cd backend && npm run build` |
| Build the frontend | `cd frontend && npm run build` |

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Sign in and receive a JWT |
| GET | `/api/dashboard/*` | KPIs, trends, recent transactions, top customers |
| GET/POST/PUT/DELETE | `/api/customers` | Customer CRUD |
| GET/POST/PATCH/DELETE | `/api/invoices` | Invoice CRUD and status updates |

All endpoints except login require an `Authorization: Bearer <token>` header.