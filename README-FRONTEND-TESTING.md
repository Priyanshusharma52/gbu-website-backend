# Frontend Runbook (Live Backend Contract)

This file is updated as per the currently working backend endpoints and real response formats.

Last aligned with endpoint verification:

- Command: node scripts/test-all-endpoints.js
- Result: 28/28 passed

## 1) Quick Start (Windows + PowerShell)

1. Open terminal in backend folder:

```powershell
Set-Location "<path-to>/gbu-website-backend"
```

2. Install dependencies:

```powershell
npm i
```

3. Create or update .env in backend root:

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

4. Apply schema:

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

GET http://localhost:3000/api/health

## 2) Base URL and Live Endpoints

Base URL:

http://localhost:3000

Public endpoints:

1. GET /api/v1/announcements
2. GET /api/v1/notices
3. GET /api/v1/notices/:id
4. GET /api/v1/news
5. GET /api/v1/news/:id
6. GET /api/v1/events
7. GET /api/v1/events/:id
8. GET /api/v1/newsletters
9. GET /api/v1/media-gallery
10. GET /api/v1/tenders
11. GET /recruitments
12. GET /api/bookings
13. POST /api/bookings/

Auth endpoints:

1. POST /api/auth/login/teacher
2. POST /api/auth/login/school
3. POST /api/auth/login/admin
4. POST /api/auth/refresh
5. POST /api/auth/logout
6. GET /api/auth/me

Protected content management endpoints:

1. POST /api/v1/events (super_admin token required)
2. POST /api/v1/newsletters (super_admin token required)

## 3) Important Integration Notes

1. GET /api/v1/events and GET /api/v1/events/:id do not return the standard message field.
2. There is no /api/v1/events/:id/related endpoint in current backend.
3. There is no list pagination envelope in current communications list responses.
4. Recruitments endpoint is /recruitments (without /api prefix).
5. Media gallery canonical endpoint is only /api/v1/media-gallery.

## 4) Request and Response Contracts

### 4.1 GET /api/v1/notices

Request:

- Headers: none
- Body: none

Response (200):

```json
{
  "success": true,
  "message": "Notices fetched successfully",
  "data": [
    {
      "id": 1,
      "title": "Important Notice",
      "slug": "notice-1",
      "summary": "Notice text",
      "content": "Notice text",
      "category": "General",
      "tags": ["general", "high"],
      "coverImageUrl": "https://example.com/notice.pdf",
      "publishedAt": "2026-04-21",
      "createdAt": null,
      "updatedAt": null,
      "priority": "High",
      "views": 10,
      "isNew": true,
      "pdfUrl": "https://example.com/notice.pdf"
    }
  ]
}
```

### 4.2 GET /api/v1/news

Response (200):

```json
{
  "success": true,
  "message": "News fetched successfully",
  "data": [
    {
      "id": 1,
      "title": "News Title",
      "slug": "news-1",
      "summary": "Short summary",
      "content": "Full content",
      "category": "Campus",
      "tags": ["campus", "update"],
      "sourceUrl": null,
      "coverImageUrl": "https://example.com/news.jpg",
      "publishedAt": "2026-04-21",
      "createdAt": null,
      "updatedAt": null,
      "author": "Admin",
      "department": "General",
      "priority": "normal",
      "views": 120,
      "likes": 25,
      "featured": false,
      "status": "published"
    }
  ]
}
```

### 4.3 GET /api/v1/events

Response (200):

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "title": "Event Title",
      "description": "...",
      "starts_at": "2026-04-21T10:00:00.000Z",
      "time_string": "10:00",
      "venue": "Main Auditorium",
      "organizer": "Admin",
      "type": "General",
      "mode": "Offline",
      "status": "upcoming",
      "price": "Free",
      "attendees": 0,
      "cover_image": null,
      "tags": [],
      "year": "2026"
    }
  ]
}
```

### 4.4 GET /api/v1/events/:id

Response (200):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Event Title",
    "description": "...",
    "starts_at": "2026-04-21T10:00:00.000Z",
    "time_string": "10:00",
    "venue": "Main Auditorium",
    "organizer": "Admin",
    "type": "General",
    "mode": "Offline",
    "status": "upcoming",
    "price": "Free",
    "attendees": 0,
    "cover_image": null,
    "tags": [],
    "year": "2026"
  }
}
```

### 4.5 GET /api/v1/tenders

Response (200):

```json
{
  "success": true,
  "message": "Tenders fetched successfully",
  "data": {
    "items": [],
    "current": [],
    "archived": [],
    "meta": {
      "total": 0,
      "currentCount": 0,
      "archivedCount": 0
    }
  }
}
```

### 4.6 GET /recruitments

Response (200):

```json
{
  "success": true,
  "message": "Recruitments fetched successfully",
  "data": {
    "items": [],
    "current": [],
    "archived": [],
    "currentByCategory": {},
    "archivedByYear": {},
    "meta": {
      "total": 0,
      "currentCount": 0,
      "archivedCount": 0
    }
  }
}
```

### 4.7 GET /api/v1/media-gallery

Response (200):

```json
{
  "success": true,
  "message": "Media gallery fetched successfully",
  "data": [
    {
      "id": 1,
      "title": "Convocation 2026",
      "category": "Events",
      "year": "2026",
      "publishedAt": "2026-04-21",
      "images": ["https://example.com/1.jpg"],
      "coverImageUrl": "https://example.com/1.jpg"
    }
  ]
}
```

### 4.8 Booking endpoints

GET /api/bookings response (200):

```json
{
  "success": true,
  "message": "Bookings fetched successfully",
  "data": [
    {
      "id": 1,
      "startTime": "2026-04-21 10:00:00",
      "endTime": "2026-04-21 11:00:00",
      "purpose": "Endpoint smoke test",
      "organizingDept": "QA",
      "contactEmail": "qa@gbu.ac.in",
      "contactMobile": "9999999999"
    }
  ]
}
```

POST /api/bookings/ request body:

```json
{
  "startTime": "2026-04-21 10:00:00",
  "endTime": "2026-04-21 11:00:00",
  "purpose": "Seminar",
  "organizingDept": "CSE",
  "contactEmail": "faculty@gbu.ac.in",
  "contactMobile": "9999999999"
}
```

POST /api/bookings/ response (200 when saved):

```json
{
  "success": true,
  "message": "Booking request submitted successfully",
  "data": {
    "id": 1
  }
}
```

POST /api/bookings/ response (200 when booking table missing):

```json
{
  "success": true,
  "message": "Booking request received",
  "data": {
    "id": null,
    "saved": false,
    "reason": "booking_requests table is not available in current schema"
  }
}
```

### 4.9 Auth and protected write APIs

Admin login request:

```json
{
  "email": "admin@gbu.ac.in",
  "password": "Admin@123"
}
```

Admin login response (200):

```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Super Admin",
      "email": "admin@gbu.ac.in",
      "role": "super_admin"
    },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

POST /api/v1/events request headers and minimal body:

- Authorization: Bearer <adminAccessToken>
- Content-Type: application/json

```json
{
  "title": "Smoke Test Event",
  "date": "2026-04-21",
  "time": "10:00",
  "organizer": "QA"
}
```

POST /api/v1/newsletters request headers and minimal body:

- Authorization: Bearer <adminAccessToken>
- Content-Type: application/json

```json
{
  "title": "Smoke Test Newsletter",
  "issueDate": "2026-04-21",
  "summary": "Smoke test"
}
```

## 5) Frontend Adapter Tips

1. For notices/news/newsletters/tenders/recruitments/media-gallery, use common parser for:
   - response.success
   - response.message
   - response.data
2. For events list/detail, use separate parser because response does not include message and events list includes count.
3. For recruitments and tenders, UI should render from grouped blocks in data (current, archived, meta).
4. For booking create, handle both success variants (saved vs received without table).

## 6) Smoke Test URLs

1. GET http://localhost:3000/api/v1/announcements
2. GET http://localhost:3000/api/v1/notices
3. GET http://localhost:3000/api/v1/news
4. GET http://localhost:3000/api/v1/events
5. GET http://localhost:3000/api/v1/media-gallery
6. GET http://localhost:3000/api/v1/tenders
7. GET http://localhost:3000/recruitments
8. GET http://localhost:3000/api/bookings

## 7) Common Errors and Fixes

1. relation notices/news/events/tenders/recruitments does not exist
   - run src/db/schema.sql in same database as DATABASE_URL
2. CORS blocked
   - include frontend URL in CORS_ORIGIN
3. 401 on protected routes
   - send valid Authorization Bearer token from login endpoint
4. PowerShell error for psql flags
   - use call operator & before psql path

## 8) Minimal Frontend Helpers

```js
const baseUrl = "http://localhost:3000";

async function apiGet(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(json.message || "Request failed");
  }
  return json;
}

export async function getNotices() {
  const result = await apiGet("/api/v1/notices");
  return result.data;
}

export async function getEvents() {
  const result = await apiGet("/api/v1/events");
  return result.data;
}

export async function getRecruitments() {
  const result = await apiGet("/recruitments");
  return result.data;
}
```
