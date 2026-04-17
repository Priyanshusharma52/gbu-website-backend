# Backend Update README (Academics, Departments, Programs)

## Scope Note (April 2026)

This file documents only the Academics/Departments/Programs flow.
Recent backend additions like tenders and recruitments are documented in `README.md`.

Current route snapshot relevant to this file:

- Base API: `/api`
- Versioned routes: `/api/v1/...`
- Academics endpoints in this file remain under `/api/v1`.

## 1) What was implemented

Only the requested backend APIs and related entities were implemented.

### Implemented APIs (exact scope)

- GET /api/v1/schools
- GET /api/v1/schools/:id
- GET /api/v1/departments
- GET /api/v1/departments/:slug
- GET /api/v1/programs?departmentId=
- GET /api/v1/courses?programId=
- POST /api/v1/departments (super_admin only)
- PUT /api/v1/departments/:id (super_admin only)

### Backend wiring updates

- Added versioned routing: /api/v1
- Mounted Academics, Departments, and Programs routers under /api/v1.

### Business rules implemented

- Enforced unique department code (global uniqueness check, for example CSE/ECE).
- Applied role-based access control on POST/PUT department endpoints:
  - authenticate + authorize(super_admin)

### Frontend integration friendly payload notes

Comments were added in code to make frontend integration easier:

- Department detail response includes dynamicBlocks:
  - about
  - achievements
  - placements
  - labs
- Courses response includes syllabus.version (for card/detail mapping in frontend).

### Schema level additions (academics scope)

The following tables and indexes were added in schema.sql:

- course_outcomes
- department_contacts
- department_notices
- labs
- boards_of_study

Important:

- The department detail API reads optional tables.
- If optional tables are not migrated yet, safe fallback logic prevents API crashes.

### Compatibility fix

- Added legacy compatibility object in db config:
  - db.query(...)
  - Modern query(...) export is still available and used.

---

## 2) How to use this

## Step A: Start the server

1. Ensure PostgreSQL is running and reachable.
2. Ensure the database URL in env is correct.
3. Run the server using the existing project flow.

## Step B: Run schema migration

1. Execute src/db/schema.sql on the database.
2. Verify the new tables are created:
   - course_outcomes
   - department_contacts
   - department_notices
   - labs
   - boards_of_study

## Step C: API testing flow

### Public read APIs

1. Get all schools

GET /api/v1/schools

2. Get one school by id

GET /api/v1/schools/:id

3. Get all departments

GET /api/v1/departments

4. Get department by slug

GET /api/v1/departments/:slug

5. Get programs by department

GET /api/v1/programs?departmentId=<DEPARTMENT_UUID>

6. Get courses by program

GET /api/v1/courses?programId=<PROGRAM_UUID>

### Protected write APIs (super_admin)

7. Create department

POST /api/v1/departments
Headers:

- Authorization: Bearer <ACCESS_TOKEN_WITH_ROLE_super_admin>
  Body example:

{
"schoolId": "<UUID>",
"code": "CSE",
"name": "Computer Science and Engineering",
"slug": "computer-science-and-engineering",
"about": "Department description",
"contactEmail": "cse@gbu.ac.in",
"contactPhone": "9999999999",
"isActive": true
}

8. Update department

PUT /api/v1/departments/:id
Headers:

- Authorization: Bearer <ACCESS_TOKEN_WITH_ROLE_super_admin>
  Body example (partial update supported):

{
"name": "Computer Science and Engineering Updated",
"about": "Updated about section",
"isActive": true
}

---

## 3) Frontend integration guide (quick)

1. Department page load:

- Call GET /api/v1/departments/:slug
- Bind response.dynamicBlocks.about -> About section
- Bind response.dynamicBlocks.achievements -> Achievements section
- Bind response.dynamicBlocks.placements -> Placement section
- Bind response.dynamicBlocks.labs -> Labs section

2. Program listing:

- Call GET /api/v1/programs?departmentId=
- Render the result in the program tab of the department page.

3. Course listing:

- Call GET /api/v1/courses?programId=
- Show response.syllabus.version as the syllabus version tag in UI.

---

## 4) Notes for future enhancement

- If you add a dynamic block management panel later, standardize department_notices.notice_type as an enum (achievement, placement, general).
- Syllabus versioning is currently supported at course level through courses.syllabus_version.
- If full version history is required, add a separate course_syllabus_versions table in the next phase.
