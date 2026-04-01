# Frontend Runbook (Announcements, News, Events)

This file is written so your frontend friend can run and consume the APIs without confusion.

Backend scope is only communications data from these 3 tables:

1. notices
2. news
3. events

## 1) 5-Minute Quick Start

Run these steps exactly.

1. Open terminal in backend folder:

```powershell
Set-Location "Y:\gbu-web-work\gbu-website-backend"
```

2. Install dependencies:

```powershell
npm i
```

3. Create or update .env in backend root:

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

4. Apply schema and seed data:

```powershell
"C:\Program Files\PostgreSQL\18\bin\psql.exe" "postgresql://<db_user>:<db_password>@localhost:5432/gbu_backend" -f src/db/schema.sql
```

5. Start backend:

```powershell
npm run dev
```

6. Health check:

```text
GET http://localhost:3000/api/health
```

Expected: success true.

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

## 3) Full JSON for Frontend (Recommended URLs)

If frontend wants full list JSON and filter/sort on client side, call:

1. GET /api/v1/announcements?limit=50&page=1
2. GET /api/v1/news?limit=50&page=1
3. GET /api/v1/events?limit=50&page=1

Note:

1. List endpoint default limit is 10.
2. Max limit is 50.
3. Current seeded counts are below 50, so these URLs return full datasets currently.

## 4) Why event detail and related endpoints are still needed

1. GET /api/v1/events/:id gives complete detail for selected event page.
2. GET /api/v1/events/:id/related gives related cards without frontend side matching logic.

Use id from events list response. Event id is integer.

## 5) Response Envelope

All endpoints return JSON in this shape:

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

For detail endpoint, data is an object instead of array.
Pagination appears only on list endpoints.

## 6) Expected DB Data Counts

After schema run, expected counts:

1. notices = 15
2. news = 15
3. events = 18

Verify quickly:

```sql
SELECT 'notices' AS table_name, COUNT(*) FROM notices
UNION ALL
SELECT 'news', COUNT(*) FROM news
UNION ALL
SELECT 'events', COUNT(*) FROM events;
```

## 7) Frontend Smoke Test (Copy-Paste Flow)

1. Open announcements list:
   - GET http://localhost:3000/api/v1/announcements?limit=50&page=1
2. Open news list:
   - GET http://localhost:3000/api/v1/news?limit=50&page=1
3. Open events list:
   - GET http://localhost:3000/api/v1/events?limit=50&page=1
4. Pick first event id from step 3 and test:
   - GET http://localhost:3000/api/v1/events/1
   - GET http://localhost:3000/api/v1/events/1/related?limit=4

If all return success true with non-empty data, frontend is connected to DB-backed APIs.

## 8) Minimal Frontend Fetch Example

```js
const baseUrl = "http://localhost:3000";

async function getAnnouncements() {
  const response = await fetch(
    `${baseUrl}/api/v1/announcements?limit=50&page=1`,
  );
  const json = await response.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

async function getNews() {
  const response = await fetch(`${baseUrl}/api/v1/news?limit=50&page=1`);
  const json = await response.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

async function getEvents() {
  const response = await fetch(`${baseUrl}/api/v1/events?limit=50&page=1`);
  const json = await response.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

async function getEventDetails(id) {
  const response = await fetch(`${baseUrl}/api/v1/events/${id}`);
  const json = await response.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}
```

## 9) Common Errors and Fix

1. relation notices does not exist
   - schema not applied on selected database
2. password authentication failed
   - wrong username or password in DATABASE_URL
3. database gbu_backend does not exist
   - create DB first, then run schema file
4. CORS blocked from frontend
   - add frontend URL in CORS_ORIGIN

## 10) Important Notes

1. Source of truth for tables and seed data is src/db/schema.sql.
2. Schema contains destructive reset for public tables.
3. Do not run schema on production without review.

---

If needed, a Postman collection can be generated for these exact endpoints.
