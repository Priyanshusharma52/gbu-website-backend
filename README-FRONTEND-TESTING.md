# Frontend Runbook (Announcements, News, Events)

This runbook is for frontend developers consuming communications APIs from backend.

Backend scope in this file:

1. notices
2. news
3. events

## 1) Quick Start (Windows + PowerShell)

1. Open terminal in backend folder:

```powershell
Set-Location "C:/Users/Priyanshu Sharma/Downloads/website/gbu-website-backend"
```

2. Install dependencies:

```powershell
npm i
```

3. Create or update `.env` in backend root:

```env
PORT=3000
DATABASE_URL=postgresql://gbu-user:12345678@localhost:5432/gbu-db
DB_SSL_ENABLED=false
JWT_ACCESS_SECRET=anything-long
JWT_REFRESH_SECRET=anything-long
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

4. Apply schema and seed data:

```powershell
$env:PGPASSWORD = "<postgres_password>"
& "C:/Program Files/PostgreSQL/18/bin/psql.exe" -h localhost -p 5432 -U postgres -d gbu-db -f "src/db/schema.sql"
Remove-Item Env:PGPASSWORD
```

5. Start backend:

```powershell
npm run dev
```

6. Health check:

```text
GET http://localhost:3000/api/health
```

Expected: `success: true`

## 2) APIs Frontend Should Call

Base URL:

```text
http://localhost:3000
```

Public endpoints:

1. GET /api/v1/announcements
2. GET /api/v1/news
3. GET /api/v1/events
4. GET /api/v1/events/:id
5. GET /api/v1/events/:id/related

## 3) Recommended Frontend Calls

Use these depending on UI need:

1. Simple list fetch:
   - GET /api/v1/announcements
   - GET /api/v1/news
   - GET /api/v1/events
2. Full dataset for client-side filtering (current seed is below 50 rows):
   - GET /api/v1/announcements?limit=50&page=1
   - GET /api/v1/news?limit=50&page=1
   - GET /api/v1/events?limit=50&page=1

Notes:

1. List endpoint default limit is 10.
2. Max limit is 50.

## 4) Response Envelope

All list endpoints return this shape:

```json
{
  "success": true,
  "message": "...",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 18,
    "pages": 1,
    "offset": 0
  }
}
```

For detail endpoints (`/events/:id`), `data` is an object.

## 5) DB Verification After Schema Run

Expected counts:

1. notices = 15
2. news = 15
3. events = 18

Verify:

```sql
SELECT 'notices' AS table_name, COUNT(*) FROM notices
UNION ALL
SELECT 'news', COUNT(*) FROM news
UNION ALL
SELECT 'events', COUNT(*) FROM events;
```

## 6) Smoke Test Flow

1. GET http://localhost:3000/api/v1/announcements
2. GET http://localhost:3000/api/v1/news
3. GET http://localhost:3000/api/v1/events
4. Pick an event id and test:
   - GET http://localhost:3000/api/v1/events/1
   - GET http://localhost:3000/api/v1/events/1/related?limit=4

If all return `success: true` with non-empty data, frontend is connected correctly.

## 7) Common Errors and Fixes

1. `relation notices does not exist`
   - schema not applied on selected database

2. `password authentication failed`
   - invalid username or password in `DATABASE_URL`

3. `database gbu-db does not exist`
   - create database first, then run `src/db/schema.sql`

4. CORS blocked from frontend
   - include frontend origin in `CORS_ORIGIN`

5. `permission denied for table notices` (or news/events)
   - run as table owner/postgres superuser:

```sql
GRANT USAGE ON SCHEMA public TO "gbu-user";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "gbu-user";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "gbu-user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "gbu-user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO "gbu-user";
```

Replace `gbu-user` with the username used in `DATABASE_URL` if different.

6. PowerShell shows `Unexpected token '-U'`
   - use call operator `&` before quoted `psql.exe` path

## 8) Minimal Fetch Example

```js
const baseUrl = "http://localhost:3000";

async function getAnnouncements() {
  const response = await fetch(`${baseUrl}/api/v1/announcements`);
  const json = await response.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}
```

## 9) Important Notes

1. Source of truth for schema and seed is `src/db/schema.sql`.
2. Schema script is destructive for public tables.
3. Do not run schema on production without explicit review.