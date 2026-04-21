# ALL ENDPOINTS TESTING

Last verification: 2026-04-21
Verification command: node scripts/test-all-endpoints.js
Result: 28/28 passed

All endpoints listed in this file exist in code and are mounted.

## Health

### GET /api/health

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: none
- Body: none

Response format (200):

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "uptime": 123.45,
    "timestamp": "2026-04-21T10:00:00.000Z"
  }
}
```

## Auth

### POST /api/auth/login/teacher

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: Content-Type: application/json
- Body:

```json
{
  "email": "faculty@gbu.ac.in",
  "password": "Faculty@123"
}
```

Response format (200):

```json
{
  "success": true,
  "message": "Teacher login successful",
  "data": {
    "user": {
      "id": 3,
      "name": "Faculty User",
      "email": "faculty@gbu.ac.in",
      "role": "faculty"
    },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

### POST /api/auth/login/school

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: Content-Type: application/json
- Body:

```json
{
  "email": "school@gbu.ac.in",
  "password": "School@123"
}
```

Response format (200):

```json
{
  "success": true,
  "message": "School login successful",
  "data": {
    "user": {
      "id": 2,
      "name": "School User",
      "email": "school@gbu.ac.in",
      "role": "school"
    },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

### POST /api/auth/login/admin

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: Content-Type: application/json
- Body:

```json
{
  "email": "admin@gbu.ac.in",
  "password": "Admin@123"
}
```

Response format (200):

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

### POST /api/auth/refresh

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: Content-Type: application/json
- Body:

```json
{
  "refreshToken": "<jwt>"
}
```

Response format (200):

```json
{
  "success": true,
  "message": "Access token refreshed",
  "data": {
    "accessToken": "<jwt>"
  }
}
```

### POST /api/auth/logout

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: Content-Type: application/json
- Body:

```json
{
  "refreshToken": "<jwt>"
}
```

Response format (200):

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {}
}
```

### GET /api/auth/me

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: Authorization: Bearer <accessToken>
- Body: none

Response format (200):

```json
{
  "success": true,
  "message": "User profile fetched",
  "data": {
    "id": 3,
    "email": "faculty@gbu.ac.in",
    "role": "faculty",
    "name": "Faculty User"
  }
}
```

## Dashboard

### GET /api/dashboard/admin

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: Authorization: Bearer <adminAccessToken>
- Body: none

Response format (200):

```json
{
  "success": true,
  "message": "Admin dashboard data fetched",
  "data": {
    "dashboard": "admin",
    "role": "super_admin",
    "widgets": ["user-management", "audit-logs", "system-settings", "reports"]
  }
}
```

### GET /api/dashboard/school

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: Authorization: Bearer <schoolAccessToken>
- Body: none

Response format (200):

```json
{
  "success": true,
  "message": "School dashboard data fetched",
  "data": {
    "dashboard": "school",
    "role": "school",
    "widgets": ["school-updates", "department-summary", "school-notices"]
  }
}
```

### GET /api/dashboard/faculty

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: Authorization: Bearer <facultyAccessToken>
- Body: none

Response format (200):

```json
{
  "success": true,
  "message": "Faculty dashboard data fetched",
  "data": {
    "dashboard": "faculty",
    "role": "faculty",
    "widgets": ["profile", "publications", "teaching-load", "research-work"]
  }
}
```

## Booking

### GET /api/bookings

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: none
- Body: none

Response format (200):

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

### POST /api/bookings/

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: Content-Type: application/json
- Body:

```json
{
  "startTime": "2026-04-21 10:00:00",
  "endTime": "2026-04-21 11:00:00",
  "purpose": "Endpoint smoke test",
  "organizingDept": "QA",
  "contactEmail": "qa@gbu.ac.in",
  "contactMobile": "9999999999"
}
```

Response format (200 when table exists):

```json
{
  "success": true,
  "message": "Booking request submitted successfully",
  "data": {
    "id": 1
  }
}
```

Response format (200 when booking table is missing):

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

## Communications (v1)

### GET /api/v1/announcements

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: none
- Body: none

Response format (200):

```json
{
  "success": true,
  "message": "Announcements fetched successfully",
  "data": [
    {
      "id": 1,
      "title": "Important Notice",
      "slug": "notice-1",
      "summary": "...",
      "content": "...",
      "category": "General",
      "tags": ["general", "high"],
      "coverImageUrl": "https://.../notice.pdf",
      "publishedAt": "2026-04-21",
      "createdAt": null,
      "updatedAt": null,
      "priority": "High",
      "views": 10,
      "isNew": true,
      "pdfUrl": "https://.../notice.pdf"
    }
  ]
}
```

### GET /api/v1/notices

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: none
- Body: none

Response format (200):

```json
{
  "success": true,
  "message": "Notices fetched successfully",
  "data": [
    {
      "id": 1,
      "title": "Important Notice",
      "slug": "notice-1",
      "summary": "...",
      "content": "...",
      "category": "General",
      "tags": ["general", "high"],
      "coverImageUrl": "https://.../notice.pdf",
      "publishedAt": "2026-04-21",
      "createdAt": null,
      "updatedAt": null,
      "priority": "High",
      "views": 10,
      "isNew": true,
      "pdfUrl": "https://.../notice.pdf"
    }
  ]
}
```

### GET /api/v1/notices/:id

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: none
- Path params: id (integer)
- Body: none

Response format (200):

```json
{
  "success": true,
  "message": "Notice fetched successfully",
  "data": {
    "id": 1,
    "title": "Important Notice",
    "slug": "notice-1",
    "summary": "...",
    "content": "...",
    "category": "General",
    "tags": ["general", "high"],
    "coverImageUrl": "https://.../notice.pdf",
    "publishedAt": "2026-04-21",
    "createdAt": null,
    "updatedAt": null,
    "priority": "High",
    "views": 10,
    "isNew": true,
    "pdfUrl": "https://.../notice.pdf"
  }
}
```

### GET /api/v1/news

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: none
- Body: none

Response format (200):

```json
{
  "success": true,
  "message": "News fetched successfully",
  "data": [
    {
      "id": 1,
      "title": "News Title",
      "slug": "news-1",
      "summary": "...",
      "content": "...",
      "category": "Campus",
      "tags": ["campus", "update"],
      "sourceUrl": null,
      "coverImageUrl": "https://.../news.jpg",
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

### GET /api/v1/news/:id

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: none
- Path params: id (integer)
- Body: none

Response format (200):

```json
{
  "success": true,
  "message": "News fetched successfully",
  "data": {
    "id": 1,
    "title": "News Title",
    "slug": "news-1",
    "summary": "...",
    "content": "...",
    "category": "Campus",
    "tags": ["campus", "update"],
    "sourceUrl": null,
    "coverImageUrl": "https://.../news.jpg",
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
}
```

### GET /api/v1/newsletters

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: none
- Body: none

Response format (200):

```json
{
  "success": true,
  "message": "Newsletters fetched successfully",
  "data": [
    {
      "id": 1,
      "title": "Monthly Bulletin",
      "issueNumber": "APR-2026",
      "publishedDate": "2026-04-21",
      "coverImageUrl": "https://.../cover.jpg",
      "excerpt": "...",
      "pdfUrl": "https://.../newsletter.pdf",
      "views": 15,
      "category": "General"
    }
  ]
}
```

### GET /api/v1/media-gallery

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: none
- Body: none

Response format (200):

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
      "images": ["https://.../1.jpg", "https://.../2.jpg"],
      "coverImageUrl": "https://.../1.jpg"
    }
  ]
}
```

### GET /api/v1/events

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: none
- Body: none

Response format (200):

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "title": "Smoke Test Event",
      "description": "...",
      "starts_at": "2026-04-21T10:00:00.000Z",
      "time_string": "10:00",
      "venue": "Main Auditorium",
      "organizer": "QA",
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

### GET /api/v1/events/:id

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: none
- Path params: id (integer)
- Body: none

Response format (200):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Smoke Test Event",
    "description": "...",
    "starts_at": "2026-04-21T10:00:00.000Z",
    "time_string": "10:00",
    "venue": "Main Auditorium",
    "organizer": "QA",
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

### POST /api/v1/events

- Exists in code: Yes
- Tested status: 201

Request format:

- Headers:
  - Content-Type: application/json
  - Authorization: Bearer <adminAccessToken>
- Body:

```json
{
  "title": "Smoke Test Event",
  "date": "2026-04-21",
  "time": "10:00",
  "organizer": "QA"
}
```

Response format (201):

```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": 1,
    "title": "Smoke Test Event",
    "slug": "event-1",
    "summary": null,
    "description": null,
    "category": "General",
    "venue": null,
    "organizer": "QA",
    "startsAt": "2026-04-21T10:00:00",
    "endsAt": null,
    "coverImageUrl": null,
    "registrationUrl": null,
    "isFeatured": false,
    "isPublished": true,
    "publishedAt": "2026-04-21T10:00:00",
    "tags": [],
    "createdAt": null,
    "updatedAt": null,
    "attendees": 0,
    "status": "upcoming",
    "price": "Free",
    "year": "2026",
    "date": "2026-04-21",
    "time": "10:00",
    "location": null,
    "type": "General",
    "mode": "Offline",
    "gallery": [],
    "agenda": [],
    "speakers": []
  }
}
```

### POST /api/v1/newsletters

- Exists in code: Yes
- Tested status: 201

Request format:

- Headers:
  - Content-Type: application/json
  - Authorization: Bearer <adminAccessToken>
- Body:

```json
{
  "title": "Smoke Test Newsletter",
  "issueDate": "2026-04-21",
  "summary": "Smoke test"
}
```

Response format (201):

```json
{
  "success": true,
  "message": "Newsletter created successfully",
  "data": {
    "id": 1,
    "title": "Smoke Test Newsletter",
    "issueNumber": null,
    "issueDate": "2026-04-21",
    "publishedDate": "2026-04-21",
    "summary": "Smoke test",
    "contentHtml": null,
    "pdfUrl": null,
    "coverImageUrl": null,
    "views": 0,
    "category": "General",
    "isPublished": true
  }
}
```

## Tenders

### GET /api/v1/tenders

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: none
- Body: none

Response format (200):

```json
{
  "success": true,
  "message": "Tenders fetched successfully",
  "data": {
    "items": [
      {
        "id": 1,
        "title": "Tender Title",
        "description": "...",
        "referenceNo": "GBU/TDR/2026/01",
        "category": "procurement",
        "tenderType": "open",
        "publishedDate": "2026-04-01",
        "closingDate": "2026-04-30",
        "documentUrl": "https://.../tender.pdf",
        "isArchived": false,
        "status": "current",
        "createdAt": "2026-04-01T10:00:00.000Z",
        "updatedAt": "2026-04-01T10:00:00.000Z"
      }
    ],
    "current": [],
    "archived": [],
    "meta": {
      "total": 1,
      "currentCount": 1,
      "archivedCount": 0
    }
  }
}
```

## Recruitments

### GET /recruitments

- Exists in code: Yes
- Tested status: 200

Request format:

- Headers: none
- Body: none

Response format (200):

```json
{
  "success": true,
  "message": "Recruitments fetched successfully",
  "data": {
    "items": [
      {
        "id": 1,
        "title": "Assistant Professor",
        "description": "...",
        "referenceNo": "GBU/REC/2026/01",
        "category": "teaching",
        "tabId": "teaching",
        "publishedDate": "2026-04-01",
        "closingDate": "2026-04-30",
        "year": 2026,
        "isArchived": false,
        "status": "current",
        "documents": [
          {
            "id": 1,
            "name": "Detailed Advertisement",
            "documentType": "pdf",
            "url": "https://.../recruitment.pdf",
            "description": null,
            "sortOrder": 1
          }
        ],
        "createdAt": "2026-04-01T10:00:00.000Z",
        "updatedAt": "2026-04-01T10:00:00.000Z"
      }
    ],
    "current": [],
    "archived": [],
    "currentByCategory": {},
    "archivedByYear": {},
    "meta": {
      "total": 1,
      "currentCount": 1,
      "archivedCount": 0
    }
  }
}
```
