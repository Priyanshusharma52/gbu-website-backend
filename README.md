# GBU Website Backend Master Documentation

Single source of truth for the full GBU website backend.

## Stack
- Runtime: Node.js
- Framework: Express.js
- Database: PostgreSQL 
- ORM: Sequelize (recommended) or Prisma
- Auth: JWT + Refresh Token + RBAC
- API Style: REST (`/api/...`)

---

## 1) Objectives
Build a production-ready backend that supports all frontend areas:
- School / Department / Program hierarchy
- Admission + document verification workflows
- Faculty profiles + research datasets
- Resource booking + pricing
- Tenders + recruitments
- Announcements, events, media, newsletters
- Grievance portal with role-based dashboards
- Placement, research, clubs, NCC, NSS
- Directory, contact forms, static page CMS, global search

No module remains undefined after this document.

---

## 2) Backend Architecture

### 2.1 Suggested Folder Structure
```text
backend/
  src/
    app.js
    server.js
    config/
      env.js
      db.js
      logger.js
    constants/
      roles.js
    routes/
      index.js
    modules/
      auth/
      dashboard/
      users/
      cms/
      academics/
      admissions/
      faculty/
      departments/
      booking/
      tenders/
      recruitments/
      grievance/
      rti/
      clubs/
      ncc/
      nss/
      research/
      placements/
      directory/
      contact/
      search/
      media/
      notifications/
      audit/
    middleware/
      auth.js
      validate.js
      errorHandler.js
      rateLimit.js
      upload.js
    utils/
      pagination.js
      queryBuilder.js
      date.js
      response.js
    jobs/
      archiveTenders.job.js
      bookingReminder.job.js
      newsletter.job.js
    docs/
      swagger.yaml
```

### 2.2 Core Principles
- Modular, domain-based architecture
- Strict DTO validation at controller boundary
- Service layer for business logic
- Transactions for critical workflows (admission, booking, grievance)
- Soft delete where auditability is required
- Every write operation must produce audit logs

---

## 3) Roles & Access Matrix
Roles:
- `super_admin`
- `school`
- `faculty`
- `staff`
- `public` (no login)

### Access Summary
- `public`: read-only for events, notices, tenders, faculty directory, schools
- `school`: school dashboard + school-level updates
- `staff` / `faculty`: workflow actions based on permissions
- `super_admin`: full CRUD, approvals, reports, user management

### Protected Dashboard Routes (Mandatory)
The following endpoints are protected and **cannot** be accessed until login is complete and role token is valid:
- `GET /api/dashboard/admin` → only `super_admin`
- `GET /api/dashboard/school` → only `school`
- `GET /api/dashboard/faculty` → only `faculty`

Authentication flow:
- Login: `POST /api/auth/login`
- Refresh: `POST /api/auth/refresh`
- Logout: `POST /api/auth/logout`
- Profile: `GET /api/auth/me`

Security enforcement:
- Middleware chain: `authenticate` → `authorize(role)`
- Unauthorized token: `401`
- Role mismatch: `403`
- Auth endpoints have stricter rate limiting

---

## 4) Frontend-to-Backend Module Mapping (Complete)

### A. Home + Global UI Content
- Frontend: `components/home/*`
- Module: `cms-home`
- Entities: `home_banners`, `home_sections`, `home_quick_links`, `home_stats`, `featured_items`
- APIs:
  - `GET /api/home`
  - `PUT /api/home` (`super_admin`)
  - `GET /api/quick-links`
  - `POST /api/quick-links` (`super_admin`)

### B. About University Pages
- Frontend: `pages/Aboutus/*`
- Module: `about-cms`
- Entities: `about_pages`, `governance_members`, `policy_documents`, `disclosures`, `leadership_profiles`
- APIs:
  - `GET /api/about/:slug`
  - `PUT /api/about/:slug` (`super_admin`)
  - `GET /api/governance`
  - `POST /api/governance` (`super_admin`)

### C. Academics, Schools, Departments, Programs
- Frontend: `pages/Academic/*`, `pages/departments/*`, `components/departments/*`
- Modules: `academics`, `departments`, `programs`
- Entities: `schools`, `departments`, `programs`, `courses`, `course_outcomes`, `department_contacts`, `department_notices`, `labs`, `boards_of_study`
- APIs:
  - `GET /api/schools`
  - `GET /api/schools/:id`
  - `GET /api/departments`
  - `GET /api/departments/:slug`
  - `GET /api/programs?departmentId=`
  - `GET /api/courses?programId=`
  - `POST /api/departments` (`super_admin`)
  - `PUT /api/departments/:id` (`super_admin`)
- Rules:
  - Unique department codes (e.g. `CSE`, `ECE`)
  - Syllabus versioning
  - Dynamic department blocks (`about`, `achievements`, `placements`, `labs`)

### D. Faculty Module (Detailed Tabs)
- Frontend: `components/faculty/*`, `pages/Academic/Faculty.jsx`, `FacultyDetail.jsx`
- Module: `faculty`
- Entities: `faculty_profiles`, `faculty_qualifications`, `faculty_teaching`, `faculty_publications`, `faculty_patents`, `faculty_talks`, `faculty_admin_roles`, `faculty_certifications`, `faculty_social_impact`, `faculty_research_groups`
- APIs:
  - `GET /api/faculty`
  - `GET /api/faculty/:id`
  - `GET /api/faculty/:id/publications`
  - `POST /api/faculty/:id/publications` (`faculty` / `super_admin`)
  - `PUT /api/faculty/:id/profile` (`faculty` / `super_admin`)
- Rules:
  - Faculty edits own profile only
  - `super_admin` edits all
  - Publications support DOI/URL, indexing, year filters

### E. Admissions Module
- Frontend: `pages/Admission/*`, `components/Admission/*`
- Module: `admissions`
- Entities: `admission_cycles`, `admission_programs`, `applications`, `application_documents`, `application_status_history`, `reservation_categories`, `eligibility_rules`
- APIs:
  - `GET /api/admissions/cycles/active`
  - `POST /api/admissions/applications`
  - `GET /api/admissions/applications/:id`
  - `GET /api/admissions/admin/applications`
  - `PUT /api/admissions/documents/:id/verify`
  - `PUT /api/admissions/applications/:id/status`
  - `GET /api/admissions/stats`
  - `GET /api/admissions/timeline`
- Rules:
  - No duplicate active application for same cycle + program
  - Mandatory docs vary by category
  - Controlled status transitions using FSM

### F. Booking + Resource Management
- Frontend: `pages/booking/BookingMain.jsx`, `components/booking/*`
- Module: `booking`
- Entities: `facilities`, `facility_images`, `facility_pricing_rules`, `facility_documents`, `booking_requests`, `booking_slots`, `booking_invoices`
- APIs:
  - `GET /api/facilities`
  - `GET /api/facilities/:id`
  - `GET /api/facilities/:id/pricing`
  - `GET /api/bookings/availability?facilityId=&from=&to=`
  - `POST /api/bookings/requests`
  - `PUT /api/bookings/requests/:id/approve`
  - `PUT /api/bookings/requests/:id/reject`
  - `GET /api/bookings/my`
- Rules:
  - Prevent slot overlap
  - Dynamic pricing by role + event type + duration
  - Auto-expire pending requests after timeout

### G. Announcements, Notices, News, Events
- Frontend: `pages/Announcements/*`, `components/announcement/*`
- Module: `communications`
- Entities: `announcements`, `news_items`, `events`, `event_tags`, `media_gallery_items`, `newsletter_issues`
- APIs:
  - `GET /api/announcements`
  - `GET /api/news`
  - `GET /api/events`
  - `GET /api/events/:id`
  - `GET /api/events/:id/related`
  - `POST /api/events` (`super_admin`)
  - `POST /api/newsletters` (`super_admin`)
- Query features:
  - `search`, `category`, `dateFrom`, `dateTo`, `tags`
  - `page`, `limit`, `sortBy`, `order`

### H. Tenders Module
- Frontend: `pages/tenders/TenderMain.jsx`, `components/tenders/*`
- Module: `tenders`
- Entities: `tenders`, `tender_documents`, `tender_corrigendum`
- APIs:
  - `GET /api/tenders?status=active|archived`
  - `GET /api/tenders/:id`
  - `POST /api/tenders` (`super_admin`)
  - `PUT /api/tenders/:id` (`super_admin`)
- Rules:
  - Auto-archive after closing date via cron
  - Corrigendum file versioning

### I. Recruitment Module
- Frontend: `pages/recruitments/RecruitMain.jsx`, `components/recruitments/*`
- Module: `recruitments`
- Entities: `job_posts`, `job_eligibility`, `job_applications`, `application_attachments`, `recruitment_stages`
- APIs:
  - `GET /api/jobs`
  - `GET /api/jobs/:id`
  - `POST /api/jobs/:id/apply`
  - `GET /api/jobs/super-admin/applications`
  - `PUT /api/jobs/super-admin/applications/:id/status`

### J. Grievance Portal (Role Dashboards)
- Frontend: `pages/grievance/*`, `components/Grievance/*`
- Module: `grievance`
- Entities: `complaints`, `complaint_assignments`, `complaint_comments`, `complaint_attachments`, `complaint_timeline`, `complaint_escalation_rules`, `feedback_ratings`
- APIs:
  - `POST /api/grievance/complaints`
  - `GET /api/grievance/complaints/me`
  - `GET /api/grievance/complaints/:id`
  - `PUT /api/grievance/complaints/:id/assign`
  - `PUT /api/grievance/complaints/:id/status`
  - `POST /api/grievance/complaints/:id/comments`
  - `GET /api/grievance/reports/super-admin`
- Rules:
  - SLA per category
  - Escalation on SLA breach
  - Mandatory timeline audit

### K. NCC / NSS / Clubs / Campus Life
- Frontend: `components/ncc/*`, `components/nss/*`, `components/clubs/*`, `pages/campusLife/*`, `pages/clubs/*`
- Modules: `clubs`, `ncc`, `nss`, `campus-life`
- Entities: `clubs`, `club_events`, `club_memberships`, `ncc_activities`, `nss_activities`, `campus_facilities`, `campus_content`, `campus_gallery`
- APIs:
  - `GET /api/clubs`
  - `POST /api/clubs/:id/join`
  - `GET /api/ncc/events`
  - `GET /api/nss/events`
  - `POST /api/ncc/register`
  - `POST /api/nss/register`
  - `GET /api/campus-life/content/:slug`

### L. Research + IPR + Incubation + DAC
- Frontend: `pages/Reasearch/*`, `pages/dac/DAC.jsx`, `components/dac/*`
- Modules: `research`, `ipr`, `incubation`, `dac`
- Entities: `research_centers`, `funded_projects`, `research_publications`, `ipr_items`, `incubation_services`, `incubation_startups`, `dac_applications`
- APIs:
  - `GET /api/research/publications`
  - `GET /api/research/projects`
  - `GET /api/ipr`
  - `POST /api/dac/apply`

### M. Placement Module
- Frontend: `pages/Placement/*`
- Module: `placements`
- Entities: `placement_stats`, `recruiters`, `internship_programs`, `placement_brochures`, `training_programs`
- APIs:
  - `GET /api/placements/stats`
  - `GET /api/placements/recruiters`
  - `GET /api/placements/internships`

### N. Contact + Directory + Sitemap + Search
- Frontend: `pages/Contact/*`, `pages/directory/ContactDirectory.jsx`, `components/Searchbar/*`, `pages/Sitemap/*`
- Modules: `contact`, `directory`, `search`, `sitemap`
- Entities: `contact_messages`, `directory_entries`, `search_index`, `sitemap_routes`
- APIs:
  - `POST /api/contact/messages`
  - `GET /api/directory`
  - `GET /api/search?q=`
  - `GET /api/sitemap`

---

## 5) SQL Schema Baseline (Phase-1 Minimum)
- Identity: `users`, `roles`, `user_roles`, `refresh_tokens`
- Media: `media_files`, `media_folders`
- CMS: `pages`, `page_blocks`, `quick_links`, `banners`
- Academics: `schools`, `departments`, `programs`, `courses`
- Faculty: `faculty_profiles`, `faculty_publications`, `faculty_patents`
- Admission: `admission_cycles`, `applications`, `application_documents`, `application_status_history`
- Booking: `facilities`, `facility_pricing_rules`, `booking_requests`, `booking_slots`
- Communication: `announcements`, `news_items`, `events`
- Tender / Recruitment: `tenders`, `job_posts`, `job_applications`
- Grievance: `complaints`, `complaint_timeline`, `complaint_comments`
- Clubs/NCC/NSS: `clubs`, `club_memberships`, `ncc_activities`, `nss_activities`
- Research/Placement: `research_publications`, `placement_stats`
- Ops: `audit_logs`, `notifications`, `system_settings`, `activities`

---

## 6) API Standards

### Headers
- `Authorization: Bearer <access_token>`
- `X-Request-Id: <uuid>`

### Success Response
```json
{
  "success": true,
  "message": "Fetched successfully",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 250,
    "pages": 25
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email is invalid" }
  ]
}
```

---

## 7) Non-Functional Requirements
- Security: Helmet, CORS allowlist, SQL injection prevention, request validation, rate limiting
- Performance: DB indexing, cache hot endpoints, response compression
- Reliability: transactions + retry-safe jobs
- Observability: structured logs + request IDs + error tracking
- Compliance: audit trail for all `super_admin` actions

---

## 8) File Upload & Media Rules
- Supported uploads:
  - PDF: tenders, notices, brochures, circulars
  - Images: events, faculty, gallery, clubs
  - Optional video links: virtual tour, media sections
- Rules:
  - Validate MIME + size
  - Store metadata in `media_files`
  - Use presigned URLs for cloud storage
  - Keep old versions for legal/compliance docs

---

## 9) Workflow Design (Critical Flows)

### 9.1 Admission Workflow
`Draft -> Submitted -> Docs Under Review -> Verified/Rejected -> Merit Listed -> Admitted`
- Every transition writes to `application_status_history`

### 9.2 Booking Workflow
`Requested -> Pending Approval -> Approved/Rejected -> Invoice Generated -> Completed`
- Overlap check mandatory before approval

### 9.3 Grievance Workflow
`Submitted -> Assigned -> In Progress -> Resolved -> Closed -> Feedback`
- SLA timer + escalation required

### 9.4 Tender Workflow
`Draft -> Published -> Corrigendum(optional) -> Closed -> Archived`

---

## 10) 4-Developer Work Distribution (No Gap)

### Developer 1: Platform, Auth, Users, Audit, RTI, Settings
- Project bootstrap + architecture
- Auth, RBAC, user lifecycle
- RTI, system settings, audit logs, admin base APIs
- Deliverables:
  - Refresh-token auth complete
  - User-role-permission management
  - Central middleware + error handling

### Developer 2: Academics, Departments, Faculty, Research, Placement
- Academic hierarchy
- Faculty full tab model + APIs
- Research + placement services
- Deliverables:
  - Schools/departments/program/course APIs
  - Faculty profile + nested tabs APIs
  - Research + placement APIs

### Developer 3: Admissions, Booking, Tenders, Recruitment
- Admission + doc verification + stats
- Booking conflict engine
- Tenders + job workflows
- Deliverables:
  - End-to-end admission APIs
  - Booking approvals + availability APIs
  - Tender + recruitment modules

### Developer 4: CMS, Communications, Grievance, Clubs/NCC/NSS, Contact/Search
- Home/About/Campus CMS
- Announcements/news/events/gallery/newsletter
- Grievance role dashboard backend
- Public modules
- Deliverables:
  - CMS editor APIs
  - Communication APIs with search/filter/pagination
  - Grievance workflow + reports
  - Contact/directory/search/sitemap APIs

---

## 11) Execution Plan (Sprint-wise)
- Sprint 1 (Foundation): repo setup, migrations, auth, RBAC, media service, shared utilities
- Sprint 2 (Core Business): academics, admissions, faculty, communications, tenders/recruitments
- Sprint 3 (Workflows & Dashboards): booking engine, grievance dashboards, research/placement
- Sprint 4 (Hardening): search, sitemap, security/performance audit, tests, docs freeze

---

## 12) Testing Strategy
- Unit: services + validators
- Integration: auth, admissions, booking, grievance
- Contract: critical public APIs
- Role tests: authorization matrix
- Data tests: migration consistency + rollback verification

### Must-have Test Scenarios
- Duplicate application is blocked
- Double booking is blocked
- Unauthorized admin endpoints are blocked
- Unauthorized super-admin endpoints are blocked
- Grievance escalation triggers on SLA breach

---

## 13) Documentation Deliverables
Per module:
- ERD snippet
- API list with request/response examples
- Validation rules
- Role permissions
- Edge-case behavior

Global:
- Postman collection
- Swagger/OpenAPI spec
- Seed data guide
- Deployment runbook

---

## 14) Definition of Done (Per Module)
A module is complete only when:
1. DB migrations and indexes merged
2. CRUD + workflow endpoints implemented
3. Auth + role checks verified
4. Validation + error handling present
5. Test cases pass
6. Swagger + Postman updated
7. Frontend integration behavior validated for super-admin/public visibility

---

## 15) Immediate Next Steps
1. Finalize ORM (`Sequelize` or `Prisma`)
2. Lock DB (`PostgreSQL` recommended)
3. Create migration baseline from section 5
4. Start Sprint 1 with Developer 1 lead
5. Run parallel implementation per ownership from section 10

---

## Suggested Project Bootstrap Commands
```bash
npm init -y
npm install express dotenv cors helmet compression jsonwebtoken bcrypt sequelize pg pg-hstore
npm install -D nodemon eslint prettier jest supertest
```

If Prisma is selected instead of Sequelize:
```bash
npm install prisma @prisma/client
npx prisma init
```

---

## Notes
- Keep all APIs under `/api`.
- Enforce request validation for every write endpoint.
- Implement audit logging for every state transition and admin write operation.
- Prefer idempotent job design for cron-based automations.
