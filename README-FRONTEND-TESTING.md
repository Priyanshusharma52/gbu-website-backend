# Frontend Runbook (Current Backend APIs)

This runbook is for frontend developers consuming currently live backend APIs.

Backend scope in this file (current):

1. auth (role-based + OTP password reset)
1. notices
2. news
3. events
4. tenders
5. recruitments

## 1) Quick Start (Windows + PowerShell)

1. Open terminal in backend folder:

```powershell
Set-Location "<path-to>/gbu-website-backend"
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
6. GET /api/v1/tenders
7. GET /recruitments

Auth endpoints:

1. POST /api/auth/login/teacher
2. POST /api/auth/login/school
3. POST /api/auth/login/admin
4. GET /api/auth/me (Bearer token required)
5. POST /api/auth/refresh
6. POST /api/auth/logout
7. POST /api/auth/forgot-password/request-otp
8. POST /api/auth/forgot-password/verify-otp

Role-protected APIs:

1. GET /api/dashboard/faculty -> role `faculty`
2. GET /api/dashboard/school -> role `school`
3. GET /api/dashboard/admin -> role `super_admin`

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
3. Tenders page data:
   - GET /api/v1/tenders
4. Recruitments page data:
   - GET /recruitments

Notes:

1. List endpoint default limit is 10.
2. Max limit is 50.

## 4) Response Envelope

All APIs return the standard envelope:

```json
{
  "success": true,
  "message": "...",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "pages": 1,
    "offset": 0
  }
}
```

Notes:

1. Communications list APIs may include `pagination`.
2. `GET /api/v1/tenders` and `GET /recruitments` currently return grouped data under `data` without pagination.
3. For detail endpoints (`/events/:id`), `data` is an object.

## 4.1) Demo Credentials (Seeded in DB)

These are stored in the `users` table after schema run/startup bootstrap:

1. Change these credentials immediately in non-local environments.
2. Password reset requires OTP verification over email.

## 5) DB Verification After Schema Run

Expected counts in current seed:

1. notices = 1
2. news = 1
3. events = 1
4. media_gallery = 8
5. newsletters = 1
6. tenders = 3
7. recruitments = 8
8. recruitment_documents = 13
9. users = 3
10. auth_refresh_tokens = 0
11. password_reset_otps = 0

Verify:

```sql
SELECT 'notices' AS table_name, COUNT(*) FROM notices
UNION ALL
SELECT 'news', COUNT(*) FROM news
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'media_gallery', COUNT(*) FROM media_gallery
UNION ALL
SELECT 'newsletters', COUNT(*) FROM newsletters
UNION ALL
SELECT 'tenders', COUNT(*) FROM tenders
UNION ALL
SELECT 'recruitments', COUNT(*) FROM recruitments
UNION ALL
SELECT 'recruitment_documents', COUNT(*) FROM recruitment_documents
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'auth_refresh_tokens', COUNT(*) FROM auth_refresh_tokens
UNION ALL
SELECT 'password_reset_otps', COUNT(*) FROM password_reset_otps;
```

## 6) Smoke Test Flow

1. GET http://localhost:3000/api/v1/announcements
2. GET http://localhost:3000/api/v1/news
3. GET http://localhost:3000/api/v1/events
4. Pick an event id and test:
   - GET http://localhost:3000/api/v1/events/1
   - GET http://localhost:3000/api/v1/events/1/related?limit=4
5. GET http://localhost:3000/api/v1/tenders
6. GET http://localhost:3000/recruitments
7. POST http://localhost:3000/api/auth/login/teacher
   - body: {"email":"faculty@gbu.ac.in","password":"Faculty@123"}
8. POST http://localhost:3000/api/auth/forgot-password/request-otp
   - body: {"email":"faculty@gbu.ac.in"}

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

7. `relation tenders does not exist` or `relation recruitments does not exist`
   - schema not applied after latest backend updates

## 8) Minimal Fetch Example

```js
const baseUrl = "http://localhost:3000";

async function getAnnouncements() {
  const response = await fetch(`${baseUrl}/api/v1/announcements`);
  const json = await response.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

async function getTenders() {
  const response = await fetch(`${baseUrl}/api/v1/tenders`);
  const json = await response.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

async function getRecruitments() {
  const response = await fetch(`${baseUrl}/recruitments`);
  const json = await response.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}
```

## 9) Important Notes

1. Source of truth for schema and seed is `src/db/schema.sql`.
2. Schema script is destructive for public tables.
3. Do not run schema on production without explicit review.
