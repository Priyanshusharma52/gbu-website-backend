# Backend Update README (Academics, Departments, Programs)

## Scope Note (April 2026)

This README is the dedicated reference for academics-family endpoints only:

- schools
- departments
- programs
- courses

These endpoints should stay documented here.
`ALL-ENDPOINTS-TESTING.md` should focus on currently used backend flows and exclude this module family.

## 1) Mounted Routes

- `/api/academics/...`
- `/api/v1/...`

## 2) Endpoint List

### 2.1 Schools

- GET `/api/academics/schools`
- GET `/api/academics/schools/:id`
- GET `/api/v1/schools`
- GET `/api/v1/schools/:id`

### 2.2 Departments

- GET `/api/v1/departments`
- GET `/api/v1/departments/:slug`
- POST `/api/v1/departments` (super_admin)
- PUT `/api/v1/departments/:id` (super_admin)

### 2.3 Programs and Courses

- GET `/api/v1/programs?departmentId=<UUID>`
- GET `/api/v1/courses?programId=<UUID>`

## 3) Request and Response Contract

### 3.1 Schools list

- Method: GET
- Path: `/api/v1/schools`
- Auth: Not required

Success response shape:

```json
{
  "success": true,
  "message": "Schools fetched successfully",
  "data": []
}
```

### 3.2 School detail

- Method: GET
- Path: `/api/v1/schools/:id`
- Auth: Not required

Success response shape:

```json
{
  "success": true,
  "message": "School fetched successfully",
  "data": {
    "id": "<uuid>",
    "name": "...",
    "departments": []
  }
}
```

### 3.3 Departments list

- Method: GET
- Path: `/api/v1/departments`
- Auth: Not required

Success response shape:

```json
{
  "success": true,
  "message": "Departments fetched successfully",
  "data": []
}
```

### 3.4 Department detail

- Method: GET
- Path: `/api/v1/departments/:slug`
- Auth: Not required

Response includes:

- department core data
- `dynamicBlocks`
- `contacts`
- `notices`
- `labs`
- `boardsOfStudy`
- `programs`

### 3.5 Department create

- Method: POST
- Path: `/api/v1/departments`
- Auth: Bearer token
- Role: super_admin
- Required body: `schoolId`, `code`, `name`, `slug`

### 3.6 Department update

- Method: PUT
- Path: `/api/v1/departments/:id`
- Auth: Bearer token
- Role: super_admin
- Body: partial update allowed

### 3.7 Programs list

- Method: GET
- Path: `/api/v1/programs?departmentId=<UUID>`
- Auth: Not required

### 3.8 Courses list

- Method: GET
- Path: `/api/v1/courses?programId=<UUID>`
- Auth: Not required

## 4) Implementation Notes

- Versioned routing is used for this module family (`/api/v1/...`).
- Department code uniqueness is enforced.
- Department create/update is RBAC-protected.
- Optional-table fallbacks are in place to avoid hard failures on partial schema rollout.
- Course payload includes `syllabus.version` for frontend mapping.

## 5) Schema Additions Related to This Module

- `course_outcomes`
- `department_contacts`
- `department_notices`
- `labs`
- `boards_of_study`
