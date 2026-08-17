# Vendor Portal — Implementation Guide
### Route Optimization & Delivery Management Platform | Devorbits | Stage 2

**Stack:** Next.js (frontend) + NestJS (backend) + Prisma ORM + Supabase (Postgres DB only — **no Supabase Auth**, custom auth in NestJS)
**Repo layout:** single GitHub repo, `frontend/` and `backend/` folders, starter template with Prisma already scaffolded, `DATABASE_URL` already in `.env`.
**Builder:** This guide is written for **Antigravity** to execute phase by phase.

---

## 0. Mandatory Session Protocol (read this every session)

Before writing any code in a session, Antigravity **must**:

1. Read this file (`implementation-guide.md`) in full.
2. Read `work-done.md` (create it if it doesn't exist yet — see format below) to see what's already been done and why.
3. Identify the next incomplete phase and only work on that phase unless told otherwise.
4. At the **end of every phase** (not every session — a phase may span multiple sessions), append a new entry to `work-done.md` before stopping.

### `work-done.md` format

Create this file at the repo root the first time it's needed. Append entries — never delete or rewrite old ones.

```md
# Work Done Log

## Phase X — <phase name>
**Date:** YYYY-MM-DD
**Status:** In Progress / Complete

### What was done
- Bullet list of concrete changes (files created/modified, migrations run, endpoints added)

### Why
- The reasoning behind key decisions made in this phase (e.g. "chose bcrypt over argon2 because
  the starter already has bcryptjs in package.json")

### Deviations from the guide
- Anything done differently than this guide specifies, and why

### Verification performed
- How it was confirmed to work (tests run, manual checks, curl/Postman calls)

### Open items / blockers
- Anything left unresolved for the next session
```

This log is the single source of truth for continuity across sessions — treat it as seriously as the code itself.

---

## 1. Scope Recap (from the Stage 2 SOW)

The Vendor Portal serves **vendors** (delivery businesses) with:

1. **Registration & Profile** — business registration, document submission, admin-approval gate, profile management, subscription plan visibility.
2. **Fleet Management** — drivers and vehicles CRUD, working hours/availability, driver-vehicle assignment.
3. **Order Management** — manual entry, bulk CSV/Excel import (multi-day), address verification with duplicate/error checking, time windows/priority/weight/notes, edit/cancel before dispatch.
4. **Route Optimization** — one-click optimization by time/distance/cost, respects capacity/time windows/hours, clusters same-location stops, map view, manual drag-and-drop adjustment.
5. **Dispatch** — assign routes to drivers, push to Driver App, live re-optimization on new orders/traffic, reassign/cancel.
6. **Live Monitoring** — driver location tracking, stop status (pending/completed/failed/delayed), delay/failure alerts.
7. **Reports** — daily/weekly summaries, driver performance/on-time rate, route efficiency, CSV/PDF export.

**Out of scope for this guide:** Admin Panel (Stage 1, already being built separately) and Driver App (Stage 3). Where the Vendor Portal needs to "push to the Driver App," build the backend endpoint/contract only — assume the Driver App team consumes it.

### Relevant tables (already partially defined by Admin Panel schema — do not redefine ones that already exist; extend/reference them)

| Table | Key fields |
|---|---|
| vendors | id, business_name, contact_person, email, phone, address, plan_id, status, approved_at |
| vendor_users | id, vendor_id, name, email, password, role, status, created_at |
| drivers | id, vendor_id, name, phone, license_no, working_hours, status, current_location |
| vehicles | id, vendor_id, type, capacity, depot, plate_no, status |
| orders | id, vendor_id, customer_name, address, coordinates, time_window, priority, weight, notes, status |
| routes | id, vendor_id, driver_id, vehicle_id, date, total_distance, total_duration, status |
| deliveries | id, route_id, order_id, sequence, eta, delivered_at, proof_url, status |
| notifications | id, vendor_id, recipient_id, type, message, sent_at, status |
| plans | id, name, price, order_limit, features, billing_cycle |
| invoices | id, vendor_id, plan_id, amount, status, issued_at, paid_at |

> ⚠️ Since the Admin Panel (Stage 1) is being built by a different workstream against the same Supabase project, **check the live database schema first** (`npx prisma db pull` or a quick inspection) before creating any table. If `vendors`, `plans`, `invoices`, `drivers`, `vehicles`, or `orders` already exist from Stage 1 work, extend the Prisma schema to match reality rather than assuming this guide's field list is final — reconcile any mismatch and record it in `work-done.md`.

---

## 2. Open Decisions (resolve before/during the relevant phase, log the choice in `work-done.md`)

1. **Route optimization approach** — hand-rolled nearest-neighbor + 2-opt heuristic, an OSS solver (e.g. Google OR-Tools via a Python microservice), or a paid routing API (Mapbox Optimization API / Google Routes API)? Budget/time-constrained student project → default recommendation: start with a simple heuristic in Phase 6, upgrade later if time allows.
2. **Map provider** — Google Maps vs Mapbox vs Leaflet+OpenStreetMap (free). Default recommendation: Leaflet + OpenStreetMap to avoid billing setup, unless the team already has a Google Maps API key.
3. **Geocoding/address verification provider** — Nominatim (free, rate-limited) vs Google Geocoding API vs Mapbox Geocoding.
4. **Real-time updates for Live Monitoring** — WebSockets (NestJS Gateway + Socket.IO) vs polling. Default recommendation: polling every 10–15s for MVP, WebSockets as a stretch goal.
5. **File storage** (vendor documents, logos, delivery proof photos) — Supabase Storage buckets (recommended, since Supabase is already the DB) vs S3.
6. **PDF generation for reports** — `pdfkit`/`puppeteer` (backend-rendered) vs frontend `jspdf`. Default recommendation: backend `puppeteer`/`pdf-lib` so reports are consistent regardless of client.

Antigravity should pick sensible defaults from the above, note the choice and reasoning in `work-done.md` for the relevant phase, and flag it clearly if the team needs to override it.

---

## 3. Phase Plan

Work through these **in order**. Each phase should be fully functional and verified before moving to the next. Do not start Phase N+1 in the same sitting as Phase N without updating `work-done.md` first.

---

### Phase 1 — Environment & Schema Audit

**Objective:** Confirm the starter template is sound and the Prisma schema matches the real Supabase DB before writing any feature code.

- [ ] Confirm `backend/.env` has a working `DATABASE_URL` — run `npx prisma db pull` (or equivalent) against a throwaway schema copy to see what already exists in Supabase from Stage 1 work.
- [ ] Confirm `npx prisma generate` and a basic `npx prisma studio` connection both work.
- [ ] Confirm frontend can hit a NestJS health-check route (`GET /health`) — create one if it doesn't exist.
- [ ] Document Node version, package manager (npm/pnpm/yarn), and confirm both `frontend/` and `backend/` install and run cleanly.

**Verification:** backend boots (`npm run start:dev`), frontend boots (`npm run dev`), Prisma can connect to Supabase.

---

### Phase 2 — Prisma Schema for Vendor-Owned Tables

**Objective:** Model `vendor_users`, `drivers`, `vehicles`, `orders`, `routes`, `deliveries`, `notifications` in Prisma (reusing `vendors`, `plans`, `invoices` if Stage 1 already created them; creating them here only if they don't exist yet).

- [ ] Write/extend `schema.prisma` with all vendor-related models, correct relations (`vendor_users.vendor_id → vendors.id`, `drivers.vendor_id → vendors.id`, etc.), enums for `status` fields (e.g. `VendorStatus { pending, approved, rejected, suspended }`, `OrderStatus`, `RouteStatus`, `DeliveryStatus`).
- [ ] Add indexes on all foreign keys and on frequently filtered fields (`orders.status`, `routes.date`, `vendor_users.email` unique).
- [ ] `password` field on `vendor_users` stores a **bcrypt hash**, never plaintext — name it `password_hash` if you're not bound by the SOW's literal column name, or keep `password` as the column but treat it as a hash in code. Log which you chose.
- [ ] Run migration: `npx prisma migrate dev --name vendor_portal_schema`.
- [ ] Seed a couple of `plans` rows if `plans` is empty (needed for vendor registration to reference a plan).

**Verification:** migration applies cleanly, `prisma studio` shows all tables with correct relations, seed data present.

---

### Phase 3 — Authentication (custom, no Supabase Auth)

**Objective:** Full auth for `vendor_users` — this is the foundation everything else depends on.

**Backend (NestJS):**
- [ ] Install `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcryptjs` (or `bcrypt`), `class-validator`, `class-transformer` if not present.
- [ ] `POST /auth/register` — creates a `vendors` row (status: `pending`) **and** the first `vendor_users` row for that vendor (role: `owner`), hashes the password with bcrypt (cost factor 10–12), validates email uniqueness.
- [ ] `POST /auth/login` — validates email + password against `vendor_users`, checks `vendors.status === 'approved'` (reject with a clear "pending approval" error otherwise), issues a short-lived **access token** (JWT, ~15 min) and a longer-lived **refresh token** (7 days). Store refresh tokens hashed in a `refresh_tokens` table (or reuse a column on `vendor_users`) so they can be revoked.
- [ ] `POST /auth/refresh` — exchanges a valid refresh token for a new access token.
- [ ] `POST /auth/logout` — revokes the refresh token.
- [ ] `JwtStrategy` (Passport) validates the access token and attaches `{ vendor_user_id, vendor_id, role }` to `request.user`.
- [ ] `RolesGuard` + `@Roles('owner', 'staff')` decorator for endpoint-level authorization — vendor `owner` can manage staff/billing, `staff` has restricted access (define the exact split now and record it).
- [ ] A `VendorScopeGuard` (or middleware) that ensures every query for orders/drivers/vehicles/routes is automatically scoped to `request.user.vendor_id` — **no vendor should ever be able to read or write another vendor's data.** This is the most important security boundary in the whole portal; treat it as non-negotiable.
- [ ] Global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true` on all DTOs.
- [ ] Rate-limit `/auth/login` and `/auth/register` (e.g. `@nestjs/throttler`) to blunt brute-force/spam.

**Frontend (Next.js):**
- [ ] Registration page (business + first user details) → calls `/auth/register`, shows a "pending admin approval" state afterward (don't auto-login a pending vendor).
- [ ] Login page → calls `/auth/login`, stores access token in memory/short-lived storage and refresh token in an httpOnly cookie if the backend sets one (preferred) — avoid storing the refresh token in `localStorage`.
- [ ] Auth context/provider + protected route wrapper that redirects unauthenticated users to `/login`.
- [ ] Silent token refresh (axios/fetch interceptor that retries once after a 401 with a refreshed token).

**Verification:** register → still blocked at login until manually flipping `vendors.status` to `approved` in Prisma Studio (simulating admin approval) → login succeeds → protected route returns 401 without a token and 200 with one → confirm vendor A's token cannot read vendor B's data (create two test vendors and try).

---

### Phase 4 — Vendor Profile & Approval-Aware UX

**Objective:** Business profile management and correct UX for the pending/approved/rejected states.

- [ ] `GET /vendors/me`, `PATCH /vendors/me` (name, contact, address, logo — logo upload via Supabase Storage, see decision #5).
- [ ] `GET /vendors/me/plan` — current plan + usage (order count this cycle vs `plan.order_limit`).
- [ ] Frontend: profile page, plan/usage widget, a persistent "pending approval" banner/state if `status !== 'approved'` that blocks the rest of the app.

**Verification:** profile edits persist; a pending vendor cannot reach the dashboard; logo upload round-trips through Supabase Storage.

---

### Phase 5 — Fleet Management (Drivers & Vehicles)

**Objective:** CRUD for the resources routes will later depend on.

- [ ] `drivers`: `POST/GET/PATCH/DELETE /drivers`, working-hours/availability fields, status (`active/inactive`).
- [ ] `vehicles`: `POST/GET/PATCH/DELETE /vehicles`, capacity, depot, plate number, status.
- [ ] Driver↔vehicle assignment endpoint (`PATCH /drivers/:id/assign-vehicle`).
- [ ] All endpoints scoped by `VendorScopeGuard` from Phase 3.
- [ ] Frontend: drivers table + form, vehicles table + form, simple assignment UI.

**Verification:** full CRUD works, list views correctly filter to the logged-in vendor only, cross-vendor access attempts return 403/404.

---

### Phase 6 — Order Management

**Objective:** Get orders into the system reliably, one at a time or in bulk.

- [ ] `POST /orders` — manual single order (customer name, address, time window, priority, weight/size, notes).
- [ ] Address verification/geocoding: call the chosen provider (decision #3) to turn `address` into `coordinates`; flag orders where geocoding fails or is ambiguous for manual review rather than silently guessing.
- [ ] `POST /orders/bulk-import` — CSV/Excel upload (use `csv-parse`/`papaparse` on the backend, or `multer` + a parsing lib), supports **multi-day files in one upload** (a `delivery_date` column per row), validates each row, reports per-row errors (missing fields, bad address, duplicate) without failing the whole batch, and returns a summary (`imported: N, skipped: N, errors: [...]`).
- [ ] Duplicate detection — flag orders with matching customer + address + date as likely duplicates before import commits (soft warning, not a hard block, unless the team decides otherwise).
- [ ] `GET /orders` (filterable by status/date), `PATCH /orders/:id` (edit before dispatch — reject edits once `status = 'dispatched'`), `DELETE /orders/:id` (cancel, soft-delete recommended: set status to `cancelled` rather than removing the row).
- [ ] Frontend: manual order form, CSV upload UI with an import-preview/error table, orders list with filters.

**Verification:** manual order creates and geocodes correctly; a CSV with intentionally bad rows (missing address, duplicate, malformed date) imports the good rows and reports the bad ones clearly; editing a dispatched order is blocked.

---

### Phase 7 — Route Optimization

**Objective:** Turn a set of pending orders into optimized, feasible routes.

- [ ] Build the optimization service per decision #1's chosen approach. At minimum it must respect: vehicle capacity, order time windows, and driver working hours.
- [ ] Cluster same-location stops (e.g. same building/address) into one stop with multiple orders.
- [ ] `POST /routes/optimize` — input: date + optimization criterion (`time`/`distance`/`cost`) + optionally a subset of order IDs; output: proposed `routes` + `deliveries` (sequence, ETA) *not yet dispatched* (status: `draft`).
- [ ] `GET /routes/:id` returns route + ordered stops for map rendering.
- [ ] Frontend: order-selection screen → "Optimize" action → map view (per decision #2) showing the proposed route(s) with stop sequence and ETAs → manual drag-and-drop reordering of stops before confirming.

**Verification:** optimizing a realistic test set (15–30 orders across 2–3 vehicles with a tight capacity) produces routes that don't exceed vehicle capacity or violate time windows; manually re-ordering stops updates ETAs.

---

### Phase 8 — Dispatch

**Objective:** Commit a draft route to a driver and Driver App.

- [ ] `POST /routes/:id/dispatch` — assigns `driver_id`/`vehicle_id`, flips route status `draft → dispatched`, flips associated orders to `dispatched`, and calls/queues the outbound integration point for the Driver App (define this as a clean internal API/event even if the Driver App isn't built yet — e.g. write to a `notifications` row of type `route_dispatched` addressed to that driver, which the Driver App will poll or subscribe to).
- [ ] `POST /routes/:id/reassign` and `POST /routes/:id/cancel`.
- [ ] Re-optimization trigger: when a new order arrives for a date that already has dispatched routes, surface a "re-optimize available" flag rather than silently mutating a live route (a driver may already be en route).
- [ ] Frontend: dispatch confirmation flow, reassign/cancel actions, re-optimize prompt.

**Verification:** dispatching updates order/route status correctly and creates the expected notification record; cancel/reassign work and are reflected immediately in the UI.

---

### Phase 9 — Live Monitoring

**Objective:** Real-time-ish visibility into today's deliveries.

- [ ] `GET /routes/active` — today's dispatched routes with current stop statuses.
- [ ] Driver location updates: since the Driver App isn't built here, expose `PATCH /drivers/:id/location` as the contract the Driver App will call, and consume it on this side (per decision #4: polling vs WebSocket) for a live map.
- [ ] Delivery status transitions (`pending → completed/failed/delayed`) drive alerts: a simple in-app + `notifications` row when a stop is marked `failed` or `delayed` beyond its ETA window.
- [ ] Frontend: live map with driver markers, stop-status list, alert banner/toast for delays/failures.

**Verification:** manually PATCH a driver's location and a delivery's status via Postman while the dashboard is open; confirm the UI reflects it within the chosen refresh interval, and that a failed/delayed status triggers an alert.

---

### Phase 10 — Reports

**Objective:** Turn operational data into exportable summaries.

- [ ] `GET /reports/daily`, `GET /reports/weekly` — delivery counts, on-time rate, per-driver performance, route efficiency (distance/duration/cost).
- [ ] `GET /reports/export?format=csv|pdf` — CSV via straightforward row export; PDF per decision #6.
- [ ] Frontend: reports dashboard with date-range picker, charts (a lightweight lib like `recharts` is fine), export buttons.

**Verification:** numbers in the report match a hand-checked sample from the DB for a known test date range; both export formats download and open correctly.

---

### Phase 11 — Notifications (cross-cutting, if not already covered)

**Objective:** Centralize the `notifications` table usage from earlier phases into a coherent in-app experience.

- [ ] `GET /notifications` (current vendor's, paginated), `PATCH /notifications/:id/read`.
- [ ] Frontend: notification bell/dropdown, unread count.

**Verification:** dispatch, delay, and failed-delivery events from earlier phases all show up here correctly.

---

### Phase 12 — Hardening & Definition of Done

**Objective:** Close out the SOW's acceptance criteria before calling Stage 2 done.

- [ ] Re-verify against the 5 acceptance criteria from the SOW:
  1. A vendor can register, get approved, and log in.
  2. Drivers, vehicles, and orders can be added (including CSV import).
  3. Routes optimize correctly and dispatch to the Driver App (contract-level, since Driver App is Stage 3).
  4. Live monitoring shows accurate delivery status.
  5. Reports export correctly to CSV and PDF.
- [ ] Security pass: confirm `VendorScopeGuard` is applied everywhere, no endpoint leaks another vendor's data, input validation exists on every DTO, secrets aren't committed.
- [ ] Basic automated tests for auth and the vendor-scoping guard at minimum (these are the highest-risk areas).
- [ ] Error handling & loading states across the frontend (no unhandled promise rejections, no blank screens on API errors).
- [ ] Final `work-done.md` entry summarizing the whole Stage 2 build, known limitations, and anything deferred (e.g. WebSockets, paid routing API) as future work.

---

## 4. Working Agreement for Multi-Person Sessions

Since several interns will be running Antigravity against the same repo:

- Pull latest and re-read `work-done.md` before starting any session — don't trust local memory of "what's done."
- One phase per branch/PR where practical (`phase-3-auth`, `phase-6-orders`, etc.) to avoid stepping on each other.
- If two people are working in parallel on independent phases (e.g. one on Fleet Management, one on Reports), call that out explicitly in `work-done.md` so it's clear the phases weren't done strictly in order — the guide's ordering is a dependency guide, not a rigid lockstep requirement, but Phases 1–3 (schema + auth) must land before anything else starts.