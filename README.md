# Vendor Portal

## Overview

Welcome to **vendors-portal** – a full‑stack application built with NestJS for the backend and Next.js for the frontend. This repository contains everything needed to develop, run, and extend the platform.

## Prerequisites

- **Node.js** (>= 18.x) and **npm** (or **yarn**) installed.
- **Docker** (optional, for running a PostgreSQL instance locally).
- **Git** for version control.

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/sharjeel7911/vendors-portal.git
cd vendors-portal
```

### 2. Install dependencies
```bash
# Install root dependencies (shared scripts, linting, etc.)
npm install

# Backend dependencies
cd backend && npm install && cd ..

# Frontend dependencies
cd frontend && npm install && cd ..
```


### 4. Running the application in development mode
```bash
# Terminal 1 – Backend (NestJS)
cd backend
npm run start:dev

# Terminal 2 – Frontend (Next.js)
cd ../frontend
npm run dev
```
The backend will be reachable at `http://localhost:3000` and the frontend at `http://localhost:3001` (or the default Next.js port).

## Where to Put Your Code

- **Backend** – All server‑side code lives under `backend/src/`.  Typical entry points:
  - `src/app.module.ts` – Root module.
  - `src/prisma/` – Prisma service and module for DB access.
  - Create new feature modules under `src/<feature>/` following NestJS conventions.

- **Frontend** – UI code resides in `frontend/src/app/`.
  - Pages are defined in `frontend/src/app/page.tsx` and sub‑routes as folder structures.
  - Re‑usable UI components go into `frontend/src/app/components/`.
  - API calls to the backend should use the `/api` routes provided by the NestJS server.

## Scripts

- `npm run lint` – Lint both backend and frontend.
- `npm run test` – Run unit tests.
- `npm run build` – Build production bundles for both sides.

## Contributing

1. Create a feature branch:
```bash
git checkout -b feature/your-feature-name
```
2. Make your changes and ensure lint/tests pass.
3. Open a Pull Request against `main` with a clear description.

## Helpful Commands

- **Reset database** (useful during development):
```bash
cd backend
npx prisma migrate reset
```
- **Generate Prisma client** after schema changes:
```bash
npx prisma generate
```

---

Happy coding! 🚀
