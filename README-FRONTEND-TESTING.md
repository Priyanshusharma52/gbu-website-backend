# Frontend Testing Guide (Communications APIs)

This guide helps frontend developers test announcements, news, and events APIs against the current backend implementation.

## 1) Prerequisites

1. PostgreSQL is running locally.
2. Backend dependencies are installed:
   - `npm i`
3. `.env` is configured in backend root:

```env
PORT=3000
DATABASE_URL=postgresql://<db_user>:<db_password>@localhost:5432/gbu_backend
DB_SSL_ENABLED=false
JWT_ACCESS_SECRET=anything-long
JWT_REFRESH_SECRET=anything-long
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

4. Schema is applied:

```powershell
"C:\Program Files\PostgreSQL\18\bin\psql.exe" "postgresql://<db_user>:<db_password>@localhost:5432/gbu_backend" -f src/db/schema.sql
```

## 2) Start Backend

Run from backend folder:

```powershell
npm run dev
```

Health check:

- `GET http://localhost:3000/api/health`
- Expected: `success: true`

## 3) Base URL and Response Contract

Base URL:

- `http://localhost:3000`

All APIs return this envelope:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "pagination": {}
}
```

`pagination` appears on list endpoints only.

## 4) Frontend-Facing Endpoints

Public list/detail endpoints (no token required):

1. `GET /api/v1/announcements`
2. `GET /api/v1/news`
3. `GET /api/v1/events`
4. `GET /api/v1/events/:id`
5. `GET /api/v1/events/:id/related`

Admin endpoints (not usually called directly from public frontend pages):

1. `POST /api/v1/events` (super_admin)
2. `POST /api/v1/newsletters` (super_admin)

## 5) Query Params for List APIs

Supported on announcements/news/events:

1. `page` (default `1`)
2. `limit` (default `10`, max `50`)
3. `search`
4. `category`
5. `dateFrom` (ISO date/time)
6. `dateTo` (ISO date/time)
7. `tags` (comma-separated or array)

Examples:

- `/api/v1/events?page=1&limit=10`
- `/api/v1/events?search=tech&category=event`
- `/api/v1/events?dateFrom=2026-01-01&dateTo=2026-12-31`
- `/api/v1/events?tags=ai,workshop`

Validation behavior:

1. `dateFrom > dateTo` returns `400`.
2. Invalid event id for `/events/:id` returns `400`.

## 6) Event ID Format

`/api/v1/events/:id` expects UUID event ids.

Do not send numeric ids in route params.

## 7) Quick Frontend Test Flow

1. Call `GET /api/v1/events`.
2. Take first event `id` from response.
3. Call `GET /api/v1/events/:id`.
4. Call `GET /api/v1/events/:id/related?limit=4`.
5. Verify cards/list/detail page rendering.

## 8) Optional Automated Smoke Test

A one-click script is available at workspace root:

- `Y:\gbu-web-work\test.py`

Run:

```powershell
Set-Location "Y:\gbu-web-work"
python test.py
```

Expected: all checks pass.

## 9) Known Integration Notes

1. Backend table names are `announcements`, `news_items`, and `events`.
2. If frontend mock SQL uses `notices` or `news` tables, it does not match this backend directly.
3. Use backend schema in `src/db/schema.sql` as the source of truth.

## 10) Troubleshooting

1. `relation "announcements" does not exist`
   - Schema not applied on current database.
2. `password authentication failed`
   - Fix username/password in `DATABASE_URL`.
3. `database "..." does not exist`
   - Create DB first, then run schema.
4. CORS issue from frontend
   - Add frontend origin to `CORS_ORIGIN`.

## 11) Minimal JS Example (Frontend)

```js
const baseUrl = "http://localhost:3000";

async function fetchEvents() {
  const res = await fetch(`${baseUrl}/api/v1/events?page=1&limit=10`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

async function fetchEventDetails(id) {
  const res = await fetch(`${baseUrl}/api/v1/events/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}
```

---

If frontend team wants, we can also provide a Postman collection aligned to these endpoints.
