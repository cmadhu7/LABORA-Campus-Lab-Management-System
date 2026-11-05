# LABORA REST API Documentation

Base URL: `http://localhost:5000/api`

## Authentication (`/api/auth`)
- `POST /login`: Authenticate institutional email & password; returns signed JWT.
- `POST /logout`: Terminates active session.
- `GET /me`: Fetches profile of currently authenticated user.

## Equipment Management (`/api/equipment`)
- `GET /`: Retrieve all lab apparatus with search, category, and status filters.
- `GET /:id`: Retrieve detailed apparatus record including recent borrow history.
- `POST /`: Add new equipment inventory (Requires staff/admin role).
- `PUT /:id`: Update apparatus metadata, quantities, and status (Requires staff/admin role).
- `DELETE /:id`: Remove equipment item (Requires admin role; rejects if active issues exist).

## User Governance (`/api/users`)
- `GET /`: List all users with search and role filters (Admin only).
- `GET /:id`: User details with active borrowings (Admin only).
- `POST /`: Register student, faculty, or staff with bcrypt hashing (Admin only).
- `PUT /:id`: Modify user record, roles, or password (Admin only).
- `DELETE /:id`: Remove user (Admin only; rejects if active unreturned items exist).

## Issue & Returns (`/api/issues`)
- `POST /`: Checkout apparatus to student with ACID transaction & row lock.
- `GET /`: Query checkout logs by status, student ID, or equipment ID.
- `GET /:id`: Transaction detail inspect.
- `PUT /:id/return`: Process return, verify condition, and restore available inventory.

## Dashboard Telemetry (`/api/dashboard`)
- `GET /stats`: Real-time aggregated database statistics.
- `GET /charts`: Category breakdown and monthly trends for Chart.js.
- `GET /recent-activities`: Latest 8 checkout and return events.

## Audit & Reports (`/api/reports`)
- `GET /inventory`: Equipment inventory valuation and availability percentages.
- `GET /issues`: Historical checkouts with date filtering.
- `GET /damaged`: Damaged equipment records and incident notes.
- `GET /users`: User-wise borrowing aggregations.
